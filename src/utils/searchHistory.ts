const SEARCH_HISTORY_KEY_PREFIX = 'search_history_';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function getSearchHistory(category: 'taxis' | 'hotels'): SearchHistoryItem[] {
  try {
    const key = `${SEARCH_HISTORY_KEY_PREFIX}${category}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const history: SearchHistoryItem[] = JSON.parse(stored);
    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_ITEMS);
  } catch (error) {
    console.error('Error loading search history:', error);
    return [];
  }
}

export function addToSearchHistory(
  category: 'taxis' | 'hotels',
  query: string
): void {
  if (!query.trim()) return;

  try {
    const key = `${SEARCH_HISTORY_KEY_PREFIX}${category}`;
    const history = getSearchHistory(category);

    const existingIndex = history.findIndex(
      (item) => item.query.toLowerCase() === query.toLowerCase()
    );

    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    const newHistory = [
      { query: query.trim(), timestamp: Date.now() },
      ...history,
    ].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(key, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

export function removeFromSearchHistory(
  category: 'taxis' | 'hotels',
  query: string
): void {
  try {
    const key = `${SEARCH_HISTORY_KEY_PREFIX}${category}`;
    const history = getSearchHistory(category);

    const filtered = history.filter(
      (item) => item.query.toLowerCase() !== query.toLowerCase()
    );

    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from search history:', error);
  }
}

export function clearSearchHistory(category: 'taxis' | 'hotels'): void {
  try {
    const key = `${SEARCH_HISTORY_KEY_PREFIX}${category}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}
