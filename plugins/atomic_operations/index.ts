// plugins/atomic_operations/index.ts

import {
  MeasurementNode,
  MeasurementPlugin,
  MeasurementEvalContext,
} from "../../src/core/types";

/**
 * Helper to read a scalar field from state.
 */
function field(ctx: MeasurementEvalContext, name: string): number {
  const v = ctx.state.fields[name];
  if (typeof v !== "number") {
    throw new Error(`Expected scalar field "${name}", got ${typeof v}`);
  }
  return v;
}

/**
 * Atomic operation nodes:
 * - identity(field)
 * - sum(a, b)
 * - difference(a, b)
 * - product(a, b)
 * - ratio(a, b)
 * - magnitude2(ax, ay, az)
 * - log10(x)
 * - abs(x)
 */

const atomicOperationNodes: MeasurementNode[] = [
  {
    id: "op.identity",
    label: "Identity",
    description: "Pass-through of a single scalar field.",
    dependencies: [],
    fieldDependencies: ["x"],
    tags: ["atomic", "operation"],
    evaluate: (ctx) => field(ctx, "x"),
  },
  {
    id: "op.sum",
    label: "Sum",
    description: "Sum of two scalar fields a + b.",
    dependencies: [],
    fieldDependencies: ["a", "b"],
    tags: ["atomic", "operation"],
    evaluate: (ctx) => field(ctx, "a") + field(ctx, "b"),
  },
  {
    id: "op.difference",
    label: "Difference",
    description: "Difference of two scalar fields a - b.",
    dependencies: [],
    fieldDependencies: ["a", "b"],
    tags: ["atomic", "operation"],
    evaluate: (ctx) => field(ctx, "a") - field(ctx, "b"),
  },
  {
    id: "op.product",
    label: "Product",
    description: "Product of two scalar fields a * b.",
    dependencies: [],
    fieldDependencies: ["a", "b"],
    tags: ["atomic", "operation"],
    evaluate: (ctx) => field(ctx, "a") * field(ctx, "b"),
  },
  {
    id: "op.ratio",
    label: "Ratio",
    description: "Ratio of two scalar fields a / b.",
    dependencies: [],
    fieldDependencies: ["a", "b"],
    tags: ["atomic", "operation"],
    evaluate: (ctx) => {
      const denom = field(ctx, "b");
      if (denom === 0) {
        return Number.POSITIVE_INFINITY;
      }
      return field(ctx, "a") / denom;
    },
  },
  {
    id: "op.magnitude2",
    label: "Squared Magnitude",
    description: "Squared magnitude of a 3D vector: ax^2 + ay^2 + az^2.",
    dependencies: [],
    fieldDependencies: ["ax", "ay", "az"],
    tags: ["atomic", "operation", "vector"],
    evaluate: (ctx) => {
      const ax = field(ctx, "ax");
      const ay = field(ctx, "ay");
      const az = field(ctx, "az");
      return ax * ax + ay * ay + az * az;
    },
  },
  {
    id: "op.log10",
    label: "Log10",
    description: "Base-10 logarithm of a scalar field.",
    dependencies: [],
    fieldDependencies: ["x"],
    tags: ["atomic", "operation", "nonlinear"],
    evaluate: (ctx) => {
      const x = field(ctx, "x");
      return Math.log10(x);
    },
  },
  {
    id: "op.abs",
    label: "Absolute Value",
    description: "Absolute value of a scalar field.",
    dependencies: [],
    fieldDependencies: ["x"],
    tags: ["atomic", "operation"],
    evaluate: (ctx) => Math.abs(field(ctx, "x")),
  },
];

export const AtomicOperationsPlugin: MeasurementPlugin = {
  namespace: "atomic_operations",
  measurements: atomicOperationNodes,
};
