import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/TopBar';
import { useEffect } from 'react';
import {
  Package, Route, AlertTriangle, CheckCircle, Plus,
  Ship, Truck, Plane, Bike, ArrowRight,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ShipmentStatus, TransportMode } from '@/types/shipment';

const statusConfig: Record<ShipmentStatus, { label: string; color: string }> = {
  'in-transit': { label: 'In Transit', color: 'bg-primary/20 text-primary border-primary/30' },
  'at-risk': { label: 'At Risk', color: 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30' },
  'delayed': { label: 'Delayed', color: 'bg-cyber-red/20 text-cyber-red border-cyber-red/30' },
  'delivered': { label: 'Delivered', color: 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' },
  'processing': { label: 'Processing', color: 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30' },
};

const modeIcons: Record<TransportMode, React.ReactNode> = {
  truck: <Truck className="w-4 h-4" />,
  ship: <Ship className="w-4 h-4" />,
  plane: <Plane className="w-4 h-4" />,
  bike: <Bike className="w-4 h-4" />,
};

const Dashboard = () => {
  const { shipments } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const userEmail = useStore.getState().user?.email || "";
    // Fetch live shipments from backend API restricted to logged-in user
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/shipments/?user_email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data.shipments) {
          const loadedShipments = data.shipments.map((s: any) => ({
            ...s,
            riskScore: s.riskScore,
          }));

          useStore.setState({ shipments: loadedShipments });
        }
      })
      .catch(err => console.error("Error fetching shipments from backend", err));
  }, []);

  const stats = {
    total: shipments.length,
    active: shipments.filter((s) => s.status === 'in-transit').length,
    atRisk: shipments.filter((s) => s.status === 'at-risk' || s.status === 'delayed').length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
  };

  const cards = [
    { label: 'Total Shipments', value: stats.total, icon: Package, color: 'text-primary' },
    { label: 'Active Routes', value: stats.active, icon: Route, color: 'text-primary' },
    { label: 'High-Risk Alerts', value: stats.atRisk, icon: AlertTriangle, color: 'text-cyber-orange' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-cyber-green' },
  ];

  return (
    <div className="min-h-screen grid-bg">
      <TopBar />
      <main className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Control Hub</h1>
            <p className="text-sm text-muted-foreground font-mono">Mission Control · All Systems Operational</p>
          </div>
          <button
            onClick={() => navigate('/create-shipment')}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm cyber-glow hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create New Shipment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="glass-panel rounded-xl p-4 cyber-border">
              <div className="flex items-center justify-between mb-2">
                <c.icon className={`w-5 h-5 ${c.color}`} />
                <span className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Shipments Table */}
        <div className="glass-panel rounded-xl cyber-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Active Shipments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Route</th>
                  <th className="text-left p-3 font-medium">Mode</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Risk</th>
                  <th className="text-left p-3 font-medium">Progress</th>
                  <th className="text-left p-3 font-medium">ETA</th>
                  <th className="text-left p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => {
                  const sc = statusConfig[s.status];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/shipment/${s.id}`)}
                      className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-mono font-semibold text-primary">{s.id}</td>
                      <td className="p-3">
                        <span className="text-foreground">{s.source}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1 text-muted-foreground" />
                        <span className="text-foreground">{s.destination}</span>
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          {modeIcons[s.transportMode]}
                          <span className="capitalize text-xs">{s.transportMode}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-mono text-xs ${s.riskScore > 60 ? 'text-cyber-red' : s.riskScore > 30 ? 'text-cyber-orange' : 'text-cyber-green'}`}>
                          {s.riskScore}%
                        </span>
                      </td>
                      <td className="p-3 w-32">
                        <Progress value={s.progress} className="h-1.5 bg-secondary" />
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{s.eta}</td>
                      <td className="p-3">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
