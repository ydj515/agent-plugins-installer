import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = fileURLToPath(new URL("../plugins/mise-workflows/", import.meta.url));
const VALIDATOR_PATH = path.join(PLUGIN_ROOT, "scripts", "validate_mise_toml.py");
const EXAMPLES = ["python-uv-app", "python-uv-lib", "java-gradle-app", "java-spring-service"];

test("mise-workflows 예제 mise.toml은 validator 진단 없이 통과한다", async (t) => {
  if (!hasPython3()) {
    t.skip("python3가 없어 validator 테스트를 건너뜁니다.");
    return;
  }

  for (const example of EXAMPLES) {
    const repoDir = await createTempDir(t);
    const doc = await fs.readFile(
      path.join(PLUGIN_ROOT, "references", "examples", `${example}.md`),
      "utf8"
    );
    const toml = doc.match(/```toml\n([\s\S]*?)```/)[1];
    await fs.writeFile(path.join(repoDir, "mise.toml"), toml, "utf8");
    await fs.writeFile(path.join(repoDir, "mise.lock"), "", "utf8");

    const payload = runValidator(repoDir);
    assert.equal(payload.status, "success", example);
    assert.deepEqual(
      payload.diagnostics.map((diagnostic) => diagnostic.rule_id),
      [],
      example
    );
  }
});

test("mise-workflows validator는 deprecated 문법과 task 정의 규칙 위반을 보고한다", async (t) => {
  if (!hasPython3()) {
    t.skip("python3가 없어 validator 테스트를 건너뜁니다.");
    return;
  }

  const repoDir = await createTempDir(t);
  await fs.writeFile(
    path.join(repoDir, "mise.toml"),
    [
      'redactions = ["*_TOKEN"]',
      "",
      "[tools]",
      'node = "^24"',
      'java = "21"',
      '"ubi:BurntSushi/ripgrep" = "14"',
      "",
      "[settings]",
      "python.uv_venv_auto = true",
      "",
      "[tasks.legacy]",
      'description = "Legacy task."',
      "run = \"echo {{ arg(name='target') }}\"",
      ""
    ].join("\n"),
    "utf8"
  );

  const payload = runValidator(repoDir);
  const ruleIds = payload.diagnostics.map((diagnostic) => diagnostic.rule_id).sort();

  assert.equal(payload.status, "failed");
  assert.deepEqual(ruleIds, ["MWC001", "MWE005", "MWJ001", "MWL001", "MWT001", "MWT002", "MWV004"]);
  assert.deepEqual(
    payload.diagnostics.find((diagnostic) => diagnostic.rule_id === "MWT002").evidence.missing,
    ["usage"]
  );
});

function runValidator(repoDir) {
  const result = spawnSync("python3", [VALIDATOR_PATH, "--format", "json", repoDir], {
    encoding: "utf8"
  });
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}

async function createTempDir(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mise-workflows-validator-"));
  t.after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });
  return dir;
}

function hasPython3() {
  const result = spawnSync("python3", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}
