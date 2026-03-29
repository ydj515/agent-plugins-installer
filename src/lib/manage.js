import fs from "node:fs/promises";
import path from "node:path";
import {
  getTargetAdapter,
  readClaudePluginManifest,
  readCodexPluginManifest
} from "./adapters.js";
import { resolveIntegrationsForTarget } from "./catalog.js";
import {
  LOCK_FILE,
  MARKER_FILE,
  MARKER_SCHEMA_VERSION,
  PACKAGE_NAME,
  TARGETS,
  TEMP_ROOT_DIR
} from "./constants.js";
import {
  externalCommandError,
  markerInvalidError,
  safetyError
} from "./errors.js";
import {
  acquireInstallLock,
  cleanupStaleTemps,
  ensureWritableInstallRoot,
  removeManagedEntriesAtomically
} from "./install-core.js";
import { installTarget } from "./install.js";
import {
  createEmptyState,
  listInstalledIntegrationIds,
  loadTargetState,
  removeInstalledIntegration,
  saveTargetState
} from "./state.js";
import {
  formatList,
  pathExists,
  readJsonFile,
  runCommand,
  writeJsonFile
} from "./utils.js";

export async function listTargets({ catalog, target, scope, cwd, selection, env = process.env }) {
  return runPerTarget({
    action: "list",
    target,
    scope,
    cwd,
    callback: (entryTarget) => listTarget({ catalog, target: entryTarget, scope, cwd, selection, env })
  });
}

export async function removeTargets({
  catalog,
  target,
  scope,
  cwd,
  dryRun,
  selection,
  env = process.env
}) {
  return runPerTarget({
    action: "remove",
    target,
    scope,
    cwd,
    callback: (entryTarget) =>
      removeTarget({ catalog, target: entryTarget, scope, cwd, dryRun, selection, env })
  });
}

export async function updateTargets({
  catalog,
  target,
  scope,
  cwd,
  dryRun,
  packageVersion,
  selection,
  env = process.env
}) {
  return runPerTarget({
    action: "update",
    target,
    scope,
    cwd,
    callback: (entryTarget) =>
      updateTarget({
        catalog,
        target: entryTarget,
        scope,
        cwd,
        dryRun,
        packageVersion,
        selection,
        env
      })
  });
}

export function formatManageSummary(result) {
  switch (result.action) {
    case "list":
      return formatListSummary(result);
    case "remove":
      return formatRemoveSummary(result);
    case "update":
      return formatUpdateSummary(result);
    default:
      return "";
  }
}

async function listTarget({ catalog, target, scope, cwd, selection, env }) {
  const adapter = getTargetAdapter(target);
  const installRoot = await adapter.resolveInstallRoot(scope, cwd, env);
  const integrations = resolveIntegrationsForTarget(catalog, target, selection);

  if (target === "codex") {
    return listCodexTarget({ adapter, target, scope, cwd, installRoot, integrations });
  }

  return listExternalTarget({ adapter, target, scope, cwd, installRoot, integrations, env });
}

async function listCodexTarget({ adapter, target, scope, cwd, installRoot, integrations }) {
  const marketplacePath = adapter.resolveCodexMarketplacePath(scope, cwd);
  const entries = [];
  const installed = [];
  const available = [];
  const conflicts = [];

  for (const integration of integrations) {
    const state = await inspectCodexIntegrationState({ installRoot, target, scope, integration });
    entries.push(state);

    if (state.status === "installed") {
      installed.push(integration.id);
    } else if (state.status === "available") {
      available.push(integration.id);
    } else {
      conflicts.push(integration.id);
    }
  }

  return {
    action: "list",
    target,
    scope,
    installRoot,
    integrations: integrations.map((integration) => integration.id),
    entries,
    installed,
    available,
    conflicts,
    unmanaged: await findUnmanagedDirectories(installRoot, new Set(integrations.map((item) => item.id))),
    marketplacePath,
    ok: true
  };
}

async function listExternalTarget({ adapter, target, scope, cwd, installRoot, integrations, env }) {
  const statePath = adapter.resolveStateFile(scope, cwd, env);
  const state = statePath
    ? await loadTargetState(statePath, { target, scope }).catch(() => createEmptyState({ target, scope }))
    : createEmptyState({ target, scope });
  const installedSet = new Set(listInstalledIntegrationIds(state));

  return {
    action: "list",
    target,
    scope,
    installRoot,
    integrations: integrations.map((integration) => integration.id),
    entries: integrations.map((integration) => ({
      id: integration.id,
      status: installedSet.has(integration.id) ? "installed" : "available",
      title: integration.title,
      enabledByDefault: integration.enabledByDefault,
      tags: integration.tags,
      groups: integration.groups
    })),
    installed: integrations.filter((integration) => installedSet.has(integration.id)).map((item) => item.id),
    available: integrations.filter((integration) => !installedSet.has(integration.id)).map((item) => item.id),
    conflicts: [],
    unmanaged: [],
    ok: true
  };
}

async function removeTarget({ catalog, target, scope, cwd, dryRun, selection, env }) {
  const adapter = getTargetAdapter(target);
  const installRoot = await adapter.resolveInstallRoot(scope, cwd, env);
  const integrations = resolveIntegrationsForTarget(catalog, target, selection);

  if (target === "codex") {
    return removeCodexTarget({ adapter, target, scope, cwd, dryRun, installRoot, integrations });
  }

  if (target === "claude") {
    return removeClaudeTarget({ adapter, target, scope, cwd, dryRun, installRoot, integrations, env });
  }

  return removeGeminiTarget({ adapter, target, scope, cwd, dryRun, installRoot, integrations, env });
}

async function removeCodexTarget({ adapter, target, scope, cwd, dryRun, installRoot, integrations }) {
  const removable = [];
  const skipped = [];

  for (const integration of integrations) {
    const state = await inspectCodexIntegrationState({ installRoot, target, scope, integration });
    if (state.status === "available") {
      skipped.push(integration.id);
      continue;
    }

    if (state.status === "installed") {
      removable.push(integration);
      continue;
    }

    throw withFailedIntegrationId(markerInvalidError(state.integrationDir), integration.id);
  }

  if (dryRun || removable.length === 0) {
    return {
      action: "remove",
      target,
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      removed: [],
      skipped,
      failed: [],
      ok: true,
      dryRun
    };
  }

  const marketplacePath = adapter.resolveCodexMarketplacePath(scope, cwd);
  await ensureWritableInstallRoot(installRoot);
  await ensureWritableInstallRoot(path.dirname(marketplacePath));
  const releaseLock = await acquireInstallLock(installRoot);

  try {
    await cleanupStaleTemps(installRoot);
    const removed = await removeManagedEntriesAtomically({
      entries: removable,
      installRoot,
      target,
      scope
    });
    await removeCodexMarketplaceEntries({
      adapter,
      marketplacePath,
      installRoot,
      scope,
      cwd,
      integrations: removable
    });

    return {
      action: "remove",
      target,
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      removed,
      skipped,
      failed: [],
      ok: true
    };
  } finally {
    await releaseLock();
  }
}

async function removeClaudeTarget({
  adapter,
  target,
  scope,
  cwd,
  dryRun,
  installRoot,
  integrations,
  env
}) {
  const statePath = adapter.resolveStateFile(scope, cwd, env);
  const state = statePath
    ? await loadTargetState(statePath, { target, scope }).catch(() => createEmptyState({ target, scope }))
    : createEmptyState({ target, scope });
  const installedSet = new Set(listInstalledIntegrationIds(state));
  const skipped = [];
  const removed = [];
  const removable = [];

  for (const integration of integrations) {
    if (!installedSet.has(integration.id)) {
      skipped.push(integration.id);
      continue;
    }

    removable.push(integration);
  }

  if (dryRun || removable.length === 0) {
    return {
      action: "remove",
      target,
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      removed: [],
      skipped,
      failed: [],
      ok: true,
      dryRun
    };
  }

  const marketplacePath = adapter.resolveClaudeMarketplacePath(scope, cwd, env);
  await ensureWritableInstallRoot(installRoot);
  await ensureWritableInstallRoot(path.dirname(marketplacePath));
  const releaseLock = await acquireInstallLock(installRoot);

  try {
    await cleanupStaleTemps(installRoot);

    for (const integration of removable) {
      const args = adapter.getClaudeUninstallArgs(integration, scope);
      const result = await runCommand("claude", args, { cwd, env });
      if (result.code !== 0) {
        throw withFailedIntegrationId(externalCommandError("claude", args, result), integration.id);
      }

      removeInstalledIntegration(state, integration.id);
      removed.push(integration.id);
    }

    await removeManagedEntriesAtomically({
      entries: removable,
      installRoot,
      target,
      scope
    });
    await removeClaudeMarketplaceEntries({
      adapter,
      marketplacePath,
      installRoot,
      scope,
      cwd,
      integrations: removable
    });

    if (statePath) {
      await saveTargetState(statePath, state);
    }
  } finally {
    await releaseLock();
  }

  return {
    action: "remove",
    target,
    scope,
    installRoot,
    integrations: integrations.map((integration) => integration.id),
    removed,
    skipped,
    failed: [],
    ok: true,
    dryRun
  };
}

async function removeGeminiTarget({
  adapter,
  target,
  scope,
  cwd,
  dryRun,
  installRoot,
  integrations,
  env
}) {
  const statePath = adapter.resolveStateFile(scope, cwd, env);
  const state = statePath
    ? await loadTargetState(statePath, { target, scope }).catch(() => createEmptyState({ target, scope }))
    : createEmptyState({ target, scope });
  const installedSet = new Set(listInstalledIntegrationIds(state));
  const skipped = [];
  const removed = [];
  const removable = [];

  for (const integration of integrations) {
    if (!installedSet.has(integration.id)) {
      skipped.push(integration.id);
      continue;
    }

    removable.push(integration);
  }

  if (dryRun || removable.length === 0) {
    return {
      action: "remove",
      target,
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      removed: [],
      skipped,
      failed: [],
      ok: true,
      dryRun
    };
  }

  await ensureWritableInstallRoot(installRoot);
  if (scope === "project") {
    for (const integration of removable) {
      const args = adapter.getGeminiDisableArgs(integration, scope);
      const result = await runCommand("gemini", args, { cwd, env });
      if (result.code !== 0) {
        throw withFailedIntegrationId(externalCommandError("gemini", args, result), integration.id);
      }

      removeInstalledIntegration(state, integration.id);
      removed.push(integration.id);
    }

    if (statePath) {
      await saveTargetState(statePath, state);
    }
  } else {
    const releaseLock = await acquireInstallLock(installRoot);

    try {
      await cleanupStaleTemps(installRoot);

      for (const integration of removable) {
        const args = adapter.getGeminiUninstallArgs(integration);
        const result = await runCommand("gemini", args, { cwd, env });
        if (result.code !== 0) {
          throw withFailedIntegrationId(externalCommandError("gemini", args, result), integration.id);
        }

        removeInstalledIntegration(state, integration.id);
        removed.push(integration.id);
      }

      await removeManagedEntriesAtomically({
        entries: removable,
        installRoot,
        target,
        scope
      });

      if (statePath) {
        await saveTargetState(statePath, state);
      }
    } finally {
      await releaseLock();
    }
  }

  return {
    action: "remove",
    target,
    scope,
    installRoot,
    integrations: integrations.map((integration) => integration.id),
    removed,
    skipped,
    failed: [],
    ok: true,
    dryRun,
    note:
      scope === "project"
        ? "Gemini project scope removal disables the extension for this workspace and keeps the shared bundle in ~/.gemini/extensions."
        : undefined
  };
}

async function removeExternalTarget({
  adapter,
  target,
  scope,
  cwd,
  dryRun,
  installRoot,
  integrations,
  env
}) {
  const statePath = adapter.resolveStateFile(scope, cwd, env);
  const state = statePath
    ? await loadTargetState(statePath, { target, scope }).catch(() => createEmptyState({ target, scope }))
    : createEmptyState({ target, scope });
  const installedSet = new Set(listInstalledIntegrationIds(state));
  const skipped = [];
  const removed = [];

  for (const integration of integrations) {
    if (!installedSet.has(integration.id)) {
      skipped.push(integration.id);
      continue;
    }

    if (dryRun) {
      continue;
    }

    const command = target === "claude" ? "claude" : "gemini";
    const args =
      target === "claude"
        ? adapter.getClaudeUninstallArgs(integration, scope)
        : adapter.getGeminiUninstallArgs(integration);
    const result = await runCommand(command, args, { cwd, env });
    if (result.code !== 0) {
      throw withFailedIntegrationId(externalCommandError(command, args, result), integration.id);
    }

    removeInstalledIntegration(state, integration.id);
    removed.push(integration.id);
  }

  if (!dryRun && statePath) {
    await saveTargetState(statePath, state);
  }

  return {
    action: "remove",
    target,
    scope,
    installRoot,
    integrations: integrations.map((integration) => integration.id),
    removed,
    skipped,
    failed: [],
    ok: true,
    dryRun
  };
}

async function updateTarget({
  catalog,
  target,
  scope,
  cwd,
  dryRun,
  packageVersion,
  selection,
  env
}) {
  const adapter = getTargetAdapter(target);
  const installRoot = await adapter.resolveInstallRoot(scope, cwd, env);
  const integrations = resolveIntegrationsForTarget(catalog, target, selection);

  if (target === "codex") {
    const updatableIntegrationIds = [];
    const skipped = [];

    for (const integration of integrations) {
      const state = await inspectCodexIntegrationState({ installRoot, target, scope, integration });
      if (state.status === "available") {
        skipped.push(integration.id);
        continue;
      }

      if (state.status === "installed") {
        updatableIntegrationIds.push(integration.id);
        continue;
      }

      throw withFailedIntegrationId(markerInvalidError(state.integrationDir), integration.id);
    }

    if (updatableIntegrationIds.length === 0) {
      return {
        action: "update",
        target,
        scope,
        installRoot,
        integrations: integrations.map((integration) => integration.id),
        updated: [],
        skipped,
        failed: [],
        ok: true,
        dryRun
      };
    }

    const installResult = await installTarget({
      catalog,
      target,
      selectedIntegrationIds: updatableIntegrationIds,
      scope,
      cwd,
      dryRun,
      force: true,
      packageVersion,
      env
    });

    return {
      action: "update",
      target,
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      updated: installResult.installed,
      skipped,
      failed: installResult.failed,
      ok: installResult.ok,
      error: installResult.error,
      dryRun,
      note: installResult.note
    };
  }

  if (target === "claude") {
    return reinstallManagedTarget({
      catalog,
      adapter,
      target,
      scope,
      cwd,
      dryRun,
      packageVersion,
      integrations,
      installRoot,
      env
    });
  }

  return reinstallManagedTarget({
    catalog,
    adapter,
    target,
    scope,
    cwd,
    dryRun,
    packageVersion,
    integrations,
    installRoot,
    env
  });
}

async function inspectCodexIntegrationState({ installRoot, target, scope, integration }) {
  const integrationDir = path.join(installRoot, integration.id);
  if (!(await pathExists(integrationDir))) {
    return {
      id: integration.id,
      integrationDir,
      status: "available",
      title: integration.title,
      enabledByDefault: integration.enabledByDefault,
      tags: integration.tags,
      groups: integration.groups
    };
  }

  const markerPath = path.join(integrationDir, MARKER_FILE);
  if (!(await pathExists(markerPath))) {
    return {
      id: integration.id,
      integrationDir,
      status: "conflict",
      title: integration.title,
      enabledByDefault: integration.enabledByDefault,
      tags: integration.tags,
      groups: integration.groups
    };
  }

  try {
    const marker = await readJsonFile(markerPath);
    if (
      marker.schemaVersion === MARKER_SCHEMA_VERSION &&
      marker.packageName === PACKAGE_NAME &&
      marker.integrationId === integration.id &&
      marker.installedFor === target &&
      marker.scope === scope
    ) {
      return {
        id: integration.id,
        integrationDir,
        status: "installed",
        title: integration.title,
        enabledByDefault: integration.enabledByDefault,
        tags: integration.tags,
        groups: integration.groups
      };
    }
  } catch {}

  return {
    id: integration.id,
    integrationDir,
    status: "conflict",
    title: integration.title,
    enabledByDefault: integration.enabledByDefault,
    tags: integration.tags,
    groups: integration.groups
  };
}

async function removeCodexMarketplaceEntries({
  adapter,
  marketplacePath,
  installRoot,
  scope,
  cwd,
  integrations
}) {
  if (!(await pathExists(marketplacePath))) {
    return;
  }

  const marketplace = await readJsonFile(marketplacePath);
  if (!Array.isArray(marketplace.plugins)) {
    throw safetyError(`Codex marketplace file "${marketplacePath}" must contain a plugins array.`);
  }

  const namesToRemove = new Set();
  for (const integration of integrations) {
    const manifest = await readCodexPluginManifest(integration);
    const sourcePath = adapter.buildCodexMarketplaceSourcePath(
      installRoot,
      integration.id,
      scope,
      cwd
    );
    namesToRemove.add(`${manifest.name}:${sourcePath}`);
  }

  marketplace.plugins = marketplace.plugins.filter((plugin) => {
    const sourcePath =
      plugin &&
      typeof plugin === "object" &&
      plugin.source &&
      typeof plugin.source === "object" &&
      typeof plugin.source.path === "string"
        ? plugin.source.path
        : "";
    return !namesToRemove.has(`${plugin.name}:${sourcePath}`);
  });

  await writeJsonFile(marketplacePath, marketplace);
}

async function removeClaudeMarketplaceEntries({
  adapter,
  marketplacePath,
  installRoot,
  scope,
  cwd,
  integrations
}) {
  if (!(await pathExists(marketplacePath))) {
    return;
  }

  const marketplace = await readJsonFile(marketplacePath);
  if (!Array.isArray(marketplace.plugins)) {
    throw safetyError(`Claude marketplace file "${marketplacePath}" must contain a plugins array.`);
  }

  const namesToRemove = new Set();
  for (const integration of integrations) {
    const manifest = await readClaudePluginManifest(integration);
    const sourcePath = adapter.buildClaudeMarketplaceSourcePath(
      installRoot,
      integration.id,
      scope,
      cwd
    );
    namesToRemove.add(`${manifest.name}:${sourcePath}`);
  }

  marketplace.plugins = marketplace.plugins.filter((plugin) => {
    const sourcePath =
      plugin && typeof plugin === "object" && typeof plugin.source === "string" ? plugin.source : "";
    return !namesToRemove.has(`${plugin.name}:${sourcePath}`);
  });

  await writeJsonFile(marketplacePath, marketplace);
}

async function findUnmanagedDirectories(installRoot, knownIntegrationIds) {
  if (!(await pathExists(installRoot))) {
    return [];
  }

  const entries = await fs.readdir(installRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== TEMP_ROOT_DIR && !knownIntegrationIds.has(name))
    .sort((left, right) => left.localeCompare(right));
}

async function reinstallManagedTarget({
  catalog,
  adapter,
  target,
  scope,
  cwd,
  dryRun,
  packageVersion,
  integrations,
  installRoot,
  env
}) {
  const statePath = adapter.resolveStateFile(scope, cwd, env);
  const state = statePath
    ? await loadTargetState(statePath, { target, scope }).catch(() => createEmptyState({ target, scope }))
    : createEmptyState({ target, scope });
  const installedSet = new Set(listInstalledIntegrationIds(state));
  const selected = integrations.filter((integration) => installedSet.has(integration.id));
  const skipped = integrations
    .filter((integration) => !installedSet.has(integration.id))
    .map((integration) => integration.id);

  if (selected.length === 0) {
    return {
      action: "update",
      target,
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      updated: [],
      skipped,
      failed: [],
      ok: true,
      dryRun
    };
  }

  if (dryRun) {
    return {
      action: "update",
      target,
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      updated: [],
      skipped,
      failed: [],
      ok: true,
      dryRun
    };
  }

  if (target === "claude") {
    await removeClaudeTarget({
      adapter,
      target,
      scope,
      cwd,
      dryRun: false,
      installRoot,
      integrations: selected,
      env
    });
  } else {
    await removeGeminiTarget({
      adapter,
      target,
      scope,
      cwd,
      dryRun: false,
      installRoot,
      integrations: selected,
      env
    });
  }

  const installResult = await installTarget({
    catalog,
    target,
    selectedIntegrationIds: selected.map((integration) => integration.id),
    scope,
    cwd,
    dryRun: false,
    force: true,
    packageVersion,
    env
  });

  return {
    action: "update",
    target,
    scope,
    installRoot,
    integrations: integrations.map((integration) => integration.id),
    updated: installResult.installed,
    skipped,
    failed: installResult.failed,
    ok: installResult.ok,
    error: installResult.error,
    dryRun,
    note: installResult.note
  };
}

function skippedScopeResult(action, target, scope, note) {
  return {
    action,
    target,
    scope,
    installRoot: undefined,
    integrations: [],
    installed: [],
    removed: [],
    updated: [],
    skipped: [],
    failed: [],
    ok: true,
    note
  };
}

function formatListSummary(result) {
  const lines = [
    `[agent-plugins-installer] ${result.action} summary`,
    `- target: ${result.target}`,
    `- scope: ${result.scope}`,
    `- root: ${result.installRoot ?? "unresolved"}`,
    `- selected: ${formatList(result.integrations ?? [])}`,
    `- installed: ${formatList(result.installed ?? [])}`,
    `- available: ${formatList(result.available ?? [])}`,
    `- conflicts: ${formatList(result.conflicts ?? [])}`,
    `- unmanaged: ${formatList(result.unmanaged ?? [])}`
  ];

  for (const entry of result.entries ?? []) {
    lines.push(
      `integration: ${entry.id} | status: ${entry.status} | default: ${
        entry.enabledByDefault ? "yes" : "no"
      } | groups: ${formatList(entry.groups ?? [])} | tags: ${formatList(entry.tags ?? [])}`
    );
  }

  if (result.note) {
    lines.push(`- note: ${result.note}`);
  }

  return lines.join("\n");
}

function formatRemoveSummary(result) {
  const lines = [
    `[agent-plugins-installer] ${result.action} summary`,
    `- target: ${result.target}`,
    `- scope: ${result.scope}`,
    `- root: ${result.installRoot ?? "unresolved"}`,
    `- selected: ${formatList(result.integrations ?? [])}`,
    `- removed: ${result.dryRun ? "none (dry-run)" : formatList(result.removed ?? [])}`,
    `- skipped: ${formatList(result.skipped ?? [])}`,
    `- failed: ${formatList(result.failed ?? [])}`
  ];

  if (result.note) {
    lines.push(`- note: ${result.note}`);
  }

  return lines.join("\n");
}

function formatUpdateSummary(result) {
  const lines = [
    `[agent-plugins-installer] ${result.action} summary`,
    `- target: ${result.target}`,
    `- scope: ${result.scope}`,
    `- root: ${result.installRoot ?? "unresolved"}`,
    `- selected: ${formatList(result.integrations ?? [])}`,
    `- updated: ${result.dryRun ? "none (dry-run)" : formatList(result.updated ?? [])}`,
    `- skipped: ${formatList(result.skipped ?? [])}`,
    `- failed: ${formatList(result.failed ?? [])}`
  ];

  if (result.note) {
    lines.push(`- note: ${result.note}`);
  }

  return lines.join("\n");
}

async function runPerTarget({ action, target, scope, cwd, callback }) {
  const results = [];
  const targets = target === "all" ? TARGETS : [target];

  for (const entryTarget of targets) {
    try {
      results.push(await callback(entryTarget));
    } catch (error) {
      results.push({
        action,
        target: entryTarget,
        scope,
        installRoot: undefined,
        integrations: [],
        failed: [],
        ok: false,
        error
      });
    }
  }

  return results;
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
