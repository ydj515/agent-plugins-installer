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
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  const result = runCli(
    [
      "install",
      "codex",
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

  const commandLog = await fs.readFile(fake.codexLog, "utf8");
  assert.match(commandLog, new RegExp(`plugin marketplace add ${escapeForRegExp(projectDir)}`));
  assert.match(commandLog, /plugin add github@agent-plugins-installer/);
  assert.match(commandLog, /plugin list --marketplace agent-plugins-installer/);
});

test("codex project 설치는 stale direct marketplace entry가 있으면 local bundle 경로로 교체한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);
  const marketplacePath = path.join(projectDir, ".agents", "plugins", "marketplace.json");

  await fs.mkdir(path.dirname(marketplacePath), { recursive: true });
  await fs.writeFile(
    marketplacePath,
    `${JSON.stringify(
      {
        name: "agent-plugins-installer",
        interface: {
          displayName: "Agent Plugins Installer"
        },
        plugins: [
          {
            name: "github",
            source: {
              source: "local",
              path: "./.generated/direct/codex/github"
            },
            policy: {
              installation: "AVAILABLE",
              authentication: "ON_INSTALL"
            },
            category: "Coding"
          }
        ]
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const result = runCli(
    [
      "install",
      "codex",
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

  const marketplace = await readJsonFile(marketplacePath);
  assert.equal(
    marketplace.plugins.find((plugin) => plugin.name === "github").source.path,
    "./.codex/plugins/github"
  );
});

test("codex project 설치는 동일한 generated direct bundle entry를 재사용한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);
  const marketplacePath = path.join(projectDir, ".agents", "plugins", "marketplace.json");
  const directManifestPath = path.join(
    projectDir,
    ".generated",
    "direct",
    "codex",
    "github",
    ".codex-plugin",
    "plugin.json"
  );

  await fs.mkdir(path.dirname(marketplacePath), { recursive: true });
  await fs.mkdir(path.dirname(directManifestPath), { recursive: true });
  await fs.copyFile(
    path.join(REPO_ROOT, "plugins", "github", "targets", "codex", ".codex-plugin", "plugin.json"),
    directManifestPath
  );
  await fs.writeFile(
    marketplacePath,
    `${JSON.stringify(
      {
        name: "agent-plugins-installer",
        interface: {
          displayName: "Agent Plugins Installer"
        },
        plugins: [
          {
            name: "github",
            source: {
              source: "local",
              path: "./.generated/direct/codex/github"
            },
            policy: {
              installation: "AVAILABLE",
              authentication: "ON_INSTALL"
            },
            category: "Coding"
          }
        ]
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const result = runCli(
    [
      "install",
      "codex",
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

  const marketplace = await readJsonFile(marketplacePath);
  assert.equal(
    marketplace.plugins.find((plugin) => plugin.name === "github").source.path,
    "./.generated/direct/codex/github"
  );
});

test("codex workspace 설치는 web-a11y plugin 디렉터리와 marketplace entry를 만든다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t);

  const result = runCli(
    [
      "install",
      "codex",
      "--scope",
      "workspace",
      "--cwd",
      projectDir,
      "--plugins",
      "web-a11y"
    ],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );

  assert.equal(result.status, 0);
  assert.equal(
    await pathExists(
      path.join(
        projectDir,
        ".codex",
        "plugins",
        "web-a11y",
        ".codex-plugin",
        "plugin.json"
      )
    ),
    true
  );

  const marketplace = await readJsonFile(
    path.join(projectDir, ".agents", "plugins", "marketplace.json")
  );
  assert.equal(
    marketplace.plugins.some((plugin) => plugin.name === "web-a11y"),
    true
  );
  assert.equal(
    marketplace.plugins.find((plugin) => plugin.name === "web-a11y").source.path,
    "./.codex/plugins/web-a11y"
  );

  const commandLog = await fs.readFile(fake.codexLog, "utf8");
  assert.match(commandLog, /plugin add web-a11y@agent-plugins-installer/);
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
    await pathExists(
      path.join(projectDir, ".gemini", "extensions", "github", "gemini-extension.json")
    ),
    true
  );

  const geminiLog = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(
    geminiLog,
    new RegExp(
      `extensions install ${escapeForRegExp(
        path.join(projectDir, ".gemini", "extensions", "github")
      )} --consent`
    )
  );
  assert.match(geminiLog, /extensions enable github --scope workspace/);
});

test("install all --scope project 는 superpowers 를 모든 타깃에 설치한다", async (t) => {
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
      "superpowers"
    ],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );

  assert.equal(result.status, 0);
  assert.equal(
    await pathExists(
      path.join(projectDir, ".codex", "plugins", "superpowers", ".codex-plugin", "plugin.json")
    ),
    true
  );
  assert.equal(
    await pathExists(
      path.join(projectDir, ".claude", "plugins", "superpowers", ".claude-plugin", "plugin.json")
    ),
    true
  );
  assert.equal(
    await pathExists(
      path.join(projectDir, ".gemini", "extensions", "superpowers", "gemini-extension.json")
    ),
    true
  );

  const claudeState = await readJsonFile(path.join(projectDir, ".claude", STATE_FILE));
  assert.equal(Object.hasOwn(claudeState.integrations, "superpowers"), true);

  const geminiState = await readJsonFile(path.join(projectDir, ".gemini", STATE_FILE));
  assert.equal(Object.hasOwn(geminiState.integrations, "superpowers"), true);

  const geminiLog = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(
    geminiLog,
    new RegExp(
      `extensions install ${escapeForRegExp(
        path.join(projectDir, ".gemini", "extensions", "superpowers")
      )} --consent`
    )
  );
  assert.match(geminiLog, /extensions enable superpowers --scope workspace/);
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

test("claude 설치는 기존 marketplace가 있으면 update를 호출한다", async (t) => {
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t, {
    claudeMarketplaceListJson: JSON.stringify([{ name: "agent-plugins-installer" }])
  });

  const result = runCli(
    ["install", "claude", "--scope", "user", "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );

  assert.equal(result.status, 0);

  const commandLog = await fs.readFile(fake.claudeLog, "utf8");
  assert.match(commandLog, /plugin marketplace update agent-plugins-installer/);
});

test("claude 설치는 기존 marketplace 경로가 다르면 remove 후 add를 호출한다", async (t) => {
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t, {
    claudeMarketplaceListJson: JSON.stringify([
      {
        name: "agent-plugins-installer",
        path: "/tmp/stale-marketplace/.claude"
      }
    ])
  });

  const result = runCli(
    ["install", "claude", "--scope", "user", "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );

  assert.equal(result.status, 0);

  const commandLog = await fs.readFile(fake.claudeLog, "utf8");
  assert.match(commandLog, /plugin marketplace remove agent-plugins-installer/);
  assert.match(commandLog, /plugin marketplace add .*\.claude --scope user/);
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

test("gemini project 설치는 trust 입력과 skip-settings를 함께 전달한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t, {
    geminiRequireSkipSettings: true,
    geminiRequireTrustInput: true
  });

  const result = runCli(
    ["install", "gemini", "--scope", "project", "--cwd", projectDir, "--plugins", "github"],
    {
      env: buildEnv({ homeDir, fakeBinDir: fake.binDir })
    }
  );

  assert.equal(result.status, 0);

  const commandLog = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(commandLog, /--skip-settings/);
});

test("gemini project 설치는 워크스페이스 .gemini 아래 extension bundle 과 workspace 활성화를 만든다", async (t) => {
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
    await pathExists(path.join(projectDir, ".gemini", "extensions", "github", "gemini-extension.json")),
    true
  );

  const state = await readJsonFile(path.join(projectDir, ".gemini", STATE_FILE));
  assert.equal(Object.hasOwn(state.integrations, "github"), true);

  const commandLog = await fs.readFile(fake.geminiLog, "utf8");
  assert.match(
    commandLog,
    new RegExp(
      `extensions install ${escapeForRegExp(
        path.join(projectDir, ".gemini", "extensions", "github")
      )} --consent`
    )
  );
  assert.match(commandLog, /extensions enable github --scope workspace/);
});

test("gemini project 설치는 기존 user bundle 이 있어도 충돌 없이 workspace 활성화를 수행한다", async (t) => {
  const projectDir = await createTempDir(t, "agent-plugins-project-");
  const homeDir = await createTempDir(t, "agent-plugins-home-");
  const fake = await createFakeCommands(t, {
    geminiInstalledExtensionNames: ["github"]
  });

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
  assert.doesNotMatch(
    commandLog,
    new RegExp(
      `extensions install ${escapeForRegExp(
        path.join(projectDir, ".gemini", "extensions", "github")
      )} --consent`
    )
  );
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
    claudeMarketplaceListJson = "[]",
    geminiRequireSkipSettings = false,
    geminiRequireTrustInput = false,
    geminiInstalledExtensionNames = []
  } = {}
) {
  const binDir = await createTempDir(t, "agent-plugins-bin-");
  const codexLog = path.join(binDir, "codex.log");
  const claudeLog = path.join(binDir, "claude.log");
  const geminiLog = path.join(binDir, "gemini.log");

  await writeExecutable(
    path.join(binDir, "codex"),
    `#!/bin/sh
set -eu
printf '%s\\n' "$*" >> "${codexLog}"
exit 0
`
  );

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
if [ "$#" -ge 2 ] && [ "$1" = "extensions" ] && [ "$2" = "list" ]; then
${geminiInstalledExtensionNames.map((name) => `  printf '%s\\n' '✓ ${name} (0.1.0)'`).join("\n")}
  exit 0
fi
if [ "$#" -ge 2 ] && [ "$1" = "extensions" ] && [ "$2" = "install" ]; then
  extension_name="$(basename "$3")"
  case ",${geminiInstalledExtensionNames.join(",")}," in
    *",$extension_name,"*)
      printf '%s\\n' "Extension \"$extension_name\" is already installed. Please uninstall it first." >&2
      exit 44
      ;;
  esac
  if [ "${geminiRequireSkipSettings ? "1" : "0"}" = "1" ]; then
    case " $* " in
      *" --skip-settings "*) ;;
      *)
        printf '%s\\n' 'missing --skip-settings' >&2
        exit 41
        ;;
    esac
  fi
  if [ "${geminiRequireTrustInput ? "1" : "0"}" = "1" ]; then
    if ! IFS= read -r trust_answer; then
      printf '%s\\n' 'missing trust input' >&2
      exit 42
    fi
    if [ "$trust_answer" != "y" ]; then
      printf '%s\\n' "unexpected trust input: $trust_answer" >&2
      exit 43
    fi
  fi
fi
[ -z "${geminiStdout}" ] || printf '%s\\n' "${geminiStdout}"
[ -z "${geminiStderr}" ] || printf '%s\\n' "${geminiStderr}" >&2
exit ${geminiExitCode}
`
  );

  return {
    binDir,
    codexLog,
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
