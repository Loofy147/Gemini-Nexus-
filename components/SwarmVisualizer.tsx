

import React, { useState, useEffect, useRef } from 'react';
import { AgentTask, AgentStatus, AgentCapability, MetricPoint } from '../types';

// Icons
const IconCpu = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1V4M15 1V4M9 20V23M15 20V23M20 9H23M20 14H23M1 9H4M1 14H4"/></svg>
);
export const IconZap = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const IconGlobe = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const IconCheck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);
const IconLoader = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
const IconBrain = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);
const IconLock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconShield = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const IconHeal = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);
const IconPause = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
);

interface SwarmVisualizerProps {
  tasks: AgentTask[];
  swarmState: string;
  onSelectTask: (task: AgentTask) => void;
  selectedTaskId?: string;
  onAction?: (taskId: string, action: 'resume' | 'abort' | 'edit') => void;
}

// V9.0 SINGULARITY OSCILLOSCOPE
const SingularityOscilloscope = ({ history }: { history: MetricPoint[] }) => {
  if (!history || history.length < 2) return null;

  const width = 280;
  const height = 40;
  const padding = 2;

  // Normalize data
  const maxAleph = Math.max(...history.map(p => p.aleph), 1);

  const points = history.map((p, i) => {
    const x = (i / (history.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((p.aleph / maxAleph) * (height - 2 * padding)) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="absolute top-2 right-2 w-[280px] h-[40px] opacity-30 pointer-events-none">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="alephGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M ${points} L ${width} ${height} L 0 ${height} Z`} fill="url(#alephGradient)" />
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

const AgentCard: React.FC<{ task: AgentTask; onClick: () => void; isSelected: boolean; onAction?: (id: string, action: any) => void }> = ({ task, onClick, isSelected, onAction }) => {
  let borderColor = "border-nexus-700/50";
  let bgClass = "glass-card";
  let textClass = "text-gray-400";
  let StatusIcon = IconCpu;
  let animation = "";
  let statusLabel = task.status;
  let shadow = "";

  if (task.status === AgentStatus.QUEUED) {
    bgClass = "bg-nexus-900/30 border-dashed border-nexus-700/30";
  } else if (task.status === AgentStatus.BLOCKED) {
    bgClass = "bg-nexus-950/50 border-dashed border-nexus-700/30 opacity-60";
    StatusIcon = IconLock;
    statusLabel = `WAITING (${task.dependencies.length})`;
  } else if (task.status === AgentStatus.THINKING || task.status === AgentStatus.WORKING) {
    borderColor = "border-nexus-cyan/50";
    bgClass = "bg-nexus-800/80";
    textClass = "text-nexus-cyan";
    shadow = "shadow-[0_0_20px_rgba(6,182,212,0.2)]";
    StatusIcon = IconLoader;
    animation = "animate-spin-slow";
  } else if (task.status === AgentStatus.VERIFYING) {
    borderColor = "border-nexus-purple/50";
    bgClass = "bg-nexus-900/90";
    textClass = "text-nexus-purple";
    StatusIcon = IconShield;
    animation = "animate-pulse";
    statusLabel = "QA CHECK";
  } else if (task.status === AgentStatus.HEALING) {
    borderColor = "border-nexus-warning/50";
    bgClass = "bg-nexus-900/90";
    textClass = "text-nexus-warning";
    StatusIcon = IconHeal;
    animation = "animate-pulse-fast";
    statusLabel = "SELF-HEALING";
  } else if (task.status === AgentStatus.AWAITING_INPUT) {
    borderColor = "border-nexus-error/80"; // Red for attention
    bgClass = "bg-nexus-950";
    textClass = "text-white";
    StatusIcon = IconPause;
    animation = "animate-pulse";
    statusLabel = "NEURAL HANDSHAKE";
    shadow = "shadow-[0_0_20px_rgba(239,68,68,0.4)]";
  } else if (task.status === AgentStatus.COMPLETED) {
    borderColor = "border-nexus-success/50";
    textClass = "text-nexus-success";
    StatusIcon = IconCheck;
    shadow = "shadow-[0_0_10px_rgba(16,185,129,0.1)]";
  } else if (task.status === AgentStatus.FAILED) {
    borderColor = "border-nexus-error/50";
    textClass = "text-nexus-error";
  }

  // Capability Icon logic
  let CapabilityIcon = IconCpu;
  let capabilityColor = "text-gray-400";
  let modelLabel = "STD";

  if (task.requiresWebSearch) {
    CapabilityIcon = IconGlobe;
    capabilityColor = "text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]";
    modelLabel = "PRO + WEB";
  } else if (task.capability === AgentCapability.FAST_TASK) {
    CapabilityIcon = IconZap;
    capabilityColor = "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]";
    modelLabel = "FLASH";
  } else if (task.capability === AgentCapability.ANALYSIS || task.capability === AgentCapability.CODING) {
    CapabilityIcon = IconBrain;
    capabilityColor = "text-nexus-purple drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]";
    modelLabel = "PRO + THINK";
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col p-5 rounded-xl border transition-all duration-300 cursor-pointer
        hover:scale-[1.02] min-h-[180px] backdrop-blur-md overflow-hidden animate-slide-up group
        ${bgClass} ${borderColor} ${textClass} ${shadow}
        ${isSelected ? 'ring-2 ring-nexus-cyan ring-offset-2 ring-offset-nexus-950 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : ''}
      `}
    >
      {/* Background Pulse for active agents */}
      {(task.status === AgentStatus.WORKING || task.status === AgentStatus.HEALING) && (
        <div className="absolute inset-0 bg-gradient-to-tr from-nexus-cyan/10 to-transparent animate-pulse pointer-events-none" />
      )}

      {/* v9.0 Oscilloscope Background */}
      {task.metricsHistory && (
         <SingularityOscilloscope history={task.metricsHistory} />
      )}

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-nexus-950/50 border border-white/5 ${capabilityColor}`}>
            <CapabilityIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-50 text-white">ID: {task.id.slice(0, 4)}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.internalMonologue && (
             <div className="p-1.5 rounded bg-nexus-purple/20 text-nexus-purple border border-nexus-purple/50 animate-pulse" title="Brain Activity Detected">
               <IconBrain className="w-3 h-3" />
             </div>
          )}
          {task.citations && task.citations.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-nexus-950/50 px-2 py-1 rounded text-blue-400 border border-blue-500/20" title={`${task.citations.length} Citations Found`}>
              <IconGlobe className="w-3 h-3" />
              {task.citations.length}
            </span>
          )}
          <StatusIcon className={`w-5 h-5 ${animation}`} />
        </div>
      </div>

      <h3 className="font-bold text-lg mb-2 leading-tight text-gray-100 truncate relative z-10 font-sans tracking-tight">{task.role}</h3>
      <p className="text-xs text-gray-400 line-clamp-2 overflow-hidden mb-4 leading-relaxed font-mono relative z-10">{task.description}</p>

      {/* Hover Detail for Critique */}
      {task.critique && (
        <div className="absolute inset-x-0 top-20 p-4 bg-nexus-950/95 backdrop-blur text-[10px] text-nexus-warning opacity-0 group-hover:opacity-100 transition-opacity z-20 border-y border-nexus-warning/30 italic">
          Last Feedback: "{task.critique.slice(0,100)}..."
        </div>
      )}

      {/* v9.0 NEURAL HANDSHAKE UI */}
      {task.status === AgentStatus.AWAITING_INPUT && onAction && (
         <div className="absolute inset-x-0 bottom-0 bg-nexus-950 border-t border-nexus-error/50 p-4 z-30 animate-in slide-in-from-bottom-5">
            <div className="text-[10px] font-mono text-nexus-error uppercase tracking-widest mb-2 flex items-center gap-2">
               <IconPause className="w-3 h-3" />
               Awaiting Authorization
            </div>
            <div className="grid grid-cols-2 gap-2">
               <button
                  onClick={(e) => { e.stopPropagation(); onAction(task.id, 'resume'); }}
                  className="bg-nexus-success/20 hover:bg-nexus-success/40 text-nexus-success border border-nexus-success/50 rounded py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
               >
                 Authorize
               </button>
               <button
                  onClick={(e) => { e.stopPropagation(); onAction(task.id, 'abort'); }}
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 rounded py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
               >
                 Abort
               </button>
            </div>
         </div>
      )}

      {/* Math Kernel Visualization */}
      <div className="relative z-10 mb-3 grid grid-cols-2 gap-2 bg-nexus-950/40 p-2 rounded-lg border border-white/5">
         <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-wider opacity-50">Entropy (Ω)</span>
            <div className="flex items-center gap-1">
               <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-nexus-purple" style={{ width: `${(task.metrics?.entropy || 0) * 100}%` }}></div>
               </div>
               <span className="text-[9px] font-mono">{task.metrics?.entropy?.toFixed(2) || '0.00'}</span>
            </div>
         </div>
         <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-wider opacity-50">Conf (P)</span>
            <div className="flex items-center gap-1">
               <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-nexus-cyan" style={{ width: `${(task.metrics?.confidence || 0) * 100}%` }}></div>
               </div>
               <span className="text-[9px] font-mono">{task.metrics?.confidence?.toFixed(2) || '0.00'}</span>
            </div>
         </div>
         {/* v8.0 Aleph Index */}
         {task.metrics?.singularityIndex !== undefined && (
            <div className="col-span-2 border-t border-white/5 pt-1 mt-1 flex justify-between items-center">
               <span className="text-[8px] uppercase tracking-wider opacity-50 text-nexus-success">ℵ Index</span>
               <span className="text-[10px] font-bold text-nexus-success font-mono">{task.metrics.singularityIndex.toFixed(2)}</span>
            </div>
         )}
      </div>

      {task.dependencies && task.dependencies.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1 relative z-10">
          {task.dependencies.map(dep => (
             <span key={dep} className="text-[9px] px-2 py-1 rounded bg-nexus-950/80 text-gray-500 border border-white/5 flex items-center gap-1">
               <span className="w-1 h-1 rounded-full bg-gray-600"></span>
               WAITING: {dep.slice(0,4)}
             </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between text-[10px] font-mono uppercase tracking-widest relative z-10">
         <span className={`${capabilityColor} font-bold`}>{modelLabel}</span>
         <span className="opacity-70">{statusLabel}</span>
      </div>

      {/* Progress Bar for Active */}
      {(task.status === AgentStatus.WORKING || task.status === AgentStatus.HEALING) && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-nexus-900">
          <div className={`h-full ${task.status === AgentStatus.HEALING ? 'bg-nexus-warning' : 'bg-nexus-cyan'} animate-[pulse_1.5s_ease-in-out_infinite] w-full origin-left scale-x-100 shadow-[0_0_10px_currentColor]`}></div>
        </div>
      )}
    </div>
  );
};

export const SwarmVisualizer: React.FC<SwarmVisualizerProps> = ({ tasks, swarmState, onSelectTask, selectedTaskId, onAction }) => {
  if (tasks.length === 0 && swarmState === 'IDLE') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-nexus-cyan/30 border-2 border-dashed border-nexus-700/30 rounded-2xl bg-nexus-900/20">
        <IconBrain className="w-24 h-24 mb-6 opacity-20 animate-pulse" />
        <p className="font-mono text-sm tracking-widest">SYSTEM ONLINE. AWAITING DIRECTIVE.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full auto-rows-min pb-6">
      {tasks.map((task) => (
        <AgentCard
          key={task.id}
          task={task}
          onClick={() => onSelectTask(task)}
          isSelected={selectedTaskId === task.id}
          onAction={onAction}
        />
      ))}

      {swarmState === 'ORCHESTRATING' && (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-nexus-purple/50 border-dashed bg-nexus-purple/5 animate-pulse text-nexus-purple shadow-[0_0_20px_rgba(139,92,246,0.1)] backdrop-blur-sm">
          <IconBrain className="w-10 h-10 mb-3 animate-bounce" />
          <span className="font-mono text-xs tracking-[0.2em]">ORCHESTRATING...</span>
        </div>
      )}

      {swarmState === 'SYNTHESIZING' && (
        <div className="col-span-full mt-4 p-6 rounded-xl border border-nexus-cyan bg-gradient-to-r from-nexus-900/90 to-nexus-800/90 text-nexus-cyan backdrop-blur-xl flex items-center justify-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-in slide-in-from-bottom-4">
             <div className="relative">
               <IconBrain className="w-6 h-6 animate-pulse relative z-10" />
               <div className="absolute inset-0 bg-nexus-cyan blur-lg opacity-50 animate-pulse"></div>
             </div>
             <span className="font-mono font-bold tracking-[0.3em] text-sm">SYNTHESIZING INTELLIGENCE</span>
        </div>
      )}
    </div>
  );
};
