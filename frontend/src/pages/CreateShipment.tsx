import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Loader2, MapPin } from 'lucide-react';
import type { TransportMode, Priority, Route } from '@/types/shipment';

const PROCESSING_STEPS = [
  'Geocoding locations...',
  'Classifying shipment type...',
  'Activating swarm agents...',
  'Collecting environmental data...',
  'Analyzing risk factors...',
  'Optimizing routes with AI...',
  'Finalizing route selection...',
];

const CreateShipment = () => {
  const navigate = useNavigate();
  const { addShipment } = useStore();
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    source: '',
    destination: '',
    transportMode: 'truck' as TransportMode,
    shipmentType: '',
    departureTime: '',
    deliveryDeadline: '',
    priorities: ['speed'] as Priority[],
  });

  // No longer used, using intelligent endpoint below
  const geocode = async (cityName: string) => {
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.source.trim() || !form.destination.trim()) {
      alert("Please enter both source and destination city names.");
      return;
    }

    setProcessing(true);
    setStep(0);

    try {
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep < PROCESSING_STEPS.length) {
          setStep(currentStep);
        }
      }, 600);

      // intelligent single API call to Gemini powered endpoint
      const safeIsoDate = (dString: string) => {
        try {
          const d = new Date(dString || Date.now());
          return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        } catch {
          return new Date().toISOString();
        }
      };

      const payload = {
        user_email: useStore.getState().user?.email || "anonymous@swarmroute.ai",
        source_query: form.source,
        destination_query: form.destination,
        mode: form.transportMode,
        shipment_type: form.shipmentType || 'General',
        departure_time: safeIsoDate(form.departureTime),
        deadline: safeIsoDate(form.deliveryDeadline),
        priorities: form.priorities
      };

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/shipments/intelligent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      clearInterval(interval);
      setStep(PROCESSING_STEPS.length - 1);

      if (!data || !data.source_parsed || !data.destination_parsed) {
        setProcessing(false);
        alert("Failed to parse locations intelligently.");
        return;
      }

      const srcGeo = data.source_parsed;
      const destGeo = data.destination_parsed;

      const srcCoords: [number, number] = [srcGeo.lat || 0, srcGeo.lon || 0];
      const destCoords: [number, number] = [destGeo.lat || 0, destGeo.lon || 0];

      const routes = data.routes?.map((r: any, idx: number) => ({
        id: r.route_id,
        name: r.type,
        time: `${Math.floor(r.time_hours)}h ${Math.round((r.time_hours % 1) * 60)}m`,
        cost: `$${Math.round(r.cost)}`,
        risk: Math.round(r.risk * 100) || 18,
        waypoints: [],
        active: idx === 0
      })) || [
          { id: '1', name: 'Optimal Route', time: '16h 30m', cost: '$2,200', risk: 18, waypoints: [], active: true }
        ];

      const id = data.shipment_id || `SWR-${String(Math.floor(Math.random() * 900) + 100)}`;

      const displaySource = srcGeo.display || `${srcGeo.city}, ${srcGeo.country}`;
      const displayDest = destGeo.display || `${destGeo.city}, ${destGeo.country}`;

      addShipment({
        id, source: displaySource, destination: displayDest,
        sourceCoords: srcCoords, destCoords: destCoords,
        transportMode: form.transportMode, shipmentType: form.shipmentType || 'General',
        departureTime: form.departureTime, deliveryDeadline: form.deliveryDeadline,
        priorities: form.priorities, status: 'in-transit', riskScore: Math.round((data.composite_risk_score || 0.18) * 100),
        progress: 0, eta: 'Calculating...', routes, activeRouteIndex: 0,
      });

      setTimeout(() => navigate(`/shipment/${id}`), 500);

    } catch (error) {
      console.error("Backend error:", error);
      alert("Error connecting to backend API. Is it running on port 8000?");
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen grid-bg">
        <TopBar />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center cyber-glow pulse-glow">
              <Zap className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-4">
              {PROCESSING_STEPS.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i <= step ? 'opacity-100' : 'opacity-20'}`}>
                  {i < step ? (
                    <div className="w-5 h-5 rounded-full bg-cyber-green flex items-center justify-center text-[10px] font-bold text-primary-foreground">✓</div>
                  ) : i === step ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-border" />
                  )}
                  <span className={`font-mono text-sm ${i === step ? 'text-primary cyber-glow-text' : 'text-muted-foreground'}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <TopBar />
      <main className="p-6 max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold mb-1">Create New Shipment</h1>
        <p className="text-sm text-muted-foreground mb-8 font-mono">Type any city worldwide — AI resolves coordinates automatically</p>

        <form onSubmit={handleSubmit} className="space-y-5 glass-panel rounded-xl p-6 cyber-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> Source Location
              </label>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g. Mumbai, London, Shanghai..."
                required
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyber-red" /> Destination
              </label>
              <Input
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="e.g. New York, Tokyo, Dubai..."
                required
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Transport Mode</label>
              <select value={form.transportMode} onChange={(e) => setForm({ ...form, transportMode: e.target.value as TransportMode })} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50">
                <option value="truck">🚛 Truck</option>
                <option value="ship">🚢 Ship</option>
                <option value="plane">✈️ Plane</option>
                <option value="bike">🏍️ Bike</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Shipment Type</label>
              <Input value={form.shipmentType} onChange={(e) => setForm({ ...form, shipmentType: e.target.value })} placeholder="e.g. Electronics" className="bg-secondary/50 border-border" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Departure Time</label>
              <Input type="datetime-local" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} required className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Delivery Deadline</label>
              <Input type="datetime-local" value={form.deliveryDeadline} onChange={(e) => setForm({ ...form, deliveryDeadline: e.target.value })} required className="bg-secondary/50 border-border" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Optimization Priority (Click in order of preference)</label>
            <div className="flex gap-3">
              {(['cost', 'speed', 'safety'] as Priority[]).map((p) => {
                const index = form.priorities.indexOf(p);
                const isSelected = index !== -1;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      let newPriorities = [...form.priorities];
                      if (isSelected) {
                        newPriorities = newPriorities.filter(item => item !== p);
                        if (newPriorities.length === 0) newPriorities = ['speed'];
                      } else {
                        newPriorities.push(p);
                      }
                      setForm({ ...form, priorities: newPriorities });
                    }}
                    className={`relative flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${isSelected ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/30'}`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                    )}
                    {p === 'cost' ? '💰' : p === 'speed' ? '⚡' : '🛡️'} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full h-11 font-semibold cyber-glow text-base">
            <Zap className="w-4 h-4 mr-2" /> Initialize AI Route Optimization
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CreateShipment;