// plugins/transport_regime_pack/index.ts

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
 * Transport regimes:
 * - viscous-dominated
 * - resistive-dominated
 * - conduction-dominated
 * - viscous-heating-dominated
 * - ohmic-heating-dominated
 */

const transportRegimes: Regime[] = [
  // Viscous-dominated: high viscosity + strong velocity gradients
  {
    id: "regime.transport.viscous_dominated",
    label: "Viscous-Dominated",
    description: "Viscosity dominates momentum transport.",
    capabilityDependencies: [
      "cap.transport.high_viscosity",
      "cap.kin.grad_v",
    ],
    classify: (caps): RegimeClassification => {
      const mu = c(caps, "cap.transport.high_viscosity");
      const grad = c(caps, "cap.kin.grad_v");
      const score = clamp01((mu + grad) / 2);
      return {
        regimeId: "regime.transport.viscous_dominated",
        confidence: score,
        label: "Viscous-Dominated",
        description: "Viscosity dominates momentum transport.",
      };
    },
  },

  // Resistive-dominated: high resistivity + strong current density
  {
    id: "regime.transport.resistive_dominated",
    label: "Resistive-Dominated",
    description: "Resistive diffusion dominates magnetic transport.",
    capabilityDependencies: [
      "cap.transport.high_resistivity",
      "cap.coupling.mhd_fluid", // proxy for current density strength
    ],
    classify: (caps): RegimeClassification => {
      const eta = c(caps, "cap.transport.high_resistivity");
      const mhd = c(caps, "cap.coupling.mhd_fluid");
      const score = clamp01((eta + mhd) / 2);
      return {
        regimeId: "regime.transport.resistive_dominated",
        confidence: score,
        label: "Resistive-Dominated",
        description: "Resistive diffusion dominates magnetic transport.",
      };
    },
  },

  // Conduction-dominated: strong conduction flux
  {
    id: "regime.transport.conduction_dominated",
    label: "Conduction-Dominated",
    description: "Thermal conduction dominates energy transport.",
    capabilityDependencies: ["cap.transport.strong_conduction"],
    classify: (caps): RegimeClassification => {
      const q = c(caps, "cap.transport.strong_conduction");
      return {
        regimeId: "regime.transport.conduction_dominated",
        confidence: q,
        label: "Conduction-Dominated",
        description: "Thermal conduction dominates energy transport.",
      };
    },
  },

  // Viscous-heating-dominated: strong viscous heating
  {
    id: "regime.transport.viscous_heating_dominated",
    label: "Viscous-Heating-Dominated",
    description: "Viscous dissipation dominates energy injection.",
    capabilityDependencies: ["cap.transport.strong_viscous_heating"],
    classify: (caps): RegimeClassification => {
      const Q = c(caps, "cap.transport.strong_viscous_heating");
      return {
        regimeId: "regime.transport.viscous_heating_dominated",
        confidence: Q,
        label: "Viscous-Heating-Dominated",
        description: "Viscous dissipation dominates energy injection.",
      };
    },
  },

  // Ohmic-heating-dominated: strong ohmic heating
  {
    id: "regime.transport.ohmic_heating_dominated",
    label: "Ohmic-Heating-Dominated",
    description: "Ohmic dissipation dominates energy injection.",
    capabilityDependencies: ["cap.transport.strong_ohmic_heating"],
    classify: (caps): RegimeClassification => {
      const Q = c(caps, "cap.transport.strong_ohmic_heating");
      return {
        regimeId: "regime.transport.ohmic_heating_dominated",
        confidence: Q,
        label: "Ohmic-Heating-Dominated",
        description: "Ohmic dissipation dominates energy injection.",
      };
    },
  },
];

export const TransportRegimePlugin: RegimePlugin = {
  namespace: "transport_regime_pack",
  regimes: transportRegimes,
};
