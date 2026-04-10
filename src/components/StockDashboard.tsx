import { useState, useEffect } from 'react';
import { getQuote, type StockQuote } from '../api/finnhub';

interface Props {
  symbol: string;
  companyName: string;
}

export default function StockDashboard({ symbol, companyName }: Props) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    setQuote(null);
    getQuote(symbol)
      .then(setQuote)
      .catch(() => setError('Could not load quote data. The market may be closed or the symbol is invalid.'))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 mt-10 text-gray-400 text-sm">
        <span className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        Loading dashboard for {symbol}…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 bg-[#1a1a2e] border border-red-500/30 rounded-2xl p-6 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!quote) return null;

  const isPositive = parseFloat(quote.change) >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-red-400';
  const changeBg = isPositive ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-red-400/10 border-red-400/20';
  const arrow = isPositive ? '▲' : '▼';

  const metrics = [
    { label: 'Open', value: `$${parseFloat(quote.open).toFixed(2)}` },
    { label: "Prev. Close", value: `$${parseFloat(quote.previousClose).toFixed(2)}` },
    { label: 'Day High', value: `$${parseFloat(quote.high).toFixed(2)}` },
    { label: 'Day Low', value: `$${parseFloat(quote.low).toFixed(2)}` },
  ];

  return (
    <div className="mt-8 w-full space-y-5">

      {/* Hero card */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl font-extrabold text-white">{quote.symbol}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${changeBg} ${changeColor}`}>
                {arrow} Live
              </span>
            </div>
            <p className="text-gray-500 text-sm">{companyName}</p>
            <p className="text-gray-600 text-xs mt-0.5">{quote.latestTradingDay}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-5xl font-bold text-white leading-none">
              ${parseFloat(quote.price).toFixed(2)}
            </span>
            <span className={`inline-block mt-2 text-base font-semibold ${changeColor}`}>
              {arrow} {isPositive ? '+' : ''}{parseFloat(quote.change).toFixed(2)}{' '}
              <span className="text-sm opacity-80">
                ({quote.changePercent.replace('%', '')}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map(({ label, value }) => (
          <div key={label} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-4 flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-widest text-gray-600">{label}</span>
            <span className="text-xl font-bold text-gray-200">{value}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
