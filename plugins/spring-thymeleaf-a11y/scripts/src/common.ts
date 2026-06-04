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
  tags?: string[];
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
  configPath: string;
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

export interface FixGuideItem {
  pageName: string;
  pageUrl: string;
  ruleId: string;
  severity: string;
  whyItMatters: string;
  thymeleafGuidance: string;
  templateHints: string[];
  selectors: string[];
}

export interface FixGuide {
  generatedAt: string;
  reportPath: string;
  overallStatus: AuditStatus;
  itemCount: number;
  items: FixGuideItem[];
}

export interface AutofixPlanItem {
  pageName: string;
  pageUrl: string;
  ruleId: string;
  severity: string;
  canAutofix: boolean;
  reason: string;
  suggestedChange: string;
}

export interface AutofixPlan {
  generatedAt: string;
  reportPath: string;
  actionableCount: number;
  skippedCount: number;
  items: AutofixPlanItem[];
}

export function parseArgs(argv: string[]): minimist.ParsedArgs {
  return minimist(argv, {
    boolean: ["dry-run", "write"],
    string: ["config", "report", "output"],
    alias: {
      c: "config",
      r: "report",
      o: "output"
    },
    default: {
      "dry-run": false,
      write: false
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
  name: "config" | "report" | "output"
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
  if (/^https?:\/\//.test(candidate)) {
    return candidate;
  }
  if (!baseUrl) {
    throw new Error(`Relative page URL '${candidate}' requires 'baseUrl' in the config.`);
  }
  return new URL(candidate, baseUrl).toString();
}

export function impactLabel(impact: string | null): string {
  return impact ?? "unknown";
}
