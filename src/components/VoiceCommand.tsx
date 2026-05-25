import { Mic, MicOff, Command } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

// Extend window for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceCommandProps {
  onCommand: (command: string) => void;
}

export function VoiceCommand({ onCommand }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Browser tidak mendukung Web Speech API.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; // Indonesian
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const recognizedText = event.results[current][0].transcript.toLowerCase();
      setTranscript(recognizedText);
      onCommand(recognizedText);
    };

    recognition.onerror = (event: any) => {
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [onCommand]);

  return (
    <div className="bg-black/60 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-6">
      <div className="flex items-center gap-4 md:border-r md:border-white/10 md:pr-6 md:w-64">
        <div className={`w-12 h-12 rounded-full border flex items-center justify-center relative flex-shrink-0 ${isListening ? 'border-red-500/50' : 'border-cyan-500/50'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isListening ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </div>
          {isListening && <div className="absolute -inset-1 border border-red-500/30 rounded-full animate-ping"></div>}
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Voice Assistant</p>
          <p className={`text-sm font-medium italic ${isListening ? 'text-red-400' : 'text-cyan-400'}`}>
            {isListening ? '"Listening..."' : '"Inactive"'}
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        {error ? (
          <div className="font-mono text-[10px] text-red-400">
            <p>[ERROR] {error}</p>
          </div>
        ) : transcript ? (
          <div className="font-mono text-[10px] text-white/30">
            <p>[RECOGNIZED] "{transcript}"</p>
          </div>
        ) : (
          <div className="font-mono text-[10px] text-white/30">
            <p>[WAITING] Try: "Nyalakan relay dua", "Mati semua"</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={startListening}
          disabled={isListening}
          className={`h-10 px-6 font-bold text-xs rounded uppercase flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-red-500/20 text-red-500 border border-red-500/30 opacity-50 cursor-not-allowed'
              : 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer hover:bg-cyan-400'
          }`}
        >
          {isListening ? 'Active' : 'Start Mic'}
        </button>
      </div>
    </div>
  );
}
