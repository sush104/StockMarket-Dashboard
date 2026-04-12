import { useState, useEffect, useCallback } from 'react';
import { getCompanyNews, getMarketNews, type NewsItem } from '../api/finnhub';

interface Props {
  symbol: string;
}

const TABS = [
  { key: 'company', label: 'Company News' },
  { key: 'market',  label: 'Market News'  },
] as const;

type Tab = typeof TABS[number]['key'];

const PREVIEW_COUNT = 5;

function NewsItem_({ item }: { item: NewsItem }) {
  return (
    <li className="flex gap-4 group">
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
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
        {item.summary && (
          <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
        )}
      </div>
    </li>
  );
}

function NewsList({ items, loading, error }: { items: NewsItem[]; loading: boolean; error: string }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
        <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        Loading news…
      </div>
    );
  }
  if (error) return <p className="text-red-400 text-sm py-4">{error}</p>;
  if (!items.length) return <p className="text-gray-500 text-sm py-4">No recent news found.</p>;
  return (
    <ul className="space-y-4">
      {items.map((item) => <NewsItem_ key={item.id} item={item} />)}
    </ul>
  );
}

function NewsModal({ title, items, onClose }: { title: string; items: NewsItem[]; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a] flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition-colors text-lg leading-none px-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {/* Scrollable list */}
        <div className="overflow-y-auto px-6 py-4">
          <ul className="space-y-5">
            {items.map((item) => <NewsItem_ key={item.id} item={item} />)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function NewsPanel({ symbol }: Props) {
  const [tab, setTab] = useState<Tab>('company');
  const [modalOpen, setModalOpen] = useState(false);

  const [companyNews, setCompanyNews] = useState<NewsItem[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');

  const [marketNews, setMarketNews] = useState<NewsItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    setCompanyLoading(true);
    setCompanyError('');
    setCompanyNews([]);
    getCompanyNews(symbol)
      .then(setCompanyNews)
      .catch(() => setCompanyError('Could not load company news.'))
      .finally(() => setCompanyLoading(false));
  }, [symbol]);

  useEffect(() => {
    if (tab !== 'market' || marketNews.length || marketLoading) return;
    setMarketLoading(true);
    setMarketError('');
    getMarketNews('general')
      .then(setMarketNews)
      .catch(() => setMarketError('Could not load market news.'))
      .finally(() => setMarketLoading(false));
  }, [tab, marketNews.length, marketLoading]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const activeItems = tab === 'company' ? companyNews : marketNews;
  const activeLoading = tab === 'company' ? companyLoading : marketLoading;
  const activeError = tab === 'company' ? companyError : marketError;
  const preview = activeItems.slice(0, PREVIEW_COUNT);
  const hasMore = activeItems.length > PREVIEW_COUNT;
  const modalTitle = tab === 'company' ? 'Company News' : 'Market News';

  return (
    <>
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 shadow-xl">
        {/* Tab bar */}
        <div className="flex items-center justify-between mb-5 border-b border-[#2a2a4a] pb-3">
          <div className="flex gap-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setModalOpen(false); }}
                className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
                  tab === key
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {hasMore && !activeLoading && (
            <span className="text-[11px] text-gray-600">{activeItems.length} articles</span>
          )}
        </div>

        <NewsList items={preview} loading={activeLoading} error={activeError} />

        {/* Show more button */}
        {hasMore && !activeLoading && !activeError && (
          <button
            onClick={() => setModalOpen(true)}
            className="mt-5 w-full py-2 text-xs font-semibold text-violet-400 border border-violet-500/30 rounded-xl hover:bg-violet-500/10 transition-colors"
          >
            Show all {activeItems.length} articles ↗
          </button>
        )}
      </div>

      {modalOpen && (
        <NewsModal
          title={modalTitle}
          items={activeItems}
          onClose={closeModal}
        />
      )}
    </>
  );
}
