"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setSubmitting(false);
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        setSubmitting(false);
        return;
      }
      const result = await signup(email, password);
      if (result.ok) {
        router.push("/");
      } else {
        setError(result.error ?? "Sign up failed.");
        setSubmitting(false);
      }
    } else {
      const result = await login(email, password);
      if (result.ok) {
        router.push("/");
      } else {
        setError(result.error ?? "Invalid email or password.");
        setSubmitting(false);
      }
    }
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Home className="h-6 w-6 text-amber-500" />
          <span className="text-2xl font-semibold tracking-wide text-slate-900">MINE SAFE</span>
        </div>

        <div className="mb-6 flex rounded-xl border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-amber-500 text-slate-950" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-amber-500 text-slate-950" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        <h1 className="mb-1 text-lg font-semibold text-slate-900">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          {mode === "login" ? "Sign in to access the dashboard" : "Register to get started"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900">Confirm Password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-amber-500 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition disabled:opacity-60"
          >
            {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-amber-600 hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
