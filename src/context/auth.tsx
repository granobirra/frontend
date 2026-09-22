import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { apiFetch, TOKEN_KEY } from "@/src/api";
import { storage } from "@/src/utils/storage";

export type User = {
  id: string;
  email: string;
  nome: string;
  role: "direttore" | "tecnico";
  station_id: string | null;
  station_code: string | null;
  station_name: string | null;
};

type RegisterInput = {
  nome: string;
  email: string;
  password: string;
  role: "direttore" | "tecnico";
  station_name?: string;
  station_code?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await storage.secureGet(TOKEN_KEY, "");
      if (token) {
        try {
          const me = await apiFetch<User>("/auth/me");
          setUser(me);
        } catch {
          await storage.secureRemove(TOKEN_KEY);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await storage.secureSet(TOKEN_KEY, res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiFetch<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: input,
    });
    await storage.secureSet(TOKEN_KEY, res.access_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await storage.secureRemove(TOKEN_KEY);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await apiFetch("/auth/account", { method: "DELETE" });
    await storage.secureRemove(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, deleteAccount }),
    [user, loading, login, register, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
