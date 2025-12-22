const TRANSLATIONS = {
  en: require('./locales/en.json'),
  fr: require('./locales/fr.json'),
};

const getTranslation = (lang, key = null) => {
  const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;
  if (!key) return translations;
  
  const keys = key.split('.');
  let value = translations;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English if key not found
      return getTranslation('en', key) || '';
    }
  }
  return value;
};

module.exports = { getTranslation };