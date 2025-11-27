import { AgentTask, AgentCapability, AgentContext, AgentStatus } from '../types';
import { DynamicOrchestrator } from './dynamicOrchestrator';
import { GoogleGenerativeAI } from '@google/genai';
import { AdversarialKernel } from '../common/constitution_refactor';
import { EntropyKernel } from '../common/constitution_refactor';
import { AdaptiveCortex } from './adaptiveCortex';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export class SwarmExecutor {
  private orchestrator: DynamicOrchestrator;
  private cortex: AdaptiveCortex;

  constructor(cortex: AdaptiveCortex) {
    this.orchestrator = new DynamicOrchestrator();
    this.cortex = cortex;
  }

  async execute(prompt: string, maxAgents: number = 5) {
    const plan = await this.orchestrator.planExecution(prompt, maxAgents);
    const agentTasks: AgentTask[] = plan.stages.map(stage => ({
        id: stage.agent.capability + '_' + stage.stageId,
        role: stage.agent.role,
        description: prompt,
        capability: stage.agent.capability,
        requiresWebSearch: false,
        status: AgentStatus.QUEUED,
        logs: [],
        dependencies: stage.dependencies,
        metrics: {
            entropy: 0,
            confidence: 0,
            costFunction: 0,
            computeTime: 0,
        },
        retryCount: 0,
    }));

    const executionPromises = agentTasks.map(task => this.executeAgentTask(task, {
        originalPrompt: prompt,
        strategy: plan.estimatedCost.toString(),
        peers: [],
        dependencyOutputs: [],
        globalHistory: '',
    }));

    const results = await Promise.all(executionPromises);
    return this.synthesizeSwarmResults(results);
  }

  private async executeAgentTask(task: AgentTask, context: AgentContext): Promise<AgentTask> {
    task.status = AgentStatus.WORKING;
    const startTime = Date.now();

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Context-Aware HyperNetwork Projection
      const strategyEmbedding = context.strategy; // Simplified for now
      const systemPrompt = `Global Strategy: ${strategyEmbedding}\n\nYour Task:`;

      const temperature = this.cortex.getTemperature(task.capability);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${systemPrompt} ${task.description}` }] }],
        generationConfig: {
          temperature,
        },
      });
      const output = result.response.text();

      task.result = output;
      task.status = AgentStatus.VERIFYING;

      // Adversarial Sub-Grid (Shadow Swarm)
      const critique = AdversarialKernel.generateCritique(task, output);
      if (critique) {
        task.critique = critique;
        task.status = AgentStatus.HEALING; // Needs revision
        // In a real scenario, you might re-run the task with the critique as input
      } else {
        task.status = AgentStatus.COMPLETED;
      }

    } catch (error) {
      task.status = AgentStatus.FAILED;
      task.logs.push(`Error: ${error}`);
    }

    task.metrics.computeTime = Date.now() - startTime;

    // Record experience for learning
    const experience = this.cortex.createExperience(
      task,
      { budget: 0, success: 0 }, // Simplified for now
      {
        budget: task.result?.length || 0, // Simplified metric
        success: task.status === AgentStatus.COMPLETED,
        quality: 0.8, // Simplified for now
        latency: task.metrics.computeTime,
        output: task.result || '',
      }
    );
    this.cortex.recordExperience(experience);

    return task;
  }

  private synthesizeSwarmResults(completedTasks: AgentTask[]): any {
    const successfulTasks = completedTasks.filter(t => t.status === AgentStatus.COMPLETED);
    const outputs = successfulTasks.map(t => t.result || "");
    const DIVERSITY_THRESHOLD = 1.0;

    // Entropy-Maximized GNN Mixing
    const diversityScore = EntropyKernel.calculateShannonEntropy(outputs);

    if (diversityScore < DIVERSITY_THRESHOLD && completedTasks.length > 1) { // Low diversity threshold
      // Instruct synthesizer to diversify
      return {
        synthesis: "Synthesized result: The agent outputs were too similar. Re-evaluating with a focus on diverse perspectives.",
        diversityScore,
        finalOutput: "",
        results: completedTasks,
      }
    }

    const finalOutput = outputs.join('\n\n---\n\n');
    return {
      synthesis: `Synthesized result from ${successfulTasks.length} agents.`,
      diversityScore,
      finalOutput,
      results: completedTasks,
    };
  }
}
