import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { X, CheckCheck } from 'lucide-react';

const severityColor: Record<string, string> = {
  high: 'border-l-cyber-red bg-cyber-red/5',
  medium: 'border-l-cyber-orange bg-cyber-orange/5',
  low: 'border-l-cyber-green bg-cyber-green/5',
};

export const NotificationsPanel = ({ onClose }: { onClose: () => void }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute right-4 top-14 w-96 max-h-[70vh] glass-panel rounded-xl border border-border overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            <button onClick={markAllNotificationsRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Mark all read
            </button>
            <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={`w-full text-left p-4 border-b border-border/50 border-l-4 hover:bg-secondary/30 transition-colors ${severityColor[n.severity]} ${!n.read ? 'opacity-100' : 'opacity-60'}`}
                onClick={() => {
                  markNotificationRead(n.id);
                  navigate(`/shipment/${n.shipmentId}`);
                  onClose();
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                      {n.timestamp.toLocaleTimeString()} · {n.shipmentId}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
