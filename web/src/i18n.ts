import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationEN from "./locales/en/translation.json";
import translationZHS from "./locales/zh/translation.json";
import translationZHT from "./locales/zh-HK/translation.json";

// the translations
const resources = {
    en: {
      translation: translationEN,
    },
    zhs: {
      translation: translationZHS,
    },
    zht: {
      translation: translationZHT,
    },
  };

const currentLanguage = localStorage.getItem("currentLanguage") ? localStorage.getItem("currentLanguage") : "zhs";

i18n.use(initReactI18next).init({
    resources,
    lng: currentLanguage,
    fallbackLng: currentLanguage,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;