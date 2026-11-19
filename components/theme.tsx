"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";

export type Theme = "light" | "dark";
const STORAGE_KEY = "theme";

/** Runs before first paint (inlined in <head>) so there is no flash of the wrong theme. */
export const themeInitScript = `try{var t=localStorage.getItem("${STORAGE_KEY}");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}`;

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => "light"
  );
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the switch still works for this visit.
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={`rounded-xl p-2.5 text-muted ring-1 ring-line transition hover:bg-surface hover:text-fg ${className}`}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function ThemedToaster() {
  const theme = useTheme();
  return <Toaster theme={theme} richColors position="top-right" closeButton />;
}
