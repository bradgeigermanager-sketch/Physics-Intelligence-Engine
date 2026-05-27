// plugins/transport_capability_library/index.ts

import {
  Capability,
  CapabilityPlugin,
} from "../../src/core/types";

/**
 * Smooth logistic function for capability scoring.
 */
function logistic(x: number, x0: number, k: number): number {
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

/**
 * Helper to read a measurement.
 */
function m(measurements: Record<string, unknown>, id: string): number {
  const v = measurements[id];
  if (typeof v !== "number") {
    throw new Error(`Expected measurement "${id}"`);
  }
  return v;
}

/**
 * Transport capabilities:
 * - high viscosity
 * - high resistivity
 * - strong conduction
 * - strong viscous heating
 * - strong ohmic heating
 */

const transportCaps: Capability[] = [
  // High viscosity capability
  {
    id: "cap.transport.high_viscosity",
    label: "High Viscosity",
    description: "Measures whether dynamic viscosity μ is large.",
    measurementDependencies: ["transport.viscosity"],
    evaluate: (measurements) => {
      const mu = m(measurements, "transport.viscosity");
      return logistic(mu, 1e2, 1e-2); // threshold ~100 (example)
    },
  },

  // High resistivity capability
  {
    id: "cap.transport.high_resistivity",
    label: "High Resistivity",
    description: "Measures whether resistive diffusion η is large.",
    measurementDependencies: ["transport.resistive_diffusion"],
    evaluate: (measurements) => {
      const eta = m(measurements, "transport.resistive_diffusion");
      return logistic(eta, 1.0, 1.0); // threshold ~1
    },
  },

  // Strong conduction capability
  {
    id: "cap.transport.strong_conduction",
    label: "Strong Conduction",
    description: "Measures whether conduction flux |q| is large.",
    measurementDependencies: ["transport.conduction_flux"],
    evaluate: (measurements) => {
      const q = m(measurements, "transport.conduction_flux");
      return logistic(q, 1e5, 1e-5); // threshold ~1e5
    },
  },

  // Strong viscous heating capability
  {
    id: "cap.transport.strong_viscous_heating",
    label: "Strong Viscous Heating",
    description: "Measures whether viscous heating Q_visc is large.",
    measurementDependencies: ["transport.viscous_heating"],
    evaluate: (measurements) => {
      const Q = m(measurements, "transport.viscous_heating");
      return logistic(Q, 1e4, 1e-4); // threshold ~1e4
    },
  },

  // Strong ohmic heating capability
  {
    id: "cap.transport.strong_ohmic_heating",
    label: "Strong Ohmic Heating",
    description: "Measures whether ohmic heating Q_ohm is large.",
    measurementDependencies: ["transport.ohmic_heating"],
    evaluate: (measurements) => {
      const Q = m(measurements, "transport.ohmic_heating");
      return logistic(Q, 1e4, 1e-4); // threshold ~1e4
    },
  },
];

export const TransportCapabilityPlugin: CapabilityPlugin = {
  namespace: "transport_capability_library",
  capabilities: transportCaps,
};
