import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sahoda CRM - Founder CRM & Task Manager",
  description: "All-in-one lightweight CRM, Task Manager, Meetings Calendar, and WhatsApp alerts engine for solo founders.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sahoda CRM",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Applies the saved theme before first paint. The class used to be
          hardcoded to "dark" here, so a saved light preference was rendered
          dark by the server and only corrected after hydration — the toggle
          looked like it had not persisted.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme")||"dark";if(t==="dark")document.documentElement.classList.add("dark");}catch(e){document.documentElement.classList.add("dark");}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
          {/* Toasts sit above dialogs so a save result is never hidden. */}
          <Toaster
            position="top-right"
            richColors
            closeButton
            style={{ zIndex: "var(--z-toast)" as any }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
