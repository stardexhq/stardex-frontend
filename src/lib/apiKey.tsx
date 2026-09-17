import { StardexClient } from "@stardex/sdk";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { API_BASE_URL } from "../config";

const STORAGE_KEY = "stardex.apiKey";

function readStoredKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

interface ApiKeyState {
  apiKey: string;
  setApiKey: (key: string) => void;
  /** Client for business data, carrying the saved key. */
  stardex: StardexClient;
}

const ApiKeyContext = createContext<ApiKeyState | null>(null);

/**
 * Holds the backend admin key for this browser. It is kept in localStorage so
 * it survives reloads; if storage is unavailable it lasts for the session.
 */
export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setKeyState] = useState(readStoredKey);

  const setApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    setKeyState(trimmed);
    try {
      if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage blocked (private mode, site data disabled): keep it in memory only.
    }
  }, []);

  const stardex = useMemo(
    () => new StardexClient({ baseUrl: API_BASE_URL, apiKey: apiKey || undefined }),
    [apiKey],
  );

  const value = useMemo(() => ({ apiKey, setApiKey, stardex }), [apiKey, setApiKey, stardex]);
  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApiKey(): ApiKeyState {
  const value = useContext(ApiKeyContext);
  if (!value) throw new Error("useApiKey must be used inside ApiKeyProvider");
  return value;
}
