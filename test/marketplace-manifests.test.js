import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { pathExists, readJsonFile } from "../src/lib/utils.js";

const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));

test("repo root marketplace manifests point at expected target bundle locations", async () => {
  const catalog = await readJsonFile(path.join(REPO_ROOT, "catalog.json"));
  const integrationIds = catalog.integrations.map((integration) => integration.id).sort();

  const codexMarketplace = await readJsonFile(
    path.join(REPO_ROOT, ".agents", "plugins", "marketplace.json")
  );
  assert.equal(codexMarketplace.name, "agent-plugins-installer");
  assert.equal(typeof codexMarketplace.interface?.displayName, "string");
  assert.deepEqual(
    codexMarketplace.plugins.map((plugin) => plugin.name).sort(),
    integrationIds
  );

  for (const plugin of codexMarketplace.plugins) {
    assert.equal(plugin.source?.source, "local");
    assert.equal(plugin.source?.path, `./.codex/plugins/${plugin.name}`);
    assert.equal(typeof plugin.policy?.installation, "string");
    assert.equal(typeof plugin.policy?.authentication, "string");
    assert.equal(typeof plugin.category, "string");
  }

  const claudeMarketplace = await readJsonFile(
    path.join(REPO_ROOT, ".claude-plugin", "marketplace.json")
  );
  assert.equal(claudeMarketplace.name, "agent-plugins-installer");
  assert.deepEqual(
    claudeMarketplace.plugins.map((plugin) => plugin.name).sort(),
    integrationIds
  );

  for (const plugin of claudeMarketplace.plugins) {
    assert.equal(plugin.source, `./.generated/direct/claude/${plugin.name}`);
    const pluginRoot = path.join(REPO_ROOT, plugin.source.slice(2));
    const manifestPath = path.join(pluginRoot, ".claude-plugin", "plugin.json");
    assert.equal(await pathExists(manifestPath), true);
  }

  for (const integrationId of integrationIds) {
    const pluginRoot = path.join(REPO_ROOT, "plugins", integrationId);
    assert.equal(
      await pathExists(path.join(pluginRoot, ".codex-plugin", "plugin.json")),
      false
    );
    assert.equal(
      await pathExists(path.join(pluginRoot, ".claude-plugin", "plugin.json")),
      false
    );
    assert.equal(
      await pathExists(path.join(pluginRoot, "gemini-extension.json")),
      false
    );
  }

  for (const integrationId of integrationIds) {
    const generatedGeminiRoot = path.join(REPO_ROOT, ".generated", "direct", "gemini", integrationId);
    const geminiManifestPath = path.join(generatedGeminiRoot, "gemini-extension.json");
    assert.equal(await pathExists(geminiManifestPath), true);

    const geminiManifest = await readJsonFile(geminiManifestPath);
    assert.equal(typeof geminiManifest.name, "string");
    assert.equal(typeof geminiManifest.version, "string");
    assert.equal(typeof geminiManifest.contextFileName, "string");
    assert.equal(
      await pathExists(path.join(generatedGeminiRoot, geminiManifest.contextFileName)),
      true
    );
  }
});
