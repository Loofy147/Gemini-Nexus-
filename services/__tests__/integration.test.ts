
import { SwarmExecutor } from '../swarmExecutor';

describe('Swarm Integration', () => {
  it('should execute complete workflow', async () => {
    const executor = new SwarmExecutor();

    const result = await executor.execute(
      'Create a simple todo app in React',
      3
    );

    expect(result).toBeDefined();
    expect(result.output.length).toBeGreaterThan(0);
  }, 30000); // 30s timeout
});
