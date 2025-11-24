/**
 * ADAPTIVE CORTEX - LEARNING ENGINE
 *
 * Implements reinforcement learning-based adaptation of system parameters.
 * Replaces magic numbers with learned weights based on task outcomes.
 */

import { AgentCapability, AgentTask } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface CortexWeights {
  // Entropy calculation weights
  entropyWeights: {
    length: number;
    keyword: number;
    history: number;
    visual: number;
  };

  // Budget multipliers per capability
  budgetMultipliers: Record<AgentCapability, number>;

  // Temperature settings for model calls
  temperatureSettings: Record<AgentCapability, number>;

  // Routing preferences
  routingPreferences: Record<AgentCapability, number>;

  // Metadata
  lastUpdated: number;
  updateCount: number;
  confidence: number; // How confident are we in these weights?
}

interface Experience {
  // Input features
  taskEntropy: number;
  capability: AgentCapability;
  promptLength: number;
  hasVisual: boolean;
  historyLength: number;

  // Predicted values
  predictedBudget: number;
  predictedSuccess: number;

  // Actual outcomes
  actualBudget: number;
  actualSuccess: boolean;
  actualQuality: number;
  actualLatency: number;

  // Metadata
  timestamp: number;
  taskId: string;
}

interface LearningMetrics {
  totalExperiences: number;
  avgPredictionError: number;
  successRate: number;
  avgQuality: number;
  lastUpdate: number;
  convergenceScore: number; // How stable are the weights?
}

// ============================================================================
// ADAPTIVE CORTEX
// ============================================================================

export class AdaptiveCortex {
  private weights: CortexWeights;
  private experienceBuffer: Experience[] = [];
  private maxBufferSize = 1000;
  private updateFrequency = 100; // Update every N experiences
  private learningRate = 0.05;

  constructor(initialWeights?: Partial<CortexWeights>) {
    this.weights = this.initializeWeights(initialWeights);
  }

  // ============================================================================
  // WEIGHT INITIALIZATION
  // ============================================================================

  private initializeWeights(custom?: Partial<CortexWeights>): CortexWeights {
    const defaults: CortexWeights = {
      entropyWeights: {
        length: 0.35,
        keyword: 0.45,
        history: 0.15,
        visual: 0.05
      },
      budgetMultipliers: {
        [AgentCapability.FAST_TASK]: 0.0,
        [AgentCapability.RESEARCH]: 1.2,
        [AgentCapability.ANALYSIS]: 1.5,
        [AgentCapability.CODING]: 2.0,
        [AgentCapability.CREATIVE]: 1.1
      },
      temperatureSettings: {
        [AgentCapability.FAST_TASK]: 0.3,
        [AgentCapability.RESEARCH]: 0.7,
        [AgentCapability.ANALYSIS]: 0.5,
        [AgentCapability.CODING]: 0.4,
        [AgentCapability.CREATIVE]: 0.9
      },
      routingPreferences: {
        [AgentCapability.FAST_TASK]: 0.5,
        [AgentCapability.RESEARCH]: 0.5,
        [AgentCapability.ANALYSIS]: 0.5,
        [AgentCapability.CODING]: 0.5,
        [AgentCapability.CREATIVE]: 0.5
      },
      lastUpdated: Date.now(),
      updateCount: 0,
      confidence: 0.3 // Start with low confidence
    };

    return { ...defaults, ...custom };
  }

  // ============================================================================
  // EXPERIENCE RECORDING
  // ============================================================================

  /**
   * Record an experience from task execution
   */
  recordExperience(experience: Experience): void {
    this.experienceBuffer.push(experience);

    // Trim buffer if too large (FIFO)
    if (this.experienceBuffer.length > this.maxBufferSize) {
      this.experienceBuffer.shift();
    }

    // Trigger update if buffer is full enough
    if (this.experienceBuffer.length >= this.updateFrequency) {
      this.updateWeights();
    }
  }

  /**
   * Create experience from task execution
   */
  createExperience(
    task: AgentTask,
    predicted: { budget: number; success: number },
    actual: { budget: number; success: boolean; quality: number; latency: number }
  ): Experience {
    return {
      taskEntropy: task.metrics.entropy,
      capability: task.capability,
      promptLength: task.description.length,
      hasVisual: task.metrics.visualInput || false,
      historyLength: 0, // Would come from context
      predictedBudget: predicted.budget,
      predictedSuccess: predicted.success,
      actualBudget: actual.budget,
      actualSuccess: actual.success,
      actualQuality: actual.quality,
      actualLatency: actual.latency,
      timestamp: Date.now(),
      taskId: task.id
    };
  }

  // ============================================================================
  // WEIGHT OPTIMIZATION
  // ============================================================================

  /**
   * Update weights based on accumulated experience
   */
  private updateWeights(): void {
    if (this.experienceBuffer.length < 10) return;

    console.log(`[Cortex] Updating weights from ${this.experienceBuffer.length} experiences`);

    // 1. Optimize entropy weights
    this.optimizeEntropyWeights();

    // 2. Optimize budget multipliers
    this.optimizeBudgetMultipliers();

    // 3. Optimize routing preferences
    this.optimizeRoutingPreferences();

    // 4. Update metadata
    this.weights.lastUpdated = Date.now();
    this.weights.updateCount++;
    this.weights.confidence = Math.min(
      this.weights.confidence + 0.1,
      1.0
    );

    // 5. Clear buffer
    this.experienceBuffer = [];

    console.log('[Cortex] Weight update complete', this.weights);
  }

  /**
   * Optimize entropy calculation weights using gradient descent
   */
  private optimizeEntropyWeights(): void {
    // Goal: Minimize prediction error for task success
    const experiences = this.experienceBuffer;

    // Calculate gradients
    let lengthGrad = 0;
    let keywordGrad = 0;
    let historyGrad = 0;
    let visualGrad = 0;

    for (const exp of experiences) {
      // Predicted entropy with current weights
      const predictedEntropy = this.calculateEntropyWithWeights(exp, this.weights.entropyWeights);

      // Error: difference between predicted and actual performance
      const error = (exp.actualSuccess ? 1 : 0) - predictedEntropy;

      // Gradient for each weight (simplified)
      const lengthFeature = Math.min(exp.promptLength / 500, 1.0);
      const keywordFeature = 0.5; // Simplified
      const historyFeature = Math.min(exp.historyLength / 10, 1.0);
      const visualFeature = exp.hasVisual ? 1.0 : 0.0;

      lengthGrad += error * lengthFeature;
      keywordGrad += error * keywordFeature;
      historyGrad += error * historyFeature;
      visualGrad += error * visualFeature;
    }

    // Average gradients
    const n = experiences.length;
    lengthGrad /= n;
    keywordGrad /= n;
    historyGrad /= n;
    visualGrad /= n;

    // Update weights with learning rate
    this.weights.entropyWeights.length += this.learningRate * lengthGrad;
    this.weights.entropyWeights.keyword += this.learningRate * keywordGrad;
    this.weights.entropyWeights.history += this.learningRate * historyGrad;
    this.weights.entropyWeights.visual += this.learningRate * visualGrad;

    // Normalize to sum to 1.0
    this.normalizeEntropyWeights();

    // Clamp to reasonable ranges
    this.weights.entropyWeights.length = this.clamp(this.weights.entropyWeights.length, 0.1, 0.6);
    this.weights.entropyWeights.keyword = this.clamp(this.weights.entropyWeights.keyword, 0.2, 0.6);
    this.weights.entropyWeights.history = this.clamp(this.weights.entropyWeights.history, 0.05, 0.4);
    this.weights.entropyWeights.visual = this.clamp(this.weights.entropyWeights.visual, 0.0, 0.3);
  }

  /**
   * Optimize budget multipliers based on efficiency
   */
  private optimizeBudgetMultipliers(): void {
    // Group experiences by capability
    const byCapability = new Map<AgentCapability, Experience[]>();

    this.experienceBuffer.forEach(exp => {
      if (!byCapability.has(exp.capability)) {
        byCapability.set(exp.capability, []);
      }
      byCapability.get(exp.capability)!.push(exp);
    });

    // For each capability, adjust multiplier based on performance
    byCapability.forEach((experiences, capability) => {
      const avgSuccess = experiences.filter(e => e.actualSuccess).length / experiences.length;
      const avgQuality = experiences.reduce((sum, e) => sum + e.actualQuality, 0) / experiences.length;
      const avgEfficiency = experiences.reduce((sum, e) => {
        // Efficiency = quality / tokens
        return sum + (e.actualQuality / Math.max(e.actualBudget, 1));
      }, 0) / experiences.length;

      const currentMultiplier = this.weights.budgetMultipliers[capability];

      // If success is low, increase budget
      if (avgSuccess < 0.7) {
        this.weights.budgetMultipliers[capability] = currentMultiplier * 1.1;
      }
      // If quality is high and efficient, can decrease budget
      else if (avgQuality > 0.85 && avgEfficiency > 0.001) {
        this.weights.budgetMultipliers[capability] = currentMultiplier * 0.95;
      }

      // Clamp to reasonable range
      this.weights.budgetMultipliers[capability] = this.clamp(
        this.weights.budgetMultipliers[capability],
        0.5,
        3.0
      );
    });
  }

  /**
   * Optimize routing preferences based on success rates
   */
  private optimizeRoutingPreferences(): void {
    const byCapability = new Map<AgentCapability, Experience[]>();

    this.experienceBuffer.forEach(exp => {
      if (!byCapability.has(exp.capability)) {
        byCapability.set(exp.capability, []);
      }
      byCapability.get(exp.capability)!.push(exp);
    });

    byCapability.forEach((experiences, capability) => {
      const successRate = experiences.filter(e => e.actualSuccess).length / experiences.length;

      // Update preference based on success rate
      const alpha = 0.2; // Smoothing factor
      const currentPref = this.weights.routingPreferences[capability];
      this.weights.routingPreferences[capability] =
        currentPref * (1 - alpha) + successRate * alpha;
    });
  }

  // ============================================================================
  // PREDICTION
  // ============================================================================

  /**
   * Predict optimal budget for a task
   */
  predictBudget(
    entropy: number,
    capability: AgentCapability,
    hasVisual: boolean
  ): number {
    const BASE_BUDGET = 100;
    const MAX_BUFFER = this.getMaxBuffer(capability);

    const multiplier = this.weights.budgetMultipliers[capability];
    const visualMultiplier = hasVisual ? 1.5 : 1.0;

    const budget = BASE_BUDGET + (entropy * MAX_BUFFER * multiplier * visualMultiplier);

    return Math.min(Math.floor(budget), 32000);
  }

  /**
   * Predict success probability for a task
   */
  predictSuccess(
    entropy: number,
    capability: AgentCapability
  ): number {
    // Based on historical success rates for similar tasks
    const baseSuccess = this.weights.routingPreferences[capability];

    // Adjust for entropy (higher entropy = lower confidence)
    const entropyPenalty = entropy * 0.2;

    return Math.max(0.1, Math.min(1.0, baseSuccess - entropyPenalty));
  }

  /**
   * Get recommended temperature for capability
   */
  getTemperature(capability: AgentCapability): number {
    return this.weights.temperatureSettings[capability];
  }

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  /**
   * Get learning metrics
   */
  getMetrics(): LearningMetrics {
    if (this.experienceBuffer.length === 0) {
      return {
        totalExperiences: 0,
        avgPredictionError: 0,
        successRate: 0,
        avgQuality: 0,
        lastUpdate: this.weights.lastUpdated,
        convergenceScore: 0
      };
    }

    const successCount = this.experienceBuffer.filter(e => e.actualSuccess).length;
    const avgQuality = this.experienceBuffer.reduce((sum, e) => sum + e.actualQuality, 0) /
                       this.experienceBuffer.length;

    // Calculate prediction error
    const errors = this.experienceBuffer.map(exp => {
      const predicted = this.predictSuccess(exp.taskEntropy, exp.capability);
      const actual = exp.actualSuccess ? 1 : 0;
      return Math.abs(predicted - actual);
    });
    const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;

    // Convergence: how stable are recent updates?
    const convergenceScore = this.calculateConvergence();

    return {
      totalExperiences: this.experienceBuffer.length,
      avgPredictionError: avgError,
      successRate: successCount / this.experienceBuffer.length,
      avgQuality,
      lastUpdate: this.weights.lastUpdated,
      convergenceScore
    };
  }

  /**
   * Calculate how stable the weights are (for convergence detection)
   */
  private calculateConvergence(): number {
    // Would track weight history in production
    // For now, use confidence as proxy
    return this.weights.confidence;
  }

  /**
   * Export weights for persistence
   */
  exportWeights(): CortexWeights {
    return { ...this.weights };
  }

  /**
   * Import weights (for loading saved state)
   */
  importWeights(weights: CortexWeights): void {
    this.weights = weights;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private calculateEntropyWithWeights(
    exp: Experience,
    weights: CortexWeights['entropyWeights']
  ): number {
    const lengthScore = Math.min(exp.promptLength / 500, 1.0);
    const keywordScore = 0.5; // Simplified
    const historyScore = Math.min(exp.historyLength / 10, 1.0);
    const visualScore = exp.hasVisual ? 1.0 : 0.0;

    return (
      lengthScore * weights.length +
      keywordScore * weights.keyword +
      historyScore * weights.history +
      visualScore * weights.visual
    );
  }

  private normalizeEntropyWeights(): void {
    const sum =
      this.weights.entropyWeights.length +
      this.weights.entropyWeights.keyword +
      this.weights.entropyWeights.history +
      this.weights.entropyWeights.visual;

    if (sum > 0) {
      this.weights.entropyWeights.length /= sum;
      this.weights.entropyWeights.keyword /= sum;
      this.weights.entropyWeights.history /= sum;
      this.weights.entropyWeights.visual /= sum;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private getMaxBuffer(capability: AgentCapability): number {
    const buffers: Record<AgentCapability, number> = {
      [AgentCapability.FAST_TASK]: 0,
      [AgentCapability.RESEARCH]: 4000,
      [AgentCapability.ANALYSIS]: 8000,
      [AgentCapability.CODING]: 16000,
      [AgentCapability.CREATIVE]: 8000
    };

    return buffers[capability];
  }
}

// ============================================================================
// META-LEARNING: Learn to Learn
// ============================================================================

export class MetaLearningCortex extends AdaptiveCortex {
  private learningRateHistory: number[] = [];
  private adaptiveLearningRate: number;

  constructor() {
    super();
    this.adaptiveLearningRate = 0.05;
  }

  /**
   * Adjust learning rate based on recent performance
   */
  private adaptLearningRate(): void {
    if (this.learningRateHistory.length < 5) return;

    // If learning is plateauing, increase learning rate
    const recent = this.learningRateHistory.slice(-5);
    const variance = this.calculateVariance(recent);

    if (variance < 0.001) {
      // Plateauing, increase learning rate
      this.adaptiveLearningRate = Math.min(this.adaptiveLearningRate * 1.2, 0.2);
    } else if (variance > 0.01) {
      // Oscillating, decrease learning rate
      this.adaptiveLearningRate = Math.max(this.adaptiveLearningRate * 0.8, 0.01);
    }
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b) / values.length;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  CortexWeights,
  Experience,
  LearningMetrics
};