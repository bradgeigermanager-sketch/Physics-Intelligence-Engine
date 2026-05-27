// plugins/transport_composites/index.ts

import {
  MeasurementNode,
  MeasurementPlugin,
  MeasurementEvalContext,
} from "../../src/core/types";

/**
 * Physical constants (placeholder values; can be externalized)
 */
const MU_0 = 1.0;     // magnetic permeability (normalized)
const KAPPA = 1.0;    // thermal conductivity coefficient
const ETA = 1.0;      // resistivity coefficient
const NU = 1.0;       // kinematic viscosity coefficient

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

function m(ctx: MeasurementEvalContext, id: string): number {
  const v = ctx.measurements[id];
  if (typeof v !== "number") {
    throw new Error(`Expected measurement "${id}"`);
  }
  return v;
}

/**
 * Transport composite nodes:
 * - viscosity (ν ρ)
 * - resistive diffusion (η)
 * - conduction flux (−κ ∇T) — simplified magnitude
 * - viscous heating (ν |∇v|²)
 * - ohmic heating (η |J|²)
 *
 * NOTE:
 *   This pack assumes the existence of:
 *     - field.rho
 *     - field.vx, field.vy, field.vz
 *     - thermo.T
 *     - kinematic.grad_v_mag (from kinematic composites)
 *     - kinematic.current_density_mag (from radiation/MHD composites)
 */

const transportNodes: MeasurementNode[] = [
  // Dynamic viscosity μ = ν ρ
  {
    id: "transport.viscosity",
    label: "Dynamic Viscosity",
    description: "μ = ν ρ",
    dependencies: [],
    fieldDependencies: ["rho"],
    tags: ["transport", "composite"],
    evaluate: (ctx) => {
      const rho = f(ctx, "rho");
      return NU * rho;
    },
  },

  // Resistive diffusion coefficient η (constant for now)
  {
    id: "transport.resistive_diffusion",
    label: "Resistive Diffusion",
    description: "η (constant or field-dependent)",
    dependencies: [],
    fieldDependencies: [],
    tags: ["transport", "composite", "mhd"],
    evaluate: () => ETA,
  },

  // Conduction flux magnitude |q| = κ |∇T|
  // Here we approximate |∇T| using a placeholder field "grad_T_mag"
  {
    id: "transport.conduction_flux",
    label: "Conduction Flux Magnitude",
    description: "|q| = κ |∇T| (magnitude only)",
    dependencies: [],
    fieldDependencies: ["grad_T_mag"],
    tags: ["transport", "composite"],
    evaluate: (ctx) => {
      const gradT = f(ctx, "grad_T_mag");
      return KAPPA * gradT;
    },
  },

  // Viscous heating: Q_visc = μ |∇v|²
  {
    id: "transport.viscous_heating",
    label: "Viscous Heating",
    description: "Q_visc = μ |∇v|²",
    dependencies: ["transport.viscosity"],
    fieldDependencies: ["grad_v_mag"],
    tags: ["transport", "composite"],
    evaluate: (ctx) => {
      const mu = m(ctx, "transport.viscosity");
      const gradV = f(ctx, "grad_v_mag");
      return mu * gradV * gradV;
    },
  },

  // Ohmic heating: Q_ohm = η |J|²
  {
    id: "transport.ohmic_heating",
    label: "Ohmic Heating",
    description: "Q_ohm = η |J|²",
    dependencies: ["transport.resistive_diffusion"],
    fieldDependencies: ["current_density_mag"],
    tags: ["transport", "composite", "mhd"],
    evaluate: (ctx) => {
      const eta = m(ctx, "transport.resistive_diffusion");
      const J = f(ctx, "current_density_mag");
      return eta * J * J;
    },
  },
];

export const TransportCompositesPlugin: MeasurementPlugin = {
  namespace: "transport_composites",
  measurements: transportNodes,
};
