import { useState, useRef, useEffect } from 'react';
import { searchSymbol, type SearchResult } from '../api/finnhub';

interface Props {
  initialQuery?: string;
  onSelect: (symbol: string, name: string) => void;
}

export default function StockSearch({ initialQuery = '', onSelect }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync search bar when a stock is selected externally (e.g. DefaultDashboard)
  useEffect(() => {
    setQuery(initialQuery);
    setOpen(false);
  }, [initialQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setError('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchSymbol(value.trim());
        setResults(data);
        setOpen(true);
      } catch {
        setError('Failed to fetch results. Try again.');
      } finally {
        setLoading(false);
      }
    }, 500);
  }

  function handleSelect(result: SearchResult) {
    setQuery(result.symbol);
    setOpen(false);
    onSelect(result.symbol, result.name);
  }

  return (
    <div className="relative w-full max-w-xl mx-auto" ref={containerRef}>
      {/* Search input */}
      <div className="flex items-center gap-3 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
        <svg className="w-5 h-5 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-gray-200 text-base py-4 placeholder-gray-600"
          placeholder="Search stock symbol or company..."
          value={query}
          onChange={handleChange}
          autoComplete="off"
        />
        {loading && (
          <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto py-1.5 list-none m-0 p-0">
          {results.map((r) => (
            <li
              key={r.symbol}
              onClick={() => handleSelect(r)}
              className="grid grid-cols-[80px_1fr_auto] items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#22223a] transition-colors"
            >
              <span className="font-bold text-violet-400 text-sm">{r.symbol}</span>
              <span className="text-gray-400 text-sm truncate">{r.name}</span>
              <span className="text-gray-600 text-xs whitespace-nowrap">{r.region} · {r.currency}</span>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && !loading && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-2xl z-50 px-4 py-4 text-gray-500 text-sm">
          No results found
        </div>
      )}
    </div>
  );
}
