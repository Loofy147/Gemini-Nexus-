
import { SwarmExecutor } from '../swarmExecutor';
import { AdaptiveCortex } from '../adaptiveCortex';

jest.mock('@google/genai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(() => ({
        response: {
          text: () => 'Mocked AI response',
        },
      })),
    })),
  })),
}));

describe('Swarm Integration', () => {
  it('should execute complete workflow', async () => {
    const mockCortex = new AdaptiveCortex();
    mockCortex.recordExperience = jest.fn();
    mockCortex.createExperience = jest.fn();
    const executor = new SwarmExecutor(mockCortex);

    const result = await executor.execute(
      'Create a simple todo app in React',
      3
    );

    expect(result).toBeDefined();
    expect(result.finalOutput.length).toBeGreaterThan(0);
  }, 30000); // 30s timeout
});
