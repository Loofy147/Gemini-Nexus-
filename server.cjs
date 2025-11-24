
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const {
    MODEL_ORCHESTRATOR,
    MODEL_WORKER_PRO,
    MODEL_WORKER_FLASH,
    MODEL_SYNTHESIZER,
    SYSTEM_INSTRUCTION_ORCHESTRATOR,
    ORCHESTRATOR_SCHEMA,
    SYSTEM_INSTRUCTION_SYNTHESIZER
} = require('./common/constants.js');
const { MathKernel, PRIME_DIRECTIVES, GOVERNANCE_PROTOCOLS, IRONCLAD_PROTOCOLS } = require('./common/constitution_refactor.js');

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry(fn, retries = 3, delay = 2000) {
  try {
    return await fn();
  } catch (error) {
    console.warn("API Error:", error);
    const isRetryable = error.status === 429 || error.status === 503 || (error.message && error.message.includes('overloaded'));

    if (retries > 0 && isRetryable) {
      console.log(`Retrying in ${delay}ms... (${retries} left)`);
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

app.post('/api/orchestrate', async (req, res) => {
    const { userPrompt, history, playbookInstruction, imageBase64, lastActiveTimestamp, lessons } = req.body;

    const hasVisual = !!imageBase64;
    const now = Date.now();

    const entropy = MathKernel.calculateEntropy(userPrompt, history.length / 100, hasVisual);
    const thinkingBudget = MathKernel.calculateThinkingBudget(entropy, 'ANALYSIS', hasVisual, 1.0);

    const plasticity = MathKernel.calculatePlasticity(lastActiveTimestamp, now);
    const decayGamma = MathKernel.calculateContextDecay(lastActiveTimestamp, now);

    let timeAwareInstruction = "";
    if (plasticity > 1.2) {
        timeAwareInstruction = `
        [CHRONO-SYNAPSE DETECTED HIGH PLASTICITY (P=${plasticity})]
        There has been a significant time gap. Disregard "momentum" from the bottom of the history. Treat this as a fresh strategic pivot.
        Apply a Context Decay factor of γ=${decayGamma}.
        `;
    }

    const learnedContext = lessons.length > 0
        ? `\n[KNOWLEDGE BASE / LEARNED LESSONS]\nThe Swarm has learned the following from previous missions:\n${lessons.map(l => `- ${l.insight}`).join('\n')}\nApply these lessons to the current strategy.`
        : '';

    const textPart = `
        [SYSTEM TELEMETRY]
        Input Entropy: ${entropy}
        Visual Input: ${hasVisual ? 'ACTIVE (Ocular Uplink)' : 'NONE'}
        Allocated Thinking Budget: ${thinkingBudget} tokens
        System Plasticity: ${plasticity}

        ${GOVERNANCE_PROTOCOLS}
        ${IRONCLAD_PROTOCOLS}

        ${timeAwareInstruction}
        ${learnedContext}

        USER REQUEST: "${userPrompt}"

        ${playbookInstruction ? `PLAYBOOK OVERRIDE INSTRUCTION: ${playbookInstruction}` : ''}

        ${history ? `PREVIOUS CONTEXT / HISTORY:\n${history}\n` : ''}

        ${hasVisual ? 'NOTE: The user has provided an image. Analyze the image to inform the strategy.' : ''}
    `;

    const contents = hasVisual
        ? [
            { inlineData: { mimeType: 'image/png', data: imageBase64 } },
            { text: textPart }
        ]
        : textPart;

    try {
        const planData = await withRetry(async () => {
            const response = await genAI.models.generateContent({
                model: MODEL_ORCHESTRATOR,
                contents: contents,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION_ORCHESTRATOR + "\n\n" + PRIME_DIRECTIVES,
                    responseMimeType: "application/json",
                    responseSchema: ORCHESTRATOR_SCHEMA,
                    temperature: 0.7,
                    thinkingBudget: { thinkingBudget: thinkingBudget },
                }
            });

            const text = response.text;
            if (!text) throw new Error("Orchestrator returned empty response");
            return JSON.parse(text);
        });
        res.json(planData);
    } catch (error) {
        console.error('Orchestration failed:', error);
        res.status(500).json({ error: 'Orchestration failed' });
    }
});

app.post('/api/execute', async (req, res) => {
    const { task, context, retryCount, previousCritique } = req.body;
    const hasVisual = !!context.visualData;

    const entropy = MathKernel.calculateEntropy(task.description, 0, hasVisual);
    const thinkingBudget = MathKernel.calculateThinkingBudget(entropy, task.capability, hasVisual, 1.0);

    let model = MODEL_WORKER_FLASH;
    const tools = [];

    if (task.capability === 'RESEARCH' || task.capability === 'CODING' || hasVisual) {
        model = MODEL_WORKER_PRO;
    } else if (task.capability === 'ANALYSIS' && entropy > 0.5) {
        model = MODEL_WORKER_PRO;
    } else if (retryCount > 0) {
        if (previousCritique.includes("JSON") || previousCritique.includes("format")) {
            model = MODEL_WORKER_FLASH;
        } else {
            model = MODEL_WORKER_PRO;
        }
    }

    const config = {
        systemInstruction: `
            ${PRIME_DIRECTIVES}
            ${GOVERNANCE_PROTOCOLS}
            ${IRONCLAD_PROTOCOLS}

            You are a specialized agent (${task.role}).
            Your objective is: ${task.description}.

            [MATH KERNEL PARAMETERS]
            Complexity Entropy: ${entropy}
            Visual Context: ${hasVisual ? 'Present' : 'Absent'}

            [V8.0 COGNITIVE GHOST PROTOCOL]
            You MUST separate your internal reasoning from your final output.
            Format your response strictly as:
            <thought>
            (Your internal monologue, reasoning, and scratchpad goes here)
            </thought>
            <output>
            (Your final deliverable goes here)
            </output>

            ${retryCount > 0 ? `[SELF-HEALING MODE ACTIVATED - ATTEMPT ${retryCount + 1}]\nCRITIQUE: ${previousCritique}\n\nYOU MUST FIX THESE ISSUES.` : ''}
        `,
        temperature: retryCount > 0 ? 0.5 : 0.7,
    };

    if (model === MODEL_WORKER_PRO && !task.requiresWebSearch) {
        config.thinkingConfig = { thinkingBudget: thinkingBudget };
    }

    if (task.requiresWebSearch) {
        model = MODEL_WORKER_PRO;
        tools.push({ googleSearch: {} });
        config.tools = tools;
        config.thinkingConfig = { thinkingBudget: Math.min(thinkingBudget, 2048) };
    }

    const dependencyContext = context.dependencyOutputs.length > 0
        ? `[CRITICAL INPUTS FROM UPSTREAM AGENTS]\n${context.dependencyOutputs.map(o => `--- REPORT FROM ${o.role} ---\n${o.content}\n--- END REPORT ---\n`).join('\n')}`
        : `[PEER ACTIVITY] Working in parallel with ${context.peers.length} other agents.`;

    const textPrompt = `
        [MISSION BRIEFING]
        User Goal: "${context.originalPrompt}"
        Orchestrator Strategy: "${context.strategy}"

        ${context.globalHistory ? `[PROJECT HISTORY]\n${context.globalHistory.slice(-2000)}...` : ''}

        ${dependencyContext}

        [YOUR ASSIGNMENT]
        ROLE: ${task.role}
        TASK: ${task.description}

        INSTRUCTIONS:
        Execute your task.
        ${hasVisual ? 'Refer to the attached image in your analysis.' : ''}
    `;

    const contents = hasVisual
        ? [
            { inlineData: { mimeType: 'image/png', data: context.visualData } },
            { text: textPrompt }
        ]
        : textPrompt;

    try {
        const response = await withRetry(async () => {
            const result = await genAI.models.generateContent({
                model: model,
                contents: contents,
                config: config
            });
            return result;
        });

        const rawText = response.text || "No output generated.";
        let internalMonologue = "";
        let finalOutput = rawText;

        const thoughtMatch = rawText.match(/<thought>([\s\S]*?)<\/thought>/);
        const outputMatch = rawText.match(/<output>([\s\S]*?)<\/output>/);

        if (thoughtMatch) {
            internalMonologue = thoughtMatch[1].trim();
        }
        if (outputMatch) {
            finalOutput = outputMatch[1].trim();
        } else {
            if (thoughtMatch) {
                finalOutput = rawText.replace(thoughtMatch[0], "").trim();
            }
        }

        const citations = [];
        if (task.requiresWebSearch && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = response.candidates[0].groundingMetadata.groundingChunks;
            chunks.forEach((c) => {
                if (c.web?.uri && c.web?.title) {
                    citations.push({ uri: c.web.uri, title: c.web.title });
                }
            });
        }

        res.json({
            output: finalOutput,
            internalMonologue,
            model,
            citations
        });

    } catch (error) {
        console.error('Execution failed:', error);
        res.status(500).json({ error: 'Execution failed' });
    }
});

app.post('/api/synthesize', async (req, res) => {
    const { originalPrompt, agentResults, history } = req.body;

    const reports = agentResults.map(a =>
        `## Report from ${a.role}\n${a.output}\n`
    ).join("\n---\n");

    const content = `
        [METHODOLOGY PHASE: FINAL ASSEMBLY]
        User Request: "${originalPrompt}"
        ${history ? `Previous Context: ${history}` : ''}
        ${reports}

        Synthesize these reports into one cohesive final answer in Markdown format.
    `;

    try {
        const response = await withRetry(async () => {
            const result = await genAI.models.generateContent({
                model: MODEL_SYNTHESIZER,
                contents: content,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION_SYNTHESIZER + "\n\n" + PRIME_DIRECTIVES,
                    temperature: 0.4,
                }
            });
            return result;
        });
        res.json({ output: response.text || "Synthesis failed." });
    } catch (error) {
        console.error('Synthesis failed:', error);
        res.status(500).json({ error: 'Synthesis failed' });
    }
});

app.post('/api/learn', async (req, res) => {
    const { userPrompt, finalOutput } = req.body;
    try {
        const lessonPromise = (async () => {
            const prompt = `
              [SYSTEM: RECURSIVE SELF-IMPROVEMENT]
              Analyze the following Mission.
              USER REQUEST: "${userPrompt.slice(0, 300)}"
              MISSION OUTCOME: "${finalOutput.slice(0, 1000)}..."
              Identify ONE (1) critical strategic lesson or pattern.
              Format: "Insight: [The lesson]"
            `;
            try {
              const response = await genAI.models.generateContent({
                model: MODEL_WORKER_FLASH,
                contents: prompt,
                config: { temperature: 0.3 }
              });
              const text = response.text?.replace("Insight:", "").trim() || "";
              if (!text) return null;
              return {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: Date.now(),
                insight: text,
                context: "Post-Mission Analysis"
              };
            } catch (e) { return null; }
        })();

        const mutationPromise = (async () => {
            if (finalOutput.length > 500) return null;

            const prompt = `
              [EVOLUTIONARY LOGIC]
              The system struggled to produce a detailed response for: "${userPrompt.slice(0, 200)}".
              Propose a MUTATION to the System Instruction to prevent it next time.
              Return JSON: { "originalInstruction": "Standard", "mutatedInstruction": "New instruction...", "reasoning": "...", "scoreImprovement": 0.15 }
            `;
            try {
              const response = await genAI.models.generateContent({
                  model: MODEL_WORKER_FLASH,
                  contents: prompt,
                  config: { responseMimeType: "application/json" }
              });
              const data = JSON.parse(response.text || "{}");
              if (!data.mutatedInstruction) return null;
              return { ...data, id: Math.random().toString(36).substring(2, 9) };
            } catch (e) { return null; }
        })();

        const [lesson, mutation] = await Promise.all([lessonPromise, mutationPromise]);
        res.json({ lesson, mutation });
    } catch (error) {
        console.error('Learn failed:', error);
        res.status(500).json({ error: 'Learn failed' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message, history, swarmContext } = req.body;
    try {
        const chatHistory = history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const chat = genAI.chats.create({
            model: 'gemini-3-pro-preview',
            history: chatHistory,
            config: {
              systemInstruction: `
                You are Nexus, the tactical AI Co-Pilot.
                You have access to [SWARM CONSTITUTION], [GOVERNANCE PROTOCOLS], and [IRONCLAD SECURITY].

                ${PRIME_DIRECTIVES}
                ${IRONCLAD_PROTOCOLS}

                [CURRENT SWARM STATE]
                ${swarmContext}

                Mission: Provide tactical advice, explain swarm actions, and enforce security.
              `
            }
        });

        const stream = await chat.sendMessageStream(message);
        res.setHeader('Content-Type', 'text/plain');
        for await (const chunk of stream) {
            if (chunk.text) {
                res.write(chunk.text());
            }
        }
        res.end();

    } catch (error) {
        console.error('Chat failed:', error);
        res.status(500).json({ error: 'Chat failed' });
    }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
