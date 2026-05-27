// plugins/kinematic_regime_pack/index.ts

import {
  Regime,
  RegimePlugin,
  RegimeClassification,
} from "../../src/core/types";

/**
 * Helper to read a capability.
 */
function c(caps: Record<string, unknown>, id: string): number {
  const v = caps[id];
  if (typeof v !== "number") {
    throw new Error(`Expected capability "${id}"`);
  }
  return v;
}

/**
 * Clamp to [0, 1].
 */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Kinematic regimes:
 * - expansion-dominated
 * - compression-dominated
 * - vorticity-dominated
 * - shear-dominated
 * - strain-dominated
 * - strong-gradient flow
 */

const kinRegimes: Regime[] = [
  // Expansion-dominated: positive divergence
  {
    id: "regime.kin.expansion_dominated",
    label: "Expansion-Dominated",
    description: "Flow dominated by expansion (positive divergence).",
    capabilityDependencies: ["cap.kin.expansion"],
    classify: (caps): RegimeClassification => {
      const exp = c(caps, "cap.kin.expansion");
      return {
        regimeId: "regime.kin.expansion_dominated",
        confidence: exp,
        label: "Expansion-Dominated",
        description: "Flow dominated by expansion.",
      };
    },
  },

  // Compression-dominated: negative divergence
  {
    id: "regime.kin.compression_dominated",
    label: "Compression-Dominated",
    description: "Flow dominated by compression (negative divergence).",
    capabilityDependencies: ["cap.kin.compression"],
    classify: (caps): RegimeClassification => {
      const comp = c(caps, "cap.kin.compression");
      return {
        regimeId: "regime.kin.compression_dominated",
        confidence: comp,
        label: "Compression-Dominated",
        description: "Flow dominated by compression.",
      };
    },
  },

  // Vorticity-dominated: strong rotation
  {
    id: "regime.kin.vorticity_dominated",
    label: "Vorticity-Dominated",
    description: "Flow dominated by rotational motion.",
    capabilityDependencies: ["cap.kin.vorticity"],
    classify: (caps): RegimeClassification => {
      const w = c(caps, "cap.kin.vorticity");
      return {
        regimeId: "regime.kin.vorticity_dominated",
        confidence: w,
        label: "Vorticity-Dominated",
        description: "Flow dominated by rotational motion.",
      };
    },
  },

  // Shear-dominated: strong shear tensor
  {
    id: "regime.kin.shear_dominated",
    label: "Shear-Dominated",
    description: "Flow dominated by shear deformation.",
    capabilityDependencies: ["cap.kin.shear"],
    classify: (caps): RegimeClassification => {
      const S = c(caps, "cap.kin.shear");
      return {
        regimeId: "regime.kin.shear_dominated",
        confidence: S,
        label: "Shear-Dominated",
        description: "Flow dominated by shear deformation.",
      };
    },
  },

  // Strain-dominated: strong strain rate tensor
  {
    id: "regime.kin.strain_dominated",
    label: "Strain-Dominated",
    description: "Flow dominated by strain rate deformation.",
    capabilityDependencies: ["cap.kin.strain"],
    classify: (caps): RegimeClassification => {
      const D = c(caps, "cap.kin.strain");
      return {
        regimeId: "regime.kin.strain_dominated",
        confidence: D,
        label: "Strain-Dominated",
        description: "Flow dominated by strain rate deformation.",
      };
    },
  },

  // Strong-gradient flow: strong |∇v|
  {
    id: "regime.kin.strong_gradient_flow",
    label: "Strong-Gradient Flow",
    description: "Flow dominated by strong velocity gradients.",
    capabilityDependencies: ["cap.kin.grad_v"],
    classify: (caps): RegimeClassification => {
      const g = c(caps, "cap.kin.grad_v");
      return {
        regimeId: "regime.kin.strong_gradient_flow",
        confidence: g,
        label: "Strong-Gradient Flow",
        description: "Flow dominated by strong velocity gradients.",
      };
    },
  },
];

export const KinematicRegimePlugin: RegimePlugin = {
  namespace: "kinematic_regime_pack",
  regimes: kinRegimes,
};
