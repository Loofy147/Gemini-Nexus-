// tests/mathKernel.test.ts
import { MathKernel } from '../common/constitution_refactor';
import { AgentCapability } from '../types';

describe('MathKernel', () => {
  describe('calculateEntropy', () => {
    it('should return 0 for empty text', () => {
      expect(MathKernel.calculateEntropy("")).toBe(0);
    });

    it('should calculate entropy correctly for a simple case', () => {
      const text = "analyze this";
      const historyLength = 2;
      const hasVisualInput = false;
      const entropy = MathKernel.calculateEntropy(text, historyLength, hasVisualInput);
      expect(entropy).toBeCloseTo(0.11);
    });

    it('should handle visual input', () => {
        const text = "analyze this";
        const historyLength = 2;
        const hasVisualInput = true;
        const entropy = MathKernel.calculateEntropy(text, historyLength, hasVisualInput);
        expect(entropy).toBeCloseTo(0.46);
    });
  });

  describe('calculateThinkingBudget', () => {
    it('should return 0 for FAST_TASK', () => {
      const budget = MathKernel.calculateThinkingBudget(0.5, AgentCapability.FAST_TASK, false, 1.0);
      expect(budget).toBe(0);
    });

    it('should calculate the budget correctly for a coding task', () => {
        const budget = MathKernel.calculateThinkingBudget(0.8, AgentCapability.CODING, false, 1.0);
        expect(budget).toBe(25700);
    });
  });

  describe('calculateCoordinateBias', () => {
    it('should not apply bias for low entropy', () => {
      const bias = MathKernel.calculateCoordinateBias(0.5, AgentCapability.CREATIVE);
      expect(bias.bias).toBeNull();
      expect(bias.strength).toBe(0);
    });

    it('should shift CREATIVE to ANALYSIS for high entropy', () => {
      const bias = MathKernel.calculateCoordinateBias(0.8, AgentCapability.CREATIVE);
      expect(bias.bias).toBe(AgentCapability.ANALYSIS);
      expect(bias.strength).toBeCloseTo(0.64);
    });

    it('should shift ANALYSIS to CREATIVE for very high entropy', () => {
        const bias = MathKernel.calculateCoordinateBias(0.9, AgentCapability.ANALYSIS);
        expect(bias.bias).toBe(AgentCapability.CREATIVE);
        expect(bias.strength).toBeCloseTo(0.405);
    });
  });
});
