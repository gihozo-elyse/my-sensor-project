"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { email, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!email && pathname !== "/login") router.replace("/login");
    if (email && pathname === "/login") router.replace("/");
  }, [email, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    );
  }

  if (!email && pathname !== "/login") return null;

  return <>{children}</>;
}
