"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  email: null,
  loading: true,
  login: async () => ({ ok: false }),
  signup: async () => ({ ok: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, verify the stored email against the DB
  useEffect(() => {
    const stored = localStorage.getItem("auth_email");
    if (!stored) {
      setLoading(false);
      return;
    }
    fetch(`/api/auth?email=${encodeURIComponent(stored)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setEmail(stored);
        } else {
          localStorage.removeItem("auth_email");
        }
      })
      .catch(() => localStorage.removeItem("auth_email"))
      .finally(() => setLoading(false));
  }, []);

  async function login(inputEmail: string, inputPassword: string) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email: inputEmail, password: inputPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setEmail(data.email);
      localStorage.setItem("auth_email", data.email);
      return { ok: true };
    }
    return { ok: false, error: data.error };
  }

  async function signup(inputEmail: string, inputPassword: string) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup", email: inputEmail, password: inputPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setEmail(data.email);
      localStorage.setItem("auth_email", data.email);
      return { ok: true };
    }
    return { ok: false, error: data.error };
  }

  async function logout() {
    if (email) {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout", email }),
      });
    }
    setEmail(null);
    localStorage.removeItem("auth_email");
  }

  return (
    <AuthContext.Provider value={{ email, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
