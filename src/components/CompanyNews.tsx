import { useState, useEffect } from 'react';
import { getCompanyNews, type NewsItem } from '../api/finnhub';

interface Props {
  symbol: string;
}

export default function CompanyNews({ symbol }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    setNews([]);
    getCompanyNews(symbol)
      .then(setNews)
      .catch(() => setError('Could not load news.'))
      .finally(() => setLoading(false));
  }, [symbol]);

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">Latest News</h2>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Loading news…
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && news.length === 0 && (
        <p className="text-gray-500 text-sm">No recent news found.</p>
      )}

      <ul className="space-y-4">
        {news.map((item) => (
          <li key={item.id} className="flex gap-4 group">
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-[#12122a]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="min-w-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-200 group-hover:text-violet-400 transition-colors line-clamp-2 leading-snug"
              >
                {item.headline}
              </a>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-violet-400 font-medium">{item.source}</span>
                <span className="text-[11px] text-gray-600">·</span>
                <span className="text-[11px] text-gray-600">
                  {new Date(item.datetime * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {item.summary && (
                <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
