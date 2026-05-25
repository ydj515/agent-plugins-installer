import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyDirectoryStrict, readJsonFile, removePath } from "../src/lib/utils.js";

const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));
const GENERATED_ROOT = path.join(REPO_ROOT, ".generated", "direct");
const TARGETS = ["codex", "claude", "gemini"];
const SHARED_SOURCE_IGNORES = new Set([
  ".DS_Store",
  "targets",
  ".codex-plugin",
  ".claude-plugin",
  "gemini-extension.json",
  "GEMINI.md",
  ".app.json",
  ".mcp.json"
]);

await removePath(GENERATED_ROOT);

const catalog = await readJsonFile(path.join(REPO_ROOT, "catalog.json"));

for (const integration of catalog.integrations) {
  const sourceDir = path.join(REPO_ROOT, integration.sourceDir);

  for (const target of TARGETS) {
    if (!integration.targets.includes(target)) {
      continue;
    }

    const destinationDir = path.join(GENERATED_ROOT, target, integration.id);
    const overlayDir = path.join(sourceDir, "targets", target);

    await fs.mkdir(destinationDir, { recursive: true });
    await copySharedSource(sourceDir, destinationDir);
    await copyDirectoryStrict(overlayDir, destinationDir);
  }
}

async function copySharedSource(sourceDir, destinationDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (SHARED_SOURCE_IGNORES.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    const stat = await fs.lstat(sourcePath);

    if (stat.isSymbolicLink()) {
      throw new Error(`Symlinks are not supported: ${sourcePath}`);
    }

    if (stat.isDirectory()) {
      await copyDirectoryStrict(sourcePath, destinationPath);
      continue;
    }

    if (!stat.isFile()) {
      throw new Error(`Unsupported file type: ${sourcePath}`);
    }

    await fs.copyFile(sourcePath, destinationPath);
    await fs.chmod(destinationPath, stat.mode);
  }
}
