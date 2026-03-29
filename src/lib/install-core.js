import fs from "node:fs/promises";
import path from "node:path";
import {
  LOCK_FILE,
  MARKER_FILE,
  MARKER_SCHEMA_VERSION,
  PACKAGE_NAME,
  STALE_WINDOW_MS,
  TEMP_META_FILE,
  TEMP_ROOT_DIR
} from "./constants.js";
import {
  installError,
  lockConflictError,
  markerInvalidError,
  permissionError,
  safetyError
} from "./errors.js";
import {
  copyDirectoryStrict,
  isProcessAlive,
  pathExists,
  readJsonFile,
  removePath,
  writeJsonFile
} from "./utils.js";

export async function ensureWritableInstallRoot(installRoot) {
  try {
    await fs.mkdir(installRoot, { recursive: true });
    const probePath = path.join(installRoot, `.agent-plugins-installer-probe-${process.pid}`);
    const handle = await fs.open(probePath, "w");
    await handle.close();
    await fs.rm(probePath, { force: true });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "EACCES" || error.code === "EPERM")
    ) {
      throw permissionError(installRoot);
    }

    throw installError(`Failed to prepare install root "${installRoot}".`, error);
  }
}

export async function acquireInstallLock(installRoot) {
  const lockPath = path.join(installRoot, LOCK_FILE);
  const metadata = {
    pid: process.pid,
    startedAt: new Date().toISOString()
  };

  try {
    const handle = await fs.open(lockPath, "wx");
    await handle.writeFile(`${JSON.stringify(metadata, null, 2)}\n`, "utf8");
    await handle.close();
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") {
      throw installError(`Failed to create lock file "${lockPath}".`, error);
    }

    const stale = await tryRecoverStaleLock(lockPath);
    if (!stale) {
      throw lockConflictError(installRoot);
    }

    const retryHandle = await fs.open(lockPath, "wx");
    await retryHandle.writeFile(`${JSON.stringify(metadata, null, 2)}\n`, "utf8");
    await retryHandle.close();
  }

  return async function releaseLock() {
    await fs.rm(lockPath, { force: true });
  };
}

async function tryRecoverStaleLock(lockPath) {
  let metadata;

  try {
    metadata = await readJsonFile(lockPath);
  } catch (error) {
    if (await isFreshLockFile(lockPath)) {
      return false;
    }

    throw safetyError(`Lock metadata is corrupted: "${lockPath}". Remove it manually and retry.`, error);
  }

  if (
    !metadata ||
    typeof metadata !== "object" ||
    !Number.isInteger(metadata.pid) ||
    typeof metadata.startedAt !== "string"
  ) {
    if (await isFreshLockFile(lockPath)) {
      return false;
    }

    throw safetyError(`Lock metadata is incomplete: "${lockPath}". Remove it manually and retry.`);
  }

  const startedAt = Date.parse(metadata.startedAt);
  if (!Number.isFinite(startedAt)) {
    throw safetyError(`Lock metadata has an invalid startedAt timestamp: "${lockPath}".`);
  }

  const stale = !isProcessAlive(metadata.pid) && Date.now() - startedAt >= STALE_WINDOW_MS;
  if (!stale) {
    return false;
  }

  await fs.rm(lockPath, { force: true });
  return true;
}

async function isFreshLockFile(lockPath) {
  try {
    const stat = await fs.stat(lockPath);
    return Date.now() - stat.mtimeMs < 2000;
  } catch {
    return false;
  }
}

export async function cleanupStaleTemps(installRoot) {
  const tempRoot = path.join(installRoot, TEMP_ROOT_DIR);
  if (!(await pathExists(tempRoot))) {
    return;
  }

  const entries = await fs.readdir(tempRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.name.startsWith("tmp-")) {
      continue;
    }

    const tempPath = path.join(tempRoot, entry.name);
    const entryStat = await fs.lstat(tempPath);
    if (entryStat.isSymbolicLink()) {
      throw safetyError(`Refusing to inspect symlink temp entry "${tempPath}".`);
    }

    if (!entryStat.isDirectory()) {
      continue;
    }

    const metaPath = path.join(tempPath, TEMP_META_FILE);
    if (!(await pathExists(metaPath))) {
      continue;
    }

    let metadata;
    try {
      metadata = await readJsonFile(metaPath);
    } catch {
      continue;
    }

    const startedAt = Date.parse(metadata.startedAt);
    if (!Number.isFinite(startedAt) || isProcessAlive(metadata.pid)) {
      continue;
    }

    if (Date.now() - startedAt < STALE_WINDOW_MS) {
      continue;
    }

    await removePath(tempPath);
  }
}

export async function installPreparedEntriesAtomically({
  entries,
  installRoot,
  target,
  scope,
  packageVersion,
  force
}) {
  const sessionDir = path.join(
    installRoot,
    TEMP_ROOT_DIR,
    `tmp-${process.pid}-${Date.now()}-batch`
  );
  const payloadRoot = path.join(sessionDir, "payload");
  const backupRoot = path.join(sessionDir, "backup");
  const tempMetaPath = path.join(sessionDir, TEMP_META_FILE);
  const stagedEntries = [];

  await fs.mkdir(payloadRoot, { recursive: true });
  await writeJsonFile(tempMetaPath, {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    target,
    scope,
    integrationIds: entries.map((entry) => entry.id)
  });

  try {
    for (const entry of entries) {
      const finalDir = path.join(installRoot, entry.id);
      const stagedPayloadDir = path.join(payloadRoot, entry.id);

      await copyDirectoryStrict(entry.resolvedSourceDir, stagedPayloadDir);
      await writeJsonFile(path.join(stagedPayloadDir, MARKER_FILE), {
        schemaVersion: MARKER_SCHEMA_VERSION,
        packageName: PACKAGE_NAME,
        packageVersion,
        integrationId: entry.id,
        installedFor: target,
        scope,
        installedAt: new Date().toISOString()
      });

      const existing = await inspectExistingEntry({
        entry,
        finalDir,
        target,
        scope,
        force
      });

      stagedEntries.push({
        entry,
        finalDir,
        stagedPayloadDir,
        backupDir: path.join(backupRoot, entry.id),
        needsBackup: existing.exists
      });
    }

    await commitStagedEntries(stagedEntries, backupRoot);
    await removePath(sessionDir);
    return entries.map((entry) => entry.id);
  } catch (error) {
    await removePath(sessionDir).catch(() => {});
    throw error;
  }
}

export async function removeManagedEntriesAtomically({
  entries,
  installRoot,
  target,
  scope
}) {
  if (entries.length === 0) {
    return [];
  }

  const sessionDir = path.join(
    installRoot,
    TEMP_ROOT_DIR,
    `tmp-${process.pid}-${Date.now()}-remove`
  );
  const backupRoot = path.join(sessionDir, "backup");
  const tempMetaPath = path.join(sessionDir, TEMP_META_FILE);
  const stagedEntries = [];

  await fs.mkdir(sessionDir, { recursive: true });
  await writeJsonFile(tempMetaPath, {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    target,
    scope,
    integrationIds: entries.map((entry) => entry.id),
    action: "remove"
  });

  try {
    for (const entry of entries) {
      const finalDir = path.join(installRoot, entry.id);
      const marker = await readMarkerOrThrow(finalDir).catch((error) => {
        throw withFailedIntegrationId(error, entry.id);
      });

      try {
        assertMarkerMatches({ marker, targetDir: finalDir, entry, target, scope });
      } catch (error) {
        throw withFailedIntegrationId(error, entry.id);
      }

      stagedEntries.push({
        entry,
        finalDir,
        backupDir: path.join(backupRoot, entry.id)
      });
    }

    await commitRemovalEntries(stagedEntries, backupRoot);
    await removePath(sessionDir);
    return entries.map((entry) => entry.id);
  } catch (error) {
    await removePath(sessionDir).catch(() => {});
    throw error;
  }
}

async function inspectExistingEntry({ entry, finalDir, target, scope, force }) {
  const exists = await pathExists(finalDir);
  if (!exists) {
    return { exists: false };
  }

  if (!force) {
    throw withFailedIntegrationId(
      safetyError(
        `Managed directory "${finalDir}" already exists. Re-run with --force only if it was installed by ${PACKAGE_NAME}.`
      ),
      entry.id
    );
  }

  const marker = await readMarkerOrThrow(finalDir).catch((error) => {
    throw withFailedIntegrationId(error, entry.id);
  });

  try {
    assertMarkerMatches({ marker, targetDir: finalDir, entry, target, scope });
  } catch (error) {
    throw withFailedIntegrationId(error, entry.id);
  }

  return { exists: true };
}

async function commitStagedEntries(stagedEntries, backupRoot) {
  const committedEntries = [];

  try {
    for (const stagedEntry of stagedEntries) {
      if (stagedEntry.needsBackup) {
        await fs.mkdir(backupRoot, { recursive: true });
        await fs.rename(stagedEntry.finalDir, stagedEntry.backupDir).catch((error) => {
          throw withFailedIntegrationId(
            installError(`Failed to back up existing directory "${stagedEntry.finalDir}".`, error),
            stagedEntry.entry.id
          );
        });
      }

      await fs.rename(stagedEntry.stagedPayloadDir, stagedEntry.finalDir).catch((error) => {
        throw withFailedIntegrationId(
          installError(`Failed to move staged directory into "${stagedEntry.finalDir}".`, error),
          stagedEntry.entry.id
        );
      });

      committedEntries.push(stagedEntry);
    }

    if (await pathExists(backupRoot)) {
      await removePath(backupRoot);
    }
  } catch (error) {
    await rollbackCommittedEntries(committedEntries, stagedEntries).catch((rollbackError) => {
      throw withFailedIntegrationId(
        installError("Failed to roll back target installation after an error.", rollbackError),
        error && typeof error === "object" && "failedIntegrationId" in error
          ? error.failedIntegrationId
          : undefined
      );
    });

    throw error;
  }
}

async function rollbackCommittedEntries(committedEntries, stagedEntries) {
  for (const stagedEntry of [...stagedEntries].reverse()) {
    if (await pathExists(stagedEntry.finalDir)) {
      await removePath(stagedEntry.finalDir);
    }

    if (stagedEntry.needsBackup && (await pathExists(stagedEntry.backupDir))) {
      await fs.rename(stagedEntry.backupDir, stagedEntry.finalDir);
    }
  }

  for (const stagedEntry of committedEntries) {
    if (await pathExists(stagedEntry.stagedPayloadDir)) {
      await removePath(stagedEntry.stagedPayloadDir);
    }
  }
}

async function commitRemovalEntries(stagedEntries, backupRoot) {
  const committedEntries = [];

  try {
    await fs.mkdir(backupRoot, { recursive: true });

    for (const stagedEntry of stagedEntries) {
      await fs.rename(stagedEntry.finalDir, stagedEntry.backupDir).catch((error) => {
        throw withFailedIntegrationId(
          installError(`Failed to stage directory "${stagedEntry.finalDir}" for removal.`, error),
          stagedEntry.entry.id
        );
      });

      committedEntries.push(stagedEntry);
    }

    await removePath(backupRoot);
  } catch (error) {
    await rollbackRemovalEntries(committedEntries).catch((rollbackError) => {
      throw withFailedIntegrationId(
        installError("Failed to roll back target removal after an error.", rollbackError),
        error && typeof error === "object" && "failedIntegrationId" in error
          ? error.failedIntegrationId
          : undefined
      );
    });

    throw error;
  }
}

async function rollbackRemovalEntries(committedEntries) {
  for (const stagedEntry of [...committedEntries].reverse()) {
    if (await pathExists(stagedEntry.finalDir)) {
      await removePath(stagedEntry.finalDir);
    }

    if (await pathExists(stagedEntry.backupDir)) {
      await fs.rename(stagedEntry.backupDir, stagedEntry.finalDir);
    }
  }
}

async function readMarkerOrThrow(targetDir) {
  const markerPath = path.join(targetDir, MARKER_FILE);
  if (!(await pathExists(markerPath))) {
    throw markerInvalidError(targetDir);
  }

  try {
    return await readJsonFile(markerPath);
  } catch (error) {
    throw markerInvalidError(targetDir, error);
  }
}

function assertMarkerMatches({ marker, targetDir, entry, target, scope }) {
  const scopeMatches = target === "gemini" ? true : marker?.scope === scope;

  if (
    !marker ||
    typeof marker !== "object" ||
    marker.schemaVersion !== MARKER_SCHEMA_VERSION ||
    marker.packageName !== PACKAGE_NAME ||
    marker.integrationId !== entry.id ||
    marker.installedFor !== target ||
    !scopeMatches
  ) {
    throw markerInvalidError(targetDir);
  }
}

function withFailedIntegrationId(error, failedIntegrationId) {
  if (!failedIntegrationId || !error || typeof error !== "object") {
    return error;
  }

  if (!("failedIntegrationId" in error)) {
    Object.defineProperty(error, "failedIntegrationId", {
      value: failedIntegrationId,
      enumerable: false,
      configurable: true,
      writable: true
    });
  }

  return error;
}
