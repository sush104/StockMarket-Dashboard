import { useState, useCallback } from 'react';

export interface Holding {
  id: string;        // unique per lot
  symbol: string;
  name: string;
  buyPrice: number;
  quantity: number;
  addedAt: string; // ISO date string
}

const STORAGE_KEY = 'stock_portfolio';

function load(): Holding[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(holdings: Holding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>(load);

  const addHolding = useCallback((holding: Omit<Holding, 'id' | 'addedAt'>) => {
    setHoldings((prev) => {
      const updated = [
        ...prev,
        { ...holding, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, addedAt: new Date().toISOString() },
      ];
      save(updated);
      return updated;
    });
  }, []);

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      save(updated);
      return updated;
    });
  }, []);

  const getHoldingsForSymbol = useCallback(
    (symbol: string) => holdings.filter((h) => h.symbol === symbol),
    [holdings]
  );

  const isInPortfolio = useCallback(
    (symbol: string) => holdings.some((h) => h.symbol === symbol),
    [holdings]
  );

  return { holdings, addHolding, removeHolding, getHoldingsForSymbol, isInPortfolio };
}

