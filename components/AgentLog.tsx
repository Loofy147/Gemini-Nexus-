import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface AgentLogProps {
  logs: LogEntry[];
}

export const AgentLog: React.FC<AgentLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-nexus-900 border border-nexus-700 rounded-lg overflow-hidden font-mono text-xs">
      <div className="px-4 py-2 bg-nexus-800 border-b border-nexus-700 flex items-center justify-between">
        <span className="text-gray-400 font-bold">SYSTEM TERMINAL</span>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {logs.length === 0 && (
          <div className="text-gray-600 italic">{'>'}{'>'} System Ready...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-gray-500 select-none">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
            <span className={`font-bold min-w-[80px] text-right ${
              log.source === 'ORCHESTRATOR' ? 'text-nexus-purple' :
              log.source === 'SYSTEM' ? 'text-gray-400' : 'text-nexus-accent'
            }`}>
              {log.source}:
            </span>
            <span className={`break-words flex-1 ${
               log.type === 'error' ? 'text-red-400' :
               log.type === 'success' ? 'text-green-400' :
               'text-gray-300'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};