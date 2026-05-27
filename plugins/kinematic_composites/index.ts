// plugins/kinematic_composites/index.ts

import {
  MeasurementNode,
  MeasurementPlugin,
  MeasurementEvalContext,
} from "../../src/core/types";

/**
 * Helper to read a scalar field.
 */
function f(ctx: MeasurementEvalContext, name: string): number {
  const v = ctx.state.fields[name];
  if (typeof v !== "number") {
    throw new Error(`Expected scalar field "${name}"`);
  }
  return v;
}

/**
 * Kinematic composite nodes:
 * - divergence
 * - vorticity magnitude
 * - shear magnitude
 * - strain rate magnitude
 * - velocity gradient magnitude
 *
 * These use placeholder gradient fields:
 *   grad_vx_x, grad_vx_y, grad_vx_z
 *   grad_vy_x, grad_vy_y, grad_vy_z
 *   grad_vz_x, grad_vz_y, grad_vz_z
 */

const kinNodes: MeasurementNode[] = [
  // Divergence: ∇·v = dvx/dx + dvy/dy + dvz/dz
  {
    id: "kin.divergence",
    label: "Velocity Divergence",
    description: "∇·v = dvx/dx + dvy/dy + dvz/dz",
    dependencies: [],
    fieldDependencies: ["grad_vx_x", "grad_vy_y", "grad_vz_z"],
    tags: ["kinematic", "composite"],
    evaluate: (ctx) =>
      f(ctx, "grad_vx_x") +
      f(ctx, "grad_vy_y") +
      f(ctx, "grad_vz_z"),
  },

  // Vorticity magnitude: |ω| = |∇×v|
  {
    id: "kin.vorticity_mag",
    label: "Vorticity Magnitude",
    description: "|ω| = |∇×v|",
    dependencies: [],
    fieldDependencies: [
      "grad_vz_y", "grad_vy_z",
      "grad_vx_z", "grad_vz_x",
      "grad_vy_x", "grad_vx_y",
    ],
    tags: ["kinematic", "composite"],
    evaluate: (ctx) => {
      const wx = f(ctx, "grad_vz_y") - f(ctx, "grad_vy_z");
      const wy = f(ctx, "grad_vx_z") - f(ctx, "grad_vz_x");
      const wz = f(ctx, "grad_vy_x") - f(ctx, "grad_vx_y");
      return Math.sqrt(wx * wx + wy * wy + wz * wz);
    },
  },

  // Shear magnitude: |S| = sqrt(2 S_ij S_ij)
  {
    id: "kin.shear_mag",
    label: "Shear Magnitude",
    description: "Shear tensor magnitude |S| = sqrt(2 S_ij S_ij)",
    dependencies: [],
    fieldDependencies: [
      "grad_vx_y", "grad_vx_z",
      "grad_vy_x", "grad_vy_z",
      "grad_vz_x", "grad_vz_y",
    ],
    tags: ["kinematic", "composite"],
    evaluate: (ctx) => {
      const dvx_dy = f(ctx, "grad_vx_y");
      const dvx_dz = f(ctx, "grad_vx_z");
      const dvy_dx = f(ctx, "grad_vy_x");
      const dvy_dz = f(ctx, "grad_vy_z");
      const dvz_dx = f(ctx, "grad_vz_x");
      const dvz_dy = f(ctx, "grad_vz_y");

      const Sxy = 0.5 * (dvx_dy + dvy_dx);
      const Sxz = 0.5 * (dvx_dz + dvz_dx);
      const Syz = 0.5 * (dvy_dz + dvz_dy);

      return Math.sqrt(2 * (Sxy * Sxy + Sxz * Sxz + Syz * Syz));
    },
  },

  // Strain rate magnitude: |D| = sqrt(2 D_ij D_ij)
  {
    id: "kin.strain_rate_mag",
    label: "Strain Rate Magnitude",
    description: "Strain rate tensor magnitude |D| = sqrt(2 D_ij D_ij)",
    dependencies: ["kin.divergence"],
    fieldDependencies: [
      "grad_vx_x", "grad_vy_y", "grad_vz_z",
      "grad_vx_y", "grad_vx_z",
      "grad_vy_x", "grad_vy_z",
      "grad_vz_x", "grad_vz_y",
    ],
    tags: ["kinematic", "composite"],
    evaluate: (ctx) => {
      const div = ctx.measurements["kin.divergence"] as number;

      const dvx_dx = f(ctx, "grad_vx_x");
      const dvy_dy = f(ctx, "grad_vy_y");
      const dvz_dz = f(ctx, "grad_vz_z");

      const dvx_dy = f(ctx, "grad_vx_y");
      const dvx_dz = f(ctx, "grad_vx_z");
      const dvy_dx = f(ctx, "grad_vy_x");
      const dvy_dz = f(ctx, "grad_vy_z");
      const dvz_dx = f(ctx, "grad_vz_x");
      const dvz_dy = f(ctx, "grad_vz_y");

      const Dxx = dvx_dx - div / 3;
      const Dyy = dvy_dy - div / 3;
      const Dzz = dvz_dz - div / 3;

      const Dxy = 0.5 * (dvx_dy + dvy_dx);
      const Dxz = 0.5 * (dvx_dz + dvz_dx);
      const Dyz = 0.5 * (dvy_dz + dvz_dy);

      return Math.sqrt(
        2 *
          (Dxx * Dxx +
           Dyy * Dyy +
           Dzz * Dzz +
           2 * (Dxy * Dxy + Dxz * Dxz + Dyz * Dyz))
      );
    },
  },

  // Velocity gradient magnitude: |∇v|
  {
    id: "kin.grad_v_mag",
    label: "Velocity Gradient Magnitude",
    description: "|∇v| = sqrt(sum of squared partial derivatives)",
    dependencies: [],
    fieldDependencies: [
      "grad_vx_x", "grad_vx_y", "grad_vx_z",
      "grad_vy_x", "grad_vy_y", "grad_vy_z",
      "grad_vz_x", "grad_vz_y", "grad_vz_z",
    ],
    tags: ["kinematic", "composite"],
    evaluate: (ctx) => {
      const names = [
        "grad_vx_x", "grad_vx_y", "grad_vx_z",
        "grad_vy_x", "grad_vy_y", "grad_vy_z",
        "grad_vz_x", "grad_vz_y", "grad_vz_z",
      ];
      let sum = 0;
      for (const n of names) {
        const g = f(ctx, n);
        sum += g * g;
      }
      return Math.sqrt(sum);
    },
  },
];

export const KinematicCompositesPlugin: MeasurementPlugin = {
  namespace: "kinematic_composites",
  measurements: kinNodes,
};
