// src/core/measurement-dag.ts

import {
  FieldState,
  MeasurementNode,
  MeasurementEvalContext,
  MeasurementPlugin,
} from "./types";

export interface MeasurementDagConfig {
  plugins: MeasurementPlugin[];
}

export class MeasurementDAG {
  private nodes: Map<string, MeasurementNode>;
  private adjacency: Map<string, string[]>;

  constructor(config: MeasurementDagConfig) {
    this.nodes = new Map();
    this.adjacency = new Map();

    for (const plugin of config.plugins) {
      for (const node of plugin.measurements) {
        if (this.nodes.has(node.id)) {
          throw new Error(`Duplicate measurement id: ${node.id}`);
        }
        this.nodes.set(node.id, node);
        this.adjacency.set(node.id, node.dependencies.slice());
      }
    }

    this.assertAcyclic();
  }

  private assertAcyclic() {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const visit = (id: string) => {
      if (stack.has(id)) {
        throw new Error(`Cycle detected in measurement DAG at ${id}`);
      }
      if (visited.has(id)) return;
      visited.add(id);
      stack.add(id);

      const deps = this.adjacency.get(id) ?? [];
      for (const dep of deps) {
        if (!this.nodes.has(dep)) {
          throw new Error(`Unknown dependency "${dep}" for measurement "${id}"`);
        }
        visit(dep);
      }

      stack.delete(id);
    };

    for (const id of this.nodes.keys()) {
      visit(id);
    }
  }

  evaluate(state: FieldState, targetIds?: string[]): Record<string, unknown> {
    const results: Record<string, unknown> = {};
    const evaluating = new Set<string>();

    const evalNode = (id: string) => {
      if (id in results) return results[id];
      if (evaluating.has(id)) {
        throw new Error(`Re‑entrant evaluation detected at measurement "${id}"`);
      }

      const node = this.nodes.get(id);
      if (!node) {
        throw new Error(`Unknown measurement id: ${id}`);
      }

      evaluating.add(id);

      for (const dep of node.dependencies) {
        evalNode(dep);
      }

      const ctx: MeasurementEvalContext = {
        state,
        measurements: results,
      };

      const value = node.evaluate(ctx);
      results[id] = value;

      evaluating.delete(id);
      return value;
    };

    if (targetIds && targetIds.length > 0) {
      for (const id of targetIds) {
        evalNode(id);
      }
    } else {
      for (const id of this.nodes.keys()) {
        evalNode(id);
      }
    }

    return results;
  }
}
