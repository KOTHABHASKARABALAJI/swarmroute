import { create } from 'zustand';
import { Shipment, Notification, AILogEntry, TimelineEvent, Route } from '@/types/shipment';

const generateId = () => Math.random().toString(36).substring(2, 9);

const mockRoutes = (src: string, dest: string): Route[] => [
  { id: generateId(), name: `Direct via Highway`, time: '14h 30m', cost: '$2,400', risk: 25, waypoints: [src, dest], active: true },
  { id: generateId(), name: `Coastal Route`, time: '18h 15m', cost: '$1,800', risk: 40, waypoints: [src, 'Port City', dest], active: false },
  { id: generateId(), name: `Northern Corridor`, time: '16h 45m', cost: '$2,100', risk: 15, waypoints: [src, 'Hub North', dest], active: false },
  { id: generateId(), name: `Express Lane`, time: '12h 00m', cost: '$3,200', risk: 55, waypoints: [src, dest], active: false },
];

const INITIAL_SHIPMENTS: Shipment[] = [];
const INITIAL_NOTIFICATIONS: Notification[] = [];

interface AppStore {
  isAuthenticated: boolean;
  user: { email: string } | null;
  shipments: Shipment[];
  notifications: Notification[];
  aiLogs: Record<string, AILogEntry[]>;
  timelineEvents: Record<string, TimelineEvent[]>;

  login: (email: string) => void;
  logout: () => void;
  addShipment: (shipment: Shipment) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addAILog: (shipmentId: string, entry: AILogEntry) => void;
  addTimelineEvent: (shipmentId: string, event: TimelineEvent) => void;
  unreadCount: () => number;
}

export const useStore = create<AppStore>((set, get) => ({
  isAuthenticated: !!localStorage.getItem('swarmroute_user'),
  user: localStorage.getItem('swarmroute_user') ? { email: localStorage.getItem('swarmroute_user')! } : null,
  shipments: INITIAL_SHIPMENTS,
  notifications: INITIAL_NOTIFICATIONS,
  aiLogs: {},
  timelineEvents: {},

  login: (email) => {
    localStorage.setItem('swarmroute_user', email);
    set({ isAuthenticated: true, user: { email } });
  },
  logout: () => {
    localStorage.removeItem('swarmroute_user');
    set({ isAuthenticated: false, user: null });
  },
  addShipment: (shipment) => set((s) => ({ shipments: [shipment, ...s.shipments] })),
  updateShipment: (id, updates) => set((s) => ({
    shipments: s.shipments.map((sh) => sh.id === id ? { ...sh, ...updates } : sh),
  })),
  addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications] })),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  markAllNotificationsRead: () => set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, read: true })),
  })),
  addAILog: (shipmentId, entry) => set((s) => ({
    aiLogs: { ...s.aiLogs, [shipmentId]: [...(s.aiLogs[shipmentId] || []), entry] },
  })),
  addTimelineEvent: (shipmentId, event) => set((s) => ({
    timelineEvents: { ...s.timelineEvents, [shipmentId]: [...(s.timelineEvents[shipmentId] || []), event] },
  })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
