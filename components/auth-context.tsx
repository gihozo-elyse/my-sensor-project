"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Result = { ok: boolean; error?: string };

type AuthContextType = {
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  signup: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  email: null,
  loading: true,
  login: async () => ({ ok: false }),
  signup: async () => ({ ok: false }),
  logout: async () => {},
});

async function postAuth(body: Record<string, string>) {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // The session lives in an httpOnly cookie; ask the server who we are.
  useEffect(() => {
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setEmail(data.email ?? null))
      .catch(() => setEmail(null))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = useCallback(async (action: "login" | "signup", inputEmail: string, password: string) => {
    try {
      const { res, data } = await postAuth({ action, email: inputEmail, password });
      if (res.ok) {
        setEmail(data.email);
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Something went wrong." };
    } catch {
      return { ok: false, error: "Can't reach the server. Check your connection." };
    }
  }, []);

  const logout = useCallback(async () => {
    await postAuth({ action: "logout" }).catch(() => {});
    setEmail(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        email,
        loading,
        login: (e, p) => authenticate("login", e, p),
        signup: (e, p) => authenticate("signup", e, p),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
