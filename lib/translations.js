const path = require('path');
const fs = require('fs');

// Load translations from client/src/locales (single source of truth)
const LOCALES_PATH = path.join(__dirname, '../client/src/locales');

// Helper to load JSON files that might be UTF-16 encoded
const loadJSON = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  let content;
  
  // Check for UTF-16 BOM and decode accordingly
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    // UTF-16LE with BOM
    content = buffer.toString('utf16le', 2);
  } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    // UTF-16BE with BOM
    content = buffer.toString('utf16be', 2);
  } else {
    // Try UTF-8
    content = buffer.toString('utf8');
  }
  
  return JSON.parse(content);
};

const enBase = require(path.join(LOCALES_PATH, 'en.json'));
const frBase = require(path.join(LOCALES_PATH, 'fr.json'));
const enCategories = loadJSON(path.join(LOCALES_PATH, '_categories_en.json'));
const frCategories = loadJSON(path.join(LOCALES_PATH, '_categories_fr.json'));

const TRANSLATIONS = {
  en: {
    ...enBase,
    categories: {
      ...enBase.categories,
      ...enCategories,
    },
  },
  fr: {
    ...frBase,
    categories: {
      ...frBase.categories,
      ...frCategories,
    },
  },
};

// Helper function to get nested value from object using dot notation
const getNestedValue = (obj, keyPath) => {
  const keys = keyPath.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }
  return value;
};

const getTranslation = (lang, key = null) => {
  const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;
  if (!key) return translations;
  
  // Try to get nested value using dot notation
  let value = getNestedValue(translations, key);
  
  // Fallback to English if key not found and language is not English
  if (value === undefined && lang !== 'en') {
    return getTranslation('en', key) || '';
  }
  
  return value || '';
};

module.exports = { getTranslation };