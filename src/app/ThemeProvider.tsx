"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const preferred = stored || "dark";
    setTheme(preferred);
    document.documentElement.classList.toggle("dark", preferred === "dark");
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  // Prevent flash by not rendering until mounted
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
      style={{
        color: "var(--text-secondary)",
        background: "var(--bg-hover)",
      }}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4" style={{ color: "var(--amber)" }} />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" style={{ color: "var(--indigo)" }} />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}
