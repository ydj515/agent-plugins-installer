import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readJsonFile, removePath } from "../src/lib/utils.js";

const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));
const CODEX_MARKETPLACE = "agent-plugins-installer";
const INTEGRATION_IDS = ["vercel", "superpowers", "mise-workflows", "web-a11y"];

test("codex real CLI 는 installer 가 workspace codex bundles 를 설치할 수 있다", async (t) => {
  if (!hasCommand("codex")) {
    t.skip("codex CLI 가 설치되어 있지 않아 real e2e 테스트를 건너뜁니다.");
    return;
  }

  const tempHome = await createTempDir(t, "agent-plugins-e2e-codex-home-");
  const projectDir = await createTempDir(t, "agent-plugins-e2e-codex-project-");
  const env = buildIsolatedEnv(tempHome);
  const selectedPlugins = INTEGRATION_IDS.join(",");

  let result = runShell(
    `node ./src/cli.js install codex --scope workspace --cwd ${shellQuote(projectDir)} --plugins ${shellQuote(selectedPlugins)}`,
    { env }
  );
  assert.equal(result.status, 0, result.stderr);

  for (const integrationId of INTEGRATION_IDS) {
    const pluginRoot = path.join(projectDir, ".codex", "plugins", integrationId);
    assert.equal(
      await pathExists(path.join(pluginRoot, ".codex-plugin", "plugin.json")),
      true
    );
  }

  const marketplace = await readJsonFile(
    path.join(projectDir, ".agents", "plugins", "marketplace.json")
  );
  for (const integrationId of INTEGRATION_IDS) {
    assert.equal(
      marketplace.plugins.find((plugin) => plugin.name === integrationId).source.path,
      `./.codex/plugins/${integrationId}`
    );
  }

  result = runShell(
    `codex plugin list --marketplace ${CODEX_MARKETPLACE}`,
    { env, cwd: projectDir }
  );
  assert.equal(result.status, 0, result.stderr);

  for (const integrationId of INTEGRATION_IDS) {
    assert.match(
      result.stdout,
      new RegExp(`${escapeForRegExp(integrationId)}@${escapeForRegExp(CODEX_MARKETPLACE)}\\s+installed, enabled`)
    );
  }
});

test("claude real CLI 는 repo marketplace 가 generated claude bundles 를 설치할 수 있다", async (t) => {
  if (!hasCommand("claude")) {
    t.skip("claude CLI 가 설치되어 있지 않아 real e2e 테스트를 건너뜁니다.");
    return;
  }

  const tempHome = await createTempDir(t, "agent-plugins-e2e-claude-home-");
  const env = buildIsolatedEnv(tempHome);

  let result = runShell(`claude plugin marketplace add ./`, { env });
  assert.equal(result.status, 0, result.stderr);

  for (const integrationId of INTEGRATION_IDS) {
    result = runShell(
      `claude plugin install ${integrationId}@${CODEX_MARKETPLACE}`,
      { env }
    );
    assert.equal(result.status, 0, `${integrationId}: ${result.stderr}`);
  }

  result = runShell(`claude plugin list --json`, { env });
  assert.equal(result.status, 0, result.stderr);

  const installed = JSON.parse(result.stdout);
  for (const integrationId of INTEGRATION_IDS) {
    const manifest = await readJsonFile(
      path.join(REPO_ROOT, ".generated", "direct", "claude", integrationId, ".claude-plugin", "plugin.json")
    );
    const pluginId = `${integrationId}@${CODEX_MARKETPLACE}`;
    const record = installed.find((entry) => entry.id === pluginId);
    const expectedVersion = manifest.version;
    assert.equal(Boolean(record), true, `missing ${pluginId}`);
    assert.equal(record.enabled, true);
    assert.equal(typeof record.version, "string");
    if (expectedVersion != null) {
      assert.equal(record.version, expectedVersion);
    }
    assert.equal(
      await pathExists(path.join(record.installPath, ".claude-plugin", "plugin.json")),
      true
    );
  }
});

test("gemini real CLI 는 generated gemini bundles 를 설치할 수 있다", async (t) => {
  if (!hasCommand("gemini")) {
    t.skip("gemini CLI 가 설치되어 있지 않아 real e2e 테스트를 건너뜁니다.");
    return;
  }

  const tempHome = await createTempDir(t, "agent-plugins-e2e-gemini-home-");
  const env = buildIsolatedEnv(tempHome);

  for (const integrationId of INTEGRATION_IDS) {
    const sourcePath = path.join(REPO_ROOT, ".generated", "direct", "gemini", integrationId);
    const result = runShell(
      `printf 'y\\n' | gemini extensions install ${shellQuote(sourcePath)} --consent --skip-settings`,
      { env }
    );
    assert.equal(result.status, 0, `${integrationId}: ${result.stderr}`);
  }

  const enablementPath = path.join(
    tempHome,
    ".gemini",
    "extensions",
    "extension-enablement.json"
  );
  const enablement = JSON.parse(await fs.readFile(enablementPath, "utf8"));

  for (const integrationId of INTEGRATION_IDS) {
    const manifest = await readJsonFile(
      path.join(REPO_ROOT, ".generated", "direct", "gemini", integrationId, "gemini-extension.json")
    );
    assert.equal(
      await pathExists(
        path.join(tempHome, ".gemini", "extensions", integrationId, "gemini-extension.json")
      ),
      true
    );
    assert.equal(
      await pathExists(
        path.join(tempHome, ".gemini", "extensions", integrationId, manifest.contextFileName)
      ),
      true
    );
    assert.equal(Array.isArray(enablement[integrationId]?.overrides), true);
    assert.equal(enablement[integrationId].overrides.length > 0, true);
  }
});

function runShell(command, { env, cwd = REPO_ROOT } = {}) {
  return spawnSync("/bin/sh", ["-c", command], {
    cwd,
    encoding: "utf8",
    env: env ?? process.env
  });
}

function hasCommand(command) {
  const result = spawnSync("/bin/sh", ["-c", `command -v ${shellQuote(command)} >/dev/null 2>&1`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: process.env
  });
  return result.status === 0;
}

async function createTempDir(t, prefix) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(async () => {
    await removePath(tempDir).catch(() => {});
  });
  return tempDir;
}

function buildIsolatedEnv(homeDir) {
  return {
    ...process.env,
    HOME: homeDir,
    XDG_CONFIG_HOME: path.join(homeDir, ".config"),
    XDG_DATA_HOME: path.join(homeDir, ".local", "share")
  };
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shellQuote(value) {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}
