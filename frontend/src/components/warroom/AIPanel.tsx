import { AILogEntry } from '@/types/shipment';
import { Brain, Activity } from 'lucide-react';
import { useRef, useEffect } from 'react';

const typeColors: Record<string, string> = {
  info: 'text-primary',
  warning: 'text-cyber-orange',
  critical: 'text-cyber-red',
  success: 'text-cyber-green',
};

interface AIPanelProps {
  logs: AILogEntry[];
  riskScore: number;
  agents?: Record<string, number>;
}

export const AIPanel = ({ logs, riskScore, agents = {} }: AIPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const agentEntries = Object.entries(agents);

  return (
    <div className="h-full flex flex-col">
      {/* Header section */}
      <div className="p-3 border-b border-border bg-card/40">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Brain className="w-3 h-3 text-primary animate-pulse" /> Live Swarm Intelligence
        </h3>
      </div>

      {/* True Agent Diagnostic Output */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="text-[10px] text-primary/80 font-mono mb-3 p-1.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap overflow-hidden shadow-[inset_0_0_10px_rgba(34,211,238,0.05)] text-center">
          P(R) = 1 - Π (1 - P(agent))
        </div>

        {agentEntries.length > 0 ? (
          agentEntries.map(([name, score]) => (
            <div key={name} className="flex justify-between items-center text-[11px] font-mono border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded bg-primary animate-pulse opacity-${score > 0.5 ? '100' : '40'}`} />
                {name}
              </span>
              <span className={`font-bold ${score > 0.5 ? 'text-cyber-red animate-pulse' : score > 0.2 ? 'text-cyber-orange' : 'text-cyber-green'}`}>
                P = {(score * 100).toFixed(0)}%
              </span>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground font-mono animate-pulse text-center py-2">Establishing Link...</div>
        )}
      </div>

      {/* Aggregate Output */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-bold tracking-wide">COMPOSITE RISK</span>
          <span className={`text-xl font-bold font-mono ${riskScore > 60 ? 'text-cyber-red' : riskScore > 30 ? 'text-cyber-orange' : 'text-cyber-green cyber-glow-text'}`}>
            {riskScore}%
          </span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full ${riskScore > 60 ? 'bg-cyber-red shadow-[0_0_10px_#ef4444]' : riskScore > 30 ? 'bg-cyber-orange shadow-[0_0_10px_#f59e0b]' : 'bg-primary shadow-[0_0_10px_#22d3ee]'}`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>

      {/* Active AI Explanations */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {logs.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center font-mono py-4">Awaiting telemetry logs...</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 p-2 rounded text-xs bg-secondary/10 border border-transparent hover:border-border transition-colors">
            <Activity className={`w-3 h-3 mt-0.5 shrink-0 ${typeColors[log.type]}`} />
            <div className="min-w-0">
              <p className={`${typeColors[log.type]} font-mono text-[11px] break-words leading-relaxed`}>{log.message}</p>
              <p className="text-[9px] text-muted-foreground/60 font-mono mt-1">
                {log.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
