import { resolve } from "node:path";
import { AuditReport, parseArgs, readJsonFile, requireStringArg } from "./common.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const reportPath = resolve(process.cwd(), requireStringArg(args, "report"));
  const report = await readJsonFile<AuditReport>(reportPath);

  console.log(`Latest report: ${reportPath}`);
  console.log(`Overall status: ${report.overallStatus}`);
  console.log(`Violations: ${report.totals.violations}`);
  console.log(`Incomplete: ${report.totals.incomplete}`);

  if (report.overallStatus === "PASS") {
    console.log("No rerun required. The latest report is already clean.");
    return;
  }

  console.log("This scaffold stops at status evaluation.");
  console.log("Next iteration should call the audit runner again after applying manual changes or a reviewed autofix plan.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
