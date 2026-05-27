// plugins/radiation_composites/index.ts

import {
  MeasurementNode,
  MeasurementPlugin,
  MeasurementEvalContext,
} from "../../src/core/types";

/**
 * Physical constants (normalized or real units)
 */
const C = 3e10;                 // speed of light (cm/s)
const SIGMA_SB = 5.670374e-5;   // Stefan–Boltzmann constant
const A_RAD = 4 * SIGMA_SB / C; // radiation constant a = 4σ/c

/**
 * Helpers
 */
function f(ctx: MeasurementEvalContext, name: string): number {
  const v = ctx.state.fields[name];
  if (typeof v !== "number") {
    throw new Error(`Expected scalar field "${name}"`);
  }
  return v;
}

function vec(ctx: MeasurementEvalContext, name: string): { x: number; y: number; z: number } {
  const v = ctx.state.fields[name];
  if (!v || typeof v !== "object") {
    throw new Error(`Expected vector field "${name}"`);
  }
  const { x, y, z } = v as any;
  if ([x, y, z].some((c) => typeof c !== "number")) {
    throw new Error(`Invalid vector components for "${name}"`);
  }
  return { x, y, z };
}

function m(ctx: MeasurementEvalContext, id: string): number {
  const v = ctx.measurements[id];
  if (typeof v !== "number") {
    throw new Error(`Expected measurement "${id}"`);
  }
  return v;
}

/**
 * Radiation composite nodes:
 * - radiation energy density
 * - radiation pressure
 * - radiation flux magnitude
 * - optical depth
 * - cooling rate
 * - Eddington factor
 */

const radNodes: MeasurementNode[] = [
  // Radiation energy density (raw)
  {
    id: "rad.E",
    label: "Radiation Energy Density",
    description: "Radiation energy density E_r",
    dependencies: [],
    fieldDependencies: ["Er"],
    tags: ["radiation", "composite"],
    evaluate: (ctx) => f(ctx, "Er"),
  },

  // Radiation pressure: P_rad = E_r / 3
  {
    id: "rad.P",
    label: "Radiation Pressure",
    description: "P_rad = E_r / 3",
    dependencies: ["rad.E"],
    fieldDependencies: [],
    tags: ["radiation", "composite"],
    evaluate: (ctx) => m(ctx, "rad.E") / 3,
  },

  // Radiation flux magnitude |F_r|
  {
    id: "rad.F_mag",
    label: "Radiation Flux Magnitude",
    description: "|F_r| = sqrt(Fx^2 + Fy^2 + Fz^2)",
    dependencies: [],
    fieldDependencies: ["Fr"],
    tags: ["radiation", "composite"],
    evaluate: (ctx) => {
      const { x, y, z } = vec(ctx, "Fr");
      return Math.sqrt(x * x + y * y + z * z);
    },
  },

  // Optical depth τ = κ ρ L
  // Here L is a placeholder path length (user can override)
  {
    id: "rad.tau",
    label: "Optical Depth",
    description: "τ = κ ρ L (L = 1 by default)",
    dependencies: [],
    fieldDependencies: ["kappa", "rho"],
    tags: ["radiation", "composite"],
    evaluate: (ctx) => {
      const kappa = f(ctx, "kappa");
      const rho = f(ctx, "rho");
      const L = 1.0; // placeholder
      return kappa * rho * L;
    },
  },

  // Cooling rate: Λ = 4 σ T^4 κ ρ
  {
    id: "rad.cooling",
    label: "Radiative Cooling Rate",
    description: "Λ = 4 σ T^4 κ ρ",
    dependencies: ["thermo.T"],
    fieldDependencies: ["kappa", "rho"],
    tags: ["radiation", "composite"],
    evaluate: (ctx) => {
      const T = m(ctx, "thermo.T");
      const kappa = f(ctx, "kappa");
      const rho = f(ctx, "rho");
      return 4 * SIGMA_SB * Math.pow(T, 4) * kappa * rho;
    },
  },

  // Eddington factor f = P_rad / E_r
  {
    id: "rad.eddington_factor",
    label: "Eddington Factor",
    description: "f = P_rad / E_r",
    dependencies: ["rad.P", "rad.E"],
    fieldDependencies: [],
    tags: ["radiation", "composite"],
    evaluate: (ctx) => {
      const P = m(ctx, "rad.P");
      const E = m(ctx, "rad.E");
      if (E === 0) return 0;
      return P / E;
    },
  },
];

export const RadiationCompositesPlugin: MeasurementPlugin = {
  namespace: "radiation_composites",
  measurements: radNodes,
};
