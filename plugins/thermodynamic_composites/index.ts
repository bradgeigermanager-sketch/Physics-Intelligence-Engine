// plugins/thermodynamic_composites/index.ts

import {
  MeasurementNode,
  MeasurementPlugin,
  MeasurementEvalContext,
} from "../../src/core/types";

/**
 * Physical constants (can be externalized later)
 */
const GAMMA = 5 / 3;      // ideal monoatomic gas
const KB = 1.380649e-23;  // Boltzmann constant
const MU = 1.0;           // mean molecular weight (normalized units)

/**
 * Helpers
 */
function m(ctx: MeasurementEvalContext, id: string): number {
  const v = ctx.measurements[id];
  if (typeof v !== "number") {
    throw new Error(`Expected measurement "${id}" to be a number`);
  }
  return v;
}

function f(ctx: MeasurementEvalContext, name: string): number {
  const v = ctx.state.fields[name];
  if (typeof v !== "number") {
    throw new Error(`Expected scalar field "${name}"`);
  }
  return v;
}

/**
 * Thermodynamic composite nodes:
 * - Temperature (EOS if raw T missing)
 * - Specific internal energy
 * - Enthalpy
 * - Entropy proxy
 * - Sound speed
 */

const thermoNodes: MeasurementNode[] = [
  // Temperature (EOS-based if raw T not provided)
  {
    id: "thermo.T",
    label: "Temperature",
    description: "Temperature from raw field or EOS p = rho * k_B * T / mu",
    dependencies: [],
    fieldDependencies: ["p", "rho", "T"],
    tags: ["thermodynamic", "composite"],
    evaluate: (ctx) => {
      const rawT = ctx.state.fields["T"];
      if (typeof rawT === "number") return rawT;
      const p = f(ctx, "p");
      const rho = f(ctx, "rho");
      return (p * MU) / (rho * KB);
    },
  },

  // Specific internal energy: e = p / [(gamma - 1) * rho]
  {
    id: "thermo.e_int",
    label: "Specific Internal Energy",
    description: "e = p / [(γ - 1) ρ]",
    dependencies: [],
    fieldDependencies: ["p", "rho"],
    tags: ["thermodynamic", "composite"],
    evaluate: (ctx) => {
      const p = f(ctx, "p");
      const rho = f(ctx, "rho");
      return p / ((GAMMA - 1) * rho);
    },
  },

  // Enthalpy: h = e + p / rho
  {
    id: "thermo.h",
    label: "Enthalpy",
    description: "h = e + p / ρ",
    dependencies: ["thermo.e_int"],
    fieldDependencies: ["p", "rho"],
    tags: ["thermodynamic", "composite"],
    evaluate: (ctx) => {
      const e = m(ctx, "thermo.e_int");
      const p = f(ctx, "p");
      const rho = f(ctx, "rho");
      return e + p / rho;
    },
  },

  // Entropy proxy: S ∝ ln(p / rho^γ)
  {
    id: "thermo.S_proxy",
    label: "Entropy Proxy",
    description: "S ∝ ln(p / ρ^γ)",
    dependencies: [],
    fieldDependencies: ["p", "rho"],
    tags: ["thermodynamic", "composite"],
    evaluate: (ctx) => {
      const p = f(ctx, "p");
      const rho = f(ctx, "rho");
      return Math.log(p / Math.pow(rho, GAMMA));
    },
  },

  // Sound speed: c_s = sqrt(γ p / rho)
  {
    id: "thermo.c_s",
    label: "Sound Speed",
    description: "c_s = sqrt(γ p / ρ)",
    dependencies: [],
    fieldDependencies: ["p", "rho"],
    tags: ["thermodynamic", "composite"],
    evaluate: (ctx) => {
      const p = f(ctx, "p");
      const rho = f(ctx, "rho");
      return Math.sqrt((GAMMA * p) / rho);
    },
  },
];

export const ThermodynamicCompositesPlugin: MeasurementPlugin = {
  namespace: "thermodynamic_composites",
  measurements: thermoNodes,
};
