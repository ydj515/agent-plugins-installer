import { resolve, basename, dirname, extname } from "node:path";
import {
  AuditReport,
  FixGuide,
  FixGuideItem,
  RuleResult,
  impactLabel,
  parseArgs,
  readJsonFile,
  requireStringArg,
  writeJsonFile,
  writeTextFile
} from "./common.js";

function guidanceForRule(rule: RuleResult): { whyItMatters: string; thymeleafGuidance: string; templateHints: string[] } {
  switch (rule.id) {
    case "image-alt":
      return {
        whyItMatters: "이미지 대체 텍스트가 없으면 스크린리더 사용자가 의미를 파악할 수 없다.",
        thymeleafGuidance: "th:src를 쓰는 img에 문맥에 맞는 alt 값을 추가하거나 장식용이면 alt=\"\"로 명시한다.",
        templateHints: ["img", "th:src", "fragment 내 공통 이미지"]
      };
    case "label":
      return {
        whyItMatters: "폼 필드에 연결된 label이 없으면 입력 목적이 명확하지 않다.",
        thymeleafGuidance: "label의 for와 input/select/textarea의 id를 연결하고, th:field가 있으면 렌더링 id를 함께 확인한다.",
        templateHints: ["th:field", "form-group", "input/select/textarea"]
      };
    case "button-name":
      return {
        whyItMatters: "버튼에 접근 가능한 이름이 없으면 보조기술에서 동작 목적을 전달하지 못한다.",
        thymeleafGuidance: "버튼 텍스트를 추가하거나 아이콘 버튼이면 aria-label을 제공한다.",
        templateHints: ["button", "icon-only button", "submit/reset control"]
      };
    case "link-name":
      return {
        whyItMatters: "링크 이름이 모호하면 목적지를 구분하기 어렵다.",
        thymeleafGuidance: "링크 본문 텍스트를 구체화하고, 아이콘 링크는 aria-label 또는 숨김 텍스트를 제공한다.",
        templateHints: ["a", "pagination", "icon link"]
      };
    case "html-has-lang":
      return {
        whyItMatters: "문서 언어가 없으면 스크린리더 발음과 해석이 부정확해질 수 있다.",
        thymeleafGuidance: "html 태그에 lang 속성을 선언하고 다국어 사이트면 템플릿 변수로 제어한다.",
        templateHints: ["layout.html", "base layout", "html tag"]
      };
    case "document-title":
      return {
        whyItMatters: "페이지 제목이 비어 있거나 의미 없으면 탭과 보조기술 탐색이 어려워진다.",
        thymeleafGuidance: "title 요소를 페이지 목적에 맞게 채우고, layout 사용 시 fragment마다 title 값을 주입한다.",
        templateHints: ["title", "layout fragment", "head section"]
      };
    default:
      return {
        whyItMatters: rule.description || "자동 해석 규칙이 아직 준비되지 않았다.",
        thymeleafGuidance: "룰 help와 helpUrl을 확인하고 템플릿 구조를 기준으로 수동 수정 가이드를 작성한다.",
        templateHints: ["layout", "fragment", "server-rendered HTML"]
      };
  }
}

function toGuide(reportPath: string, report: AuditReport): FixGuide {
  const items: FixGuideItem[] = [];
  for (const page of report.pages) {
    for (const rule of [...page.violations, ...page.incomplete]) {
      const guidance = guidanceForRule(rule);
      items.push({
        pageName: page.name,
        pageUrl: page.url,
        ruleId: rule.id,
        severity: impactLabel(rule.impact),
        whyItMatters: guidance.whyItMatters,
        thymeleafGuidance: guidance.thymeleafGuidance,
        templateHints: guidance.templateHints,
        selectors: rule.nodes.flatMap((node) => node.target)
      });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    reportPath,
    overallStatus: report.overallStatus,
    itemCount: items.length,
    items
  };
}

function buildMarkdown(guide: FixGuide, report: AuditReport): string {
  const lines: string[] = [];
  lines.push("# Accessibility Fix Guide");
  lines.push("");
  lines.push(`- Generated at: ${guide.generatedAt}`);
  lines.push(`- Source report: ${guide.reportPath}`);
  lines.push(`- Overall status: ${guide.overallStatus}`);
  lines.push(`- Pages: ${report.totals.pages}`);
  lines.push(`- Violations: ${report.totals.violations}`);
  lines.push(`- Incomplete: ${report.totals.incomplete}`);
  lines.push("");

  for (const item of guide.items) {
    lines.push(`## ${item.pageName} :: ${item.ruleId}`);
    lines.push("");
    lines.push(`- URL: ${item.pageUrl}`);
    lines.push(`- Severity: ${item.severity}`);
    lines.push(`- Why it matters: ${item.whyItMatters}`);
    lines.push(`- Thymeleaf guidance: ${item.thymeleafGuidance}`);
    lines.push(`- Template hints: ${item.templateHints.join(", ")}`);
    lines.push(`- Selectors: ${item.selectors.length > 0 ? item.selectors.join(", ") : "none captured"}`);
    lines.push("");
  }

  if (guide.items.length === 0) {
    lines.push("No violations or incomplete findings were present in the report.");
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function optionalStringArg(args: Record<string, unknown>, name: "output" | "md-output" | "json-output"): string | undefined {
  const value = args[name];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function withExtension(path: string, extension: string): string {
  return `${dirname(path)}/${basename(path, extname(path))}${extension}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const reportPath = resolve(process.cwd(), requireStringArg(args, "report"));
  const report = await readJsonFile<AuditReport>(reportPath);
  const guide = toGuide(reportPath, report);

  const requestedMarkdownOutput = optionalStringArg(args, "md-output") ?? optionalStringArg(args, "output");
  const markdownOutputPath =
    requestedMarkdownOutput !== undefined
      ? resolve(process.cwd(), requestedMarkdownOutput)
      : resolve(dirname(reportPath), `${basename(reportPath, extname(reportPath))}-fix-guide.md`);
  const requestedJsonOutput = optionalStringArg(args, "json-output");
  const jsonOutputPath =
    requestedJsonOutput !== undefined
      ? resolve(process.cwd(), requestedJsonOutput)
      : withExtension(markdownOutputPath, ".json");

  await writeTextFile(markdownOutputPath, buildMarkdown(guide, report));
  await writeJsonFile(jsonOutputPath, guide);
  console.log(`Fix guide Markdown written to ${markdownOutputPath}`);
  console.log(`Fix guide JSON written to ${jsonOutputPath}`);
  console.log(`Action items: ${guide.itemCount}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
