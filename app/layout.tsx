import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SearchProvider } from "@/components/search-context";
import { AuthProvider } from "@/components/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mine Safe Dashboard",
  description: "Mine safety monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900">
        <AuthProvider>
          <AuthGuard>
            <SearchProvider>{children}</SearchProvider>
          </AuthGuard>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
