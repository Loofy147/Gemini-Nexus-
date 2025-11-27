import { GraphOrchestrator } from '../graphOrchestrator';

describe('GraphOrchestrator', () => {
  it('should execute a simple graph', async () => {
    const orchestrator = new GraphOrchestrator();
    const result = await orchestrator.planExecution('test prompt');
    expect(result).toBeDefined();
    expect(result.completedTasks.length).toBe(1);
    expect(result.completedTasks[0].status).toBe('COMPLETED');
  });
});
