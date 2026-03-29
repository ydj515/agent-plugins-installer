import { fileURLToPath } from "node:url";

export const PACKAGE_NAME = "agent-plugins-installer";
export const CATALOG_SCHEMA_VERSION = 2;
export const STATE_SCHEMA_VERSION = 1;
export const MARKER_SCHEMA_VERSION = 1;
export const MARKER_FILE = ".agent-plugins-installer.json";
export const STATE_FILE = ".agent-plugins-installer-state.json";
export const LOCK_FILE = ".agent-plugins-installer.lock";
export const TEMP_ROOT_DIR = ".agent-plugins-installer-tmp";
export const TEMP_META_FILE = ".agent-plugins-installer-tmp.json";
export const STALE_WINDOW_MS = 10 * 60 * 1000;
export const TARGETS = ["codex", "claude", "gemini"];
export const SCOPES = ["user", "project"];
export const STRATEGIES = {
  CODEX_LOCAL: "local-marketplace-provision",
  CLAUDE_LOCAL: "local-marketplace-install",
  GEMINI_LOCAL: "local-extension-install"
};
export const CLAUDE_MARKETPLACE_NAME = "agent-plugins-installer";
export const EXIT_CODES = {
  SUCCESS: 0,
  INSTALL_FAILED: 1,
  USAGE: 2,
  ENV: 3,
  SAFETY: 4
};
export const PACKAGE_ROOT = fileURLToPath(new URL("../../", import.meta.url));
