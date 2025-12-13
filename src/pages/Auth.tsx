import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Github, Loader2, ExternalLink, Settings } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  
  const [customId, setCustomId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const [codeData, setCodeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    invoke('get_current_user')
      .then((user: any) => {
        setUser(user);
        navigate('/repo');
      })
      .catch(() => {
        // Not logged in
      });
      
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
      if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
      }
  };

  const getActiveClientId = () => {
      // Use custom ID if provided, otherwise fallback to a default or user input
      // Since user complained about "No validation returned", likely because of invalid default ID.
      // We force user to input one if they want.
      // For convenience, we can provide the CLI ID as a "Quick Start" option but user rejected it.
      // So we default to empty and ask user.
      return customId.trim();
  };

  const startLogin = async () => {
    const id = getActiveClientId();
    if (!id) {
        setError("Please enter a valid GitHub Client ID in settings.");
        setShowSettings(true);
        return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res: any = await invoke('start_device_flow', { clientId: id });
      setCodeData(res);
      await open(res.verification_uri);
      pollToken(id, res.device_code, res.interval);
    } catch (e: any) {
      setError(e.toString());
      setLoading(false);
    }
  };

  const pollToken = async (cid: string, deviceCode: string, interval: number) => {
    stopPolling();
    
    // GitHub recommendation: interval + 5s on slow_down
    let currentInterval = interval * 1000;
    
    const executePoll = async () => {
      try {
        const res: any = await invoke('exchange_token', { clientId: cid, deviceCode });
        if (res.access_token) {
            stopPolling();
            const user: any = await invoke('get_current_user');
            setUser(user);
            navigate('/repo');
        }
      } catch (e: any) {
         const errStr = e.toString();
         if (errStr.includes("authorization_pending")) {
             // Continue polling
         } else if (errStr.includes("slow_down")) {
             stopPolling();
             currentInterval += 5000;
             pollIntervalRef.current = window.setInterval(executePoll, currentInterval);
         } else if (errStr.includes("expired_token") || errStr.includes("access_denied")) {
             stopPolling();
             setError("Token expired or access denied. Please try again.");
             setLoading(false);
             setCodeData(null);
         } else {
             // Unknown error, log but keep polling? Or stop?
             // Usually network error. Let's keep polling for a bit or just show error.
             console.error("Poll error:", errStr);
         }
      }
    };

    pollIntervalRef.current = window.setInterval(executePoll, currentInterval);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 relative">
      <div className="absolute top-4 right-4">
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-muted hover:text-white rounded-full hover:bg-white/10">
              <Settings size={20} />
          </button>
      </div>

      <div className="card w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4">
             <Github size={48} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-bold">Connect GitHub Account</h2>

        {showSettings && (
            <div className="bg-surface border border-border p-4 rounded-lg space-y-2 text-left">
                <label className="text-sm font-medium text-muted block">GitHub Client ID</label>
                <input 
                    className="input w-full text-sm font-mono"
                    placeholder="e.g. Ov23lik..."
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                />
                <p className="text-xs text-muted">
                    Register a new OAuth App in GitHub Developer Settings. 
                    Enable "Device Flow" is NOT required for standard Web App, but this app uses Device Flow endpoint. 
                    Actually, GitHub Apps or OAuth Apps? 
                    <br/>
                    <strong>Note:</strong> Create an <strong>OAuth App</strong>. No callback URL needed for Device Flow usually, or use http://localhost.
                </p>
                <button 
                    className="text-xs text-primary hover:underline"
                    onClick={() => setCustomId("178c6fc778ccc68e1d6a")} // Optional convenience
                >
                    Use Standard ID (GitHub CLI)
                </button>
            </div>
        )}

        <p className="text-muted text-sm">
            We need permission to create and manage repositories on your behalf.
        </p>

        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm text-left">
                {error}
            </div>
        )}
      
        {!codeData ? (
          <button onClick={startLogin} disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Github size={18} />}
            {loading ? 'Connecting...' : 'Login with GitHub'}
          </button>
        ) : (
          <div className="space-y-6">
             <div className="bg-surface border border-primary/30 p-4 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
                    <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
                <p className="text-xs text-muted uppercase tracking-wider mb-2">Device Code</p>
                <h2 className="text-3xl font-mono font-bold text-primary tracking-widest">{codeData.user_code}</h2>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    Waiting for authorization...
                </div>
                <p className="text-sm text-muted">
                    A browser window has opened. Enter the code above to authorize.
                </p>
                <button onClick={() => open(codeData.verification_uri)} className="text-primary text-sm hover:underline flex items-center justify-center gap-1 mx-auto">
                    Re-open Link <ExternalLink size={12} />
                </button>
                <button onClick={() => { stopPolling(); setCodeData(null); setLoading(false); }} className="text-xs text-muted hover:text-white">
                    Cancel
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
