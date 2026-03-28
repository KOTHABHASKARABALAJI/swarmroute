import { TimelineEvent } from '@/types/shipment';
import { Clock } from 'lucide-react';

const typeColors: Record<string, string> = {
  departure: 'bg-primary',
  risk: 'bg-cyber-red',
  reroute: 'bg-cyber-orange',
  arrival: 'bg-cyber-green',
  info: 'bg-muted-foreground',
};

interface TimelinePanelProps {
  events: TimelineEvent[];
}

export const TimelinePanel = ({ events }: TimelinePanelProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Clock className="w-3 h-3 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Timeline</h3>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-center gap-4 p-3 min-w-max h-full">
          {events.length === 0 && (
            <p className="text-xs text-muted-foreground">Awaiting events...</p>
          )}
          {events.map((event, i) => (
            <div key={event.id} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1 min-w-[140px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{event.icon}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${typeColors[event.type]}`} />
                </div>
                <p className="text-xs font-semibold text-center">{event.title}</p>
                <p className="text-[10px] text-muted-foreground text-center line-clamp-1">{event.description}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{event.timestamp.toLocaleTimeString()}</p>
              </div>
              {i < events.length - 1 && (
                <div className="w-8 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
