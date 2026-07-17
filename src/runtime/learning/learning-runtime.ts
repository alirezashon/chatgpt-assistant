import { ExperimentationPlatform } from './experimentation-platform';
import { ExplainabilityEngine } from './explainability-engine';
import { KnowledgeQualityEngine } from './knowledge-quality-engine';
import { LearningDeploymentManager } from './deployment-manager';
import { LearningPipeline } from './learning-pipeline';
import { LearningPrivacyManager } from './privacy-manager';
import { LearningStore } from './learning-store';
import { MemoryEvolutionEngine } from './memory-evolution-engine';
import { ModelRoutingLearner } from './model-routing-learner';
import { PersonalizationEngine } from './personalization-engine';
import { PolicyOptimizer } from './policy-optimizer';
import { PromptOptimizer } from './prompt-optimizer';
import { ToolSelectionLearner } from './tool-selection-learner';
import { WorkflowOptimizer } from './workflow-optimizer';
import type { LearningRecommendation, LearningSignal } from './learning-types';

/** Learning runtime dependencies. */
export interface LearningRuntimeDependencies {
  readonly store?: LearningStore;
}

/** Autonomous learning and continuous improvement runtime. */
export class LearningRuntime {
  public readonly deployments: LearningDeploymentManager;
  public readonly experiments: ExperimentationPlatform;
  public readonly explainability: ExplainabilityEngine;
  public readonly knowledge: KnowledgeQualityEngine;
  public readonly memory: MemoryEvolutionEngine;
  public readonly modelRouting: ModelRoutingLearner;
  public readonly personalization: PersonalizationEngine;
  public readonly pipeline: LearningPipeline;
  public readonly policy: PolicyOptimizer;
  public readonly privacy: LearningPrivacyManager;
  public readonly prompts: PromptOptimizer;
  public readonly store: LearningStore;
  public readonly tools: ToolSelectionLearner;
  public readonly workflows: WorkflowOptimizer;

  public constructor(dependencies: LearningRuntimeDependencies = {}) {
    this.store = dependencies.store ?? new LearningStore();
    this.privacy = new LearningPrivacyManager(this.store);
    this.pipeline = new LearningPipeline(this.store, this.privacy);
    this.personalization = new PersonalizationEngine(this.store);
    this.workflows = new WorkflowOptimizer(this.store);
    this.prompts = new PromptOptimizer(this.store);
    this.modelRouting = new ModelRoutingLearner(this.store);
    this.tools = new ToolSelectionLearner(this.store);
    this.knowledge = new KnowledgeQualityEngine(this.store);
    this.memory = new MemoryEvolutionEngine(this.store);
    this.policy = new PolicyOptimizer(this.store);
    this.experiments = new ExperimentationPlatform(this.store);
    this.deployments = new LearningDeploymentManager(this.store);
    this.explainability = new ExplainabilityEngine(this.store);
  }

  public collect(signal: LearningSignal) {
    return this.pipeline.collect(signal);
  }

  public recommend(subjectId: string): readonly LearningRecommendation[] {
    return [
      ...this.personalization.recommend(subjectId),
      ...this.workflows.recommend(subjectId),
      ...this.prompts.recommend(subjectId),
      ...this.modelRouting.recommend(subjectId),
      ...this.tools.recommend(subjectId),
      ...this.knowledge.recommend(subjectId),
      ...this.memory.recommend(subjectId),
      ...this.policy.recommend(subjectId),
    ];
  }
}
