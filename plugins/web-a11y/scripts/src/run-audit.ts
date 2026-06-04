import { basename, dirname, extname, resolve } from "node:path";
import {
  AuditConfig,
  AuditReport,
  AuditTarget,
  PageAuditResult,
  RuleResult,
  buildStatus,
  parseArgs,
  readJsonFile,
  resolveFrom,
  toAbsoluteUrl,
  truncate,
  writeJsonFile,
  writeTextFile
} from "./common.js";

interface AxeNodeLike {
  target?: unknown;
  html?: unknown;
  failureSummary?: unknown;
}

interface AxeRuleLike {
  id?: unknown;
  impact?: unknown;
  description?: unknown;
  help?: unknown;
  helpUrl?: unknown;
  tags?: unknown;
  nodes?: unknown;
}

interface AxeResultsLike {
  violations?: unknown;
  incomplete?: unknown;
  passes?: unknown;
  inapplicable?: unknown;
}

interface AuditInput {
  config: AuditConfig;
  source: AuditReport["source"];
  configPath: string;
}

type PageLike = {
  goto: (url: string, options?: { waitUntil?: "domcontentloaded" | "load" | "networkidle" }) => Promise<unknown>;
  waitForSelector: (selector: string) => Promise<unknown>;
  waitForTimeout: (timeoutMs: number) => Promise<unknown>;
  waitForLoadState: (state: "networkidle") => Promise<unknown>;
  title: () => Promise<string>;
};

type BrowserContextLike = {
  newPage: () => Promise<PageLike>;
  close: () => Promise<void>;
};

type BrowserLike = {
  newContext: () => Promise<BrowserContextLike>;
  close: () => Promise<void>;
};

function normalizeRule(rule: AxeRuleLike): RuleResult {
  const nodes = Array.isArray(rule.nodes) ? rule.nodes : [];
  return {
    id: typeof rule.id === "string" ? rule.id : "unknown-rule",
    impact: typeof rule.impact === "string" ? rule.impact : null,
    description: typeof rule.description === "string" ? rule.description : "",
    help: typeof rule.help === "string" ? rule.help : "",
    helpUrl: typeof rule.helpUrl === "string" ? rule.helpUrl : "",
    tags: Array.isArray(rule.tags) ? rule.tags.filter((value): value is string => typeof value === "string") : [],
    nodes: nodes.map((node) => {
      const typedNode = node as AxeNodeLike;
      return {
        target: Array.isArray(typedNode.target)
          ? typedNode.target.filter((value): value is string => typeof value === "string")
          : [],
        html: typeof typedNode.html === "string" ? truncate(typedNode.html) : "",
        failureSummary:
          typeof typedNode.failureSummary === "string" ? truncate(typedNode.failureSummary, 400) : null
      };
    })
  };
}

function normalizeRules(rawRules: unknown): RuleResult[] {
  if (!Array.isArray(rawRules)) {
    return [];
  }
  return rawRules.map((rule) => normalizeRule(rule as AxeRuleLike));
}

async function waitForTargetPage(page: PageLike, config: AuditConfig, targetIndex: number): Promise<void> {
  const target = config.pages[targetIndex];
  if (target.waitForSelector) {
    await page.waitForSelector(target.waitForSelector);
  }
  if (target.waitForTimeoutMs) {
    await page.waitForTimeout(target.waitForTimeoutMs);
  }
  if (target.waitForNetworkIdle) {
    await page.waitForLoadState("networkidle");
  }
}

async function createBrowser(headless: boolean): Promise<BrowserLike> {
  const playwright = (await import("playwright")) as {
    chromium: {
      launch: (options: { headless: boolean }) => Promise<BrowserLike>;
    };
  };
  return playwright.chromium.launch({ headless });
}

async function runAxe(page: PageLike): Promise<AxeResultsLike> {
  const axeModule = await import("@axe-core/playwright");
  const builderValue =
    (axeModule as { AxeBuilder?: unknown }).AxeBuilder ??
    (axeModule as { default?: { AxeBuilder?: unknown } }).default?.AxeBuilder;

  if (typeof builderValue !== "function") {
    throw new Error("Unable to load AxeBuilder from @axe-core/playwright.");
  }

  const Builder = builderValue as new (options: { page: PageLike }) => {
    analyze: () => Promise<AxeResultsLike>;
  };
  const builder = new Builder({ page });
  return builder.analyze();
}

async function auditPage(browser: BrowserLike, config: AuditConfig, targetIndex: number): Promise<PageAuditResult> {
  const target = config.pages[targetIndex];
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const targetUrl = toAbsoluteUrl(config.baseUrl, target.url);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await waitForTargetPage(page, config, targetIndex);
    const title = await page.title();
    const rawResults = await runAxe(page);
    const violations = normalizeRules((rawResults as AxeResultsLike).violations);
    const incomplete = normalizeRules((rawResults as AxeResultsLike).incomplete);
    const passes = normalizeRules((rawResults as AxeResultsLike).passes);
    const inapplicable = normalizeRules((rawResults as AxeResultsLike).inapplicable);
    return {
      name: target.name,
      url: targetUrl,
      title,
      status: buildStatus(violations.length, incomplete.length),
      summary: {
        violations: violations.length,
        incomplete: incomplete.length,
        passes: passes.length,
        inapplicable: inapplicable.length
      },
      violations,
      incomplete
    };
  } finally {
    await context.close();
  }
}

function withExtension(path: string, extension: string): string {
  return `${dirname(path)}/${basename(path, extname(path))}${extension}`;
}

function buildOutputPaths(configPath: string, config: AuditConfig): { jsonPath: string; mdPath: string } {
  const outputDir = config.outputDir ?? "./reports/a11y";
  const resolvedDir = resolveFrom(configPath, outputDir);
  const reportName = config.reportName ?? `axe-report-${new Date().toISOString().replaceAll(":", "-")}.json`;
  const jsonPath = `${resolvedDir}/${reportName}`;
  return {
    jsonPath,
    mdPath:
      typeof config.markdownReportName === "string" && config.markdownReportName.trim() !== ""
        ? `${resolvedDir}/${config.markdownReportName}`
        : withExtension(jsonPath, ".md")
  };
}

function formatRuleSummary(rule: RuleResult): string[] {
  const lines: string[] = [];
  lines.push(`- ${rule.id} (${rule.impact ?? "unknown"})`);
  if (rule.help) {
    lines.push(`  - Help: ${rule.help}`);
  }
  if (rule.nodes.length > 0) {
    lines.push(`  - Selectors: ${rule.nodes.flatMap((node) => node.target).join(", ") || "none captured"}`);
  }
  return lines;
}

function buildMarkdownReport(report: AuditReport): string {
  const lines: string[] = [];
  lines.push("# Playwright Accessibility Audit Report");
  lines.push("");
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Engine: ${report.engine}`);
  if (report.source.configPath) {
    lines.push(`- Config: ${report.source.configPath}`);
  }
  lines.push(`- Input mode: ${report.source.mode}`);
  lines.push(`- Overall status: ${report.overallStatus}`);
  lines.push(`- Pages: ${report.totals.pages}`);
  lines.push(`- Violations: ${report.totals.violations}`);
  lines.push(`- Incomplete: ${report.totals.incomplete}`);
  lines.push(`- Passes: ${report.totals.passes}`);
  lines.push(`- Inapplicable: ${report.totals.inapplicable}`);
  lines.push("");

  for (const page of report.pages) {
    lines.push(`## ${page.name}`);
    lines.push("");
    lines.push(`- URL: ${page.url}`);
    lines.push(`- Title: ${page.title || "untitled"}`);
    lines.push(`- Status: ${page.status}`);
    lines.push(`- Violations: ${page.summary.violations}`);
    lines.push(`- Incomplete: ${page.summary.incomplete}`);
    lines.push("");

    if (page.violations.length > 0) {
      lines.push("### Violations");
      lines.push("");
      for (const rule of page.violations) {
        lines.push(...formatRuleSummary(rule));
      }
      lines.push("");
    }

    if (page.incomplete.length > 0) {
      lines.push("### Incomplete");
      lines.push("");
      for (const rule of page.incomplete) {
        lines.push(...formatRuleSummary(rule));
      }
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function optionalStringArg(args: Record<string, unknown>, name: string): string | undefined {
  const value = args[name];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function splitUrlList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function derivePageName(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const pathName = parsed.pathname === "/" ? "home" : parsed.pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-");
    return pathName || parsed.hostname || `page-${index + 1}`;
  } catch {
    const cleaned = url === "/" ? "home" : url.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-");
    return cleaned || `page-${index + 1}`;
  }
}

function buildTargetsFromArgs(args: Record<string, unknown>): AuditTarget[] {
  const singleUrl = optionalStringArg(args, "url");
  const urlList = optionalStringArg(args, "urls");
  const urls = singleUrl ? [singleUrl] : urlList ? splitUrlList(urlList) : [];
  const singleName = optionalStringArg(args, "name");
  return urls.map((url, index) => ({
    name: singleName && urls.length === 1 ? singleName : derivePageName(url, index),
    url
  }));
}

async function loadAuditInput(args: Record<string, unknown>): Promise<AuditInput> {
  const requestedConfig = optionalStringArg(args, "config");
  if (requestedConfig) {
    const configPath = resolve(process.cwd(), requestedConfig);
    return {
      config: await readJsonFile<AuditConfig>(configPath),
      source: { mode: "config", configPath },
      configPath
    };
  }

  const pages = buildTargetsFromArgs(args);
  if (pages.length === 0) {
    throw new Error("Missing audit target. Provide --url <url>, --urls <url1,url2>, or --config <path>.");
  }

  const config: AuditConfig = {
    baseUrl: optionalStringArg(args, "base-url"),
    outputDir: optionalStringArg(args, "output-dir") ?? optionalStringArg(args, "output") ?? "./reports/a11y",
    reportName: optionalStringArg(args, "report-name"),
    markdownReportName: optionalStringArg(args, "markdown-report-name"),
    browser: {
      headless: args.headed !== true
    },
    pages
  };

  return {
    config,
    source: { mode: "url" },
    configPath: process.cwd()
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const input = await loadAuditInput(args);
  const { config } = input;

  if (!Array.isArray(config.pages) || config.pages.length === 0) {
    throw new Error("The audit must define at least one URL in 'pages' or through --url/--urls.");
  }

  const browser = await createBrowser(config.browser?.headless ?? true);
  try {
    const pageResults: PageAuditResult[] = [];
    for (let index = 0; index < config.pages.length; index += 1) {
      pageResults.push(await auditPage(browser, config, index));
    }

    const totals = pageResults.reduce(
      (accumulator, pageResult) => {
        accumulator.violations += pageResult.summary.violations;
        accumulator.incomplete += pageResult.summary.incomplete;
        accumulator.passes += pageResult.summary.passes;
        accumulator.inapplicable += pageResult.summary.inapplicable;
        return accumulator;
      },
      {
        pages: pageResults.length,
        violations: 0,
        incomplete: 0,
        passes: 0,
        inapplicable: 0
      }
    );

    const report: AuditReport = {
      generatedAt: new Date().toISOString(),
      source: input.source,
      engine: "playwright-axe",
      overallStatus: buildStatus(totals.violations, totals.incomplete),
      totals,
      pages: pageResults
    };

    const outputPaths = buildOutputPaths(input.configPath, config);
    await writeJsonFile(outputPaths.jsonPath, report);
    await writeTextFile(outputPaths.mdPath, buildMarkdownReport(report));
    console.log(`Audit JSON report written to ${outputPaths.jsonPath}`);
    console.log(`Audit Markdown report written to ${outputPaths.mdPath}`);
    console.log(`Overall status: ${report.overallStatus}`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
