import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SearchProvider } from "@/components/search-context";
import { AuthProvider } from "@/components/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { ThemedToaster, themeInitScript } from "@/components/theme";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Coal Mine Safety", template: "%s · Coal Mine Safety" },
  description: "Real-time gas, temperature and humidity monitoring for underground mines.",
  // Favicons come from app/favicon.ico, app/icon.png and app/apple-icon.png (Next.js file conventions).
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d11" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-canvas text-fg">
        <AuthProvider>
          <AuthGuard>
            <SearchProvider>{children}</SearchProvider>
          </AuthGuard>
        </AuthProvider>
        <ThemedToaster />
      </body>
    </html>
  );
}
