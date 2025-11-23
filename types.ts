

export enum AgentStatus {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  BLOCKED = 'BLOCKED', // Waiting for dependencies
  THINKING = 'THINKING',
  WORKING = 'WORKING',
  AWAITING_INPUT = 'AWAITING_INPUT', // New: Human-in-the-Loop
  VERIFYING = 'VERIFYING', // Quality Control
  HEALING = 'HEALING',     // Fixing errors based on feedback
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SwarmState {
  IDLE = 'IDLE',
  ORCHESTRATING = 'ORCHESTRATING',
  EXECUTING = 'EXECUTING',
  PAUSED = 'PAUSED', // New state for HITL
  SYNTHESIZING = 'SYNTHESIZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum AgentCapability {
  RESEARCH = 'RESEARCH',
  ANALYSIS = 'ANALYSIS',
  CREATIVE = 'CREATIVE',
  CODING = 'CODING',
  FAST_TASK = 'FAST_TASK'
}

export type Vector = number[];

export interface VectorMemoryItem {
  id: string;
  role: string;
  content: string;
  embedding: Vector;
  timestamp: number;
}

export interface Citation {
  uri: string;
  title: string;
}

export interface Lesson {
  id: string;
  timestamp: number;
  insight: string;
  context: string;
}

export interface MetaRule {
  id: string;
  triggerKeywords: string[];
  rule: string;
  successWeight: number;
  lastReinforced: number;
}

export interface CortexState {
  capabilityWeightsA: Record<AgentCapability, number>;
  capabilityWeightsB: Record<AgentCapability, number>;
  temperatureTuning: Record<AgentCapability, number>;
  totalExperience: number;
}

export interface PromptMutation {
  id: string;
  originalInstruction: string;
  mutatedInstruction: string;
  reasoning: string;
  scoreImprovement: number;
}

export interface MetricPoint {
  timestamp: number;
  aleph: number; // Singularity Index
  entropy: number;
  plasticity: number;
  knowledgeVelocity: number;
}

export interface SimulatedExecution {
  passed: boolean;
  output: string;
  errors: string[];
}

export interface AgentMetrics {
  entropy: number;
  confidence: number;
  costFunction: number;
  computeTime: number;
  visualInput?: boolean;
  tier?: 'FLASH' | 'PRO';
  alignmentScore?: number;
  atomicAlignmentScore?: number; // v8.0: Granular truth score
  coherenceScore?: number;
  drift?: number;
  rScore?: number;

  // v8.0 Unified Nexus Equation Metrics
  knowledgeVelocity?: number; // dK/dt
  singularityIndex?: number;  // Aleph_G
}

export interface SwarmTelemetry {
  plasticity: number;
  lastActiveTimestamp: number;
  systemHealth: number;
  cortexLoad: number;
}

export interface SecurityAudit {
  passed: boolean;
  flaggedContent?: string;
  sanitized: boolean;
  originalContentLength: number;
  sanitizedContentLength: number;
}

export interface GuardrailResult {
  passed: boolean;
  error?: string;
  type: 'SYNTAX' | 'LOGIC' | 'SAFETY';
}

export interface WatchtowerAudit {
  passed: boolean;
  violations: string[];
  timestamp: number;
}

export interface AgentTask {
  id: string;
  role: string;
  description: string;
  capability: AgentCapability;
  requiresWebSearch: boolean;
  status: AgentStatus;
  result?: string;
  logs: string[];
  modelUsed?: string;
  thinkingBudget?: number;
  dependencies: string[];
  metrics: AgentMetrics;
  metricsHistory?: MetricPoint[]; // v9.0 Oscilloscope Data

  // v8.0: Cognitive Ghost
  internalMonologue?: string; // The hidden chain of thought

  // Auto-Reflexion
  retryCount: number;
  verificationPassed?: boolean;
  verificationAttempts?: number;
  critique?: string;
  lastHeartbeat?: number;

  // Ironclad
  securityAudit?: SecurityAudit;
  watchtowerAudit?: WatchtowerAudit; // v8.0 Formal Verification
  contextCompressed?: boolean;
  citations?: Citation[];

  // v9.0 Simulation Kernel
  simulatedExecution?: SimulatedExecution;

  // Cortex
  appliedMetaRules?: string[];
}

export interface SwarmPlan {
  tasks: AgentTask[];
  strategyDescription: string;
  strategyEmbedding?: Vector;
}

export interface AgentContext {
  originalPrompt: string;
  strategy: string;
  strategyEmbedding?: Vector;
  peers: { role: string; status: string }[];
  dependencyOutputs: { role: string; content: string }[];
  globalHistory: string;
  visualData?: string;
  isCompressed?: boolean;
}

export interface DecomposedPlan {
  strategy: string;
  agents: {
    id: string;
    role: string;
    task: string;
    capability: AgentCapability;
    requiresWebSearch: boolean;
    dependencies?: string[];
  }[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  source: 'ORCHESTRATOR' | 'SYSTEM' | string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'healing' | 'security' | 'cortex' | 'thought' | 'sim';
}

export interface MerkleNode {
  hash: string;
  prevHash: string;
  entry: LogEntry;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  icon: string;
  instruction: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type RightPanelTab = 'inspector' | 'logs' | 'chat';
