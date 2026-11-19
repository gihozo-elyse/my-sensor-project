import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SearchProvider } from "@/components/search-context";
import { AuthProvider } from "@/components/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Coal Mine Safety", template: "%s · Coal Mine Safety" },
  description: "Real-time gas, temperature and humidity monitoring for underground mines.",
  icons: { icon: "/logg.jpeg" },
};

export const viewport: Viewport = {
  themeColor: "#0b0d11",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-fg">
        <AuthProvider>
          <AuthGuard>
            <SearchProvider>{children}</SearchProvider>
          </AuthGuard>
        </AuthProvider>
        <Toaster theme="dark" richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
