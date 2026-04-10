import { useState, useEffect } from 'react';
import { getQuote, type StockQuote } from '../api/finnhub';

interface Props {
  symbol: string;
  companyName: string;
}

export default function StockQuote({ symbol, companyName }: Props) {
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
      <div className="flex items-center gap-3 bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 mt-6 w-full max-w-xl mx-auto text-gray-400 text-sm">
        <span className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
        Loading quote for {symbol}…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 mt-6 w-full max-w-xl mx-auto text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!quote) return null;

  const isPositive = parseFloat(quote.change) >= 0;
  const arrow = isPositive ? '▲' : '▼';
  const changeColor = isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10';

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 mt-6 w-full max-w-xl mx-auto shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3 pb-5 mb-5 border-b border-[#2a2a4a]">
        <div>
          <h2 className="text-2xl font-extrabold text-white m-0 mb-1">{quote.symbol}</h2>
          <p className="text-gray-500 text-sm m-0">{companyName}</p>
        </div>
        <div className="text-right">
          <span className="block text-4xl font-bold text-white leading-none">
            ${parseFloat(quote.price).toFixed(2)}
          </span>
          <span className={`inline-block mt-1.5 text-sm font-semibold px-2 py-0.5 rounded-md ${changeColor}`}>
            {arrow} {isPositive ? '+' : ''}{parseFloat(quote.change).toFixed(2)} ({quote.changePercent.replace('%', '')}%)
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', value: `$${parseFloat(quote.open).toFixed(2)}` },
          { label: 'High', value: `$${parseFloat(quote.high).toFixed(2)}` },
          { label: 'Low', value: `$${parseFloat(quote.low).toFixed(2)}` },
          { label: 'Prev. Close', value: `$${parseFloat(quote.previousClose).toFixed(2)}` },
          { label: 'Volume', value: Number(quote.volume).toLocaleString() },
          { label: 'Trading Day', value: quote.latestTradingDay },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-600 uppercase tracking-wide">{label}</span>
            <span className="text-sm font-semibold text-gray-300">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
