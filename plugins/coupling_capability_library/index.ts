// plugins/coupling_capability_library/index.ts

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
 * Coupling capabilities:
 * - thermo–kinematic
 * - thermo–radiation
 * - MHD fluid coupling
 * - radiation–MHD coupling
 * - transport–kinematic coupling
 *
 * These measure *interaction strength* between subsystems.
 */

const couplingCaps: Capability[] = [
  // Thermo–kinematic coupling: |∇v| * c_s
  {
    id: "cap.coupling.thermo_kinematic",
    label: "Thermo–Kinematic Coupling",
    description: "Measures coupling between thermal state and velocity gradients.",
    measurementDependencies: ["kin.grad_v_mag", "thermo.c_s"],
    evaluate: (measurements) => {
      const gradV = m(measurements, "kin.grad_v_mag");
      const cs = m(measurements, "thermo.c_s");
      const coupling = gradV * cs;
      return logistic(coupling, 1e10, 1e-10);
    },
  },

  // Thermo–radiation coupling: cooling rate * temperature
  {
    id: "cap.coupling.thermo_radiation",
    label: "Thermo–Radiation Coupling",
    description: "Measures coupling between thermal energy and radiative cooling.",
    measurementDependencies: ["rad.cooling", "thermo.T"],
    evaluate: (measurements) => {
      const L = m(measurements, "rad.cooling");
      const T = m(measurements, "thermo.T");
      const coupling = L * T;
      return logistic(coupling, 1e12, 1e-12);
    },
  },

  // MHD fluid coupling: |B|^2 / (ρ c_s^2)
  {
    id: "cap.coupling.mhd_fluid",
    label: "MHD–Fluid Coupling",
    description: "Measures magnetic-to-thermal pressure ratio (plasma beta inverse).",
    measurementDependencies: ["field.Bx", "field.By", "field.Bz", "field.rho", "thermo.c_s"],
    evaluate: (measurements) => {
      const Bx = m(measurements, "field.Bx");
      const By = m(measurements, "field.By");
      const Bz = m(measurements, "field.Bz");
      const rho = m(measurements, "field.rho");
      const cs = m(measurements, "thermo.c_s");

      const B2 = Bx*Bx + By*By + Bz*Bz;
      const denom = rho * cs * cs;
      const ratio = denom === 0 ? 0 : B2 / denom;

      return logistic(ratio, 1.0, 1.0); // threshold ~1
    },
  },

  // Radiation–MHD coupling: |F_r| * |B|
  {
    id: "cap.coupling.radiation_mhd",
    label: "Radiation–MHD Coupling",
    description: "Measures interaction strength between radiation flux and magnetic field.",
    measurementDependencies: ["rad.F_mag", "field.Bx", "field.By", "field.Bz"],
    evaluate: (measurements) => {
      const F = m(measurements, "rad.F_mag");
      const Bx = m(measurements, "field.Bx");
      const By = m(measurements, "field.By");
      const Bz = m(measurements, "field.Bz");

      const Bmag = Math.sqrt(Bx*Bx + By*By + Bz*Bz);
      const coupling = F * Bmag;

      return logistic(coupling, 1e8, 1e-8);
    },
  },

  // Transport–kinematic coupling: viscosity * |∇v|
  {
    id: "cap.coupling.transport_kinematic",
    label: "Transport–Kinematic Coupling",
    description: "Measures how strongly viscosity interacts with velocity gradients.",
    measurementDependencies: ["transport.viscosity", "kin.grad_v_mag"],
    evaluate: (measurements) => {
      const mu = m(measurements, "transport.viscosity");
      const gradV = m(measurements, "kin.grad_v_mag");
      const coupling = mu * gradV;
      return logistic(coupling, 1e6, 1e-6);
    },
  },
];

export const CouplingCapabilityPlugin: CapabilityPlugin = {
  namespace: "coupling_capability_library",
  capabilities: couplingCaps,
};
