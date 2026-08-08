import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors } from "../theme/colors";

const ThemeContext = createContext(null);
const STORAGE_KEY = "flare_theme_preference"; // 'light' | 'dark' | 'system'

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState("system");
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() || "light",
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setPreference(saved);
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || "light");
    });
    return () => sub.remove();
  }, []);

  const activeScheme = preference === "system" ? systemScheme : preference;
  const colors = activeScheme === "dark" ? darkColors : lightColors;

  async function setThemePreference(next) {
    setPreference(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <ThemeContext.Provider
      value={{ colors, scheme: activeScheme, preference, setThemePreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
