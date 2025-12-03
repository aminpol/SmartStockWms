import React, { createContext, useState, useContext, useEffect } from "react";
import { translations } from "../utils/translations";

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
  // Load settings from localStorage or use defaults
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("app_config");
    return saved
      ? JSON.parse(saved)
      : {
          theme: "blue", // blue, green, red, yellow
          language: "es", // es, en
          generatorDefaults: {
            type: "qr",
            textSize: 16,
            width: 80,
            height: 80,
          },
        };
  });

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem("app_config", JSON.stringify(config));
    applyTheme(config.theme);
  }, [config]);

  // Apply CSS variables based on theme
  const applyTheme = (theme) => {
    const root = document.documentElement;

    const themes = {
      blue: {
        "--primary-color": "#3b82f6",
        "--primary-hover": "#2563eb",
        "--primary-light": "#eff6ff",
        "--secondary-color": "#1e293b",
        "--accent-color": "#60a5fa",
        "--bg-gradient-start": "#f1f5f9",
        "--bg-gradient-mid": "#cfe3f9",
        "--bg-gradient-end": "#a5f3fc",
      },
      green: {
        "--primary-color": "#10b981",
        "--primary-hover": "#059669",
        "--primary-light": "#ecfdf5",
        "--secondary-color": "#064e3b",
        "--accent-color": "#34d399",
        "--bg-gradient-start": "#f0fdf4",
        "--bg-gradient-mid": "#d1fae5",
        "--bg-gradient-end": "#a7f3d0",
      },
      red: {
        "--primary-color": "#ef4444",
        "--primary-hover": "#dc2626",
        "--primary-light": "#fef2f2",
        "--secondary-color": "#7f1d1d",
        "--accent-color": "#f87171",
        "--bg-gradient-start": "#fef2f2",
        "--bg-gradient-mid": "#fee2e2",
        "--bg-gradient-end": "#fecaca",
      },
      yellow: {
        "--primary-color": "#eab308",
        "--primary-hover": "#ca8a04",
        "--primary-light": "#fefce8",
        "--secondary-color": "#713f12",
        "--accent-color": "#facc15",
        "--bg-gradient-start": "#fefce8",
        "--bg-gradient-mid": "#fef9c3",
        "--bg-gradient-end": "#fde047",
      },
    };

    const selectedTheme = themes[theme] || themes.blue;

    Object.entries(selectedTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };

  // Translation helper
  const t = (key) => {
    return translations[config.language][key] || key;
  };

  const updateConfig = (newConfig) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, t }}>
      {children}
    </ConfigContext.Provider>
  );
};
