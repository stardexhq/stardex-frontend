import type { Page } from "@stardex/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { errorText } from "../lib/money";

export interface CursorList<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

/**
 * Loads a cursor-paginated list, appending pages on `loadMore`. `load` must be
 * memoised by the caller; a new `load` (new filters) starts over from page one.
 * Responses from superseded requests are dropped.
 */
export function useCursorList<T>(
  load: ((cursor: string | undefined) => Promise<Page<T>>) | null,
): CursorList<T> {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (from: string | undefined, append: boolean) => {
      if (!load) return;
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const page = await load(from);
        if (id !== requestId.current) return;
        setItems((prev) => (append ? [...prev, ...page.items] : page.items));
        setCursor(page.nextCursor);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(errorText(err));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setItems([]);
    setCursor(null);
    void fetchPage(undefined, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (cursor && !loading) void fetchPage(cursor, true);
  }, [cursor, loading, fetchPage]);

  const reload = useCallback(() => void fetchPage(undefined, false), [fetchPage]);

  return { items, loading, error, hasMore: cursor !== null, loadMore, reload };
}
