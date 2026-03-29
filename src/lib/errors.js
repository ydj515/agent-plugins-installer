import { EXIT_CODES, PACKAGE_NAME } from "./constants.js";

export class CliError extends Error {
  constructor({ codeName, message, exitCode, cause }) {
    super(message, cause ? { cause } : undefined);
    this.name = "CliError";
    this.codeName = codeName;
    this.exitCode = exitCode;
  }
}

export function usageError(message) {
  return new CliError({
    codeName: "USAGE_ERROR",
    exitCode: EXIT_CODES.USAGE,
    message: `[${PACKAGE_NAME}] USAGE_ERROR: ${message}`
  });
}

export function configError(message, cause) {
  return new CliError({
    codeName: "CONFIG_ERROR",
    exitCode: EXIT_CODES.ENV,
    message: `[${PACKAGE_NAME}] CONFIG_ERROR: ${message}`,
    cause
  });
}

export function installError(message, cause) {
  return new CliError({
    codeName: "INSTALL_FAILED",
    exitCode: EXIT_CODES.INSTALL_FAILED,
    message: `[${PACKAGE_NAME}] INSTALL_FAILED: ${message}`,
    cause
  });
}

export function safetyError(message, cause) {
  return new CliError({
    codeName: "SAFETY_VIOLATION",
    exitCode: EXIT_CODES.SAFETY,
    message: `[${PACKAGE_NAME}] SAFETY_VIOLATION: ${message}`,
    cause
  });
}

export function lockConflictError(rootPath) {
  return new CliError({
    codeName: "LOCK_CONFLICT",
    exitCode: EXIT_CODES.SAFETY,
    message: `[${PACKAGE_NAME}] LOCK_CONFLICT: Another installation is already running for "${rootPath}".\nWait for the other process to finish and try again.\nIf you believe the lock is stale, remove it only after confirming that no installer process is still running.`
  });
}

export function markerInvalidError(targetDir) {
  return new CliError({
    codeName: "MARKER_INVALID",
    exitCode: EXIT_CODES.SAFETY,
    message: `[${PACKAGE_NAME}] MARKER_INVALID: The ownership marker in "${targetDir}" is missing or corrupted.\nThis directory cannot be safely overwritten.\nRemove the directory manually and reinstall, or choose a different install location.`
  });
}

export function permissionError(rootPath) {
  return new CliError({
    codeName: "EACCES",
    exitCode: EXIT_CODES.ENV,
    message: `[${PACKAGE_NAME}] EACCES: Cannot write to "${rootPath}".\nThe current user does not have permission to modify this directory.\nAdjust permissions and try again, or use a different scope.`
  });
}

export function interactiveTtyError() {
  return new CliError({
    codeName: "USAGE_ERROR",
    exitCode: EXIT_CODES.USAGE,
    message: `[${PACKAGE_NAME}] USAGE_ERROR: Interactive mode requires a TTY.\nRun \`npx agent-plugins-installer install <codex|claude|gemini|all> --scope user|project\` in non-interactive environments.`
  });
}

export function commandNotFoundError(command) {
  return new CliError({
    codeName: "COMMAND_NOT_FOUND",
    exitCode: EXIT_CODES.ENV,
    message: `[${PACKAGE_NAME}] COMMAND_NOT_FOUND: Required command "${command}" was not found in PATH.`
  });
}

export function externalCommandError(command, args, result) {
  const rendered = [command, ...args].join(" ");
  const details = [result?.stdout?.trim(), result?.stderr?.trim()].filter(Boolean).join("\n");

  return new CliError({
    codeName: "EXTERNAL_COMMAND_FAILED",
    exitCode: EXIT_CODES.INSTALL_FAILED,
    message: `[${PACKAGE_NAME}] EXTERNAL_COMMAND_FAILED: Command failed: ${rendered}${details ? `\n${details}` : ""}`
  });
}

export function toCliError(error) {
  if (error instanceof CliError) {
    return error;
  }

  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    const command = "path" in error && typeof error.path === "string" ? error.path : "unknown";
    return commandNotFoundError(command);
  }

  return new CliError({
    codeName: "INSTALL_FAILED",
    exitCode: EXIT_CODES.INSTALL_FAILED,
    message: `[${PACKAGE_NAME}] INSTALL_FAILED: ${error instanceof Error ? error.message : String(error)}`,
    cause: error instanceof Error ? error : undefined
  });
}
