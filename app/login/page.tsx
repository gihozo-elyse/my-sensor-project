"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, Eye, EyeOff, Flame, Loader2, LineChart, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { Button, cx } from "@/components/ui";

const FEATURES = [
  { icon: Flame, text: "Live gas, temperature and humidity readings" },
  { icon: Bell, text: "Instant push alerts on warning and critical levels" },
  { icon: LineChart, text: "History charts and weekly PDF reports" },
];

const inputClass =
  "w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-fg placeholder:text-faint outline-none transition focus:border-brand/60 focus:ring-4 focus:ring-brand/10";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (password.length < 8) return setError("Password must be at least 8 characters.");
      if (password !== confirm) return setError("Passwords do not match.");
    }

    setSubmitting(true);
    const result = mode === "signup" ? await signup(email, password) : await login(email, password);
    if (result.ok) {
      router.replace("/");
    } else {
      setError(result.error ?? "Something went wrong.");
      setSubmitting(false);
    }
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-brand-strong/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />

        <div className="relative flex items-center gap-2 text-sm text-muted">
          <ShieldCheck className="h-4 w-4 text-brand" />
          Underground safety monitoring
        </div>

        <div className="relative">
          <div className="mb-8 h-40 w-40 overflow-hidden rounded-3xl bg-[#f7f7f7] shadow-2xl shadow-brand/10 ring-1 ring-white/10">
            <Image src="/logg.jpeg" alt="Coal Mine Safety logo" width={320} height={320} className="h-full w-full object-cover" priority />
          </div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-fg">
            Know the air before your team <span className="bg-gradient-to-r from-brand to-brand-strong bg-clip-text text-transparent">goes down.</span>
          </h1>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-raised text-brand ring-1 ring-line">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-faint">ESP8266 · MQ135 · DHT22</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-5 py-12">
        <div className="fade-up w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-[#f7f7f7] ring-4 ring-brand/70">
              <Image src="/logg.jpeg" alt="Coal Mine Safety logo" width={192} height={192} className="h-full w-full object-cover" priority />
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-fg">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="mt-1 text-sm text-muted">{mode === "login" ? "Sign in to the monitoring dashboard." : "Get live alerts and reports for your site."}</p>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-surface p-1 ring-1 ring-line">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cx(
                  "rounded-lg py-2 text-sm font-medium transition",
                  mode === m ? "bg-raised text-fg shadow ring-1 ring-line-strong" : "text-muted hover:text-fg"
                )}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-fg">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-fg">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                  className={cx(inputClass, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-faint hover:text-fg"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" ? (
              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-fg">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={inputClass}
                />
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="rounded-lg bg-crit/10 px-3 py-2 text-sm text-crit ring-1 ring-crit/25">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={submitting} className="w-full py-2.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="font-medium text-brand hover:underline">
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
