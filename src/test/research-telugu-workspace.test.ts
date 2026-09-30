import assert from "node:assert";
import { MockResearchProvider } from "../server/research/mock-research.provider";
import { getStarterWorkspaceById, getStarterWorkspaces } from "../server/research/starter-workspaces";
import { RESEARCH_TRANSLATIONS } from "../app/(dashboard)/research/translations";

async function runResearchTeluguWorkspaceTests() {
  console.log("==========================================================");
  console.log("Research Workspace Telugu Language Verification Suite");
  console.log("==========================================================");

  // Test 1: Starter workspace with Telugu NLP
  console.log("\n[Test 1] Verifying Telugu NLP Starter Workspace...");
  const teluguStarter = getStarterWorkspaceById("ws-starter-telugu-nlp");
  assert(teluguStarter, "ws-starter-telugu-nlp must exist in starter workspaces");
  assert(teluguStarter.title.includes("తెలుగు"), "Title must contain Telugu characters");
  assert(teluguStarter.sources.length === 3, "Must have 3 curated research sources");
  assert(
    teluguStarter.sources.some((s) => s.fileName.includes("Telugu_Tokenization")),
    "Must include Telugu Tokenization paper"
  );
  console.log("  ✓ Test 1 Passed: Telugu NLP Starter Workspace verified.");
  console.log(`    - ID: ${teluguStarter.id}`);
  console.log(`    - Title: ${teluguStarter.title}`);
  console.log(`    - Sources: ${teluguStarter.sources.map((s) => s.fileName).join(", ")}`);

  // Test 2: MockResearchProvider Synthesis in Telugu for all 8 Modes
  console.log("\n[Test 2] Verifying MockResearchProvider 8-Mode Telugu Synthesis...");
  const provider = new MockResearchProvider();
  const testSources = teluguStarter.sources.map((s) => ({
    fileName: s.fileName,
    textContent: s.textContent,
  }));

  const modes = [
    "literature_matrix",
    "thesis_defense",
    "bibtex_citations",
    "methodology",
    "podcast",
    "study_guide",
    "summary",
    "faq",
  ] as const;

  for (const mode of modes) {
    const result = await provider.synthesizeNotebook({
      sources: testSources,
      mode,
      language: "te",
    });

    assert(result.title, `Mode ${mode} must return a title`);
    assert(result.markdown, `Mode ${mode} must return markdown`);
    // Check that title or markdown contains Telugu script (\u0C00-\u0C7F)
    const hasTeluguChar = /[\u0C00-\u0C7F]/.test(result.title) && /[\u0C00-\u0C7F]/.test(result.markdown);
    assert(hasTeluguChar, `Mode ${mode} must produce content in Telugu script`);
    // Check citations
    assert(result.markdown.includes("[Doc:"), `Mode ${mode} must include [Doc: ...] citations`);
    // Check grounding block in Telugu
    assert(
      result.markdown.includes("ఆధారాల నిర్ధారణ & ధృవీకరణ"),
      `Mode ${mode} must include Telugu evidence grounding block`
    );
    console.log(`  ✓ Mode '${mode}' passed: ${result.title}`);
  }

  // Test 3: Podcast Speaker Dialogue Turn Detection in Telugu
  console.log("\n[Test 3] Verifying Telugu Podcast Dialogue Script...");
  const podcastResult = await provider.synthesizeNotebook({
    sources: testSources,
    mode: "podcast",
    language: "te",
  });
  assert(podcastResult.markdown.includes("**అలెక్స్:**"), "Must include Alex speaker tag in Telugu");
  assert(podcastResult.markdown.includes("**జోర్డాన్:**"), "Must include Jordan speaker tag in Telugu");
  console.log("  ✓ Test 3 Passed: 2-host Telugu audio podcast format validated.");

  // Test 4: Custom Research Prompt in Telugu
  console.log("\n[Test 4] Verifying Custom Research Query with Telugu Output...");
  const customResult = await provider.synthesizeNotebook({
    sources: testSources,
    mode: "summary",
    customPrompt: "దయచేసి ద్రావిడ భాషలలో టోకనైజేషన్ సామర్థ్యాన్ని సరిపోల్చండి",
    language: "te",
  });
  assert(customResult.markdown.includes("పరిశోధనా విచారణ:"), "Must include custom prompt heading in Telugu");
  console.log("  ✓ Test 4 Passed: Custom Telugu query synthesis validated.");

  // Test 5: Complete Translation Dictionary Parity
  console.log("\n[Test 5] Verifying Translation Dictionary Parity (English vs Telugu)...");
  const enKeys = Object.keys(RESEARCH_TRANSLATIONS.en);
  const teKeys = Object.keys(RESEARCH_TRANSLATIONS.te);
  assert.strictEqual(enKeys.length, teKeys.length, "Both languages must have identical key count");
  for (const k of enKeys) {
    assert(k in RESEARCH_TRANSLATIONS.te, `Telugu translation must have key '${k}'`);
  }
  console.log(`  ✓ Test 5 Passed: All ${enKeys.length} translation keys match between en and te.`);

  console.log("\n==========================================================");
  console.log("ALL RESEARCH WORKSPACE TELUGU TESTS PASSED SUCCESSFULLY!");
  console.log("==========================================================");
}

runResearchTeluguWorkspaceTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
