"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { SessionUser } from "@/types";

interface SessionState {
  user: SessionUser | null;
  loaded: boolean;
  refresh: () => void;
}

const SessionContext = createContext<SessionState>({
  user: null,
  loaded: false,
  refresh: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setUser(json?.data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ user, loaded, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
