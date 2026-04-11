import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { getEarningsCalendar, type EarningsEntry } from '../api/finnhub';

interface Props {
  symbol: string;
}

function fmtRevenue(v: number | null): string {
  if (v === null) return '—';
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(0)}`;
}

function fmtEps(v: number | null): string {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(2);
}

function isFuture(date: string) {
  return date > new Date().toISOString().split('T')[0];
}

interface ChartTooltipPayload {
  name: string;
  value: number;
  payload: EarningsEntry & { surprise: number | null };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: ChartTooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const future = isFuture(d.date);
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-xl border border-[#2a2a4a]"
      style={{ backgroundColor: '#12122a', opacity: 1 }}
    >
      <p className="font-semibold text-gray-200 mb-1">
        {d.date} {d.quarter ? `· Q${d.quarter} ${d.year ?? ''}` : ''}
      </p>
      {future ? (
        <p className="text-violet-400">Upcoming — estimate: {fmtEps(d.epsEstimate)}</p>
      ) : (
        <>
          <p className="text-gray-400">Actual: <span className="text-gray-200 font-semibold">{fmtEps(d.epsActual)}</span></p>
          <p className="text-gray-400">Estimate: <span className="text-gray-200">{fmtEps(d.epsEstimate)}</span></p>
          {d.surprise !== null && (
            <p className={d.surprise >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              Surprise: {d.surprise >= 0 ? '+' : ''}{d.surprise.toFixed(2)}
            </p>
          )}
          {d.revenueActual !== null && (
            <p className="text-gray-400 mt-1">Revenue: <span className="text-gray-200">{fmtRevenue(d.revenueActual)}</span></p>
          )}
        </>
      )}
    </div>
  );
}

export default function EarningsCalendar({ symbol }: Props) {
  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    setEntries([]);
    getEarningsCalendar(symbol)
      .then(setEntries)
      .catch(() => setError('Could not load earnings data.'))
      .finally(() => setLoading(false));
  }, [symbol]);

  const today = new Date().toISOString().split('T')[0];

  // Chart data: EPS actual vs estimate, ordered oldest→newest
  const chartData = [...entries]
    .filter((e) => e.epsActual !== null || e.epsEstimate !== null)
    .reverse()
    .map((e) => ({
      ...e,
      label: e.date.slice(0, 7), // "YYYY-MM"
      surprise:
        e.epsActual !== null && e.epsEstimate !== null
          ? parseFloat((e.epsActual - e.epsEstimate).toFixed(2))
          : null,
    }));

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl h-full">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5">
        Earnings Calendar
      </h2>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Loading earnings…
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="text-gray-500 text-sm">No earnings data available.</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          {/* EPS surprise bar chart */}
          {chartData.some((d) => d.surprise !== null) && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">EPS Surprise</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine y={0} stroke="#2a2a4a" />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip content={CustomTooltip as any} wrapperStyle={{ zIndex: 50, opacity: 1 }} />
                  <Bar dataKey="surprise" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.date}
                        fill={
                          entry.surprise === null
                            ? '#4c4c7a'
                            : entry.surprise >= 0
                            ? '#10b981'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="divide-y divide-[#2a2a4a]">
            {entries.map((e) => {
              const future = isFuture(e.date);
              const isToday = e.date === today;
              const beat =
                e.epsActual !== null && e.epsEstimate !== null
                  ? e.epsActual >= e.epsEstimate
                  : null;
              return (
                <div
                  key={e.date}
                  className={`flex items-center justify-between py-2.5 gap-4 ${
                    isToday ? 'ring-1 ring-violet-500/30 rounded-lg px-2 -mx-2' : ''
                  }`}
                >
                  {/* Date + quarter */}
                  <div className="min-w-0">
                    <span className={`text-[12px] font-medium ${future ? 'text-violet-400' : 'text-gray-300'}`}>
                      {e.date}
                    </span>
                    {e.quarter && (
                      <span className="ml-2 text-[10px] text-gray-600">Q{e.quarter} {e.year}</span>
                    )}
                    {isToday && (
                      <span className="ml-2 text-[10px] text-violet-400 font-semibold">Today</span>
                    )}
                    {future && !isToday && (
                      <span className="ml-2 text-[10px] text-violet-400/60">Upcoming</span>
                    )}
                  </div>

                  {/* EPS */}
                  <div className="flex items-center gap-3 flex-shrink-0 text-right">
                    {!future && e.epsActual !== null && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-gray-600">Actual</p>
                        <p className={`text-[12px] font-semibold ${beat ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtEps(e.epsActual)}
                        </p>
                      </div>
                    )}
                    {e.epsEstimate !== null && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-gray-600">Est.</p>
                        <p className="text-[12px] text-gray-400">{fmtEps(e.epsEstimate)}</p>
                      </div>
                    )}
                    {beat !== null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${beat ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                        {beat ? '✓ Beat' : '✗ Miss'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
