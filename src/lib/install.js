import path from "node:path";
import {
  getTargetAdapter,
  readClaudePluginManifest,
  readCodexPluginManifest
} from "./adapters.js";
import { resolveIntegrationsForTarget } from "./catalog.js";
import {
  CLAUDE_MARKETPLACE_NAME,
  TEMP_ROOT_DIR,
  STRATEGIES,
  TARGETS
} from "./constants.js";
import {
  acquireInstallLock,
  cleanupStaleTemps,
  ensureWritableInstallRoot,
  installPreparedEntriesAtomically,
  removeManagedEntriesAtomically
} from "./install-core.js";
import { externalCommandError, installError, safetyError, toCliError } from "./errors.js";
import {
  createEmptyState,
  loadTargetState,
  recordInstalledIntegration,
  saveTargetState
} from "./state.js";
import {
  formatList,
  pathExists,
  readJsonFile,
  removePath,
  runCommand,
  writeJsonFile
} from "./utils.js";

export function buildInstallRequestsForDirectCommand(catalog, target, selection = {}) {
  const useDefaults =
    selection.selectedIntegrationIds == null && !selection.tag && !selection.group;

  if (target === "all") {
    return TARGETS.map((entryTarget) => ({
      target: entryTarget,
      selectedIntegrationIds: resolveIntegrationsForTarget(catalog, entryTarget, {
        ...selection,
        enabledOnly: useDefaults
      }).map((integration) => integration.id)
    }));
  }

  return [
    {
      target,
      selectedIntegrationIds: resolveIntegrationsForTarget(catalog, target, {
        ...selection,
        enabledOnly: useDefaults
      }).map((integration) => integration.id)
    }
  ];
}

export async function installRequests({
  catalog,
  requests,
  scope,
  cwd,
  dryRun,
  force,
  packageVersion,
  env = process.env
}) {
  const results = [];

  for (const request of requests) {
    const adapter = getTargetAdapter(request.target);

    try {
      const result = await installTarget({
        catalog,
        target: request.target,
        selectedIntegrationIds: request.selectedIntegrationIds,
        scope,
        cwd,
        dryRun,
        force,
        packageVersion,
        env
      });
      results.push(result);
    } catch (error) {
      const installRoot = await tryResolveInstallRoot(adapter, scope, cwd, env);
      results.push({
        action: "install",
        target: request.target,
        scope,
        installRoot,
        integrations: request.selectedIntegrationIds ?? [],
        installed: [],
        skipped: [],
        failed: resolveFailedIntegrationIds(request.selectedIntegrationIds ?? [], error),
        ok: false,
        error
      });
    }
  }

  return results;
}

export async function installTarget({
  catalog,
  target,
  selectedIntegrationIds,
  scope,
  cwd,
  dryRun,
  force,
  packageVersion,
  env = process.env
}) {
  const adapter = getTargetAdapter(target);
  const installRoot = await adapter.resolveInstallRoot(scope, cwd, env);
  const integrations = resolveRequestedIntegrations(catalog, target, selectedIntegrationIds);

  const plan = {
    target,
    scope,
    installRoot,
    integrations: integrations.map((integration) => integration.id)
  };

  if (dryRun) {
    return {
      action: "install",
      ...plan,
      installed: [],
      skipped: [],
      failed: [],
      ok: true,
      dryRun: true
    };
  }

  switch (adapter.strategy) {
    case STRATEGIES.CODEX_LOCAL:
      return installCodexIntegrations({
        adapter,
        integrations,
        installRoot,
        scope,
        cwd,
        packageVersion,
        force
      });
    case STRATEGIES.CLAUDE_LOCAL:
      return installClaudeIntegrations({
        adapter,
        integrations,
        installRoot,
        scope,
        cwd,
        packageVersion,
        force,
        env
      });
    case STRATEGIES.GEMINI_LOCAL:
      return installGeminiIntegrations({
        adapter,
        integrations,
        installRoot,
        scope,
        cwd,
        packageVersion,
        force,
        env
      });
    default:
      throw installError(`Unsupported install strategy "${adapter.strategy}".`);
  }
}

function resolveRequestedIntegrations(catalog, target, selectedIntegrationIds) {
  return resolveIntegrationsForTarget(catalog, target, {
    selectedIntegrationIds,
    enabledOnly: selectedIntegrationIds == null
  });
}

async function installCodexIntegrations({
  adapter,
  integrations,
  installRoot,
  scope,
  cwd,
  packageVersion,
  force
}) {
  const marketplacePath = adapter.resolveCodexMarketplacePath(scope, cwd);
  const marketplaceDir = path.dirname(marketplacePath);
  const manifests = await Promise.all(integrations.map((integration) => readCodexPluginManifest(integration)));
  const mergedMarketplace = await buildCodexMarketplace({
    adapter,
    integrations,
    manifests,
    installRoot,
    scope,
    cwd,
    marketplacePath
  });

  await ensureWritableInstallRoot(installRoot);
  await ensureWritableInstallRoot(marketplaceDir);
  const releaseLock = await acquireInstallLock(installRoot);
  const preparedEntries = [];

  try {
    await cleanupStaleTemps(installRoot);

    for (const integration of integrations) {
      preparedEntries.push(await adapter.prepareLocalEntry(integration));
    }

    const installed = await installPreparedEntriesAtomically({
      entries: preparedEntries,
      installRoot,
      target: "codex",
      scope,
      packageVersion,
      force
    });

    try {
      await writeJsonFile(marketplacePath, mergedMarketplace);
    } catch (error) {
      await removeManagedEntriesAtomically({
        entries: preparedEntries,
        installRoot,
        target: "codex",
        scope
      }).catch(() => {});

      throw installError(`Failed to write Codex marketplace file "${marketplacePath}".`, error);
    }

    return {
      action: "install",
      target: "codex",
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      installed,
      skipped: [],
      failed: [],
      ok: true,
      note: "Restart Codex and install or enable the plugin from Plugin Directory."
    };
  } finally {
    await cleanupPreparedEntries(preparedEntries);
    await releaseLock();
  }
}

async function buildCodexMarketplace({
  adapter,
  integrations,
  manifests,
  installRoot,
  scope,
  cwd,
  marketplacePath
}) {
  const existingMarketplace = (await pathExists(marketplacePath))
    ? await readJsonFile(marketplacePath)
    : {
        name: "agent-plugins-installer",
        interface: {
          displayName: "Agent Plugins Installer"
        },
        plugins: []
      };

  if (!Array.isArray(existingMarketplace.plugins)) {
    throw safetyError(`Codex marketplace file "${marketplacePath}" must contain a plugins array.`);
  }

  const nextMarketplace = {
    ...existingMarketplace,
    name:
      typeof existingMarketplace.name === "string" && existingMarketplace.name.length > 0
        ? existingMarketplace.name
        : "agent-plugins-installer",
    interface:
      existingMarketplace.interface && typeof existingMarketplace.interface === "object"
        ? existingMarketplace.interface
        : { displayName: "Agent Plugins Installer" },
    plugins: [...existingMarketplace.plugins]
  };

  for (const [index, integration] of integrations.entries()) {
    const manifest = manifests[index];
    const sourcePath = adapter.buildCodexMarketplaceSourcePath(
      installRoot,
      integration.id,
      scope,
      cwd
    );
    const entry = {
      name: manifest.name,
      source: {
        source: "local",
        path: sourcePath
      },
      policy: {
        installation: "AVAILABLE",
        authentication: "ON_INSTALL"
      },
      category: manifest.interface?.category ?? "Coding"
    };

    const existingIndex = nextMarketplace.plugins.findIndex((plugin) => plugin.name === manifest.name);
    if (existingIndex === -1) {
      nextMarketplace.plugins.push(entry);
      continue;
    }

    const existingEntry = nextMarketplace.plugins[existingIndex];
    const existingPath =
      existingEntry &&
      typeof existingEntry === "object" &&
      existingEntry.source &&
      typeof existingEntry.source === "object" &&
      existingEntry.source.path;

    if (typeof existingPath === "string" && existingPath !== sourcePath) {
      throw safetyError(
        `Codex marketplace already contains plugin "${manifest.name}" at "${existingPath}". Resolve the conflict manually before reinstalling.`
      );
    }

    nextMarketplace.plugins[existingIndex] = entry;
  }

  return nextMarketplace;
}

async function installClaudeIntegrations({
  adapter,
  integrations,
  installRoot,
  scope,
  cwd,
  packageVersion,
  force,
  env
}) {
  const marketplacePath = adapter.resolveClaudeMarketplacePath(scope, cwd, env);
  const marketplaceRoot = adapter.resolveClaudeMarketplaceRoot(scope, cwd, env);
  const marketplaceDir = path.dirname(marketplacePath);
  const manifests = await Promise.all(
    integrations.map((integration) => readClaudePluginManifest(integration))
  );
  const mergedMarketplace = await buildClaudeMarketplace({
    adapter,
    integrations,
    manifests,
    installRoot,
    scope,
    cwd,
    marketplacePath,
    env
  });

  await ensureWritableInstallRoot(installRoot);
  await ensureWritableInstallRoot(marketplaceDir);
  const releaseLock = await acquireInstallLock(installRoot);
  const preparedEntries = [];
  const statePath = adapter.resolveStateFile(scope, cwd, env);
  const state = statePath
    ? await loadTargetState(statePath, { target: "claude", scope }).catch(() =>
        createEmptyState({ target: "claude", scope })
      )
    : createEmptyState({ target: "claude", scope });

  try {
    await cleanupStaleTemps(installRoot);

    for (const integration of integrations) {
      preparedEntries.push(await adapter.prepareLocalEntry(integration));
    }

    await installPreparedEntriesAtomically({
      entries: preparedEntries,
      installRoot,
      target: "claude",
      scope,
      packageVersion,
      force: true
    });

    await writeJsonFile(marketplacePath, mergedMarketplace);
    await ensureClaudeMarketplaceConfigured({
      adapter,
      scope,
      cwd,
      env,
      marketplaceRoot
    });

    const installed = [];

    for (const [index, integration] of integrations.entries()) {
      const args = adapter.getClaudeInstallArgs(integration, scope);
      const result = await runCommand("claude", args, { cwd, env });
      if (result.code !== 0) {
        throw withFailedIntegrationId(externalCommandError("claude", args, result), integration.id);
      }

      recordInstalledIntegration(state, integration.id, {
        pluginName: manifests[index].name,
        marketplace: CLAUDE_MARKETPLACE_NAME
      });
      installed.push(integration.id);
    }

    if (statePath) {
      await saveTargetState(statePath, state);
    }

    return {
      action: "install",
      target: "claude",
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      installed,
      skipped: [],
      failed: [],
      ok: true,
      note: "Run /reload-plugins or restart Claude Code to load installed plugins."
    };
  } finally {
    await cleanupPreparedEntries(preparedEntries);
    await releaseLock();
  }
}

async function installGeminiIntegrations({
  adapter,
  integrations,
  installRoot,
  scope,
  cwd,
  packageVersion,
  force,
  env
}) {
  await ensureWritableInstallRoot(installRoot);
  const releaseLock = await acquireInstallLock(installRoot);
  const preparedEntries = [];
  const statePath = adapter.resolveStateFile(scope, cwd, env);
  const state = statePath
    ? await loadTargetState(statePath, { target: "gemini", scope }).catch(() =>
        createEmptyState({ target: "gemini", scope })
      )
    : createEmptyState({ target: "gemini", scope });

  try {
    await cleanupStaleTemps(installRoot);
    await removePath(path.join(installRoot, TEMP_ROOT_DIR)).catch(() => {});

    for (const integration of integrations) {
      preparedEntries.push(await adapter.prepareLocalEntry(integration));
    }

    await installPreparedEntriesAtomically({
      entries: preparedEntries,
      installRoot,
      target: "gemini",
      scope,
      packageVersion,
      force: true
    });

    const installed = [];

    for (const integration of integrations) {
      if (scope === "project") {
        const enableArgs = adapter.getGeminiEnableArgs(integration, scope);
        const enableResult = await runCommand("gemini", enableArgs, { cwd, env });
        if (enableResult.code !== 0) {
          throw withFailedIntegrationId(
            externalCommandError("gemini", enableArgs, enableResult),
            integration.id
          );
        }
      } else {
        const args = adapter.getGeminiInstallArgs(path.join(installRoot, integration.id));
        const result = await runCommand("gemini", args, { cwd, env });
        if (result.code !== 0) {
          throw withFailedIntegrationId(externalCommandError("gemini", args, result), integration.id);
        }
      }

      recordInstalledIntegration(state, integration.id, {
        extensionName: integration.id,
        activationScope: scope === "project" ? "workspace" : "user"
      });
      installed.push(integration.id);
    }

    if (statePath) {
      await saveTargetState(statePath, state);
    }

    return {
      action: "install",
      target: "gemini",
      scope,
      installRoot,
      integrations: integrations.map((integration) => integration.id),
      installed,
      skipped: [],
      failed: [],
      ok: true,
      note:
        scope === "project"
          ? "Restart Gemini CLI to load installed extensions. Gemini project scope uses ~/.gemini/extensions plus workspace activation."
          : "Restart Gemini CLI to load installed extensions."
    };
  } finally {
    await cleanupPreparedEntries(preparedEntries);
    await releaseLock();
  }
}

export function summarizeExitCode(results) {
  if (results.every((result) => result.ok)) {
    return 0;
  }

  if (results.length === 1) {
    return toCliError(results[0].error).exitCode;
  }

  return 1;
}

export function formatSummary(result) {
  const lines = [
    "[agent-plugins-installer] install summary",
    `- target: ${result.target}`,
    `- scope: ${result.scope}`,
    `- root: ${result.installRoot ?? "unresolved"}`,
    `- selected: ${formatList(result.integrations ?? [])}`,
    `- installed: ${result.dryRun ? "none (dry-run)" : formatList(result.installed ?? [])}`,
    `- skipped: ${formatList(result.skipped ?? [])}`,
    `- failed: ${formatList(result.failed ?? [])}`
  ];

  if (result.note) {
    lines.push(`- note: ${result.note}`);
  }

  return lines.join("\n");
}

async function tryResolveInstallRoot(adapter, scope, cwd, env) {
  try {
    return await adapter.resolveInstallRoot(scope, cwd, env);
  } catch {
    return undefined;
  }
}

async function buildClaudeMarketplace({
  adapter,
  integrations,
  manifests,
  installRoot,
  scope,
  cwd,
  marketplacePath,
  env
}) {
  const existingMarketplace = (await pathExists(marketplacePath))
    ? await readJsonFile(marketplacePath)
    : {
        name: CLAUDE_MARKETPLACE_NAME,
        owner: {
          name: "Agent Plugins Installer"
        },
        plugins: []
      };

  if (!Array.isArray(existingMarketplace.plugins)) {
    throw safetyError(`Claude marketplace file "${marketplacePath}" must contain a plugins array.`);
  }

  const nextMarketplace = {
    ...existingMarketplace,
    name:
      typeof existingMarketplace.name === "string" && existingMarketplace.name.length > 0
        ? existingMarketplace.name
        : CLAUDE_MARKETPLACE_NAME,
    owner:
      existingMarketplace.owner && typeof existingMarketplace.owner === "object"
        ? existingMarketplace.owner
        : { name: "Agent Plugins Installer" },
    plugins: [...existingMarketplace.plugins]
  };

  for (const [index, integration] of integrations.entries()) {
    const manifest = manifests[index];
    const sourcePath = adapter.buildClaudeMarketplaceSourcePath(installRoot, integration.id, scope, cwd);
    const entry = {
      name: manifest.name,
      source: sourcePath,
      description: manifest.description || integration.description
    };

    const existingIndex = nextMarketplace.plugins.findIndex((plugin) => plugin.name === manifest.name);
    if (existingIndex === -1) {
      nextMarketplace.plugins.push(entry);
      continue;
    }

    const existingEntry = nextMarketplace.plugins[existingIndex];
    const existingPath =
      existingEntry && typeof existingEntry === "object" && typeof existingEntry.source === "string"
        ? existingEntry.source
        : "";

    if (existingPath && existingPath !== sourcePath) {
      throw safetyError(
        `Claude marketplace already contains plugin "${manifest.name}" at "${existingPath}". Resolve the conflict manually before reinstalling.`
      );
    }

    nextMarketplace.plugins[existingIndex] = entry;
  }

  return nextMarketplace;
}

async function ensureClaudeMarketplaceConfigured({ adapter, scope, cwd, env, marketplaceRoot }) {
  const listArgs = adapter.getClaudeMarketplaceListArgs();
  const listResult = await runCommand("claude", listArgs, { cwd, env });
  if (listResult.code !== 0) {
    throw externalCommandError("claude", listArgs, listResult);
  }

  let marketplaces;
  try {
    marketplaces = JSON.parse(listResult.stdout || "[]");
  } catch (error) {
    throw installError("Failed to parse Claude marketplace list output.", error);
  }

  if (
    Array.isArray(marketplaces) &&
    marketplaces.some(
      (marketplace) =>
        marketplace &&
        typeof marketplace === "object" &&
        marketplace.name === CLAUDE_MARKETPLACE_NAME
    )
  ) {
    return;
  }

  const addArgs = adapter.getClaudeMarketplaceAddArgs(marketplaceRoot, scope);
  const addResult = await runCommand("claude", addArgs, { cwd, env });
  if (addResult.code !== 0) {
    throw externalCommandError("claude", addArgs, addResult);
  }
}

function resolveFailedIntegrationIds(requestedIntegrationIds, error) {
  if (
    error &&
    typeof error === "object" &&
    "failedIntegrationId" in error &&
    typeof error.failedIntegrationId === "string"
  ) {
    return [error.failedIntegrationId];
  }

  return requestedIntegrationIds;
}

async function cleanupPreparedEntries(preparedEntries) {
  const cleanupTargets = new Set(
    preparedEntries
      .map((entry) => entry.cleanupPath)
      .filter((cleanupPath) => typeof cleanupPath === "string" && cleanupPath.length > 0)
  );

  await Promise.all(
    [...cleanupTargets].map(async (cleanupPath) => {
      await removePath(cleanupPath).catch(() => {});
    })
  );
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
