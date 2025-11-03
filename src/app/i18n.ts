import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en/translation.json';
import de from '@/locales/de/translation.json';
import ru from '@/locales/ru/translation.json';
import es from '@/locales/es/translation.json';
import pl from '@/locales/pl/translation.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  ru: { translation: ru },
  es: { translation: es },
  pl: { translation: pl },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;