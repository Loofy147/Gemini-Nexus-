
import { DynamicOrchestrator } from '../dynamicOrchestrator';
import { AgentCapability } from '../../types';

describe('DynamicOrchestrator', () => {
  let orchestrator: DynamicOrchestrator;

  beforeEach(() => {
    orchestrator = new DynamicOrchestrator();
  });

  it('should select agent based on utility', async () => {
    const context = {
      prompt: 'Analyze quarterly earnings',
      entropy: 0.8,
      historyLength: 0,
      completedTasks: [],
      availableAgents: Object.values(AgentCapability),
      budget: 10000
    };

    const selection = await orchestrator.selectNextAgent(context);

    expect(selection.capability).toBeDefined();
    expect(selection.confidence).toBeGreaterThan(0);
    expect(selection.estimatedCost).toBeGreaterThan(0);
  });

  it('should learn from execution results', () => {
    const selection = {
      capability: AgentCapability.CODING,
      role: 'Software Engineer',
      confidence: 0.8,
      estimatedCost: 5000,
      reasoning: 'Test'
    };

    orchestrator.updateFromExecution(selection, {
      success: true,
      tokensUsed: 4500,
      latencyMs: 3000,
      quality: 0.9
    });

    const analytics = orchestrator.getRoutingAnalytics();
    const codingPerf = analytics.capabilityPerformance.find(
      p => p.capability === AgentCapability.CODING
    );

    expect(codingPerf).toBeDefined();
    expect(codingPerf!.successRate).toBeGreaterThan(0.5);
  });
});
