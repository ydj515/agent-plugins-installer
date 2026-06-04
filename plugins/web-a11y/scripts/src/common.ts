import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import minimist from "minimist";

export type AuditStatus = "FAIL" | "REVIEW" | "PASS";

export interface AuditTarget {
  name: string;
  url: string;
  waitForSelector?: string;
  waitForTimeoutMs?: number;
  waitForNetworkIdle?: boolean;
}

export interface AuditConfig {
  baseUrl?: string;
  outputDir?: string;
  reportName?: string;
  markdownReportName?: string;
  browser?: {
    headless?: boolean;
  };
  pages: AuditTarget[];
}

export interface RuleNode {
  target: string[];
  html: string;
  failureSummary: string | null;
}

export interface RuleResult {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: RuleNode[];
}

export interface PageAuditResult {
  name: string;
  url: string;
  title: string;
  status: AuditStatus;
  summary: {
    violations: number;
    incomplete: number;
    passes: number;
    inapplicable: number;
  };
  violations: RuleResult[];
  incomplete: RuleResult[];
}

export interface AuditReport {
  generatedAt: string;
  source: {
    mode: "config" | "url";
    configPath?: string;
  };
  engine: "playwright-axe";
  overallStatus: AuditStatus;
  totals: {
    pages: number;
    violations: number;
    incomplete: number;
    passes: number;
    inapplicable: number;
  };
  pages: PageAuditResult[];
}

export function parseArgs(argv: string[]): minimist.ParsedArgs {
  return minimist(argv, {
    boolean: ["headed"],
    string: [
      "base-url",
      "config",
      "markdown-report-name",
      "name",
      "output",
      "output-dir",
      "report-name",
      "url",
      "urls"
    ],
    alias: {
      c: "config",
      o: "output"
    },
    default: {
      headed: false
    }
  });
}

export function resolveFrom(baseFileOrDir: string, inputPath: string): string {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }
  return resolve(dirname(baseFileOrDir), inputPath);
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const contents = await readFile(path, "utf8");
  return JSON.parse(contents) as T;
}

export async function writeJsonFile(path: string, payload: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function writeTextFile(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
}

export function requireStringArg(
  args: minimist.ParsedArgs,
  name: "config" | "url" | "urls"
): string {
  const value = args[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required argument: --${name}`);
  }
  return value;
}

export function buildStatus(violations: number, incomplete: number): AuditStatus {
  if (violations > 0) {
    return "FAIL";
  }
  if (incomplete > 0) {
    return "REVIEW";
  }
  return "PASS";
}

export function truncate(input: string, maxLength = 240): string {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength - 3)}...`;
}

export function toAbsoluteUrl(baseUrl: string | undefined, candidate: string): string {
  try {
    return new URL(candidate).toString();
  } catch {
    if (!baseUrl) {
      throw new Error(`Relative page URL '${candidate}' requires 'baseUrl' in the config or --base-url in URL mode.`);
    }
    return new URL(candidate, baseUrl).toString();
  }
}

export function impactLabel(impact: string | null): string {
  return impact ?? "unknown";
}
