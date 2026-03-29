import { config as loadEnv } from "dotenv";
loadEnv();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Please set GEMINI_API_KEY in your environment before running this script.");
  process.exit(1);
}

const versions = ["v1beta", "v1"];

for (const version of versions) {
  try {
    const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error(`\n[${version}] ListModels failed (${res.status}):`, body);
      continue;
    }

    const data = await res.json();
    console.log(`\n============ ${version} ============`);
    if (!Array.isArray(data.models)) {
      console.log(`No models listed for ${version}`);
      continue;
    }

    data.models.forEach((model) => {
      const supported = Array.isArray(model.supportedGenerationMethods)
        ? model.supportedGenerationMethods.join(", ")
        : "(none)";
      console.log(`- ${model.name} (${model.version || ""}): ${model.displayName || ""}`);
      console.log(`  methods=${supported}`);
      if (model.inputTokenLimit) console.log(`  inputTokens=${model.inputTokenLimit}`);
      if (model.outputTokenLimit) console.log(`  outputTokens=${model.outputTokenLimit}`);
    });
  } catch (error) {
    console.error(`\n[${version}] Unable to fetch models:`, error);
  }
}
