/**
 * DYNAMIC ORCHESTRATION ENGINE
 *
 * Implements evolving orchestration with reinforcement learning-based routing.
 * Replaces static DAG with adaptive agent selection based on historical performance.
 */

import { AgentTask, AgentCapability, AgentContext } from '../types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ExecutionContext {
  prompt: string;
  entropy: number;
  historyLength: number;
  completedTasks: AgentTask[];
  availableAgents: AgentCapability[];
  budget: number; // Remaining token budget
}

interface AgentSelection {
  capability: AgentCapability;
  role: string;
  confidence: number;
  estimatedCost: number;
  reasoning: string;
}

interface RoutingPolicy {
  explorationRate: number; // Epsilon for epsilon-greedy
  utilityWeights: {
    historicalSuccess: number;
    capabilityMatch: number;
    costEfficiency: number;
  };
  learningRate: number;
}

interface RoutePerformance {
  capability: AgentCapability;
  successRate: number;
  avgTokens: number;
  avgLatency: number;
  sampleCount: number;
  lastUpdated: number;
}

// ============================================================================
// DYNAMIC ORCHESTRATOR
// ============================================================================

export class DynamicOrchestrator {
  private routingHistory: Map<AgentCapability, RoutePerformance>;
  private policy: RoutingPolicy;
  private executionLog: ExecutionRecord[] = [];

  constructor(policy?: Partial<RoutingPolicy>) {
    this.policy = {
      explorationRate: 0.1,
      utilityWeights: {
        historicalSuccess: 0.4,
        capabilityMatch: 0.4,
        costEfficiency: 0.2
      },
      learningRate: 0.2,
      ...policy
    };

    this.routingHistory = this.initializeRouting();
  }

  // ============================================================================
  // MAIN ORCHESTRATION
  // ============================================================================

  /**
   * Dynamically selects next agent based on context and learned performance
   */
  async selectNextAgent(context: ExecutionContext): Promise<AgentSelection> {
    const candidates = this.getEligibleCapabilities(context);

    // Epsilon-greedy exploration
    if (Math.random() < this.policy.explorationRate) {
      return this.explore(candidates, context);
    }

    // Exploit best known route
    return this.exploit(candidates, context);
  }

  /**
   * Updates routing policy based on execution results
   */
  updateFromExecution(
    selection: AgentSelection,
    result: {
      success: boolean;
      tokensUsed: number;
      latencyMs: number;
      quality: number;
    }
  ): void {
    const perf = this.routingHistory.get(selection.capability);
    if (!perf) return;

    const alpha = this.policy.learningRate;

    // Exponential moving average updates
    perf.successRate = perf.successRate * (1 - alpha) + (result.success ? 1 : 0) * alpha;
    perf.avgTokens = perf.avgTokens * (1 - alpha) + result.tokensUsed * alpha;
    perf.avgLatency = perf.avgLatency * (1 - alpha) + result.latencyMs * alpha;
    perf.sampleCount++;
    perf.lastUpdated = Date.now();

    // Log for analysis
    this.executionLog.push({
      timestamp: Date.now(),
      selection,
      result,
      contextEntropy: 0 // Would be passed from context
    });
  }

  /**
   * Generates complete execution plan with dynamic branching
   */
  async planExecution(
    prompt: string,
    maxAgents: number = 5,
    budget: number = 100000
  ): Promise<DynamicExecutionPlan> {
    const plan: DynamicExecutionPlan = {
      stages: [],
      branchPoints: [],
      fallbackStrategies: [],
      estimatedCost: 0
    };

    let context: ExecutionContext = {
      prompt,
      entropy: this.calculatePromptEntropy(prompt),
      historyLength: 0,
      completedTasks: [],
      availableAgents: Object.values(AgentCapability),
      budget
    };

    // Build plan stage by stage
    for (let stage = 0; stage < maxAgents; stage++) {
      const selection = await this.selectNextAgent(context);

      plan.stages.push({
        stageId: stage,
        agent: selection,
        dependencies: this.identifyDependencies(plan.stages),
        condition: this.createExecutionCondition(context)
      });

      plan.estimatedCost += selection.estimatedCost;

      // Check if we should continue
      if (this.shouldTerminate(context, plan)) {
        break;
      }

      // Update context for next stage
      context = this.projectNextContext(context, selection);
    }

    // Add fallback strategies for each stage
    plan.fallbackStrategies = this.generateFallbacks(plan);

    return plan;
  }

  // ============================================================================
  // EXPLORATION & EXPLOITATION
  // ============================================================================

  private explore(
    candidates: AgentCapability[],
    context: ExecutionContext
  ): AgentSelection {
    // Random selection for exploration
    const capability = candidates[Math.floor(Math.random() * candidates.length)];

    return {
      capability,
      role: this.generateRoleName(capability, context),
      confidence: 0.5, // Low confidence for exploration
      estimatedCost: this.estimateCost(capability, context),
      reasoning: `Exploration: Testing ${capability} capability`
    };
  }

  private exploit(
    candidates: AgentCapability[],
    context: ExecutionContext
  ): AgentSelection {
    // Calculate utility for each candidate
    const scores = candidates.map(capability => ({
      capability,
      utility: this.calculateUtility(capability, context)
    }));

    // Select best utility
    const best = scores.reduce((a, b) => a.utility > b.utility ? a : b);

    const perf = this.routingHistory.get(best.capability)!;

    return {
      capability: best.capability,
      role: this.generateRoleName(best.capability, context),
      confidence: perf.successRate,
      estimatedCost: this.estimateCost(best.capability, context),
      reasoning: `Exploitation: ${best.capability} has ${(perf.successRate * 100).toFixed(1)}% success rate`
    };
  }

  // ============================================================================
  // UTILITY CALCULATION
  // ============================================================================

  private calculateUtility(
    capability: AgentCapability,
    context: ExecutionContext
  ): number {
    const perf = this.routingHistory.get(capability);
    if (!perf) return 0.5; // Neutral utility for unknown

    const weights = this.policy.utilityWeights;

    // Historical success (with confidence decay for small samples)
    const confidenceFactor = Math.min(perf.sampleCount / 20, 1.0);
    const historicalScore = perf.successRate * confidenceFactor + 0.5 * (1 - confidenceFactor);

    // Capability match (how well does this capability fit the task?)
    const matchScore = this.computeCapabilityMatch(capability, context);

    // Cost efficiency (prefer cheaper agents when possible)
    const efficiency = 1 / (1 + perf.avgTokens / 1000);

    // Weighted combination
    const utility =
      historicalScore * weights.historicalSuccess +
      matchScore * weights.capabilityMatch +
      efficiency * weights.costEfficiency;

    return utility;
  }

  private computeCapabilityMatch(
    capability: AgentCapability,
    context: ExecutionContext
  ): number {
    // High entropy tasks need ANALYSIS or CODING
    if (context.entropy > 0.7) {
      if (capability === AgentCapability.ANALYSIS || capability === AgentCapability.CODING) {
        return 1.0;
      }
      return 0.3;
    }

    // Medium entropy can use RESEARCH
    if (context.entropy > 0.4) {
      if (capability === AgentCapability.RESEARCH) return 0.9;
      if (capability === AgentCapability.ANALYSIS) return 0.7;
      return 0.5;
    }

    // Low entropy uses FAST_TASK
    if (capability === AgentCapability.FAST_TASK) return 1.0;
    return 0.6;
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private initializeRouting(): Map<AgentCapability, RoutePerformance> {
    const map = new Map<AgentCapability, RoutePerformance>();

    Object.values(AgentCapability).forEach(cap => {
      map.set(cap, {
        capability: cap,
        successRate: 0.5, // Start neutral
        avgTokens: 1000,
        avgLatency: 5000,
        sampleCount: 0,
        lastUpdated: Date.now()
      });
    });

    return map;
  }

  private getEligibleCapabilities(context: ExecutionContext): AgentCapability[] {
    // Filter based on budget and context
    return context.availableAgents.filter(cap => {
      const perf = this.routingHistory.get(cap);
      if (!perf) return true;

      // Check if we have budget for this capability
      return perf.avgTokens < context.budget;
    });
  }

  private calculatePromptEntropy(prompt: string): number {
    // Simplified entropy calculation
    const length = Math.min(prompt.length / 500, 1.0);
    const keywords = ['analyze', 'compare', 'code', 'research', 'evaluate'];
    const keywordScore = keywords.filter(k => prompt.toLowerCase().includes(k)).length * 0.15;

    return Math.min(length * 0.5 + keywordScore, 1.0);
  }

  private estimateCost(capability: AgentCapability, context: ExecutionContext): number {
    const perf = this.routingHistory.get(capability);
    if (!perf) {
      // Default estimates
      const defaults: Record<AgentCapability, number> = {
        [AgentCapability.FAST_TASK]: 100,
        [AgentCapability.RESEARCH]: 2000,
        [AgentCapability.ANALYSIS]: 4000,
        [AgentCapability.CODING]: 8000,
        [AgentCapability.CREATIVE]: 3000
      };
      return defaults[capability];
    }

    return perf.avgTokens;
  }

  private generateRoleName(capability: AgentCapability, context: ExecutionContext): string {
    const roles: Record<AgentCapability, string[]> = {
      [AgentCapability.FAST_TASK]: ['Quick Processor', 'Rapid Executor', 'Fast Handler'],
      [AgentCapability.RESEARCH]: ['Research Analyst', 'Information Gatherer', 'Data Collector'],
      [AgentCapability.ANALYSIS]: ['Deep Analyzer', 'Strategic Thinker', 'Critical Evaluator'],
      [AgentCapability.CODING]: ['Software Engineer', 'Code Architect', 'Technical Developer'],
      [AgentCapability.CREATIVE]: ['Creative Writer', 'Content Designer', 'Creative Strategist']
    };

    const options = roles[capability];
    return options[Math.floor(Math.random() * options.length)];
  }

  private identifyDependencies(stages: ExecutionStage[]): string[] {
    // Last stage is always a dependency (sequential for now)
    if (stages.length === 0) return [];
    return [stages[stages.length - 1].stageId.toString()];
  }

  private createExecutionCondition(context: ExecutionContext): ExecutionCondition {
    return {
      type: 'ALWAYS',
      threshold: 0
    };
  }

  private shouldTerminate(context: ExecutionContext, plan: DynamicExecutionPlan): boolean {
    // Terminate if budget exhausted
    if (plan.estimatedCost >= context.budget * 0.9) return true;

    // Terminate if we have enough stages
    if (plan.stages.length >= 5) return true;

    // Terminate if low entropy and we have at least 1 stage
    if (context.entropy < 0.3 && plan.stages.length >= 1) return true;

    return false;
  }

  private projectNextContext(
    current: ExecutionContext,
    selection: AgentSelection
  ): ExecutionContext {
    return {
      ...current,
      budget: current.budget - selection.estimatedCost,
      historyLength: current.historyLength + 1
    };
  }

  private generateFallbacks(plan: DynamicExecutionPlan): FallbackStrategy[] {
    return plan.stages.map((stage, idx) => ({
      stageId: stage.stageId,
      primaryAgent: stage.agent.capability,
      fallbackAgent: this.selectFallback(stage.agent.capability),
      trigger: {
        type: 'FAILURE',
        maxRetries: 2
      }
    }));
  }

  private selectFallback(primary: AgentCapability): AgentCapability {
    const fallbacks: Record<AgentCapability, AgentCapability> = {
      [AgentCapability.FAST_TASK]: AgentCapability.RESEARCH,
      [AgentCapability.RESEARCH]: AgentCapability.ANALYSIS,
      [AgentCapability.ANALYSIS]: AgentCapability.CODING,
      [AgentCapability.CODING]: AgentCapability.ANALYSIS,
      [AgentCapability.CREATIVE]: AgentCapability.ANALYSIS
    };

    return fallbacks[primary];
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  getRoutingAnalytics(): RoutingAnalytics {
    const analytics: RoutingAnalytics = {
      capabilityPerformance: [],
      totalExecutions: this.executionLog.length,
      explorationRate: this.calculateActualExplorationRate(),
      avgUtilityScore: this.calculateAvgUtility()
    };

    this.routingHistory.forEach((perf, capability) => {
      analytics.capabilityPerformance.push({
        capability,
        successRate: perf.successRate,
        avgTokens: perf.avgTokens,
        avgLatency: perf.avgLatency,
        sampleCount: perf.sampleCount
      });
    });

    return analytics;
  }

  private calculateActualExplorationRate(): number {
    if (this.executionLog.length === 0) return 0;

    const explorationCount = this.executionLog.filter(log =>
      log.selection.reasoning.includes('Exploration')
    ).length;

    return explorationCount / this.executionLog.length;
  }

  private calculateAvgUtility(): number {
    if (this.executionLog.length === 0) return 0;

    const utilities = this.executionLog.map(log =>
      log.result.success ? 1 : 0
    );

    return utilities.reduce((a, b) => a + b, 0) / utilities.length;
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

interface DynamicExecutionPlan {
  stages: ExecutionStage[];
  branchPoints: BranchPoint[];
  fallbackStrategies: FallbackStrategy[];
  estimatedCost: number;
}

interface ExecutionStage {
  stageId: number;
  agent: AgentSelection;
  dependencies: string[];
  condition: ExecutionCondition;
}

interface ExecutionCondition {
  type: 'ALWAYS' | 'IF_SUCCESS' | 'IF_FAILURE' | 'IF_QUALITY_BELOW';
  threshold?: number;
}

interface BranchPoint {
  stageId: number;
  condition: string;
  trueBranch: number;
  falseBranch: number;
}

interface FallbackStrategy {
  stageId: number;
  primaryAgent: AgentCapability;
  fallbackAgent: AgentCapability;
  trigger: {
    type: 'FAILURE' | 'TIMEOUT' | 'LOW_QUALITY';
    maxRetries: number;
  };
}

interface ExecutionRecord {
  timestamp: number;
  selection: AgentSelection;
  result: {
    success: boolean;
    tokensUsed: number;
    latencyMs: number;
    quality: number;
  };
  contextEntropy: number;
}

interface RoutingAnalytics {
  capabilityPerformance: Array<{
    capability: AgentCapability;
    successRate: number;
    avgTokens: number;
    avgLatency: number;
    sampleCount: number;
  }>;
  totalExecutions: number;
  explorationRate: number;
  avgUtilityScore: number;
}

// ============================================================================
// EXPORT
// ============================================================================

export type {
  ExecutionContext,
  AgentSelection,
  RoutingPolicy,
  DynamicExecutionPlan,
  RoutingAnalytics
};