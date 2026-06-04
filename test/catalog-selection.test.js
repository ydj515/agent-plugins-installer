import assert from "node:assert/strict";
import test from "node:test";
import { loadCatalog } from "../src/lib/catalog.js";
import { buildInstallRequestsForDirectCommand } from "../src/lib/install.js";

test("기본 설치 선택에는 enabledByDefault integration만 포함된다", async () => {
  const catalog = await loadCatalog();
  const requests = buildInstallRequestsForDirectCommand(catalog, "all");

  for (const request of requests) {
    assert.equal(
      request.selectedIntegrationIds.includes("spring-thymeleaf-a11y"),
      false
    );
  }
});
