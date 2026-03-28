import { Route } from '@/types/shipment';
import { MapPin, Clock, DollarSign, Shield } from 'lucide-react';

interface RoutePanelProps {
  routes: Route[];
  activeIndex: number;
}

export const RoutePanel = ({ routes, activeIndex }: RoutePanelProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-3 h-3 text-primary" /> Route Options
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {routes.map((route, i) => (
          <div
            key={route.id}
            className={`p-3 rounded-lg border transition-all ${
              i === activeIndex
                ? 'border-primary/50 bg-primary/10 cyber-glow'
                : 'border-border/50 bg-secondary/20 hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{route.name}</span>
              {i === activeIndex && (
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">ACTIVE</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{route.time}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                <span className="font-mono">{route.cost}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span className={`font-mono ${route.risk > 40 ? 'text-cyber-red' : route.risk > 25 ? 'text-cyber-orange' : 'text-cyber-green'}`}>
                  {route.risk}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
