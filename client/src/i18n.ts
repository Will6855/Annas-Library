import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enClient from './locales/en.json';
import frClient from './locales/fr.json';

const enCategoriesAny = (globalThis as any).__ENV_EN_CATEGORIES || {};
const frCategoriesAny = (globalThis as any).__ENV_FR_CATEGORIES || {};

// Initialize with client translations and categories
const en: any = { ...enClient };
const fr: any = { ...frClient };

// Add categories - will be populated from server
en.categories = { ...en.categories, ...enCategoriesAny };
fr.categories = { ...fr.categories, ...frCategoriesAny };

// Initialize i18n first
i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr }
        },
        lng: "en",
        fallbackLng: "en",
        nsSeparator: false,  // Disable namespace separator to allow colons in keys
        keySeparator: '.',   // Use dot for nested key separation
        interpolation: {
            escapeValue: false
        }
    });

// Fetch categories from server after initialization
if (typeof window !== 'undefined') {
    Promise.all([
        fetch('/api/translations/categories/en').then(r => r.json()).catch(() => ({})),
        fetch('/api/translations/categories/fr').then(r => r.json()).catch(() => ({}))
    ]).then(([enCats, frCats]) => {
        if (enCats.data) {
            i18n.getResourceBundle('en', 'translation').categories = {
                ...i18n.getResourceBundle('en', 'translation').categories,
                ...enCats.data
            };
        }
        if (frCats.data) {
            i18n.getResourceBundle('fr', 'translation').categories = {
                ...i18n.getResourceBundle('fr', 'translation').categories,
                ...frCats.data
            };
        }
    });
}

export default i18n;
