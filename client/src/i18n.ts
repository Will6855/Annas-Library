import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enClient from './locales/en.json';
import frClient from './locales/fr.json';
// Import server-side translations (they include categories)
import enServer from '../../lib/locales/en.json';
import frServer from '../../lib/locales/fr.json';

const enServerAny = enServer as any;
const frServerAny = frServer as any;

// Initialize with client translations
const en: any = { ...enClient };
const fr: any = { ...frClient };

// Merge ALL server keys into the root
Object.keys(enServerAny).forEach(k => {
    if (k === 'categories') {
        // Flatten categories: "categories.zlib_category_id:1"
        Object.entries(enServerAny.categories).forEach(([catId, catName]) => {
            en[`categories.${catId}`] = catName;
        });
    } else {
        en[k] = enServerAny[k];
    }
});

Object.keys(frServerAny).forEach(k => {
    if (k === 'categories') {
        // Flatten categories
        Object.entries(frServerAny.categories).forEach(([catId, catName]) => {
            fr[`categories.${catId}`] = catName;
        });
    } else {
        fr[k] = frServerAny[k];
    }
});

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr }
        },
        lng: "en",
        fallbackLng: "en",
        // Disable selectors to handle colons and dots in keys
        nsSeparator: false,
        keySeparator: false,
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
