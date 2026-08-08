import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "../i18n/en.json";
import hi from "../i18n/hi.json";

const dictionaries = { en, hi };
const LanguageContext = createContext(null);
const STORAGE_KEY = "flare_language";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && dictionaries[saved]) setLang(saved);
    });
  }, []);

  async function changeLanguage(next) {
    setLang(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }

  function t(key) {
    return dictionaries[lang][key] || dictionaries.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
