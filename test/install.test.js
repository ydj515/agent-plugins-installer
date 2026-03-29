import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { MARKER_FILE, STATE_FILE } from "../src/lib/constants.js";
import { removePath, readJsonFile } from "../src/lib/utils.js";

const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));
const CLI_PATH = fileURLToPath(new URL("../src/cli.js", import.meta.url));

test("codex project 설치는 plugin 디렉터리와 marketplace.json을 만든다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");

  const result = runCli([
    "install",
    "codex",
    "--scope",
    "project",
    "--cwd",
    projectDir,
    "--plugins",
    "github"
  ]);

  assert.equal(result.status, 0);
  assert.equal(
    await pathExists(path.join(projectDir, ".codex", "plugins", "github", ".codex-plugin", "plugin.json")),
    true
  );
  assert.equal(
    await pathExists(path.join(projectDir, ".codex", "plugins", "github", MARKER_FILE)),
    true
  );

  const marketplace = await readJsonFile(
    path.join(projectDir, ".agents", "plugins", "marketplace.json")
  );
  assert.equal(Array.isArray(marketplace.plugins), true);
  assert.equal(marketplace.plugins.some((plugin) => plugin.name === "github"), true);
  assert.equal(
    marketplace.plugins.find((plugin) => plugin.name === "github").source.path,
    "./.codex/plugins/github"
  );
  assert.match(result.stdout, /\[agent-plugins-installer\] install summary/);
});

test("install all --scope project 는 codex, claude, gemini를 함께 설치한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  const result = runCli(
    [
      "install",
      "all",
      "--scope",
      "project",
      "--cwd",
      projectDir,
      "--plugins",
      "github"
    ],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );

  assert.equal(result.status, 0);
  assert.equal(
    await pathExists(path.join(projectDir, ".codex", "plugins", "github", ".codex-plugin", "plugin.json")),
    true
  );
  assert.equal(
    await pathExists(path.join(projectDir, ".claude", "plugins", "github", ".claude-plugin", "plugin.json")),
    true
  );
  assert.equal(
    await pathExists(
      path.join(projectDir, ".claude", ".claude-plugin", "marketplace.json")
    ),
    true
  );

  const claudeState = await readJsonFile(
    path.join(projectDir, ".claude", STATE_FILE)
  );
  assert.equal(Object.hasOwn(claudeState.integrations, "github"), true);

  const geminiState = await readJsonFile(
    path.join(projectDir, ".gemini", STATE_FILE)
  );
  assert.equal(Object.hasOwn(geminiState.integrations, "github"), true);
  assert.equal(
    await pathExists(path.join(homeDir, ".gemini", "extensions", "github", "gemini-extension.json")),
    true
  );

  const geminiLog = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(geminiLog, /extensions enable github --scope workspace/);
});

test("claude user 설치는 공식 plugin install 명령을 호출하고 state를 기록한다", async (t) => {
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  const result = runCli(
    ["install", "claude", "--scope", "user", "--plugins", "github,vercel"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir, claudeLog: fake.claudeLog })
    }
  );

  assert.equal(result.status, 0);
  assert.equal(
    await pathExists(path.join(homeDir, ".claude", "plugins", "github", ".claude-plugin", "plugin.json")),
    true
  );
  assert.equal(
    await pathExists(
      path.join(homeDir, ".claude", ".claude-plugin", "marketplace.json")
    ),
    true
  );

  const state = await readJsonFile(path.join(homeDir, ".claude", STATE_FILE));
  assert.equal(Object.hasOwn(state.integrations, "github"), true);
  assert.equal(Object.hasOwn(state.integrations, "vercel"), true);

  const commandLog = await fs.readFile(fake.claudeLog, "utf8");
  assert.match(commandLog, /plugin marketplace list --json/);
  assert.match(commandLog, /plugin marketplace add .*\.claude --scope user/);
  assert.match(commandLog, /plugin install github@agent-plugins-installer --scope user/);
  assert.match(commandLog, /plugin install vercel@agent-plugins-installer --scope user/);
});

test("claude 설치 실패는 요약을 유지하고 실제 외부 명령 오류를 노출한다", async (t) => {
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t, {
    claudeInstallExitCode: 1,
    claudeInstallStderr: "simulated claude failure"
  });

  const result = runCli(
    ["install", "claude", "--scope", "user", "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /- failed: github/);
  assert.match(result.stderr, /EXTERNAL_COMMAND_FAILED/);
  assert.match(result.stderr, /simulated claude failure/);
  assert.doesNotMatch(result.stderr, /catch is not a function/);
});

test("gemini user 설치는 extensions install 명령을 호출하고 state를 기록한다", async (t) => {
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  const result = runCli(
    ["install", "gemini", "--scope", "user", "--plugins", "vercel"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir, geminiLog: fake.geminiLog })
    }
  );

  assert.equal(result.status, 0);

  const state = await readJsonFile(path.join(homeDir, ".gemini", STATE_FILE));
  assert.equal(Object.hasOwn(state.integrations, "vercel"), true);

  const commandLog = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(
    commandLog,
    new RegExp(
      `extensions install ${escapeForRegExp(
        path.join(homeDir, ".gemini", "extensions", "vercel")
      )} --consent`
    )
  );
});

test("gemini project 설치는 홈 extension bundle 과 workspace 활성화를 만든다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  const result = runCli(
    ["install", "gemini", "--scope", "project", "--cwd", projectDir, "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );

  assert.equal(result.status, 0);
  assert.equal(
    await pathExists(path.join(homeDir, ".gemini", "extensions", "github", "gemini-extension.json")),
    true
  );

  const state = await readJsonFile(path.join(projectDir, ".gemini", STATE_FILE));
  assert.equal(Object.hasOwn(state.integrations, "github"), true);

  const commandLog = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(commandLog, /extensions enable github --scope workspace/);
  assert.doesNotMatch(commandLog, /extensions install .*github.*--scope workspace/);
});

test("gemini project 설치는 기존 user bundle 이 있어도 충돌 없이 workspace 활성화를 수행한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  let result = runCli(
    ["install", "gemini", "--scope", "user", "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );
  assert.equal(result.status, 0);

  await fs.writeFile(fake.geminiLog, "", "utf8");

  result = runCli(
    ["install", "gemini", "--scope", "project", "--cwd", projectDir, "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );
  assert.equal(result.status, 0);

  const state = await readJsonFile(path.join(projectDir, ".gemini", STATE_FILE));
  assert.equal(Object.hasOwn(state.integrations, "github"), true);

  const commandLog = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(commandLog, /extensions enable github --scope workspace/);
});

function runCli(args, { env } = {}) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: env ?? process.env
  });
}

async function createTempDir(t, prefix) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(async () => {
    await removePath(tempDir).catch(() => {});
  });
  return tempDir;
}

async function createFakeCommands(
  t,
  {
    claudeInstallExitCode = 0,
    geminiExitCode = 0,
    claudeInstallStdout = "",
    claudeInstallStderr = "",
    geminiStdout = "",
    geminiStderr = "",
    claudeMarketplaceListJson = "[]"
  } = {}
) {
  const binDir = await createTempDir(t, "agent-plugins-bin-");
  const claudeLog = path.join(binDir, "claude.log");
  const geminiLog = path.join(binDir, "gemini.log");

  await writeExecutable(
    path.join(binDir, "claude"),
    `#!/bin/sh
set -eu
printf '%s\\n' "$*" >> "${claudeLog}"
if [ "$#" -ge 3 ] && [ "$1" = "plugin" ] && [ "$2" = "marketplace" ] && [ "$3" = "list" ]; then
  printf '%s\\n' '${escapeForSingleQuotes(claudeMarketplaceListJson)}'
  exit 0
fi
if [ "$#" -ge 2 ] && [ "$1" = "plugin" ] && [ "$2" = "install" ]; then
  [ -z "${claudeInstallStdout}" ] || printf '%s\\n' "${claudeInstallStdout}"
  [ -z "${claudeInstallStderr}" ] || printf '%s\\n' "${claudeInstallStderr}" >&2
  exit ${claudeInstallExitCode}
fi
exit 0
`
  );

  await writeExecutable(
    path.join(binDir, "gemini"),
    `#!/bin/sh
set -eu
printf '%s\\n' "$*" >> "${geminiLog}"
[ -z "${geminiStdout}" ] || printf '%s\\n' "${geminiStdout}"
[ -z "${geminiStderr}" ] || printf '%s\\n' "${geminiStderr}" >&2
exit ${geminiExitCode}
`
  );

  return {
    binDir,
    claudeLog,
    geminiLog
  };
}

async function writeExecutable(filePath, contents) {
  await fs.writeFile(filePath, contents, "utf8");
  await fs.chmod(filePath, 0o755);
}

function buildEnv({ homeDir, fakeBinDir }) {
  return {
    ...process.env,
    HOME: homeDir,
    PATH: `${fakeBinDir}:${process.env.PATH}`
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

function escapeForSingleQuotes(value) {
  return value.replace(/'/g, "'\\''");
}
