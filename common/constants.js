
const { Type } = require("@google/genai");

const MODEL_ORCHESTRATOR = 'gemini-3-pro-preview';
const MODEL_WORKER_PRO = 'gemini-3-pro-preview';
const MODEL_WORKER_FLASH = 'gemini-2.5-flash';
const MODEL_SYNTHESIZER = 'gemini-3-pro-preview';

const SYSTEM_INSTRUCTION_ORCHESTRATOR = `
You are the **OrchestratorAI**, an autonomous orchestration engine powered by Gemini 3.
Your goal is to decompose a user request into a robust, dependency-aware workflow (DAG) following the **Progressive Chain-of-Thought Execution** model.

[PHASES OF EXECUTION]
1. **Dynamic Initialization**: Identify specialized production units (Agents).
2. **Planning Phase**: Design a blueprint. Define dependencies clearly.
3. **Implementation Strategy**: Assign capabilities based on task complexity.

[GEMINI NEXUS v5.0 UPDATE: COMPUTE PARSIMONY]
- Prioritize 'FAST_TASK' (Flash) for any task that does not strictly require complex reasoning.
- Only assign 'ANALYSIS' or 'CODING' if the entropy is high.

CRITICAL INSTRUCTIONS:
1. **Capabilities**: Assign 'capability' to optimize COST vs INTELLIGENCE.
   - 'FAST_TASK': Simple extraction, formatting. (Flash Model).
   - 'RESEARCH': Needs real-time web data/Discovery. (Pro + Search).
   - 'ANALYSIS'/'CODING': Complex reasoning/Implementation. (Pro + Thinking).

2. **Dependencies**: You can define dependencies.
   - If Agent B needs Agent A's output (e.g., Verification needs Implementation), set Agent B's 'dependencies' to ["agent_1"].
   - Agent IDs must be unique strings like "agent_1", "agent_2".

3. **Context**:
   - If the user provides PREVIOUS HISTORY, use it to refine the plan.

Return a JSON object with the strategy and list of agents.
`;

const SYSTEM_INSTRUCTION_SYNTHESIZER = `
You are the Swarm Synthesizer. You receive reports from specialized agents.
Your job is Phase 4: **Final Assembly and Output Integration**.

1. Read all reports.
2. Resolve conflicts.
3. Synthesize a cohesive, professional master response in Markdown.
4. If agents provided web links/sources, strictly preserve them in a "References" section.
5. Do not explicitly mention "Agent 1", just present the information professionally.
`;

const ORCHESTRATOR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    strategy: { type: Type.STRING, description: "High-level execution plan summary." },
    agents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID (e.g., 'agent_1')" },
          role: { type: Type.STRING, description: "Agent persona (e.g. 'Market Researcher')." },
          task: { type: Type.STRING, description: "Precise instructions for the agent." },
          capability: {
            type: Type.STRING,
            enum: ["RESEARCH", "ANALYSIS", "CREATIVE", "CODING", "FAST_TASK"],
            description: "The type of work."
          },
          requiresWebSearch: { type: Type.BOOLEAN, description: "True if web search is needed." },
          dependencies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "IDs of agents that must finish BEFORE this agent starts."
          }
        },
        required: ["id", "role", "task", "capability", "requiresWebSearch"]
      }
    }
  },
  required: ["strategy", "agents"]
};

const PLAYBOOKS = [
  {
    id: 'auto',
    name: 'Auto-Pilot',
    description: 'Standard intelligent dispatch.',
    icon: '⚡',
    instruction: ''
  },
  {
    id: 'omniscient',
    name: 'God Mode',
    description: 'Max reasoning. Deepest Analysis.',
    icon: '👁️',
    instruction: 'ENABLE GOD MODE. Create a comprehensive plan. Use at least 4 agents. 1. Historian/Context (RESEARCH). 2. Multi-perspective Analysts (ANALYSIS). 3. Critic/Reviewer (ANALYSIS). Ensure deep reasoning.'
  },
  {
    id: 'coding-sprint',
    name: 'Dev Sprint',
    description: 'Architect -> Code -> Review.',
    icon: '💻',
    instruction: 'Create a plan with: 1. Architect (ANALYSIS) to design structure (Plan Phase). 2. Developer (CODING) to write code based on Architect (Implement Phase). 3. QA Engineer (CODING) to check for bugs and write tests (Verify Phase).'
  },
  {
    id: 'deep-research',
    name: 'Deep Dive',
    description: 'Multi-source research & synthesis.',
    icon: '🔍',
    instruction: 'Create a plan with 2 RESEARCH agents looking at different aspects (Discover Phase), followed by 1 ANALYSIS agent to compare findings and Synthesize.'
  }
];

module.exports = {
    MODEL_ORCHESTRATOR,
    MODEL_WORKER_PRO,
    MODEL_WORKER_FLASH,
    MODEL_SYNTHESIZER,
    SYSTEM_INSTRUCTION_ORCHESTRATOR,
    SYSTEM_INSTRUCTION_SYNTHESIZER,
    ORCHESTRATOR_SCHEMA,
    PLAYBOOKS
};
