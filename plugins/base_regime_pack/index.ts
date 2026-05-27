// plugins/base_regime_pack/index.ts

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
 * Smooth clamp.
 */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Base regimes:
 * - equilibrium
 * - non-equilibrium
 * - high-energy
 * - low-energy
 * - strong-gradient
 * - weak-gradient
 */

const baseRegimes: Regime[] = [
  // Equilibrium: low gradients, low heating, low flux
  {
    id: "regime.base.equilibrium",
    label: "Equilibrium",
    description: "System is near equilibrium: weak gradients, weak heating, weak flux.",
    capabilityDependencies: [
      "cap.kin.grad_v",
      "cap.transport.strong_viscous_heating",
      "cap.rad.strong_flux",
    ],
    classify: (caps): RegimeClassification => {
      const grad = c(caps, "cap.kin.grad_v");
      const visc = c(caps, "cap.transport.strong_viscous_heating");
      const flux = c(caps, "cap.rad.strong_flux");

      const score = 1 - clamp01((grad + visc + flux) / 3);
      return {
        regimeId: "regime.base.equilibrium",
        confidence: score,
        label: "Equilibrium",
        description: "Weak gradients, weak heating, weak flux.",
      };
    },
  },

  // Non-equilibrium: strong gradients or heating
  {
    id: "regime.base.nonequilibrium",
    label: "Non-Equilibrium",
    description: "System is far from equilibrium: strong gradients or strong heating.",
    capabilityDependencies: [
      "cap.kin.grad_v",
      "cap.transport.strong_viscous_heating",
    ],
    classify: (caps): RegimeClassification => {
      const grad = c(caps, "cap.kin.grad_v");
      const visc = c(caps, "cap.transport.strong_viscous_heating");

      const score = clamp01((grad + visc) / 2);
      return {
        regimeId: "regime.base.nonequilibrium",
        confidence: score,
        label: "Non-Equilibrium",
        description: "Strong gradients or strong heating.",
      };
    },
  },

  // High-energy: high temperature or high sound speed
  {
    id: "regime.base.high_energy",
    label: "High Energy",
    description: "System has high thermal or acoustic energy.",
    capabilityDependencies: [
      "cap.thermo.high_T",
      "cap.thermo.high_sound_speed",
    ],
    classify: (caps): RegimeClassification => {
      const T = c(caps, "cap.thermo.high_T");
      const cs = c(caps, "cap.thermo.high_sound_speed");

      const score = clamp01((T + cs) / 2);
      return {
        regimeId: "regime.base.high_energy",
        confidence: score,
        label: "High Energy",
        description: "High temperature or high sound speed.",
      };
    },
  },

  // Low-energy: low temperature and low sound speed
  {
    id: "regime.base.low_energy",
    label: "Low Energy",
    description: "System has low thermal and acoustic energy.",
    capabilityDependencies: [
      "cap.thermo.low_T",
      "cap.thermo.high_sound_speed", // inverted
    ],
    classify: (caps): RegimeClassification => {
      const lowT = c(caps, "cap.thermo.low_T");
      const highCs = c(caps, "cap.thermo.high_sound_speed");

      const score = clamp01((lowT + (1 - highCs)) / 2);
      return {
        regimeId: "regime.base.low_energy",
        confidence: score,
        label: "Low Energy",
        description: "Low temperature and low sound speed.",
      };
    },
  },

  // Strong-gradient: strong shear or strong velocity gradients
  {
    id: "regime.base.strong_gradient",
    label: "Strong Gradient",
    description: "System exhibits strong velocity gradients or shear.",
    capabilityDependencies: [
      "cap.kin.grad_v",
      "cap.kin.shear",
    ],
    classify: (caps): RegimeClassification => {
      const grad = c(caps, "cap.kin.grad_v");
      const shear = c(caps, "cap.kin.shear");

      const score = clamp01((grad + shear) / 2);
      return {
        regimeId: "regime.base.strong_gradient",
        confidence: score,
        label: "Strong Gradient",
        description: "Strong velocity gradients or shear.",
      };
    },
  },

  // Weak-gradient: low gradients and low shear
  {
    id: "regime.base.weak_gradient",
    label: "Weak Gradient",
    description: "System exhibits weak velocity gradients and weak shear.",
    capabilityDependencies: [
      "cap.kin.grad_v",
      "cap.kin.shear",
    ],
    classify: (caps): RegimeClassification => {
      const grad = c(caps, "cap.kin.grad_v");
      const shear = c(caps, "cap.kin.shear");

      const score = 1 - clamp01((grad + shear) / 2);
      return {
        regimeId: "regime.base.weak_gradient",
        confidence: score,
        label: "Weak Gradient",
        description: "Weak velocity gradients and weak shear.",
      };
    },
  },
];

export const BaseRegimePlugin: RegimePlugin = {
  namespace: "base_regime_pack",
  regimes: baseRegimes,
};
