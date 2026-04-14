import { useState, useEffect, useRef } from 'react';
import { getQuote, type StockQuote } from '../api/finnhub';
import CompanyProfile from './CompanyProfile';
import EarningsCalendar from './EarningsCalendar';
import MarketData from './MarketData';
import NewsPanel from './NewsPanel';
import RecommendationTrends from './RecommendationTrends';

interface Props {
  symbol: string;
  companyName: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  holdingsCount: number;
  onSaveHolding: (buyPrice: number, quantity: number) => void;
}

export default function StockDashboard({ symbol, companyName, isFavorite, onToggleFavorite, holdingsCount, onSaveHolding }: Props) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formError, setFormError] = useState('');
  const buyPriceRef = useRef<HTMLInputElement>(null);

  function openModal() {
    setBuyPrice('');
    setQuantity('');
    setFormError('');
    setModalOpen(true);
    setTimeout(() => buyPriceRef.current?.focus(), 50);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(buyPrice);
    const qty = parseFloat(quantity);
    if (!buyPrice || isNaN(price) || price <= 0) { setFormError('Enter a valid buy price'); return; }
    if (!quantity || isNaN(qty) || qty <= 0) { setFormError('Enter a valid quantity'); return; }
    onSaveHolding(price, qty);
    setModalOpen(false);
  }

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
    { label: 'Prev. Close', value: `$${parseFloat(quote.previousClose).toFixed(2)}` },
    { label: 'Day High', value: `$${parseFloat(quote.high).toFixed(2)}` },
    { label: 'Day Low', value: `$${parseFloat(quote.low).toFixed(2)}` },
  ];

  return (
    <div className="mt-8 w-full space-y-5">

      {/* Hero card — price + day metrics */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl font-extrabold text-white">{quote.symbol}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${changeBg} ${changeColor}`}>
                {arrow} Live
              </span>
              <button
                onClick={onToggleFavorite}
                title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                className={`ml-1 transition-colors ${isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-600 hover:text-yellow-400'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {holdingsCount > 0 ? (
                <button
                  onClick={openModal}
                  title="Add another lot"
                  className="ml-1 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" strokeLinecap="round"/></svg>
                  In Portfolio ({holdingsCount})
                </button>
              ) : (
                <button
                  onClick={openModal}
                  title="Track this investment"
                  className="ml-1 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#2a2a4a] text-gray-400 border border-[#3a3a5a] hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" strokeLinecap="round"/></svg>
                  Track
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm">{companyName}</p>
            <p className="text-gray-600 text-xs mt-0.5">{quote.latestTradingDay}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-5xl font-bold text-white leading-none">
              ${parseFloat(quote.price).toFixed(2)}
            </span>
            <span className={`inline-block mt-2 text-base font-semibold ${changeColor}`}>
              {arrow} {isPositive ? '+' : ''}${parseFloat(quote.change).toFixed(2)}{' '}
              <span className="text-sm opacity-80">
                ({quote.changePercent.replace('%', '')}%)
              </span>
            </span>
          </div>
        </div>

        {/* Day metrics strip inside hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#2a2a4a]">
          {metrics.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-600">{label}</span>
              <span className="text-base font-semibold text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Company Profile */}
      <CompanyProfile symbol={symbol} />

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="flex flex-col">
          <RecommendationTrends symbol={symbol} />
        </div>
        <div className="flex flex-col">
          <EarningsCalendar symbol={symbol} />
        </div>
        <div className="flex flex-col">
          <MarketData symbol={symbol} />
        </div>
      </div>

      {/* News — full width */}
      <NewsPanel symbol={symbol} />

      {/* Portfolio modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Add Lot</h2>
                <p className="text-xs text-gray-500 mt-0.5">{symbol} · {companyName}</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">Buy Price (USD)</label>
                <div className="flex items-center bg-[#0d0d1a] border border-[#2a2a4a] rounded-xl px-3 focus-within:border-violet-500 transition-colors">
                  <span className="text-gray-500 text-sm mr-1">$</span>
                  <input
                    ref={buyPriceRef}
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="flex-1 bg-transparent outline-none text-gray-200 text-sm py-3"
                    placeholder="0.00"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">Number of Shares</label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded-xl px-4 py-3 text-gray-200 text-sm outline-none focus:border-violet-500 transition-colors"
                  placeholder="e.g. 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              {buyPrice && quantity && !isNaN(parseFloat(buyPrice)) && !isNaN(parseFloat(quantity)) && (
                <div className="bg-[#0d0d1a] border border-[#2a2a4a] rounded-xl px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-500">Total invested</span>
                  <span className="text-gray-200 font-semibold">${(parseFloat(buyPrice) * parseFloat(quantity)).toFixed(2)}</span>
                </div>
              )}

              {formError && <p className="text-red-400 text-xs">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2a2a4a] text-gray-400 text-sm hover:bg-[#22223a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                >
                  Add Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
