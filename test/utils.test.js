import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { removePath, runCommand } from "../src/lib/utils.js";

test("runCommand 는 stdin 을 읽지 않고 종료되는 명령도 종료 코드로 판단한다", async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-plugins-utils-"));
  t.after(async () => {
    await removePath(tempDir).catch(() => {});
  });

  const commandPath = path.join(tempDir, "close-stdin");
  await fs.writeFile(
    commandPath,
    `#!/bin/sh
exec 0<&-
exit 0
`,
    "utf8"
  );
  await fs.chmod(commandPath, 0o755);

  const result = await runCommand(commandPath, [], {
    stdinText: "y\n".repeat(1024 * 128)
  });

  assert.equal(result.code, 0);
});
