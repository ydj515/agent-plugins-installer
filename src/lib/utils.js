import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

export async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const contents = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, contents, "utf8");
}

export function isPathInside(parentPath, targetPath) {
  const relativePath = path.relative(parentPath, targetPath);
  return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

export async function removePath(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EPERM") {
      return true;
    }

    return false;
  }
}

export async function copyDirectoryStrict(sourcePath, destinationPath, onVisit) {
  const sourceStat = await fs.lstat(sourcePath);
  if (sourceStat.isSymbolicLink()) {
    throw new Error(`Symlinks are not supported: ${sourcePath}`);
  }

  if (!sourceStat.isDirectory()) {
    throw new Error(`Expected a directory: ${sourcePath}`);
  }

  await fs.mkdir(destinationPath, { recursive: true, mode: sourceStat.mode });
  const entries = await fs.readdir(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    const childSourcePath = path.join(sourcePath, entry.name);
    const childDestinationPath = path.join(destinationPath, entry.name);
    const childStat = await fs.lstat(childSourcePath);

    if (childStat.isSymbolicLink()) {
      throw new Error(`Symlinks are not supported: ${childSourcePath}`);
    }

    if (childStat.isDirectory()) {
      await copyDirectoryStrict(childSourcePath, childDestinationPath, onVisit);
      continue;
    }

    if (!childStat.isFile()) {
      throw new Error(`Unsupported file type: ${childSourcePath}`);
    }

    await fs.copyFile(childSourcePath, childDestinationPath);
    await fs.chmod(childDestinationPath, childStat.mode);

    if (typeof onVisit === "function") {
      await onVisit(childSourcePath, childDestinationPath, childStat);
    }
  }
}

export function formatList(values) {
  return values.length === 0 ? "none" : values.join(", ");
}

export function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

export function toRelativeMarketplacePath(baseDir, targetPath) {
  const relative = toPosixPath(path.relative(baseDir, targetPath));
  if (relative.startsWith("./")) {
    return relative;
  }
  return `./${relative}`;
}

export async function runCommand(command, args, { cwd, env, stdinText } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.stdin.on("error", () => {
      // 자식 프로세스가 선택적 stdin을 읽기 전에 종료될 수 있다.
      // 명령 결과는 종료 코드로 판단하므로 닫힌 stdin 파이프로 CLI가 죽지 않게 한다.
    });

    if (typeof stdinText === "string" && stdinText.length > 0) {
      child.stdin.write(stdinText);
    }
    child.stdin.end();

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr
      });
    });
  });
}
