import { useState, useEffect } from 'react';
import {
  getBasicFinancials,
  getMarketStatus,
  getPriceTarget,
  type BasicFinancials,
  type MarketStatus,
  type PriceTarget,
} from '../api/finnhub';

interface Props {
  symbol: string;
}

function fmt(value: number | null, prefix = '', suffix = '', decimals = 2): string {
  if (value === null || value === undefined) return '—';
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
}

function fmtMarketCap(mc: number | null): string {
  if (mc === null) return '—';
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}T`;
  if (mc >= 1_000)     return `$${(mc / 1_000).toFixed(2)}B`;
  return `$${mc.toFixed(0)}M`;
}

export default function MarketData({ symbol }: Props) {
  const [financials, setFinancials] = useState<BasicFinancials | null>(null);
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [priceTarget, setPriceTarget] = useState<PriceTarget | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    setFinancials(null);
    setStatus(null);

    Promise.allSettled([getBasicFinancials(symbol), getMarketStatus(), getPriceTarget(symbol)])
      .then(([finResult, mktResult, ptResult]) => {
        if (finResult.status === 'fulfilled') setFinancials(finResult.value);
        if (mktResult.status === 'fulfilled') setStatus(mktResult.value);
        if (ptResult.status === 'fulfilled') setPriceTarget(ptResult.value);
        if (finResult.status === 'rejected') setError('Could not load financials.');
      })
      .finally(() => setLoading(false));
  }, [symbol]);

  const metrics = financials
    ? [
        { label: 'Market Cap',      value: fmtMarketCap(financials.marketCap) },
        { label: 'P/E Ratio',       value: fmt(financials.pe) },
        { label: 'EPS (TTM)',       value: fmt(financials.eps, '$') },
        { label: 'Beta',            value: fmt(financials.beta) },
        { label: '52W High',        value: fmt(financials.week52High, '$') },
        { label: '52W Low',         value: fmt(financials.week52Low, '$') },
        { label: 'Dividend Yield',  value: fmt(financials.dividendYield, '', '%') },
      ]
    : [];

  const sessionLabel: Record<string, string> = {
    regular:       'Regular Hours',
    'pre-market':  'Pre-Market',
    'post-market': 'After Hours',
  };

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Market Data</h2>

        {status && (
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
              status.isOpen
                ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                : 'bg-gray-700/40 border-gray-600/30 text-gray-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}
            />
            {status.isOpen
              ? (status.session ? sessionLabel[status.session] ?? 'Open' : 'Open')
              : status.holiday
              ? `Closed · ${status.holiday}`
              : 'Market Closed'}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && financials && (
        <div className="flex flex-col divide-y divide-[#2a2a4a]">
          {metrics.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-[11px] uppercase tracking-widest text-gray-600">{label}</span>
              <span className="text-sm font-semibold text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Price Target section */}
      {!loading && !error && priceTarget && priceTarget.targetLow !== null && priceTarget.targetHigh !== null && (() => {
        const low    = priceTarget.targetLow!;
        const high   = priceTarget.targetHigh!;
        const mean   = priceTarget.targetMean;
        const median = priceTarget.targetMedian;
        const range  = high - low || 1;
        const pct    = (v: number) => Math.min(100, Math.max(0, ((v - low) / range) * 100));
        return (
          <div className="mt-5 pt-5 border-t border-[#2a2a4a]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Price Target</span>
              {priceTarget.lastUpdated && (
                <span className="text-[10px] text-gray-700">
                  {new Date(priceTarget.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>

            {/* Range bar */}
            <div className="relative h-2 rounded-full bg-[#2a2a4a] mb-3">
              {/* Filled range (low → high = full bar, colored) */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/40 via-yellow-400/40 to-emerald-400/40" />
              {/* Mean marker */}
              {mean !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-violet-400 border-2 border-[#1a1a2e] z-10"
                  style={{ left: `calc(${pct(mean)}% - 5px)` }}
                  title={`Mean: $${mean.toFixed(2)}`}
                />
              )}
              {/* Median marker */}
              {median !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400 border-2 border-[#1a1a2e] z-10"
                  style={{ left: `calc(${pct(median)}% - 4px)` }}
                  title={`Median: $${median.toFixed(2)}`}
                />
              )}
            </div>

            {/* Labels row */}
            <div className="flex justify-between text-[10px] text-gray-600 mb-3">
              <span>Low <span className="text-gray-400 font-medium">${low.toFixed(2)}</span></span>
              <span>High <span className="text-gray-400 font-medium">${high.toFixed(2)}</span></span>
            </div>

            {/* Mean / Median pills */}
            <div className="flex gap-2">
              {mean !== null && (
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-[#12122a] border border-[#2a2a4a] px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  Mean <span className="text-gray-200 font-semibold">${mean.toFixed(2)}</span>
                </span>
              )}
              {median !== null && (
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-[#12122a] border border-[#2a2a4a] px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Median <span className="text-gray-200 font-semibold">${median.toFixed(2)}</span>
                </span>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
