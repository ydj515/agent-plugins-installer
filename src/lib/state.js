import os from "node:os";
import path from "node:path";
import { PACKAGE_NAME, STATE_FILE, STATE_SCHEMA_VERSION } from "./constants.js";
import { configError } from "./errors.js";
import { pathExists, readJsonFile, writeJsonFile } from "./utils.js";

export async function loadTargetState(statePath, { target, scope }) {
  if (!(await pathExists(statePath))) {
    return createEmptyState({ target, scope });
  }

  let data;
  try {
    data = await readJsonFile(statePath);
  } catch (error) {
    throw configError(`Failed to read state file "${statePath}".`, error);
  }

  if (
    !data ||
    typeof data !== "object" ||
    data.schemaVersion !== STATE_SCHEMA_VERSION ||
    data.packageName !== PACKAGE_NAME ||
    data.target !== target ||
    data.scope !== scope ||
    !data.integrations ||
    typeof data.integrations !== "object" ||
    Array.isArray(data.integrations)
  ) {
    throw configError(`State file "${statePath}" is invalid or belongs to another target.`);
  }

  return data;
}

export async function saveTargetState(statePath, state) {
  await writeJsonFile(statePath, state);
}

export function createEmptyState({ target, scope }) {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    packageName: PACKAGE_NAME,
    target,
    scope,
    integrations: {}
  };
}

export function recordInstalledIntegration(state, integrationId, metadata = {}) {
  state.integrations[integrationId] = {
    installedAt: new Date().toISOString(),
    ...metadata
  };
}

export function removeInstalledIntegration(state, integrationId) {
  delete state.integrations[integrationId];
}

export function listInstalledIntegrationIds(state) {
  return Object.keys(state.integrations).sort((left, right) => left.localeCompare(right));
}

export function resolveStatePathForTarget(target, scope, cwd, homeDir = os.homedir()) {
  switch (target) {
    case "claude":
      return scope === "project"
        ? path.join(cwd, ".claude", STATE_FILE)
        : path.join(homeDir, ".claude", STATE_FILE);
    case "gemini":
      return scope === "project"
        ? path.join(cwd, ".gemini", STATE_FILE)
        : path.join(homeDir, ".gemini", STATE_FILE);
    default:
      throw configError(`Target "${target}" does not use a standalone state file.`);
  }
}
