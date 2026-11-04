"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface User {
  name: string;
}

interface SessionContextValue {
  user: User | null;
  login: (u: User | null) => void;
  signOut: () => void;
}

const USER_KEY = "av_user";

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // El primer render es siempre "sin sesión"; se lee localStorage tras montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const parsed = raw ? (JSON.parse(raw) as User | null) : null;
      if (parsed && typeof parsed.name === "string") {
        // Lectura única tras hidratar: evita mismatch servidor/cliente.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsed);
      }
    } catch {
      // localStorage no disponible o JSON inválido: sigue sin sesión
    }
  }, []);

  const login = useCallback((u: User | null) => {
    setUser(u);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      // sin persistencia
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // sin persistencia
    }
  }, []);

  const value = useMemo(
    () => ({ user, login, signOut }),
    [user, login, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider");
  return ctx;
}
