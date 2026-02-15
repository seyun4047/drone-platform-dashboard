
import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, Hexagon, Terminal, Github, Mail } from 'lucide-react';
import { apiService } from '../services/apiService';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLoginMode) {
        const res = await apiService.login(username, password);
        if (res.status && res.data.token) {
          onLoginSuccess({ 
            id: res.data.id || username, 
            username, 
            token: res.data.token 
          });
        } else {
          setError(res.message);
        }
      } else {
        const res = await apiService.register(username, password);
        if (res.status) {
          setIsLoginMode(true);
          setError('REGISTRATION SUCCESSFUL. ACCESS GRANTED.');
        } else {
          setError(res.message);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'CONNECTION FAILURE TO MAINFRAME.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950 text-sky-100">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md relative">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-sky-500">
          <div className="relative">
             <Hexagon size={64} className="animate-[pulse_4s_infinite]" />
             <Terminal size={32} className="absolute inset-0 m-auto" />
          </div>
        </div>

        <div className="glass rounded-2xl p-8 border border-sky-500/30 glow-blue">
          <div className="text-center mb-10 mt-4">
            <h1 className="font-futuristic text-2xl text-white glow-text-blue tracking-widest uppercase leading-tight">
              MAIN-DRONE <span className="text-sky-400 font-bold">OS</span>
            </h1>
            <p className="text-[10px] text-sky-500/60 font-mono mt-2 uppercase tracking-tight">Manufacturer-Independent Drone Platform</p>
            <p className="text-[9px] text-sky-500/40 font-futuristic mt-1 uppercase">SECURITY CLEARANCE REQUIRED</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <UserIcon size={18} className="absolute left-3 top-3.5 text-sky-500/50 group-focus-within:text-sky-400 transition-colors" />
                <input
                  type="text"
                  placeholder="USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-sky-500/20 rounded-lg py-3 pl-10 pr-4 text-sky-100 placeholder-sky-500/30 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-mono uppercase text-xs"
                  required
                />
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-3 top-3.5 text-sky-500/50 group-focus-within:text-sky-400 transition-colors" />
                <input
                  type="password"
                  placeholder="ACCESS_KEY"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-sky-500/20 rounded-lg py-3 pl-10 pr-4 text-sky-100 placeholder-sky-500/30 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-mono text-xs"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-[10px] bg-red-500/10 p-3 rounded border border-red-500/20 text-center uppercase tracking-tighter leading-relaxed font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900 text-white font-futuristic py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              {isLoading ? 'ESTABLISHING...' : (isLoginMode ? 'INITIALIZE LOGIN' : 'REGISTER ACCESS')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-sky-500/10 flex flex-col items-center gap-4">
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-sky-500/50 hover:text-sky-400 text-[10px] font-futuristic transition-colors uppercase tracking-widest"
            >
              {isLoginMode ? 'No credentials? Request access' : 'Already registered? System portal'}
            </button>
            
            <div className="flex gap-4">
              <a href="https://github.com/seyun4047" target="_blank" rel="noopener noreferrer" className="text-sky-500/30 hover:text-sky-400 transition-colors">
                <Github size={16} />
              </a>
              <a href="mailto:mutzin@mutzin.com" className="text-sky-500/30 hover:text-sky-400 transition-colors">
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center px-2 text-[8px] text-sky-500/30 font-futuristic uppercase tracking-widest">
          <div className="flex flex-col gap-1">
            <span>ENCRYPTION: AES-256-GCM</span>
            <span>SUPPORT: mutzin@mutzin.com</span>
          </div>
          <div className="text-right flex flex-col gap-1">
             <span>V1.0.1</span>
             <a href="https://github.com/seyun4047" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400">@seyun4047</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
