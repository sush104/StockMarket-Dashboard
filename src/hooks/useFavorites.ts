import { useState, useCallback } from 'react';

export interface FavoriteStock {
  symbol: string;
  name: string;
}

const STORAGE_KEY = 'stock_favorites';

function loadFromStorage(): FavoriteStock[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteStock[]>(loadFromStorage);

  const addFavorite = useCallback((stock: FavoriteStock) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.symbol === stock.symbol)) return prev;
      const updated = [...prev, stock];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((symbol: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.symbol !== symbol);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (symbol: string) => favorites.some((f) => f.symbol === symbol),
    [favorites]
  );

  const toggleFavorite = useCallback((stock: FavoriteStock) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.symbol === stock.symbol);
      const updated = exists
        ? prev.filter((f) => f.symbol !== stock.symbol)
        : [...prev, stock];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}
