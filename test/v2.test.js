import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { STATE_FILE } from "../src/lib/constants.js";
import { readJsonFile, removePath } from "../src/lib/utils.js";

const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));
const CLI_PATH = fileURLToPath(new URL("../src/cli.js", import.meta.url));

test("codex remove 는 plugin 디렉터리와 marketplace entry 를 함께 지운다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");

  let result = runCli([
    "install",
    "codex",
    "--scope",
    "project",
    "--cwd",
    projectDir,
    "--plugins",
    "github,vercel"
  ]);
  assert.equal(result.status, 0);

  result = runCli([
    "remove",
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
    await pathExists(path.join(projectDir, ".codex", "plugins", "github")),
    false
  );
  assert.equal(
    await pathExists(path.join(projectDir, ".codex", "plugins", "vercel", ".codex-plugin", "plugin.json")),
    true
  );

  const marketplace = await readJsonFile(
    path.join(projectDir, ".agents", "plugins", "marketplace.json")
  );
  assert.equal(marketplace.plugins.some((plugin) => plugin.name === "github"), false);
  assert.equal(marketplace.plugins.some((plugin) => plugin.name === "vercel"), true);
});

test("codex update 는 손상된 파일을 원본으로 복구한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const skillFile = path.join(
    projectDir,
    ".codex",
    "plugins",
    "github",
    "skills",
    "github",
    "SKILL.md"
  );

  let result = runCli([
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

  const originalContents = await fs.readFile(skillFile, "utf8");
  await fs.writeFile(skillFile, "tampered\n", "utf8");

  result = runCli([
    "update",
    "codex",
    "--scope",
    "project",
    "--cwd",
    projectDir,
    "--plugins",
    "github"
  ]);
  assert.equal(result.status, 0);
  assert.equal(await fs.readFile(skillFile, "utf8"), originalContents);
});

test("list codex 는 installed 와 available 상태를 출력한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");

  let result = runCli([
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

  result = runCli([
    "list",
    "codex",
    "--scope",
    "project",
    "--cwd",
    projectDir
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /- installed: github/);
  assert.match(result.stdout, /- available: vercel/);
  assert.match(
    result.stdout,
    /integration: github \| status: installed \| default: yes/
  );
});

test("gemini update 는 설치된 extension 만 재설치하고 로컬 bundle 을 갱신한다", async (t) => {
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
    ["update", "gemini", "--scope", "user", "--plugins", "github,vercel"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );
  assert.equal(result.status, 0);

  const log = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(log, /extensions uninstall github/);
  assert.match(
    log,
    new RegExp(
      `extensions install ${escapeForRegExp(path.join(homeDir, ".gemini", "extensions", "github"))} --consent`
    )
  );
  assert.doesNotMatch(log, /extensions uninstall vercel/);
  assert.doesNotMatch(log, /extensions install .*vercel/);
});

test("gemini project remove 는 workspace 비활성화만 수행하고 bundle 은 유지한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  let result = runCli(
    ["install", "gemini", "--scope", "project", "--cwd", projectDir, "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );
  assert.equal(result.status, 0);

  await fs.writeFile(fake.geminiLog, "", "utf8");

  result = runCli(
    ["remove", "gemini", "--scope", "project", "--cwd", projectDir, "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );
  assert.equal(result.status, 0);

  const state = await readJsonFile(path.join(projectDir, ".gemini", STATE_FILE));
  assert.equal(Object.hasOwn(state.integrations, "github"), false);
  assert.equal(
    await pathExists(path.join(homeDir, ".gemini", "extensions", "github", "gemini-extension.json")),
    true
  );

  const log = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(log, /extensions disable github --scope workspace/);
  assert.doesNotMatch(log, /extensions uninstall github/);
});

test("claude remove 는 state 에서 항목을 제거한다", async (t) => {
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  let result = runCli(
    ["install", "claude", "--scope", "user", "--plugins", "github,vercel"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );
  assert.equal(result.status, 0);

  result = runCli(
    ["remove", "claude", "--scope", "user", "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );
  assert.equal(result.status, 0);

  const state = await readJsonFile(path.join(homeDir, ".claude", STATE_FILE));
  assert.equal(Object.hasOwn(state.integrations, "github"), false);
  assert.equal(Object.hasOwn(state.integrations, "vercel"), true);
  assert.equal(
    await pathExists(path.join(homeDir, ".claude", "plugins", "github")),
    false
  );
  assert.equal(
    await pathExists(path.join(homeDir, ".claude", "plugins", "vercel", ".claude-plugin", "plugin.json")),
    true
  );
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

async function createFakeCommands(t) {
  const binDir = await createTempDir(t, "agent-plugins-bin-");
  const claudeLog = path.join(binDir, "claude.log");
  const geminiLog = path.join(binDir, "gemini.log");

  await writeExecutable(
    path.join(binDir, "claude"),
    `#!/bin/sh
set -eu
printf '%s\\n' "$*" >> "${claudeLog}"
if [ "$#" -ge 3 ] && [ "$1" = "plugin" ] && [ "$2" = "marketplace" ] && [ "$3" = "list" ]; then
  printf '%s\\n' '[]'
  exit 0
fi
exit 0
`
  );

  await writeExecutable(
    path.join(binDir, "gemini"),
    `#!/bin/sh
set -eu
printf '%s\\n' "$*" >> "${geminiLog}"
exit 0
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
