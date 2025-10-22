import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UseServerSearchOptions<T> {
  searchFunction: 'search_taxis' | 'search_hotels';
  searchQuery: string;
  filters?: Record<string, string>;
  limit?: number;
  offset?: number;
  debounceMs?: number;
  enabled?: boolean;
}

interface ServerSearchResult<T> {
  data: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useServerSearch<T = any>({
  searchFunction,
  searchQuery,
  filters = {},
  limit = 20,
  offset = 0,
  debounceMs = 500,
  enabled = true,
}: UseServerSearchOptions<T>): ServerSearchResult<T> {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, debounceMs]);

  const [data, setData] = useState<T[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const params: any = {
        search_query: debouncedQuery || '',
        limit_count: limit,
        offset_count: offset,
      };

      if (searchFunction === 'search_taxis') {
        params.vehicle_type_filter = filters.vehicle_type || '';
        params.location_filter = filters.location || '';
      } else if (searchFunction === 'search_hotels') {
        params.location_filter = filters.location || '';
        params.category_filter = filters.category || '';
      }

      const { data: result, error: err } = await supabase.rpc(searchFunction, params);

      if (err) {
        throw new Error(err.message);
      }

      setData(result as T[]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setIsError(true);
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchFunction, debouncedQuery, filters, limit, offset, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchData,
  };
}
