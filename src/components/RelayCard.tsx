import { Power } from 'lucide-react';

interface RelayCardProps {
  key?: number | string;
  index: number;
  state: boolean;
  onToggle: (index: number, newState: boolean) => void | Promise<void>;
  disabled?: boolean;
}

export function RelayCard({ index, state, onToggle, disabled }: RelayCardProps) {
  return (
    <div 
      onClick={() => !disabled && onToggle(index, !state)}
      className={`group bg-white/5 rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-colors relative min-h-[160px] ${
        state 
          ? 'border-2 border-green-500/50 hover:bg-green-500/10' 
          : 'border border-white/10 hover:bg-white/10'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`absolute top-4 right-4 w-4 h-4 rounded-full ${
        state ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-500/20 border border-red-500/50'
      }`}></div>
      
      <div>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-tighter">Relay Unit 0{index + 1}</h2>
        <p className="text-xl font-bold mt-1 text-[#E0E0E0]">Switched Load</p>
      </div>

      <div className="flex justify-between items-end mt-6">
        <span className={`text-xs font-mono ${state ? 'text-green-400' : 'text-white/20'}`}>
          STATUS: {state ? 'ACTIVE' : 'IDLE'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); !disabled && onToggle(index, !state); }}
          disabled={disabled}
          className={`px-4 sm:px-6 py-2 font-black rounded-lg text-[10px] sm:text-sm uppercase transition-colors ${
            state 
              ? 'bg-green-500 text-black'
              : 'bg-white/10 text-white/40 hover:bg-white/20'
          }`}
        >
          {state ? 'Power On' : 'Power Off'}
        </button>
      </div>
    </div>
  );
}
