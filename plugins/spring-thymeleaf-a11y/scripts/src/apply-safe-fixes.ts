import { basename, dirname, extname, resolve } from "node:path";
import {
  AuditReport,
  AutofixPlan,
  AutofixPlanItem,
  impactLabel,
  parseArgs,
  readJsonFile,
  requireStringArg,
  writeJsonFile
} from "./common.js";

function planRule(ruleId: string): { canAutofix: boolean; reason: string; suggestedChange: string } {
  switch (ruleId) {
    case "image-alt":
      return {
        canAutofix: true,
        reason: "이미지 대체 텍스트는 안전 규칙에 포함된다.",
        suggestedChange: "이미지 문맥을 확인해 alt 값을 추가하거나 장식용이면 빈 alt를 명시한다."
      };
    case "label":
      return {
        canAutofix: true,
        reason: "명확한 입력 필드와 label 쌍은 안전하게 연결 후보를 만들 수 있다.",
        suggestedChange: "label for와 필드 id를 연결하고, th:field로 생성되는 id와 충돌하지 않는지 확인한다."
      };
    case "button-name":
      return {
        canAutofix: true,
        reason: "가시 텍스트가 이미 있으면 접근 가능한 이름 보강은 저위험이다.",
        suggestedChange: "아이콘 버튼이면 aria-label을 보강하고, 텍스트 버튼이면 숨김 텍스트 중복을 피한다."
      };
    default:
      return {
        canAutofix: false,
        reason: "현재 스캐폴드에서는 규칙별 안전 자동 수정이 준비되지 않았다.",
        suggestedChange: "수정 가이드로 넘겨 수동 판단을 요청한다."
      };
  }
}

function buildPlan(reportPath: string, report: AuditReport): AutofixPlan {
  const items: AutofixPlanItem[] = [];
  for (const page of report.pages) {
    for (const rule of page.violations) {
      const plan = planRule(rule.id);
      items.push({
        pageName: page.name,
        pageUrl: page.url,
        ruleId: rule.id,
        severity: impactLabel(rule.impact),
        canAutofix: plan.canAutofix,
        reason: plan.reason,
        suggestedChange: plan.suggestedChange
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    reportPath,
    actionableCount: items.filter((item) => item.canAutofix).length,
    skippedCount: items.filter((item) => !item.canAutofix).length,
    items
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const reportPath = resolve(process.cwd(), requireStringArg(args, "report"));
  const report = await readJsonFile<AuditReport>(reportPath);
  const plan = buildPlan(reportPath, report);

  const requestedOutput = typeof args.output === "string" && args.output.trim() !== "" ? args.output : undefined;
  const outputPath =
    requestedOutput !== undefined
      ? resolve(process.cwd(), requestedOutput)
      : resolve(dirname(reportPath), `${basename(reportPath, extname(reportPath))}-autofix-plan.json`);

  await writeJsonFile(outputPath, plan);
  console.log(`Autofix plan written to ${outputPath}`);

  if (args.write === true) {
    console.log("Write mode is intentionally conservative in this scaffold. Review the generated plan before implementing file patches.");
  } else {
    console.log("Dry-run plan generated. No template files were modified.");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
