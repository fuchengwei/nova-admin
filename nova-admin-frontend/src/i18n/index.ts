import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import zh from './zh';

i18n.use(initReactI18next).init({
  resources: {
    zh_CN: { translation: zh },
    en_US: { translation: en },
  },
  lng: 'zh_CN',
  fallbackLng: 'zh_CN',
  interpolation: { escapeValue: false },
});

export default i18n;
