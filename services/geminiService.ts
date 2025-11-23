
import {
  AgentTask,
  AgentContext,
  ChatMessage,
  LogEntry,
  Lesson,
  SwarmPlan,
  AgentStatus
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 2000): Promise<any> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
    }
    return await response.json();
  } catch (error: any) {
    console.warn("API Error:", error);
    const isRetryable = error.message.includes('503') || error.message.includes('429');

    if (retries > 0 && isRetryable) {
      console.log(`Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const orchestrateTask = async (
  userPrompt: string,
  history: string = "",
  playbookInstruction: string = "",
  imageBase64?: string,
  lastActiveTimestamp: number = 0,
  lessons: Lesson[] = [],
  onLog?: (msg: string, type: LogEntry['type']) => void
): Promise<SwarmPlan> => {
    if (onLog) onLog("Orchestrating task...", 'info');
    const response = await fetchWithRetry(`${API_BASE_URL}/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt, history, playbookInstruction, imageBase64, lastActiveTimestamp, lessons })
    });

    return {
        tasks: response.agents.map((a: any) => ({
            id: a.id,
            role: a.role,
            description: a.task,
            capability: a.capability,
            requiresWebSearch: a.requiresWebSearch,
            status: 'QUEUED',
            dependencies: a.dependencies || [],
            logs: [],
            retryCount: 0,
            metrics: {
                entropy: 0,
                confidence: 0,
                costFunction: 0,
                computeTime: 0
            }
        } as AgentTask)),
        strategyDescription: response.strategy,
        strategyEmbedding: []
    };
};

export const executeAgentTask = async (
  task: AgentTask,
  context: AgentContext,
  retryCount: number = 0,
  previousCritique: string = "",
  onLog?: (msg: string, type: LogEntry['type']) => void,
  forceApproval: boolean = false
): Promise<{
    status?: AgentStatus,
    output: string;
    internalMonologue?: string;
    model: string;
    citations: any[];
}> => {
    if (onLog) onLog(`Executing task for ${task.role}...`, 'info');
    const response = await fetchWithRetry(`${API_BASE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, context, retryCount, previousCritique })
    });
    return response;
};

export const synthesizeSwarmResults = async (originalPrompt: string, agentResults: { role: string; output: string }[], history: string = ""): Promise<string> => {
    const response = await fetchWithRetry(`${API_BASE_URL}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPrompt, agentResults, history })
    });
    return response.output;
};
export const learnFromSession = async (userPrompt: string, finalOutput: string): Promise<{ lesson: Lesson | null, mutation: any | null }> => {
    const response = await fetchWithRetry(`${API_BASE_URL}/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt, finalOutput })
    });
    return response;
};
export const streamChatResponse = async function* (message: string, history: ChatMessage[], swarmContext: string) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, swarmContext })
    });

    if (!response.body) {
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        yield decoder.decode(value);
    }
};
export const getCortexLoad = () => 0;
export const clearHiveMemory = () => {};
