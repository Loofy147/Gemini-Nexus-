import { AdversarialKernel, EntropyKernel } from '../common/constitution_refactor';
import { AgentCapability, AgentTask } from '../types';

describe('AdversarialKernel', () => {
    it('should generate a critique for a coding task with missed edge cases', () => {
        const task: AgentTask = {
            id: 'test',
            role: 'test',
            description: 'handle all cases',
            capability: AgentCapability.CODING,
            requiresWebSearch: false,
            status: 'VERIFYING',
            logs: [],
            dependencies: [],
            metrics: {
                entropy: 0,
                confidence: 0,
                costFunction: 0,
                computeTime: 0,
            },
            retryCount: 0,
        };
        const output = 'const x = 1;';
        const critique = AdversarialKernel.generateCritique(task, output);
        expect(critique).toContain('Potential Edge Case Missed');
    });

    it('should not generate a critique for a perfect coding task', () => {
        const task: AgentTask = {
            id: 'test',
            role: 'test',
            description: 'handle all cases',
            capability: AgentCapability.CODING,
            requiresWebSearch: false,
            status: 'VERIFYING',
            logs: [],
            dependencies: [],
            metrics: {
                entropy: 0,
                confidence: 0,
                costFunction: 0,
                computeTime: 0,
            },
            retryCount: 0,
        };
        const output = 'if (input === null || input === undefined) { return; } try { riskyOperation(); } catch (e) { console.error(e); }';
        const critique = AdversarialKernel.generateCritique(task, output);
        expect(critique).toBe('');
    });
});

describe('EntropyKernel', () => {
    it('should return 0 for identical outputs', () => {
        const outputs = ['a b c', 'a b c', 'a b c'];
        const entropy = EntropyKernel.calculateShannonEntropy(outputs);
        expect(entropy).toBe(0);
    });

    it('should return a high entropy for diverse outputs', () => {
        const outputs = ['a b c', 'd e f', 'g h i'];
        const entropy = EntropyKernel.calculateShannonEntropy(outputs);
        expect(entropy).toBeGreaterThan(1.5);
    });
});
