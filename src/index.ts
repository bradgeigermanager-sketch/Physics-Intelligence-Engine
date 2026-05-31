// src/index.ts
import { MeasurementDag } from "./core/measurement-dag";
import { CapabilityEngine } from "./core/capability-engine";
import { RegimeClassifier } from "./core/regime-classifier";
import { RegimeTransitionDetector } from "./core/transition-detector";
import { RegimeTimelineEngine } from "./plugins/regime_timeline/engine";
import { RegimeExplanationEngine } from "./plugins/regime_explanations/engine";
import { ScenarioClassifier } from "./plugins/scenario_classification/scenario-classifier";

export class PhysicsIntelligencePack {
  private dag: MeasurementDag;
  private capEngine: CapabilityEngine;
  private regimeClassifier: RegimeClassifier;
  private transitionDetector: RegimeTransitionDetector;
  private timelineEngine: RegimeTimelineEngine;
  private explanationEngine: RegimeExplanationEngine;
  private scenarioClassifier: ScenarioClassifier;

  constructor(config?: any) {
    this.dag = new MeasurementDag();
    this.capEngine = new CapabilityEngine();
    this.regimeClassifier = new RegimeClassifier();
    this.transitionDetector = new RegimeTransitionDetector();
    this.timelineEngine = new RegimeTimelineEngine(this.transitionDetector);
    this.explanationEngine = new RegimeExplanationEngine();
    this.scenarioClassifier = new ScenarioClassifier();

    this.registerAllPlugins(config);
  }

  private registerAllPlugins(config?: any) {
    // measurements
    require("./plugins/thermodynamic_composites").default
      .registerMetrics(this.dag.metricRegistry, this.dag.measurementRegistry, config?.thermo);
    require("./plugins/transport_composites").default
      .registerMetrics(this.dag.metricRegistry, this.dag.measurementRegistry, config?.transport);
    require("./plugins/kinematic_composites").default
      .registerMetrics(this.dag.metricRegistry, this.dag.measurementRegistry);
    require("./plugins/radiation_composites").default
      .registerMetrics(this.dag.metricRegistry, this.dag.measurementRegistry, config?.radiation);

    // capabilities
    require("./plugins/thermodynamic_capability_library").default
      .registerCapabilities(this.capEngine.registry);
    require("./plugins/transport_capability_library").default
      .registerCapabilities(this.capEngine.registry);
    require("./plugins/kinematic_capability_library").default
      .registerCapabilities(this.capEngine.registry);
    require("./plugins/radiation_capability_library").default
      .registerCapabilities(this.capEngine.registry);
  }

  run(state: RawState): PipelineResult {
    // 1. metrics
    const metrics = this.dag.evaluate(state.fields);

    // 2. capabilities
    const capabilityProfile = this.capEngine.evaluate(metrics);

    // 3. regimes
    const regimeProfile = this.regimeClassifier.classify(capabilityProfile, state.timestamp);

    // 4. timeline + transitions
    this.timelineEngine.process(regimeProfile);
    const transitions = this.transitionDetector.getRecentTransitions();

    // 5. explanations
    const explanations = this.explanationEngine.explain(regimeProfile, transitions);

    // 6. scenarios
    const scenarios = this.scenarioClassifier.classify({
      regimeProfile,
      capabilityProfile,
      metrics,
      transitions
    });

    return {
      metrics,
      capabilityProfile,
      regimeProfile,
      explanations,
      scenarios
    };
  }

  finalizeTimeline() {
    return this.timelineEngine.finalize();
  }
}
