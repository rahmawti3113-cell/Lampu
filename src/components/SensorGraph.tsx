import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { SensorData } from '../types';

interface SensorGraphProps {
  data: SensorData[];
  currentTemp: number;
  currentHum: number;
}

export function SensorGraph({ data, currentTemp, currentHum }: SensorGraphProps) {
  // Safe default for empty data
  const safeData = data.length > 0 ? data : [{ time: '00:00:00', temperature: 0, humidity: 0 }];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Temp Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20">
            <svg className="w-12 h-12 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M15 13V5c0-1.7-1.3-3-3-3S9 3.3 9 5v8c-1.2 1-2 2.4-2 4 0 2.8 2.2 5 5 5s5-2.2 5-5c0-1.6-.8-3-2-4z"/></svg>
          </div>
          <p className="text-xs text-white/40 uppercase font-bold mb-1 tracking-widest">Suhu / Temp</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-mono text-orange-400">{currentTemp.toFixed(1)}</span>
            <span className="text-lg text-white/60">°C</span>
          </div>
        </div>
        {/* Humidity Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20">
            <svg className="w-12 h-12 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.5c-3.3 0-6-2.7-6-6 0-3.3 4-8.5 6-11 2 2.5 6 7.7 6 11 0 3.3-2.7 6-6 6z"/></svg>
          </div>
          <p className="text-xs text-white/40 uppercase font-bold mb-1 tracking-widest">Kelembaban</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-mono text-cyan-400">{currentHum.toFixed(1)}</span>
            <span className="text-lg text-white/60">%</span>
          </div>
        </div>
      </div>

      {/* Analytics Graph */}
      <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-6 min-h-[350px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#E0E0E0]">Historical Telemetry</h3>
          <div className="flex gap-4">
            <span className="flex items-center gap-2 text-[10px] text-orange-400 font-bold uppercase tracking-widest"><span className="w-3 h-0.5 bg-orange-400"></span> TEMP</span>
            <span className="flex items-center gap-2 text-[10px] text-cyan-400 font-bold uppercase tracking-widest"><span className="w-3 h-0.5 bg-cyan-400"></span> HUM</span>
          </div>
        </div>
        
        <div className="flex-1 w-full min-h-[250px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={true} horizontal={true} />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.2)" 
                fontSize={10}
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis 
                yAxisId="left" 
                stroke="#fb923c" 
                fontSize={10} 
                domain={['dataMin - 1', 'dataMax + 1']} 
                tickFormatter={(value) => `${value}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#22d3ee" 
                fontSize={10} 
                domain={['dataMin - 2', 'dataMax + 2']} 
                tickFormatter={(value) => `${value}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0A0B0D', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#E0E0E0', fontSize: '12px' }}
                itemStyle={{ color: '#E0E0E0' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="temperature" 
                name="Suhu (°C)" 
                stroke="#fb923c" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#fb923c', stroke: '#0A0B0D', strokeWidth: 2 }}
                animationDuration={500}
                isAnimationActive={false}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="humidity" 
                name="Kelembaban (%)" 
                stroke="#22d3ee" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#22d3ee', stroke: '#0A0B0D', strokeWidth: 2 }}
                animationDuration={500}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
