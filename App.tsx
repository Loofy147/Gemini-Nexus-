
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AgentStatus, SwarmState, AgentTask, LogEntry, Playbook, ChatMessage, RightPanelTab, Lesson, PromptMutation, Vector, MerkleNode, MetricPoint } from './types';
import { MathKernel, IntegrityProtocol, MerkleKernel } from './common/constitution_refactor';
import { SwarmVisualizer, IconZap } from './components/SwarmVisualizer';
import { AgentLog } from './components/AgentLog';
import { MetricsDashboard } from './components/MetricsDashboard';
import { PLAYBOOKS } from './common/constants';

const uuid = () => Math.random().toString(36).substring(2, 9);

const CodeBlock: React.FC<{ language: string, code: string }> = ({ language, code }) => {
  const highlighted = code
    .replace(/\b(const|let|var|function|return|if|else|for|while|import|from|export|async|await)\b/g, '<span class="code-keyword">$1</span>')
    .replace(/(['"`].*?['"`])/g, '<span class="code-string">$1</span>')
    .replace(/\b([a-zA-Z]+)(?=\()/g, '<span class="code-function">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>');

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-nexus-700/50 shadow-2xl">
      <div className="bg-nexus-950 px-4 py-2 flex items-center justify-between border-b border-nexus-800">
         <span className="text-[10px] font-mono text-gray-500 uppercase">{language || 'CODE'}</span>
         <div className="flex gap-1.5">
           <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
           <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
           <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
         </div>
      </div>
      <div
        className="code-block text-xs md:text-sm overflow-x-auto p-4 bg-[#0d1117]"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-4 text-gray-300 leading-relaxed font-sans">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          if (match) return <CodeBlock key={index} language={match[1] || ''} code={match[2]} />;
        }
        const lines = part.split('\n');
        return (
          <div key={index}>
            {lines.map((line, i) => {
              if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-nexus-cyan mt-6 mb-3 tracking-tight">{line.replace('### ', '')}</h3>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-nexus-700/50 pb-2 flex items-center gap-2"><span className="text-nexus-purple">#</span> {line.replace('## ', '')}</h2>;
              if (line.startsWith('# ')) return <h1 key={i} className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-nexus-cyan to-nexus-purple mt-6 mb-8 drop-shadow-lg">{line.replace('# ', '')}</h1>;
              if (line.trim().startsWith('- ')) return <li key={i} className="ml-4 list-disc marker:text-nexus-cyan pl-2 text-gray-300">{line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')}</li>;
              if (line.trim().startsWith('1. ')) return <li key={i} className="ml-4 list-decimal marker:text-nexus-purple pl-2 text-gray-300">{line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')}</li>;
              if (line.trim() === '---') return <hr key={i} className="border-nexus-700/50 my-8" />;
              if (line.trim().length === 0) return null;
              return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-nexus-cyan underline underline-offset-4 decoration-nexus-cyan/30 hover:decoration-nexus-cyan transition-all">$1</a>') }} />;
            })}
          </div>
        );
      })}
    </div>
  );
};

const SystemTelemetry = ({ activeAgents, lastActiveTimestamp, lessons, systemHealth, cortexStats }: { activeAgents: number, lastActiveTimestamp: number, lessons: number, systemHealth: number, cortexStats: any }) => {
  const [plasticity, setPlasticity] = useState(1.0);

  useEffect(() => {
    const interval = setInterval(() => {
      const p = MathKernel.calculatePlasticity(lastActiveTimestamp, Date.now());
      setPlasticity(p);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeAgents, lastActiveTimestamp]);

  return (
    <div className="flex items-center gap-6 text-[10px] font-mono text-gray-500 border-l border-nexus-700/50 pl-6 ml-4">
      <div className="flex flex-col">
        <span className="uppercase tracking-wider opacity-50">SYSTEM INTEGRITY</span>
        <span className={`text-lg font-bold ${systemHealth === 100 ? 'text-nexus-success' : systemHealth > 70 ? 'text-nexus-warning' : 'text-nexus-error'}`}>{systemHealth}%</span>
      </div>
      <div className="flex flex-col">
        <span className="uppercase tracking-wider opacity-50">CORTEX LOAD</span>
        <span className="text-lg font-bold text-nexus-purple">{cortexStats?.totalExperiences || 0} <span className="text-[8px]">RULES</span></span>
      </div>
      <div className="flex flex-col">
        <span className="uppercase tracking-wider opacity-50">PLASTICITY (Δt)</span>
        <span className={`text-lg font-bold ${plasticity > 1.2 ? 'text-nexus-warning' : 'text-nexus-success'}`}>{plasticity.toFixed(2)}</span>
      </div>
    </div>
  );
};

const QuickActions = ({ onSelect }: { onSelect: (text: string) => void }) => {
  const actions = [
    { label: "Deep Research", text: "Research the current state of Solid State Batteries and summarize key breakthroughs." },
    { label: "Code Audit", text: "Analyze this React codebase structure and suggest performance improvements." },
    { label: "Market Plan", text: "Create a go-to-market strategy for a new AI SaaS product." },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-4 animate-fade-in">
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => onSelect(action.text)}
          className="text-[10px] font-mono px-3 py-1.5 rounded bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 text-nexus-cyan hover:text-white transition-all text-left"
        >
          <span className="font-bold block text-xs">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [swarmState, setSwarmState] = useState<SwarmState>(SwarmState.IDLE);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [strategy, setStrategy] = useState<string>("");
  const [merkleLogs, setMerkleLogs] = useState<MerkleNode[]>([]);

  const [finalOutput, setFinalOutput] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mutations, setMutations] = useState<PromptMutation[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook>(PLAYBOOKS[0]);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<RightPanelTab>('logs');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState(100);
  const [showThoughts, setShowThoughts] = useState(false); // v8.0 Toggle
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orchestratorStats, setOrchestratorStats] = useState<any>(null);
  const [cortexStats, setCortexStats] = useState<any>(null);

  const latestHashRef = useRef("0000000000000000000000000000000000000000000000000000000000000000");

  const addLog = useCallback(async (source: string, message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = { id: uuid(), timestamp: Date.now(), source, message, type };
    const prevHash = latestHashRef.current;
    const contentToHash = prevHash + JSON.stringify(entry);
    const hash = await MerkleKernel.digest(contentToHash);
    latestHashRef.current = hash;

    const node: MerkleNode = { hash, prevHash, entry };
    setMerkleLogs(prev => [...prev, node]);
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Integrity Watchdog: Monitors system health
  useEffect(() => {
    const interval = setInterval(() => {
       setSystemHealth(IntegrityProtocol.calculateSystemHealth(tasks));
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        addLog('SYSTEM', 'Ocular Uplink Established: Image loaded.', 'success');
        speak("Visual input received.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIgnite = async () => {
    if (!prompt.trim()) return;

    if (swarmState === SwarmState.COMPLETED) {
       addLog('SYSTEM', 'Continuing session with new directive...', 'info');
    } else {
       addLog('SYSTEM', 'Initializing Swarm Nexus...', 'info');
       speak("Nexus online. Analyzing directive.");
    }

    setSwarmState(SwarmState.EXECUTING);
    setTasks([]);
    setStrategy("");
    setFinalOutput(null);
    setMerkleLogs([]);
    latestHashRef.current = "0000000000000000000000000000000000000000000000000000000000000000";
    setSelectedTask(null);
    setActiveTab('logs');

    try {
      addLog('EXECUTOR', `Executing with prompt: "${prompt}"...`);
      speak("Executing swarm.");

      const response = await fetch('http://localhost:3001/api/swarm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, maxAgents: 5 }),
      });

      const { output, orchestratorStats, cortexStats } = await response.json();

      setFinalOutput(output);
      setOrchestratorStats(orchestratorStats);
      setCortexStats(cortexStats);
      addLog('EXECUTOR', `Execution complete.`, 'success');
      speak("Execution complete.");
      setSwarmState(SwarmState.COMPLETED);

    } catch (error) {
      setSwarmState(SwarmState.ERROR);
      addLog('SYSTEM', `Execution failed: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
      speak("Execution failed.");
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatStreaming) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatStreaming(true);

    const swarmContext = `Strategy: ${strategy || 'None'}\nState: ${swarmState}\nAgents: ${tasks.map(t => `${t.role}: ${t.status}`).join(', ')}`;

    try {
      let fullResponse = "";
      const stream = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMsg.text, history: chatMessages, swarmContext }),
      });

      if (!stream.body) {
        return;
      }
      const reader = stream.body.getReader();
      const decoder = new TextDecoder();

      const aiMsgId = Date.now();
      setChatMessages(prev => [...prev, { role: 'model', text: '', timestamp: aiMsgId }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        fullResponse += decoder.decode(value);
        setChatMessages(prev => prev.map(msg =>
          msg.timestamp === aiMsgId ? { ...msg, text: fullResponse } : msg
        ));
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsChatStreaming(false);
    }
  };

  const downloadMissionPackage = () => {
    const missionData = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      strategy,
      output: finalOutput,
      tasks: [],
      logs: merkleLogs.map(n => n.entry),
      merkleChain: merkleLogs.map(n => ({ hash: n.hash, prevHash: n.prevHash })),
      lessons,
      mutations,
      orchestratorStats,
      cortexStats,
    };

    const blob = new Blob([JSON.stringify(missionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-mission-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isBusy = swarmState !== SwarmState.IDLE && swarmState !== SwarmState.COMPLETED && swarmState !== SwarmState.ERROR;

  return (
    <div className="min-h-screen font-sans selection:bg-nexus-cyan selection:text-nexus-950 text-gray-200">
      <header className="glass-panel sticky top-0 z-50 border-b-0 border-b-white/5">
        <div className="max-w-[1600px] mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <div className="relative group">
                <div className="absolute inset-0 bg-nexus-cyan blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-10 h-10 rounded-lg bg-nexus-950 border border-nexus-cyan/50 flex items-center justify-center relative z-10">
                   <svg className="w-6 h-6 text-nexus-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                 GEMINI<span className="text-nexus-cyan">.NEXUS</span>
               </h1>
               <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                  <span>v9.0 TRANSCENDENCE</span>
                  <span className="w-1 h-1 rounded-full bg-nexus-cyan"></span>
                  <span>ONLINE</span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <SystemTelemetry
                activeAgents={tasks.filter(t => t.status === AgentStatus.WORKING).length}
                lastActiveTimestamp={lastActiveTimestamp}
                lessons={lessons.length}
                systemHealth={systemHealth}
                cortexStats={cortexStats}
             />

             <button
               onClick={() => setVoiceEnabled(!voiceEnabled)}
               className={`p-2 rounded-full border transition-all ${voiceEnabled ? 'border-nexus-cyan text-nexus-cyan bg-nexus-cyan/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-gray-700 text-gray-600'}`}
             >
               {voiceEnabled ? (
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
               ) : (
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9l6 6m0-6l-6 6" /></svg>
               )}
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 gap-6 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-80px)] overflow-hidden">
        <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
          <div className="glass-panel rounded-2xl p-1 shadow-2xl flex-none animate-slide-up" style={{ animationDelay: '0.1s' }}>
             <div className="flex gap-2 p-3 pb-2 overflow-x-auto custom-scrollbar">
                {PLAYBOOKS.map(pb => (
                  <button
                    key={pb.id}
                    onClick={() => { setSelectedPlaybook(pb); speak(`Playbook selected: ${pb.name}`); }}
                    disabled={isBusy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap border ${
                      selectedPlaybook.id === pb.id
                      ? 'bg-nexus-cyan/10 text-nexus-cyan border-nexus-cyan/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'text-gray-500 border-transparent hover:bg-nexus-800 hover:text-gray-300'
                    }`}
                  >
                    <span>{pb.icon}</span>
                    <span className="uppercase tracking-wide font-bold">{pb.name}</span>
                  </button>
                ))}
             </div>

             <div className="relative group p-2">
                <textarea
                  className="w-full bg-nexus-950/50 rounded-xl p-5 pr-40 text-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-cyan/50 resize-none transition-all border border-nexus-700/30"
                  rows={2}
                  placeholder={swarmState === SwarmState.COMPLETED ? "Identify further improvements..." : "Enter mission directive..."}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isBusy}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIgnite(); }
                  }}
                />

                <div className="absolute top-5 right-5 z-20">
                   <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                   <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 rounded-lg border transition-all duration-300 ${selectedImage ? 'border-nexus-success text-nexus-success bg-nexus-success/10 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-nexus-700 text-gray-400 hover:text-white hover:border-nexus-cyan'}`}
                      title="Ocular Uplink (Upload Image)"
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                   </button>
                </div>

                {selectedImage && (
                  <div className="absolute top-16 right-5 z-20 animate-in zoom-in duration-300">
                    <div className="relative group/preview cursor-pointer" onClick={() => setSelectedImage(null)}>
                      <img src={selectedImage} alt="Ocular Uplink" className="w-16 h-12 object-cover rounded-lg border border-nexus-success/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] opacity-80 group-hover/preview:opacity-100 transition-all" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-nexus-error rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity border border-nexus-950"></div>
                      <div className="absolute inset-0 bg-nexus-success/20 animate-pulse pointer-events-none rounded-lg"></div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-5 right-5">
                  <button
                    onClick={handleIgnite}
                    disabled={isBusy || !prompt.trim()}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-bold text-xs tracking-[0.2em] transition-all duration-300 border ${
                      isBusy || !prompt.trim()
                        ? 'bg-nexus-900 border-nexus-700 text-gray-600 cursor-not-allowed'
                        : 'bg-nexus-cyan/10 border-nexus-cyan text-nexus-cyan hover:bg-nexus-cyan hover:text-nexus-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                    }`}
                  >
                    {isBusy ? (
                      <>
                         <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                         <span>PROCESSING</span>
                      </>
                    ) : (
                      <>
                        <span>{swarmState === SwarmState.COMPLETED ? 'RESUME' : 'IGNITE'}</span>
                        <IconZap className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
             </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col glass-panel rounded-2xl overflow-hidden relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {finalOutput ? (
                 <div className="absolute inset-0 z-20 bg-nexus-950/95 p-8 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-500 backdrop-blur-xl">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center justify-between mb-8 border-b border-nexus-700/50 pb-6">
                         <div className="flex items-center gap-4">
                           <div className="p-3 bg-nexus-success/10 rounded-xl text-nexus-success border border-nexus-success/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           </div>
                           <div>
                             <h3 className="text-2xl font-bold text-white tracking-tight">Mission Intelligence</h3>
                             <p className="text-xs text-nexus-success font-mono uppercase tracking-widest mt-1">Successfully Synthesized</p>
                           </div>
                         </div>
                         <div className="flex gap-2">
                            <button
                              onClick={downloadMissionPackage}
                              className="px-4 py-2 rounded-lg border border-nexus-cyan bg-nexus-cyan/10 text-nexus-cyan hover:bg-nexus-cyan hover:text-nexus-950 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Export Data
                            </button>
                            <button
                              onClick={() => setFinalOutput(null)}
                              className="px-4 py-2 rounded-lg border border-nexus-700 text-xs text-gray-400 hover:text-white hover:border-white transition-all uppercase tracking-wider"
                            >
                              Close Report
                            </button>
                         </div>
                      </div>
                      <MarkdownRenderer content={finalOutput} />
                    </div>
                 </div>
            ) : null}

            <div className="p-5 border-b border-white/5 bg-nexus-950/30 flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-nexus-cyan animate-[pulse_0.5s_infinite]' : 'bg-gray-600'}`}></span>
                Active Swarm Matrix
              </h2>
              <span className="text-[10px] text-gray-500 font-mono border border-white/10 px-2 py-1 rounded">{tasks.length} NODES</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gradient-to-b from-transparent to-nexus-950/50">
               <SwarmVisualizer
                  tasks={tasks}
                  swarmState={swarmState}
                  onSelectTask={(t) => { setSelectedTask(t); setActiveTab('inspector'); }}
                  selectedTaskId={selectedTask?.id}
                  onAction={() => {}}
               />
            </div>
          </div>

        </div>

        <div className="lg:col-span-4 h-full flex flex-col glass-panel rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex border-b border-white/5 bg-nexus-950/30">
            {(['inspector', 'logs', 'chat', 'metrics'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative overflow-hidden ${
                  activeTab === tab
                  ? 'text-nexus-cyan'
                  : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-nexus-cyan shadow-[0_0_10px_#06b6d4]"></div>
                )}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden relative bg-nexus-900/40">
            {activeTab === 'inspector' && (
              <div className="h-full overflow-y-auto custom-scrollbar p-6">
                {selectedTask ? (
                  <div className="space-y-6 animate-fade-in">
                     <div className="flex items-center justify-between pb-4 border-b border-white/5">
                       <h3 className="font-bold text-white text-xl tracking-tight">{selectedTask.role}</h3>
                       <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                         selectedTask.status === 'COMPLETED' ? 'bg-nexus-success/10 text-nexus-success border-nexus-success/30' :
                         selectedTask.status === 'FAILED' ? 'bg-nexus-error/10 text-nexus-error border-nexus-error/30' :
                         selectedTask.status === 'AWAITING_INPUT' ? 'bg-nexus-error/20 text-white border-nexus-error animate-pulse' :
                         'bg-nexus-700/50 text-gray-300 border-nexus-700'
                       }`}>{selectedTask.status}</span>
                     </div>

                     <div className="p-4 bg-nexus-950/50 rounded-xl border border-white/5 relative group">
                        <div className="absolute -left-[1px] top-4 bottom-4 w-[2px] bg-nexus-cyan"></div>
                        <span className="text-[10px] text-nexus-cyan font-mono uppercase tracking-widest block mb-2 opacity-70">DIRECTIVE</span>
                        <p className="text-gray-300 text-sm leading-relaxed">{selectedTask.description}</p>
                     </div>

                     {selectedTask.result && (
                       <div>
                         <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block mb-3">Output Stream</span>
                         <div className="text-xs font-mono bg-[#0d1117] p-4 rounded-xl border border-white/10 text-gray-300 leading-relaxed shadow-inner">
                            <MarkdownRenderer content={selectedTask.result} />
                         </div>
                       </div>
                     )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-nexus-cyan/20 space-y-4">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                    <p className="text-xs uppercase tracking-[0.3em]">Select Node to Inspect</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="h-full p-1 relative">
                <div className="absolute top-2 right-4 text-[9px] text-gray-500 font-mono uppercase tracking-widest z-10 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-nexus-purple animate-pulse"></div>
                   Merkle Ledger Active
                </div>
                <AgentLog logs={merkleLogs.map(n => n.entry)} />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-full flex flex-col bg-nexus-950/30">
                 <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="text-center mt-20 opacity-30">
                         <div className="w-16 h-16 border border-nexus-cyan rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                           <svg className="w-8 h-8 text-nexus-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                         </div>
                         <p className="text-xs font-mono uppercase tracking-[0.2em] text-nexus-cyan">Nexus Uplink Established</p>
                      </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm border ${
                          msg.role === 'user'
                          ? 'bg-nexus-cyan/10 border-nexus-cyan/30 text-nexus-cyan rounded-tr-none shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                          : 'bg-nexus-800/80 border-white/5 text-gray-200 rounded-tl-none'
                        }`}>
                          <MarkdownRenderer content={msg.text} />
                        </div>
                      </div>
                    ))}

                    {chatMessages.length === 0 && swarmState === SwarmState.IDLE && (
                      <div className="mt-4 px-2">
                        <p className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">Available Directives:</p>
                        <QuickActions onSelect={(text) => setPrompt(text)} />
                      </div>
                    )}

                    <div ref={chatEndRef} />
                 </div>
                 <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/5 bg-nexus-900/50 backdrop-blur">
                    <div className="relative group">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Query the system..."
                        className="w-full bg-nexus-950 border border-nexus-700/50 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-nexus-cyan/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all placeholder-gray-700"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatStreaming}
                        className="absolute right-2 top-2 p-1.5 bg-nexus-cyan rounded-md text-nexus-900 hover:bg-white hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      </button>
                    </div>
                 </form>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="h-full overflow-y-auto custom-scrollbar p-6">
                <MetricsDashboard orchestratorStats={orchestratorStats} cortexStats={cortexStats} circuitBreakerState="CLOSED" />
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
