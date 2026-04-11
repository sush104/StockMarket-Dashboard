import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getRecommendationTrends, type RecommendationTrend } from '../api/finnhub';

interface Props {
  symbol: string;
}

const SEGMENTS = [
  { key: 'strongBuy',  label: 'Strong Buy',  hex: '#10b981', bar: 'bg-emerald-500' },
  { key: 'buy',        label: 'Buy',          hex: '#6ee7b7', bar: 'bg-emerald-300' },
  { key: 'hold',       label: 'Hold',         hex: '#facc15', bar: 'bg-yellow-400'  },
  { key: 'sell',       label: 'Sell',         hex: '#fca5a5', bar: 'bg-red-300'     },
  { key: 'strongSell', label: 'Strong Sell',  hex: '#ef4444', bar: 'bg-red-500'     },
] as const;

function total(t: RecommendationTrend) {
  return t.strongBuy + t.buy + t.hold + t.sell + t.strongSell;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="bg-[#12122a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-xs shadow-xl" style={{ opacity: 1, backgroundColor: '#12122a' }}>
      <span style={{ color: p.color }} className="font-semibold">{name}</span>
      <span className="text-gray-400 ml-2">{value} analysts</span>
    </div>
  );
}

export default function RecommendationTrends({ symbol }: Props) {
  const [trends, setTrends] = useState<RecommendationTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    setTrends([]);
    setSelectedPeriod(null);
    getRecommendationTrends(symbol)
      .then((data) => {
        setTrends(data);
        if (data.length > 0) setSelectedPeriod(data[0].period);
      })
      .catch(() => setError('Could not load recommendation data.'))
      .finally(() => setLoading(false));
  }, [symbol]);

  const selected = trends.find((t) => t.period === selectedPeriod) ?? trends[0] ?? null;

  const pieData = selected
    ? SEGMENTS.filter((s) => selected[s.key] > 0).map((s) => ({
        name: s.label,
        value: selected[s.key],
        color: s.hex,
      }))
    : [];

  const tot = selected ? total(selected) : 0;

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl h-full">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5">
        Analyst Recommendations
      </h2>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && trends.length === 0 && (
        <p className="text-gray-500 text-sm">No recommendation data available.</p>
      )}

      {!loading && !error && selected && (
        <>
          {/* Donut chart + legend row */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            {/* Donut */}
            <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip content={CustomTooltip as any} wrapperStyle={{ outline: 'none', opacity: 1, zIndex: 50 }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-white leading-none">{tot}</span>
                <span className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">analysts</span>
                <span className="text-[9px] text-gray-700 mt-0.5">{selectedPeriod?.slice(0, 7)}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2 min-w-0">
              {pieData.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-[12px] text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                    {name}
                  </span>
                  <span className="text-[12px] font-semibold text-gray-200">
                    {value}
                    <span className="text-gray-600 font-normal ml-1">
                      ({tot > 0 ? ((value / tot) * 100).toFixed(0) : 0}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2a2a4a] mb-5" />

          {/* Period trend bars */}
          <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Trend — click a period to update chart</p>
          <div className="space-y-3">
            {trends.map((t) => {
              const period = t.period.slice(0, 7);
              const isActive = t.period === selectedPeriod;
              return (
                <div
                  key={t.period}
                  onClick={() => setSelectedPeriod(t.period)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 -mx-2 cursor-pointer transition-colors ${
                    isActive ? 'bg-violet-500/10 ring-1 ring-violet-500/30' : 'hover:bg-[#2a2a4a]/40'
                  }`}
                >
                  <span className={`text-[12px] ${isActive ? 'text-violet-400 font-semibold' : 'text-gray-500'}`}>
                    {period}
                  </span>
                  {isActive && (
                    <span className="text-[10px] text-violet-400/60 ml-1">← selected</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
