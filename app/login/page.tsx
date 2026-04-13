"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-8 flex items-center justify-center">
          <img src="/logg.jpeg" alt="Mine Safe Logo" className="h-24 w-24 rounded-full object-cover ring-4 ring-amber-500 shadow-lg" />
        </div>

        <div className="mb-6 flex rounded-xl border border-zinc-700 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-amber-500 text-slate-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-amber-500 text-slate-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <h1 className="mb-1 text-lg font-semibold text-white">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          {mode === "login" ? "Sign in to access the dashboard" : "Register to get started"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Confirm Password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-amber-500 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition disabled:opacity-60"
          >
            {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-amber-500 hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
