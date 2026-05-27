// plugins/regime_explanation_pack/index.ts

import {
  RegimeExplanationPlugin,
  RegimeClassification,
  RegimeExplanation,
} from "../../src/core/types";

/**
 * Sort helper.
 */
function sortDesc<T>(arr: T[], key: (x: T) => number): T[] {
  return [...arr].sort((a, b) => key(b) - key(a));
}

/**
 * Generate a short human-readable label from a capability ID.
 */
function prettyCap(id: string): string {
  return id.replace(/^cap\./, "").replace(/\./g, " ");
}

/**
 * Generate a natural-language explanation for a regime.
 */
function generateExplanation(
  dominant: RegimeClassification,
  capabilities: Record<string, number>
): RegimeExplanation {
  const { regimeId, confidence, label, description } = dominant;

  // Identify top contributing capabilities (highest values)
  const capEntries = Object.entries(capabilities).map(([k, v]) => ({
    capability: k,
    value: typeof v === "number" ? v : 0,
  }));

  const topCaps = sortDesc(capEntries, (x) => x.value).slice(0, 5);

  // Summary sentence
  const summary = `${label} regime detected with confidence ${confidence.toFixed(
    2
  )}.`;

  // Detailed explanation
  const detailedLines = [
    `The system is classified as **${label}** because:`,
    `• ${description}`,
    `• Key contributing factors include:`,
    ...topCaps.map(
      (c) => `  - ${prettyCap(c.capability)} (score ${c.value.toFixed(2)})`
    ),
    ``,
    `Overall, the capability profile strongly aligns with the characteristics of the ${label} regime.`,
  ];

  return {
    summary,
    dominantRegime: regimeId,
    confidence,
    drivers: topCaps,
    detailed: detailedLines.join("\n"),
  };
}

/**
 * The plugin: takes a list of regime classifications and capabilities,
 * returns a structured explanation.
 */
export const RegimeExplanationPlugin: RegimeExplanationPlugin = {
  namespace: "regime_explanation_pack",

  explain(regimes: RegimeClassification[], capabilities: Record<string, number>) {
    if (!regimes.length) {
      return {
        summary: "No regimes detected.",
        dominantRegime: "",
        confidence: 0,
        drivers: [],
        detailed: "The classifier returned no regime classifications.",
      };
    }

    // Pick highest-confidence regime
    const dominant = sortDesc(regimes, (r) => r.confidence)[0];

    return generateExplanation(dominant, capabilities);
  },
};
