#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { PACKAGE_ROOT, SCOPES, TARGETS } from "./lib/constants.js";
import { assertCatalogSourcesExist, loadCatalog } from "./lib/catalog.js";
import { interactiveTtyError, toCliError, usageError } from "./lib/errors.js";
import {
  buildInstallRequestsForDirectCommand,
  formatSummary,
  installRequests,
  summarizeExitCode
} from "./lib/install.js";
import {
  formatManageSummary,
  listTargets,
  removeTargets,
  updateTargets
} from "./lib/manage.js";
import { runInteractiveWizard } from "./lib/interactive.js";

async function main() {
  const packageVersion = await readPackageVersion();
  const catalog = await loadCatalog();
  await assertCatalogSourcesExist(catalog);

  const args = process.argv.slice(2);

  if (args.length === 0) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw interactiveTtyError();
    }

    const selection = await runInteractiveWizard(catalog);
    if (!selection) {
      process.stdout.write("[agent-plugins-installer] Cancelled.\n");
      return 0;
    }

    const results = await installRequests({
      catalog,
      requests: selection.requests,
      scope: selection.scope,
      cwd: process.cwd(),
      dryRun: false,
      force: false,
      packageVersion
    });

    printResults(results);
    return summarizeExitCode(results);
  }

  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${buildUsage()}\n`);
    return 0;
  }

  const command = args[0];

  switch (command) {
    case "install": {
      const parsed = parseCommandArgs(command, args.slice(1));
      const requests = buildInstallRequestsForDirectCommand(catalog, parsed.target, buildSelection(parsed));
      const results = await installRequests({
        catalog,
        requests,
        scope: parsed.scope,
        cwd: parsed.cwd,
        dryRun: parsed.dryRun,
        force: parsed.force,
        packageVersion
      });
      printResults(results);
      return summarizeExitCode(results);
    }
    case "list": {
      const parsed = parseCommandArgs(command, args.slice(1));
      const results = await listTargets({
        catalog,
        target: parsed.target,
        scope: parsed.scope,
        cwd: parsed.cwd,
        selection: buildSelection(parsed)
      });
      printResults(results);
      return summarizeExitCode(results);
    }
    case "remove": {
      const parsed = parseCommandArgs(command, args.slice(1));
      const results = await removeTargets({
        catalog,
        target: parsed.target,
        scope: parsed.scope,
        cwd: parsed.cwd,
        dryRun: parsed.dryRun,
        selection: buildSelection(parsed)
      });
      printResults(results);
      return summarizeExitCode(results);
    }
    case "update": {
      const parsed = parseCommandArgs(command, args.slice(1));
      const results = await updateTargets({
        catalog,
        target: parsed.target,
        scope: parsed.scope,
        cwd: parsed.cwd,
        dryRun: parsed.dryRun,
        packageVersion,
        selection: buildSelection(parsed)
      });
      printResults(results);
      return summarizeExitCode(results);
    }
    default:
      throw usageError(`Unknown command "${command}".\n${buildUsage()}`);
  }
}

function parseCommandArgs(command, args) {
  const [target, ...rest] = args;
  if (!target) {
    throw usageError(`Missing ${command} target.\n${buildUsage()}`);
  }

  if (target !== "all" && !TARGETS.includes(target)) {
    throw usageError(`Unsupported ${command} target "${target}".\n${buildUsage()}`);
  }

  const parsed = {
    target,
    scope: "user",
    cwd: process.cwd(),
    dryRun: false,
    force: false,
    selectedIntegrationIds: undefined,
    tag: undefined,
    group: undefined,
    includeHidden: false,
    includeDeprecated: false
  };

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];

    if (argument === "--scope") {
      const nextValue = rest[index + 1];
      if (!SCOPES.includes(nextValue)) {
        throw usageError(`Invalid value for --scope: "${nextValue}".`);
      }
      parsed.scope = nextValue;
      index += 1;
      continue;
    }

    if (argument === "--cwd") {
      const nextValue = rest[index + 1];
      if (!nextValue) {
        throw usageError("Missing value for --cwd.");
      }
      parsed.cwd = path.resolve(nextValue);
      index += 1;
      continue;
    }

    if (argument === "--dry-run") {
      ensureOptionAllowed(command, argument, ["install", "remove", "update"]);
      parsed.dryRun = true;
      continue;
    }

    if (argument === "--force") {
      ensureOptionAllowed(command, argument, ["install"]);
      parsed.force = true;
      continue;
    }

    if (argument === "--plugins") {
      const nextValue = rest[index + 1];
      if (!nextValue) {
        throw usageError("Missing value for --plugins.");
      }
      parsed.selectedIntegrationIds = nextValue
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (parsed.selectedIntegrationIds.length === 0) {
        throw usageError("At least one plugin id must be provided to --plugins.");
      }
      index += 1;
      continue;
    }

    if (argument === "--tag") {
      const nextValue = rest[index + 1];
      if (!nextValue) {
        throw usageError("Missing value for --tag.");
      }
      parsed.tag = nextValue.trim();
      if (!parsed.tag) {
        throw usageError("Invalid value for --tag.");
      }
      index += 1;
      continue;
    }

    if (argument === "--group") {
      const nextValue = rest[index + 1];
      if (!nextValue) {
        throw usageError("Missing value for --group.");
      }
      parsed.group = nextValue.trim();
      if (!parsed.group) {
        throw usageError("Invalid value for --group.");
      }
      index += 1;
      continue;
    }

    if (argument === "--include-hidden") {
      parsed.includeHidden = true;
      continue;
    }

    if (argument === "--include-deprecated") {
      parsed.includeDeprecated = true;
      continue;
    }

    throw usageError(`Unknown option "${argument}".\n${buildUsage()}`);
  }

  if (parsed.selectedIntegrationIds && (parsed.tag || parsed.group)) {
    throw usageError("--plugins cannot be combined with --tag or --group.");
  }

  if (
    command === "remove" &&
    parsed.selectedIntegrationIds == null &&
    !parsed.tag &&
    !parsed.group
  ) {
    throw usageError("remove requires --plugins, --tag, or --group.");
  }

  return parsed;
}

function buildUsage() {
  return [
    "Usage:",
    "  npx agent-plugins-installer",
    "  npx agent-plugins-installer install <codex|claude|gemini|all> [--scope user|project] [--cwd <path>] [--dry-run] [--force] [--plugins <a,b>] [--tag <tag>] [--group <group>]",
    "  npx agent-plugins-installer list <codex|claude|gemini|all> [--scope user|project] [--cwd <path>] [--plugins <a,b>] [--tag <tag>] [--group <group>]",
    "  npx agent-plugins-installer remove <codex|claude|gemini|all> [--scope user|project] [--cwd <path>] [--dry-run] (--plugins <a,b> | --tag <tag> | --group <group>)",
    "  npx agent-plugins-installer update <codex|claude|gemini|all> [--scope user|project] [--cwd <path>] [--dry-run] [--plugins <a,b>] [--tag <tag>] [--group <group>]"
  ].join("\n");
}

function printResults(results) {
  for (const result of results) {
    const summary =
      result.action === "install" || result.action == null
        ? formatSummary(result)
        : formatManageSummary(result);
    process.stdout.write(`${summary}\n`);
    if (!result.ok && result.error) {
      process.stderr.write(`${toCliError(result.error).message}\n`);
    }
  }
}

function ensureOptionAllowed(command, option, commands) {
  if (!commands.includes(command)) {
    throw usageError(`Option "${option}" is not supported for "${command}".`);
  }
}

function buildSelection(parsed) {
  return {
    selectedIntegrationIds: parsed.selectedIntegrationIds,
    tag: parsed.tag,
    group: parsed.group,
    includeHidden: parsed.includeHidden,
    includeDeprecated: parsed.includeDeprecated,
    ignoreUnsupported: parsed.target === "all"
  };
}

async function readPackageVersion() {
  const packageJsonPath = path.join(PACKAGE_ROOT, "package.json");
  return JSON.parse(await fs.readFile(packageJsonPath, "utf8")).version;
}

main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    const cliError = toCliError(error);
    process.stderr.write(`${cliError.message}\n`);
    process.exitCode = cliError.exitCode;
  });
