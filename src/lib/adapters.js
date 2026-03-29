import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  CLAUDE_MARKETPLACE_NAME,
  STRATEGIES,
  TARGETS
} from "./constants.js";
import { usageError } from "./errors.js";
import {
  copyDirectoryStrict,
  readJsonFile,
  toRelativeMarketplacePath
} from "./utils.js";

const IGNORED_SOURCE_NAMES = new Set([".DS_Store", "targets"]);

export function getTargetAdapter(target) {
  if (!TARGETS.includes(target)) {
    throw usageError(`Unsupported target "${target}".`);
  }

  return {
    target,
    strategy: getTargetStrategy(target),
    supportsScope(_scope) {
      return true;
    },
    resolveInstallRoot(scope, cwd, _env = process.env, homeDir = os.homedir()) {
      return resolveInstallRootForTarget(target, scope, cwd, homeDir);
    },
    resolveStateFile(scope, cwd, _env = process.env, homeDir = os.homedir()) {
      return resolveStateFileForTarget(target, scope, cwd, homeDir);
    },
    resolveCodexMarketplacePath(scope, cwd, _env = process.env, homeDir = os.homedir()) {
      return resolveCodexMarketplacePath(scope, cwd, homeDir);
    },
    resolveClaudeMarketplaceRoot(scope, cwd, _env = process.env, homeDir = os.homedir()) {
      return resolveClaudeMarketplaceRoot(scope, cwd, homeDir);
    },
    resolveClaudeMarketplacePath(scope, cwd, _env = process.env, homeDir = os.homedir()) {
      return path.join(
        resolveClaudeMarketplaceRoot(scope, cwd, homeDir),
        ".claude-plugin",
        "marketplace.json"
      );
    },
    async prepareLocalEntry(integration) {
      return prepareLocalEntryForTarget(integration, target);
    },
    buildCodexMarketplaceSourcePath(installRoot, integrationId, scope, cwd, homeDir = os.homedir()) {
      const marketplaceBaseDir = scope === "project" ? cwd : homeDir;
      return toRelativeMarketplacePath(marketplaceBaseDir, path.join(installRoot, integrationId));
    },
    buildClaudeMarketplaceSourcePath(installRoot, integrationId, scope, cwd, homeDir = os.homedir()) {
      const marketplaceRoot = resolveClaudeMarketplaceRoot(scope, cwd, homeDir);
      return toRelativeMarketplacePath(marketplaceRoot, path.join(installRoot, integrationId));
    },
    getClaudeMarketplaceListArgs() {
      return ["plugin", "marketplace", "list", "--json"];
    },
    getClaudeMarketplaceAddArgs(marketplaceRoot, scope) {
      return ["plugin", "marketplace", "add", marketplaceRoot, "--scope", scope];
    },
    getClaudeInstallArgs(integration, scope) {
      return ["plugin", "install", `${integration.id}@${CLAUDE_MARKETPLACE_NAME}`, "--scope", scope];
    },
    getClaudeUninstallArgs(integration, scope) {
      return ["plugin", "uninstall", `${integration.id}@${CLAUDE_MARKETPLACE_NAME}`, "--scope", scope];
    },
    getGeminiInstallArgs(bundlePath) {
      return ["extensions", "install", bundlePath, "--consent"];
    },
    getGeminiUninstallArgs(integration) {
      return ["extensions", "uninstall", integration.id];
    },
    getGeminiUpdateArgs(integration) {
      return ["extensions", "update", integration.id];
    },
    getGeminiEnableArgs(integration, scope) {
      return ["extensions", "enable", integration.id, "--scope", geminiScopeFor(scope)];
    },
    getGeminiDisableArgs(integration, scope) {
      return ["extensions", "disable", integration.id, "--scope", geminiScopeFor(scope)];
    }
  };
}

export async function readCodexPluginManifest(integration) {
  return readJsonFile(path.join(resolveTargetOverlayDir(integration, "codex"), ".codex-plugin", "plugin.json"));
}

export async function readClaudePluginManifest(integration) {
  return readJsonFile(
    path.join(resolveTargetOverlayDir(integration, "claude"), ".claude-plugin", "plugin.json")
  );
}

export async function readGeminiExtensionManifest(integration) {
  return readJsonFile(path.join(resolveTargetOverlayDir(integration, "gemini"), "gemini-extension.json"));
}

function getTargetStrategy(target) {
  switch (target) {
    case "codex":
      return STRATEGIES.CODEX_LOCAL;
    case "claude":
      return STRATEGIES.CLAUDE_LOCAL;
    case "gemini":
      return STRATEGIES.GEMINI_LOCAL;
    default:
      throw usageError(`Unsupported target "${target}".`);
  }
}

function resolveInstallRootForTarget(target, scope, cwd, homeDir) {
  switch (target) {
    case "codex":
      return scope === "project"
        ? path.join(cwd, ".codex", "plugins")
        : path.join(homeDir, ".codex", "plugins");
    case "claude":
      return scope === "project"
        ? path.join(cwd, ".claude", "plugins")
        : path.join(homeDir, ".claude", "plugins");
    case "gemini":
      return path.join(homeDir, ".gemini", "extensions");
    default:
      throw usageError(`Unsupported target "${target}".`);
  }
}

function resolveStateFileForTarget(target, scope, cwd, homeDir) {
  switch (target) {
    case "claude":
      return scope === "project"
        ? path.join(cwd, ".claude", ".agent-plugins-installer-state.json")
        : path.join(homeDir, ".claude", ".agent-plugins-installer-state.json");
    case "gemini":
      return scope === "project"
        ? path.join(cwd, ".gemini", ".agent-plugins-installer-state.json")
        : path.join(homeDir, ".gemini", ".agent-plugins-installer-state.json");
    default:
      return undefined;
  }
}

function resolveCodexMarketplacePath(scope, cwd, homeDir) {
  return scope === "project"
    ? path.join(cwd, ".agents", "plugins", "marketplace.json")
    : path.join(homeDir, ".agents", "plugins", "marketplace.json");
}

function resolveClaudeMarketplaceRoot(scope, cwd, homeDir) {
  return scope === "project"
    ? path.join(cwd, ".claude")
    : path.join(homeDir, ".claude");
}

async function prepareLocalEntryForTarget(integration, target) {
  const overlayDir = resolveTargetOverlayDir(integration, target);
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), `agent-plugins-installer-${target}-`));
  const preparedDir = path.join(tempRoot, integration.id);

  await fs.mkdir(preparedDir, { recursive: true });
  await copySharedIntegrationSource(integration.resolvedSourceDir, preparedDir);
  await copyDirectoryStrict(overlayDir, preparedDir);

  return {
    ...integration,
    resolvedSourceDir: preparedDir,
    cleanupPath: tempRoot
  };
}

async function copySharedIntegrationSource(sourceDir, destinationDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_SOURCE_NAMES.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    const stat = await fs.lstat(sourcePath);

    if (stat.isSymbolicLink()) {
      throw new Error(`Symlinks are not supported: ${sourcePath}`);
    }

    if (stat.isDirectory()) {
      await copyDirectoryStrict(sourcePath, destinationPath);
      continue;
    }

    if (!stat.isFile()) {
      throw new Error(`Unsupported file type: ${sourcePath}`);
    }

    await fs.copyFile(sourcePath, destinationPath);
    await fs.chmod(destinationPath, stat.mode);
  }
}

function resolveTargetOverlayDir(integration, target) {
  return path.join(integration.resolvedSourceDir, "targets", target);
}

function geminiScopeFor(scope) {
  if (scope === "project") {
    return "workspace";
  }

  return "user";
}
