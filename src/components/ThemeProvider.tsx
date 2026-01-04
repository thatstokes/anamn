import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { ThemeConfig } from "../../shared/types.js";

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeConfig>({ mode: "dark" });
  const [customCss, setCustomCss] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from config on mount
  useEffect(() => {
    window.api.config.get().then((config) => {
      setThemeState(config.theme);
      setIsLoading(false);
    });
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    const applyTheme = async () => {
      const htmlElement = document.documentElement;

      // Remove old custom CSS
      const existingCustomStyle = document.getElementById("custom-theme-css");
      if (existingCustomStyle) {
        existingCustomStyle.remove();
      }

      if (theme.mode === "custom" && theme.customCssPath) {
        // Load and apply custom CSS
        try {
          const css = await window.api.theme.loadCustomCss(theme.customCssPath);
          setCustomCss(css);
          htmlElement.setAttribute("data-theme", "custom");
        } catch (error) {
          console.error("Failed to load custom CSS:", error);
          // Fall back to dark theme on error
          htmlElement.setAttribute("data-theme", "dark");
        }
      } else {
        setCustomCss(null);
        htmlElement.setAttribute("data-theme", theme.mode === "light" ? "light" : "dark");
      }
    };

    applyTheme();
  }, [theme]);

  // Inject custom CSS when it changes
  useEffect(() => {
    if (customCss) {
      const style = document.createElement("style");
      style.id = "custom-theme-css";
      style.textContent = customCss;
      document.head.appendChild(style);

      return () => {
        style.remove();
      };
    }
  }, [customCss]);

  const setTheme = async (newTheme: ThemeConfig): Promise<void> => {
    setThemeState(newTheme);
    await window.api.config.set({ theme: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
