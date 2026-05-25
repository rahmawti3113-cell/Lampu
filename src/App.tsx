import { useState, useEffect, useRef } from 'react';
import { Cpu, Activity, RefreshCw } from 'lucide-react';
import { SensorData, ESPState, ConnectionStatus } from './types';
import { RelayCard } from './components/RelayCard';
import { SensorGraph } from './components/SensorGraph';
import { VoiceCommand } from './components/VoiceCommand';
import { ConnectionPanel } from './components/ConnectionPanel';
import { ESP32SetupCode } from './components/ESP32SetupCode';

const INITIAL_STATE: ESPState = {
  temperature: 0,
  humidity: 0,
  relays: [false, false, false, false],
  variasiMode: 0,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup'>('dashboard');
  
  // Connection State
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  
  // Data State
  const [esPState, setEsPState] = useState<ESPState>(INITIAL_STATE);
  const [graphData, setGraphData] = useState<SensorData[]>([]);
  
  // Polling ref
  const pollingRef = useRef<number | null>(null);

  // Function to construct base URL
  const getBaseUrl = () => {
    let raw = ipAddress.trim();
    if (!raw.startsWith('http')) raw = `http://${raw}`;
    return raw;
  };

  // --- API CALLS ---
  const fetchStatus = async () => {
    if (status !== 'connected' && status !== 'simulating') return;

    if (status === 'simulating') {
      // Simulate real-time data jumps
      setEsPState(prev => {
        const newTemp = prev.temperature === 0 ? 28 : prev.temperature + (Math.random() - 0.5);
        const newHum = prev.humidity === 0 ? 65 : prev.humidity + (Math.random() - 0.5) * 2;
        
        // Push to graph
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        setGraphData(gd => {
          const newGd = [...gd, { time: timeStr, temperature: newTemp, humidity: newHum }];
          if (newGd.length > 20) newGd.shift(); // Keep last 20 points
          return newGd;
        });

        return { ...prev, temperature: newTemp, humidity: newHum };
      });
      return;
    }

    try {
      const res = await fetch(`${getBaseUrl()}/api/status`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      
      setEsPState({
        temperature: data.temperature,
        humidity: data.humidity,
        relays: data.relays,
        variasiMode: data.variasiMode,
      });

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setGraphData(gd => {
        const newGd = [...gd, { time: timeStr, temperature: data.temperature, humidity: data.humidity }];
        if (newGd.length > 20) newGd.shift();
        return newGd;
      });

      setStatus('connected');
    } catch (e) {
      console.error(e);
      setStatus('disconnected');
    }
  };

  // Turn particular relay on/off
  const toggleRelay = async (index: number, state: boolean) => {
    if (status === 'disconnected' || status === 'connecting') return;
    
    // Optimistic UI Update
    setEsPState(prev => {
      const newRelays = [...prev.relays];
      newRelays[index] = state;
      return { ...prev, relays: newRelays, variasiMode: 0 };
    });

    if (status === 'simulating') return;

    try {
      await fetch(`${getBaseUrl()}/api/relay?id=${index}&state=${state ? 1 : 0}`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  // Turn all relays
  const setAllRelays = async (state: boolean) => {
    if (status === 'disconnected' || status === 'connecting') return;
    
    setEsPState(prev => ({ 
      ...prev, 
      relays: [state, state, state, state],
      variasiMode: 0 
    }));

    if (status === 'simulating') return;

    try {
      await fetch(`${getBaseUrl()}/api/all?state=${state ? 1 : 0}`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const setVariasi = async (mode: number) => {
     if (status === 'disconnected' || status === 'connecting') return;
     
     setEsPState(prev => {
       if (mode === 0) {
         return { ...prev, variasiMode: 0, relays: [false, false, false, false] };
       }
       return { ...prev, variasiMode: mode };
     });

     if (status === 'simulating') return;

     try {
       await fetch(`${getBaseUrl()}/api/variasi?mode=${mode}`, { method: 'POST' });
     } catch (e) {
       console.error(e);
     }
  };

  const handleConnect = async () => {
    if (!ipAddress) return;
    setStatus('connecting');
    try {
      const res = await window.fetch(`${getBaseUrl()}/api/status`);
      if (res.ok) {
        setStatus('connected');
        fetchStatus();
      } else {
        setStatus('disconnected');
      }
    } catch (error) {
      console.error(error);
      alert("Gagal terhubung. Pastikan IP diketik dengan benar, ESP32 berjalan, dan URL diizinkan (CORS atau Local Mixed Content). Coba mode Simulasi jika ini adalah browser HTTPS.");
      setStatus('disconnected');
    }
  };

  const handleSimulate = () => {
    setStatus('simulating');
    setEsPState({
      temperature: 28.5,
      humidity: 65,
      relays: [false, false, false, false],
      variasiMode: 0
    });
    setGraphData([]);
  };

  // Process voice commands
  const handleVoiceCommand = (command: string) => {
    const cmd = command.toLowerCase();
    
    if (cmd.includes('nyala') && cmd.includes('semua')) {
      setAllRelays(true);
    } else if (cmd.includes('mati') && cmd.includes('semua')) {
      setAllRelays(false);
    } else if (cmd.includes('nyala') || cmd.includes('hidup')) {
      if (cmd.includes('satu') || cmd.includes('1')) toggleRelay(0, true);
      else if (cmd.includes('dua') || cmd.includes('2')) toggleRelay(1, true);
      else if (cmd.includes('tiga') || cmd.includes('3')) toggleRelay(2, true);
      else if (cmd.includes('empat') || cmd.includes('4')) toggleRelay(3, true);
    } else if (cmd.includes('mati')) {
      if (cmd.includes('satu') || cmd.includes('1')) toggleRelay(0, false);
      else if (cmd.includes('dua') || cmd.includes('2')) toggleRelay(1, false);
      else if (cmd.includes('tiga') || cmd.includes('3')) toggleRelay(2, false);
      else if (cmd.includes('empat') || cmd.includes('4')) toggleRelay(3, false);
    } else if (cmd.includes('variasi')) {
      if (cmd.includes('satu') || cmd.includes('1')) setVariasi(1);
      else if (cmd.includes('dua') || cmd.includes('2')) setVariasi(2);
      else if (cmd.includes('stop') || cmd.includes('berhenti') || cmd.includes('mati')) setVariasi(0);
    } else if (cmd.includes('stop')) {
       setVariasi(0);
    }
  };

  // Start polling
  useEffect(() => {
    if (status === 'connected' || status === 'simulating') {
      fetchStatus(); // immediate call
      pollingRef.current = window.setInterval(fetchStatus, 2000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#E0E0E0] font-sans selection:bg-cyan-500/30">
      {/* Top Navigation */}
      <header className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 pt-6 max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">ESP Local Hub <span className="text-xs font-mono text-white/40 ml-2">v4.0.2</span></h1>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em]">System Latency: 4ms | Direct IP Mode</p>
          </div>
        </div>
        
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
              activeTab === 'dashboard' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
              activeTab === 'setup' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            Setup Web API
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-2">
        {activeTab === 'dashboard' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
            {/* Connection Config */}
            <ConnectionPanel 
              ipAddress={ipAddress}
              onIpChange={setIpAddress}
              status={status}
              onConnect={handleConnect}
              onSimulate={handleSimulate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              
              {/* Left Column - Sensors & Graphs */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <SensorGraph 
                  data={graphData} 
                  currentTemp={esPState.temperature} 
                  currentHum={esPState.humidity} 
                />
              </div>

              {/* Right Column - Relays & Sequences */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[0, 1, 2, 3].map(i => (
                    <RelayCard 
                      key={i} 
                      index={i} 
                      state={esPState.relays[i]} 
                      onToggle={toggleRelay}
                      disabled={status === 'disconnected' || esPState.variasiMode !== 0}
                    />
                  ))}
                </div>

                {/* Automation & Variasi */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setVariasi(1)}
                      className={`flex-1 p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        esPState.variasiMode === 1 
                          ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                          : 'bg-white/10 hover:bg-white/20 text-white/80'
                      }`}
                    >
                      Sequence A (1→4)
                    </button>
                    <button 
                      onClick={() => setVariasi(2)}
                      className={`flex-1 p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        esPState.variasiMode === 2 
                          ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                          : 'bg-white/10 hover:bg-white/20 text-white/80'
                      }`}
                    >
                      Sequence B (4→1)
                    </button>
                    <button 
                      onClick={() => setVariasi(0)}
                      className={`flex-1 p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                        esPState.variasiMode !== 0 
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border-red-500/30'
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      Stop Variasi
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 border-t border-white/10 pt-4">
                    <button 
                      onClick={() => setAllRelays(true)}
                      className="flex-1 p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30"
                    >
                      ALL POWER ON
                    </button>
                    <button 
                      onClick={() => setAllRelays(false)}
                      className="flex-1 p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors bg-white/10 hover:bg-white/20 text-white/40 border border-white/10"
                    >
                      ALL SHUTDOWN
                    </button>
                  </div>
                </div>

                {/* Voice Control Footer */}
                <VoiceCommand onCommand={handleVoiceCommand} />

              </div>

            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <ESP32SetupCode />
          </div>
        )}
      </main>
    </div>
  );
}
