import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useEffect, useRef, useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { FlatMap } from '@/components/warroom/FlatMap';
import { RoutePanel } from '@/components/warroom/RoutePanel';
import { AIPanel } from '@/components/warroom/AIPanel';
import { TimelinePanel } from '@/components/warroom/TimelinePanel';
import { ArrowLeft, Ship, Truck, Plane, Bike } from 'lucide-react';
import type { AILogEntry, TimelineEvent, Notification } from '@/types/shipment';

const AI_MESSAGES: Array<{ message: string; type: AILogEntry['type'] }> = [
  { message: 'Scanning satellite weather data...', type: 'info' },
  { message: 'Evaluating port congestion levels...', type: 'info' },
  { message: 'Cross-referencing traffic patterns...', type: 'info' },
  { message: 'Storm cell detected — monitoring trajectory', type: 'warning' },
  { message: 'Route risk factor recalculated', type: 'info' },
  { message: 'Fuel cost optimization complete', type: 'success' },
  { message: 'Customs clearance data updated', type: 'info' },
  { message: 'High wind alert on coastal segment', type: 'warning' },
  { message: 'Alternative route identified — 2h faster', type: 'success' },
  { message: 'CRITICAL: Risk threshold exceeded on active route', type: 'critical' },
  { message: 'Initiating dynamic reroute protocol...', type: 'warning' },
  { message: 'New optimal route confirmed by swarm consensus', type: 'success' },
  { message: 'ETA updated with new trajectory', type: 'info' },
  { message: 'Weather pattern clearing — risk decreasing', type: 'success' },
  { message: 'Supply chain node validated', type: 'info' },
];

const TIMELINE_EVENTS: Array<Omit<TimelineEvent, 'id' | 'timestamp'>> = [
  { title: 'Shipment Departed', description: 'Left origin facility', icon: '🚀', type: 'departure' },
  { title: 'Checkpoint Passed', description: 'Customs clearance complete', icon: '✅', type: 'info' },
  { title: 'Storm Detected', description: 'Weather system on route', icon: '⛈️', type: 'risk' },
  { title: 'Route Switched', description: 'AI rerouted via northern corridor', icon: '🔄', type: 'reroute' },
  { title: 'Delay Avoided', description: 'Saved 3h with new route', icon: '⚡', type: 'info' },
  { title: 'Risk Cleared', description: 'Weather system passed', icon: '☀️', type: 'info' },
];

const modeIcons = { truck: Truck, ship: Ship, plane: Plane, bike: Bike };

const WarRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipments, aiLogs, timelineEvents, addAILog, addTimelineEvent, updateShipment, addNotification } = useStore();
  const shipment = shipments.find((s) => s.id === id);
  const [liveAgents, setLiveAgents] = useState<Record<string, number>>({});
  const aiIdx = useRef(0);
  const tlIdx = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const generateId = () => Math.random().toString(36).substring(2, 9);

  useEffect(() => {
    if (!shipment || shipment.status === 'delivered' || !id) return;

    // Seed initial timeline event
    if (!(timelineEvents[id]?.length)) {
      addTimelineEvent(id, { id: generateId(), title: 'Shipment Departed', description: 'Left origin', icon: '🚀', timestamp: new Date(), type: 'departure' });
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}/api/tracking/live/${id}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { current_risk_score, agent_breakdown, event: eventType, message, rerouted, timestamp } = data;

        if (agent_breakdown) {
          setLiveAgents(agent_breakdown);
        }

        // Slowly increment progress for visual effect
        // Use useStore.getState() to avoid dependency staleness if possible, but safe enough here
        // We calculate real risk relative to 100
        const newProgress = Math.min(100, (shipment.progress || 0) + 0.5);
        updateShipment(id, { riskScore: Math.round(current_risk_score * 100), progress: newProgress });

        // Log AI message returned dynamically from the python script
        addAILog(id, {
          id: generateId(),
          message: message,
          type: rerouted ? 'critical' : eventType === 'alert' ? 'warning' : 'info',
          timestamp: new Date(timestamp)
        });

        if (rerouted || eventType === 'alert') {
          addTimelineEvent(id, {
            id: generateId(),
            title: rerouted ? 'Route Dynamic Reroute' : 'AI Alert',
            description: message,
            icon: rerouted ? '🔄' : '⚠️',
            timestamp: new Date(timestamp),
            type: rerouted ? 'reroute' : 'risk'
          });

          addNotification({
            id: generateId(), shipmentId: id, type: 'route-change', severity: 'high',
            title: rerouted ? 'Route Changed' : 'High Risk Alert', description: message,
            timestamp: new Date(timestamp), read: false, icon: rerouted ? '🔄' : '⚠️',
          });
        }
      } catch (e) {
        console.error("Error parsing WS data", e);
      }
    };

    ws.onclose = () => console.log("WarRoom disconnected from Live Agent WebSocket stream.");

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!shipment) {
    return (
      <div className="min-h-screen grid-bg">
        <TopBar />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Shipment not found</p>
            <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline text-sm">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ModeIcon = modeIcons[shipment.transportMode];
  const logs = aiLogs[shipment.id] || [];
  const events = timelineEvents[shipment.id] || [];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />

      {/* Sub header */}
      <div className="h-10 bg-card/50 border-b border-border flex items-center px-4 gap-4 text-xs shrink-0">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </button>
        <div className="w-px h-4 bg-border" />
        <span className="font-mono text-primary font-bold">{shipment.id}</span>
        <ModeIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{shipment.source} → {shipment.destination}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${shipment.status === 'delivered' ? 'bg-cyber-green' : 'bg-primary animate-pulse'}`} />
          <span className="font-mono capitalize">{shipment.status.replace('-', ' ')}</span>
        </div>
      </div>

      {/* War Room Grid */}
      <div className="flex-1 grid grid-cols-[280px_1fr_280px] grid-rows-[1fr_140px] min-h-0">
        {/* Left - Routes */}
        <div className="border-r border-border glass-panel overflow-hidden">
          <RoutePanel routes={shipment.routes} activeIndex={shipment.activeRouteIndex} />
        </div>

        {/* Center - Globe */}
        <div className="relative overflow-hidden bg-background">
          <div className="absolute inset-0 scanline pointer-events-none z-10 opacity-30" />
          <FlatMap
            sourceCoords={shipment.sourceCoords}
            destCoords={shipment.destCoords}
            progress={shipment.progress}
          />
          {/* Progress overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-4 py-2 flex items-center gap-4 z-20 cyber-border">
            <span className="text-xs text-muted-foreground">Progress</span>
            <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${shipment.progress}%` }} />
            </div>
            <span className="font-mono text-xs text-primary">{Math.round(shipment.progress)}%</span>
          </div>
        </div>

        {/* Right - AI Panel */}
        <div className="border-l border-border glass-panel overflow-hidden">
          <AIPanel logs={logs} riskScore={shipment.riskScore} agents={liveAgents} />
        </div>

        {/* Bottom - Timeline (spans all columns) */}
        <div className="col-span-3 border-t border-border glass-panel overflow-hidden">
          <TimelinePanel events={events} />
        </div>
      </div>
    </div>
  );
};

export default WarRoom;
