import fs from "node:fs/promises";
import path from "node:path";
import {
  CATALOG_SCHEMA_VERSION,
  PACKAGE_ROOT,
  TARGETS
} from "./constants.js";
import { configError, usageError } from "./errors.js";
import { pathExists } from "./utils.js";

const CATALOG_PATH = path.join(PACKAGE_ROOT, "catalog.json");

export async function loadCatalog() {
  let rawCatalog;

  try {
    rawCatalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  } catch (error) {
    throw configError(`Failed to read catalog at "${CATALOG_PATH}".`, error);
  }

  return validateCatalog(rawCatalog);
}

export function validateCatalog(rawCatalog) {
  if (!rawCatalog || typeof rawCatalog !== "object") {
    throw configError("Catalog root must be an object.");
  }

  if (rawCatalog.schemaVersion !== CATALOG_SCHEMA_VERSION) {
    throw configError(
      `Unsupported catalog schemaVersion "${rawCatalog.schemaVersion}". Expected "${CATALOG_SCHEMA_VERSION}".`
    );
  }

  if (!Array.isArray(rawCatalog.integrations) || rawCatalog.integrations.length === 0) {
    throw configError("Catalog must contain a non-empty integrations array.");
  }

  const seenIds = new Set();
  const integrations = rawCatalog.integrations.map((entry) => normalizeIntegration(entry, seenIds));

  return {
    schemaVersion: rawCatalog.schemaVersion,
    integrations
  };
}

function normalizeIntegration(entry, seenIds) {
  if (!entry || typeof entry !== "object") {
    throw configError("Each integration entry must be an object.");
  }

  const {
    id,
    title,
    description,
    version,
    sourceDir,
    targets,
    enabledByDefault,
    tags,
    groups,
    hidden,
    deprecated
  } = entry;

  if (typeof id !== "string" || id.length === 0) {
    throw configError("Each integration entry must have a non-empty string id.");
  }

  if (seenIds.has(id)) {
    throw configError(`Duplicate integration id "${id}" found in catalog.`);
  }
  seenIds.add(id);

  if (typeof version !== "string" || version.length === 0) {
    throw configError(`Integration "${id}" must have a non-empty string version.`);
  }

  if (typeof sourceDir !== "string" || sourceDir.length === 0) {
    throw configError(`Integration "${id}" must have a non-empty string sourceDir.`);
  }

  if (path.isAbsolute(sourceDir) || sourceDir.split(/[\\/]+/).includes("..")) {
    throw configError(`Integration "${id}" sourceDir must stay inside the package root.`);
  }

  if (!Array.isArray(targets) || targets.length === 0) {
    throw configError(`Integration "${id}" must declare at least one target.`);
  }

  for (const target of targets) {
    if (!TARGETS.includes(target)) {
      throw configError(`Integration "${id}" has unsupported target "${target}".`);
    }
  }

  if (typeof enabledByDefault !== "boolean") {
    throw configError(`Integration "${id}" must declare enabledByDefault as a boolean.`);
  }

  const resolvedSourceDir = path.resolve(PACKAGE_ROOT, sourceDir);
  if (!resolvedSourceDir.startsWith(PACKAGE_ROOT)) {
    throw configError(`Integration "${id}" sourceDir escapes the package root.`);
  }

  return {
    id,
    title: typeof title === "string" && title.trim().length > 0 ? title.trim() : id,
    description: typeof description === "string" ? description.trim() : "",
    version,
    sourceDir,
    resolvedSourceDir,
    targets: [...new Set(targets)],
    enabledByDefault,
    tags: normalizeStringList(tags, `Integration "${id}" tags`),
    groups: normalizeStringList(groups, `Integration "${id}" groups`),
    hidden: hidden ?? false,
    deprecated: deprecated ?? false
  };
}

function normalizeStringList(values, label) {
  if (values == null) {
    return [];
  }

  if (!Array.isArray(values)) {
    throw configError(`${label} must be an array when provided.`);
  }

  const normalized = [];
  const seen = new Set();

  for (const value of values) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw configError(`${label} must contain only non-empty strings.`);
    }

    const trimmed = value.trim();
    if (seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function getIntegrationMap(catalog) {
  return new Map(catalog.integrations.map((integration) => [integration.id, integration]));
}

export function getIntegrationsForTarget(catalog, target, { enabledOnly = false } = {}) {
  return catalog.integrations.filter((integration) => {
    if (!integration.targets.includes(target)) {
      return false;
    }

    return enabledOnly ? integration.enabledByDefault : true;
  });
}

export function resolveIntegrationsForTarget(catalog, target, options = {}) {
  const {
    selectedIntegrationIds,
    enabledOnly = false,
    tag,
    group,
    includeHidden = false,
    includeDeprecated = false,
    ignoreUnsupported = false
  } = options;

  if (selectedIntegrationIds != null) {
    return resolveExplicitIntegrations(catalog, target, selectedIntegrationIds, {
      includeHidden,
      includeDeprecated,
      ignoreUnsupported
    });
  }

  let integrations = getIntegrationsForTarget(catalog, target);
  integrations = applyVisibilityFilters(integrations, { includeHidden, includeDeprecated });

  if (tag) {
    integrations = integrations.filter((integration) => integration.tags.includes(tag));
  }

  if (group) {
    integrations = integrations.filter((integration) => integration.groups.includes(group));
  }

  if (enabledOnly) {
    integrations = integrations.filter((integration) => integration.enabledByDefault);
  }

  return integrations;
}

export async function assertCatalogSourcesExist(catalog) {
  for (const integration of catalog.integrations) {
    if (!(await pathExists(integration.resolvedSourceDir))) {
      throw configError(
        `Catalog sourceDir for "${integration.id}" does not exist: "${integration.sourceDir}".`
      );
    }

    for (const target of integration.targets) {
      const overlayDir = path.join(integration.resolvedSourceDir, "targets", target);
      if (!(await pathExists(overlayDir))) {
        throw configError(
          `Integration "${integration.id}" is missing target overlay directory: "${path.relative(PACKAGE_ROOT, overlayDir)}".`
        );
      }
    }
  }
}

function resolveExplicitIntegrations(catalog, target, selectedIntegrationIds, visibility) {
  const integrationMap = getIntegrationMap(catalog);
  const resolved = [];
  const seenIds = new Set();

  for (const integrationId of selectedIntegrationIds) {
    if (seenIds.has(integrationId)) {
      continue;
    }
    seenIds.add(integrationId);

    const integration = integrationMap.get(integrationId);
    if (!integration) {
      throw configError(`Unknown integration "${integrationId}" requested for "${target}".`);
    }

    if (!integration.targets.includes(target)) {
      if (visibility.ignoreUnsupported) {
        continue;
      }
      throw usageError(`Integration "${integrationId}" is not supported for target "${target}".`);
    }

    if (integration.hidden && !visibility.includeHidden) {
      throw usageError(
        `Integration "${integrationId}" is hidden for target "${target}". Re-run with --include-hidden to select it explicitly.`
      );
    }

    if (integration.deprecated && !visibility.includeDeprecated) {
      throw usageError(
        `Integration "${integrationId}" is deprecated for target "${target}". Re-run with --include-deprecated to select it explicitly.`
      );
    }

    resolved.push(integration);
  }

  return resolved;
}

function applyVisibilityFilters(integrations, { includeHidden, includeDeprecated }) {
  return integrations.filter((integration) => {
    if (!includeHidden && integration.hidden) {
      return false;
    }

    if (!includeDeprecated && integration.deprecated) {
      return false;
    }

    return true;
  });
}
