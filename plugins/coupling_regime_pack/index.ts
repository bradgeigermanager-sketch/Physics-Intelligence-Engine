// plugins/coupling_regime_pack/index.ts

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
 * Coupling regimes:
 * - thermo–kinematic
 * - thermo–radiation
 * - MHD–fluid
 * - radiation–MHD
 * - transport–kinematic
 */

const couplingRegimes: Regime[] = [
  // Thermo–kinematic coupling
  {
    id: "regime.coupling.thermo_kinematic",
    label: "Thermo–Kinematic Coupled",
    description: "Thermal state strongly interacts with velocity gradients.",
    capabilityDependencies: ["cap.coupling.thermo_kinematic"],
    classify: (caps): RegimeClassification => {
      const score = c(caps, "cap.coupling.thermo_kinematic");
      return {
        regimeId: "regime.coupling.thermo_kinematic",
        confidence: score,
        label: "Thermo–Kinematic Coupled",
        description: "Thermal state strongly interacts with velocity gradients.",
      };
    },
  },

  // Thermo–radiation coupling
  {
    id: "regime.coupling.thermo_radiation",
    label: "Thermo–Radiation Coupled",
    description: "Thermal energy strongly interacts with radiative cooling.",
    capabilityDependencies: ["cap.coupling.thermo_radiation"],
    classify: (caps): RegimeClassification => {
      const score = c(caps, "cap.coupling.thermo_radiation");
      return {
        regimeId: "regime.coupling.thermo_radiation",
        confidence: score,
        label: "Thermo–Radiation Coupled",
        description: "Thermal energy strongly interacts with radiative cooling.",
      };
    },
  },

  // MHD–fluid coupling
  {
    id: "regime.coupling.mhd_fluid",
    label: "MHD–Fluid Strongly Coupled",
    description: "Magnetic fields strongly influence fluid dynamics.",
    capabilityDependencies: ["cap.coupling.mhd_fluid"],
    classify: (caps): RegimeClassification => {
      const score = c(caps, "cap.coupling.mhd_fluid");
      return {
        regimeId: "regime.coupling.mhd_fluid",
        confidence: score,
        label: "MHD–Fluid Strongly Coupled",
        description: "Magnetic fields strongly influence fluid dynamics.",
      };
    },
  },

  // Radiation–MHD coupling
  {
    id: "regime.coupling.radiation_mhd",
    label: "Radiation–MHD Coupled",
    description: "Radiation flux strongly interacts with magnetic fields.",
    capabilityDependencies: ["cap.coupling.radiation_mhd"],
    classify: (caps): RegimeClassification => {
      const score = c(caps, "cap.coupling.radiation_mhd");
      return {
        regimeId: "regime.coupling.radiation_mhd",
        confidence: score,
        label: "Radiation–MHD Coupled",
        description: "Radiation flux strongly interacts with magnetic fields.",
      };
    },
  },

  // Transport–kinematic coupling
  {
    id: "regime.coupling.transport_kinematic",
    label: "Transport–Kinematic Coupled",
    description: "Viscosity strongly interacts with velocity gradients.",
    capabilityDependencies: ["cap.coupling.transport_kinematic"],
    classify: (caps): RegimeClassification => {
      const score = c(caps, "cap.coupling.transport_kinematic");
      return {
        regimeId: "regime.coupling.transport_kinematic",
        confidence: score,
        label: "Transport–Kinematic Coupled",
        description: "Viscosity strongly interacts with velocity gradients.",
      };
    },
  },
];

export const CouplingRegimePlugin: RegimePlugin = {
  namespace: "coupling_regime_pack",
  regimes: couplingRegimes,
};
