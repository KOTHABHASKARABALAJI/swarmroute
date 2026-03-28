import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.detail || "Authentication Error");
          return;
        }

        login(data.email);
        navigate('/dashboard');
      } catch (err) {
        console.error("Login failed", err);
        alert("Failed to connect to secure authentication server.");
      }
    }
  };

  return (
    <div className="min-h-screen flex grid-bg">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center cyber-glow">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-wider">
                <span className="text-primary cyber-glow-text">SWARM</span>
                <span className="text-foreground">ROUTE</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? 'Join the AI logistics revolution' : 'Access your command center'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@swarmroute.ai"
                className="bg-secondary/50 border-border focus:border-primary/50 h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/50 border-border focus:border-primary/50 h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-semibold cyber-glow text-base">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      {/* Right — Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-secondary/20">
        <div className="absolute inset-0 scanline pointer-events-none" />
        <div className="relative z-10 text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center cyber-glow pulse-glow">
            <Zap className="w-16 h-16 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold cyber-glow-text text-primary">AI-Powered Logistics</h2>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto text-sm">
              Real-time route optimization, risk analysis, and autonomous rerouting powered by swarm intelligence.
            </p>
          </div>
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                top: `${15 + i * 15}%`,
                left: `${10 + i * 15}%`,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
