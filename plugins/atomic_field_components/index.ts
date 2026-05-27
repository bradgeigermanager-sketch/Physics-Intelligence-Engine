// plugins/atomic_field_components/index.ts

import {
  MeasurementNode,
  MeasurementPlugin,
  MeasurementEvalContext,
} from "../../src/core/types";

/**
 * Helper to read a scalar field from state.
 */
function scalar(ctx: MeasurementEvalContext, name: string): number {
  const v = ctx.state.fields[name];
  if (typeof v !== "number") {
    throw new Error(`Expected scalar field "${name}", got ${typeof v}`);
  }
  return v;
}

/**
 * Helper to read a vector field component.
 */
function vectorComponent(
  ctx: MeasurementEvalContext,
  name: string,
  component: "x" | "y" | "z"
): number {
  const v = ctx.state.fields[name];
  if (!v || typeof v !== "object") {
    throw new Error(`Expected vector field "${name}"`);
  }
  const c = (v as any)[component];
  if (typeof c !== "number") {
    throw new Error(`Expected component "${component}" of vector "${name}"`);
  }
  return c;
}

/**
 * Atomic field component nodes:
 * - scalar.<name>
 * - vector.<name>.x
 * - vector.<name>.y
 * - vector.<name>.z
 *
 * These are intentionally generic: the simulation can provide any
 * field names it wants, and the plugin exposes them as measurements.
 */

const atomicFieldNodes: MeasurementNode[] = [
  // Density
  {
    id: "field.rho",
    label: "Density",
    description: "Mass density ρ",
    dependencies: [],
    fieldDependencies: ["rho"],
    tags: ["atomic", "field", "scalar"],
    evaluate: (ctx) => scalar(ctx, "rho"),
  },

  // Pressure
  {
    id: "field.p",
    label: "Pressure",
    description: "Thermodynamic pressure p",
    dependencies: [],
    fieldDependencies: ["p"],
    tags: ["atomic", "field", "scalar"],
    evaluate: (ctx) => scalar(ctx, "p"),
  },

  // Temperature (raw, if provided)
  {
    id: "field.T",
    label: "Temperature",
    description: "Raw temperature field (if provided)",
    dependencies: [],
    fieldDependencies: ["T"],
    tags: ["atomic", "field", "scalar"],
    evaluate: (ctx) => scalar(ctx, "T"),
  },

  // Velocity components
  {
    id: "field.vx",
    label: "Velocity X",
    description: "Velocity component v_x",
    dependencies: [],
    fieldDependencies: ["v"],
    tags: ["atomic", "field", "vector"],
    evaluate: (ctx) => vectorComponent(ctx, "v", "x"),
  },
  {
    id: "field.vy",
    label: "Velocity Y",
    description: "Velocity component v_y",
    dependencies: [],
    fieldDependencies: ["v"],
    tags: ["atomic", "field", "vector"],
    evaluate: (ctx) => vectorComponent(ctx, "v", "y"),
  },
  {
    id: "field.vz",
    label: "Velocity Z",
    description: "Velocity component v_z",
    dependencies: [],
    fieldDependencies: ["v"],
    tags: ["atomic", "field", "vector"],
    evaluate: (ctx) => vectorComponent(ctx, "v", "z"),
  },

  // Magnetic field components (if MHD)
  {
    id: "field.Bx",
    label: "Magnetic Field X",
    description: "Magnetic field component B_x",
    dependencies: [],
    fieldDependencies: ["B"],
    tags: ["atomic", "field", "vector", "mhd"],
    evaluate: (ctx) => vectorComponent(ctx, "B", "x"),
  },
  {
    id: "field.By",
    label: "Magnetic Field Y",
    description: "Magnetic field component B_y",
    dependencies: [],
    fieldDependencies: ["B"],
    tags: ["atomic", "field", "vector", "mhd"],
    evaluate: (ctx) => vectorComponent(ctx, "B", "y"),
  },
  {
    id: "field.Bz",
    label: "Magnetic Field Z",
    description: "Magnetic field component B_z",
    dependencies: [],
    fieldDependencies: ["B"],
    tags: ["atomic", "field", "vector", "mhd"],
    evaluate: (ctx) => vectorComponent(ctx, "B", "z"),
  },
];

export const AtomicFieldComponentsPlugin: MeasurementPlugin = {
  namespace: "atomic_field_components",
  measurements: atomicFieldNodes,
};
