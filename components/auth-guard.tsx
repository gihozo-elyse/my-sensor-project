"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { LiveSensorProvider } from "@/components/live-sensor";
import { LogoMark } from "@/components/ui";

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { email, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!email && !isPublic) router.replace("/login");
    if (email && isPublic) router.replace("/");
  }, [email, loading, isPublic, router]);

  if (loading || (!email && !isPublic) || (email && isPublic)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
        <LogoMark size={56} className="animate-pulse" />
        <span className="text-sm text-muted">Loading…</span>
      </div>
    );
  }

  if (isPublic) return <>{children}</>;

  // Signed in: poll live data app-wide so alerts fire on every page.
  return <LiveSensorProvider>{children}</LiveSensorProvider>;
}
