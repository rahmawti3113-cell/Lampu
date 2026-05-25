import { Wifi, Info, Link as LinkIcon, RadioReceiver } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface ConnectionPanelProps {
  ipAddress: string;
  onIpChange: (ip: string) => void;
  status: ConnectionStatus;
  onConnect: () => void;
  onSimulate: () => void;
}

export function ConnectionPanel({ ipAddress, onIpChange, status, onConnect, onSimulate }: ConnectionPanelProps) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        <div className="flex-1 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
             <RadioReceiver className="w-4 h-4 text-cyan-400" />
             <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
               Direct IP Connection
             </h2>
          </div>
          <div className="flex bg-black/60 rounded-lg overflow-hidden border border-white/10 focus-within:border-cyan-500/50 transition-colors">
            <div className="bg-white/5 px-3 py-2 flex items-center border-r border-white/10">
              <span className="text-white/30 text-sm font-mono">http://</span>
            </div>
            <input 
              type="text" 
              value={ipAddress}
              onChange={(e) => onIpChange(e.target.value)}
              placeholder="192.168.1.100"
              className="flex-1 bg-transparent border-none outline-none text-[#E0E0E0] px-3 py-2 text-sm font-mono placeholder:text-white/20"
            />
            <button 
              onClick={onConnect}
              disabled={!ipAddress || status === 'connecting'}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-white/30 text-black px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              {status === 'connecting' ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              {status === 'connected' ? 'Update IP' : 'Connect'}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:items-end w-full md:w-auto">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">
            <div className="relative flex h-3 w-3">
              {(status === 'connected' || status === 'simulating') && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'simulating' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                status === 'connected' ? 'bg-green-500' : 
                status === 'simulating' ? 'bg-orange-500' :
                status === 'connecting' ? 'bg-cyan-500' : 'bg-white/20'
              }`}></span>
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Connection Status</span>
               <span className={`text-sm font-mono font-medium ${
                  status === 'connected' ? 'text-green-400' : 
                  status === 'simulating' ? 'text-orange-400' :
                  status === 'connecting' ? 'text-cyan-400' : 'text-white/40'
                }`}>
                  {status === 'connected' ? 'CONNECTED (DIRECT)' : 
                   status === 'simulating' ? 'SIMULATION MODE' :
                   status === 'connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
                </span>
            </div>
          </div>

          {status !== 'connected' && (
            <button
              onClick={onSimulate}
              className="text-[10px] tracking-widest font-mono text-cyan-400/80 hover:text-cyan-300 mt-3 underline underline-offset-4"
            >
              [ RUN UI SIMULATION ]
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
