import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import cppCode from '../../esp32_firmware.ino?raw';

export function ESP32SetupCode() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(cppCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/60">
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#E0E0E0]">ESP32 Web Server Code</h3>
          <p className="text-xs text-white/40 mt-1 font-mono">
            Direct IP access over local WiFi network.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'COPIED' : 'COPY CODE'}
        </button>
      </div>
      <div className="p-0 bg-[#0A0B0D] overflow-x-auto max-h-[600px] custom-scrollbar">
        <pre className="p-6 text-xs text-cyan-500/80 font-mono">
          <code>{cppCode}</code>
        </pre>
      </div>
    </div>
  );
}
