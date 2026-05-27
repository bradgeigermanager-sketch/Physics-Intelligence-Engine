// plugins/radiation_regime_pack/index.ts

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
 * Radiation regimes:
 * - optically thick
 * - optically thin
 * - radiation-pressure-dominated
 * - cooling-dominated
 * - flux-dominated
 * - high-Eddington-factor flow
 */

const radRegimes: Regime[] = [
  // Optically thick: high optical depth
  {
    id: "regime.rad.optically_thick",
    label: "Optically Thick",
    description: "Radiation is trapped; τ >> 1.",
    capabilityDependencies: ["cap.rad.high_optical_depth"],
    classify: (caps): RegimeClassification => {
      const tau = c(caps, "cap.rad.high_optical_depth");
      return {
        regimeId: "regime.rad.optically_thick",
        confidence: tau,
        label: "Optically Thick",
        description: "Radiation is trapped; τ >> 1.",
      };
    },
  },

  // Optically thin: low optical depth
  {
    id: "regime.rad.optically_thin",
    label: "Optically Thin",
    description: "Radiation escapes freely; τ << 1.",
    capabilityDependencies: ["cap.rad.high_optical_depth"],
    classify: (caps): RegimeClassification => {
      const tau = c(caps, "cap.rad.high_optical_depth");
      const score = 1 - tau;
      return {
        regimeId: "regime.rad.optically_thin",
        confidence: score,
        label: "Optically Thin",
        description: "Radiation escapes freely; τ << 1.",
      };
    },
  },

  // Radiation-pressure-dominated
  {
    id: "regime.rad.pressure_dominated",
    label: "Radiation-Pressure-Dominated",
    description: "Radiation pressure dominates over gas pressure.",
    capabilityDependencies: ["cap.rad.high_pressure"],
    classify: (caps): RegimeClassification => {
      const P = c(caps, "cap.rad.high_pressure");
      return {
        regimeId: "regime.rad.pressure_dominated",
        confidence: P,
        label: "Radiation-Pressure-Dominated",
        description: "Radiation pressure dominates over gas pressure.",
      };
    },
  },

  // Cooling-dominated: strong radiative cooling
  {
    id: "regime.rad.cooling_dominated",
    label: "Cooling-Dominated",
    description: "Radiative cooling dominates energy loss.",
    capabilityDependencies: ["cap.rad.strong_cooling"],
    classify: (caps): RegimeClassification => {
      const L = c(caps, "cap.rad.strong_cooling");
      return {
        regimeId: "regime.rad.cooling_dominated",
        confidence: L,
        label: "Cooling-Dominated",
        description: "Radiative cooling dominates energy loss.",
      };
    },
  },

  // Flux-dominated: strong radiation flux
  {
    id: "regime.rad.flux_dominated",
    label: "Flux-Dominated",
    description: "Radiation flux dominates energy transport.",
    capabilityDependencies: ["cap.rad.strong_flux"],
    classify: (caps): RegimeClassification => {
      const F = c(caps, "cap.rad.strong_flux");
      return {
        regimeId: "regime.rad.flux_dominated",
        confidence: F,
        label: "Flux-Dominated",
        description: "Radiation flux dominates energy transport.",
      };
    },
  },

  // High-Eddington-factor flow
  {
    id: "regime.rad.high_eddington",
    label: "High-Eddington-Factor Flow",
    description: "Flow with large Eddington factor (f ≳ 0.5).",
    capabilityDependencies: ["cap.rad.high_eddington_factor"],
    classify: (caps): RegimeClassification => {
      const f = c(caps, "cap.rad.high_eddington_factor");
      return {
        regimeId: "regime.rad.high_eddington",
        confidence: f,
        label: "High-Eddington-Factor Flow",
        description: "Flow with large Eddington factor (f ≳ 0.5).",
      };
    },
  },
];

export const RadiationRegimePlugin: RegimePlugin = {
  namespace: "radiation_regime_pack",
  regimes: radRegimes,
};
