require('dotenv').config();
const https = require('https');
const http = require('http');

const SERVICES = {
  annas: [
    'annas-archive.gl',
    'annas-archive.pk',
    'annas-archive.gd',
    'annas-archive.org', 
    'annas-archive.li', 
    'annas-archive.se', 
    'annas-archive.in',
    'annas-archive.pm'
  ],
  zlib: [
    '1lib.sk', 
    'z-library.sk', 
    'z-lib.fm'
  ]
};

// State to store domains and current active domain
// Structure: { [service]: { domains: string[], active: string } }
const state = {};

function init() {
  Object.keys(SERVICES).forEach(service => {
    const list = SERVICES[service];
    // Normalize: remove protocol and trailing slashes
    const domains = list.map(d => d.replace(/^https?:\/\//, '').replace(/\/$/, ''));

    state[service] = {
      domains: domains,
      active: domains[0] // Optimistic start
    };
    
    console.log(`[DOMAINS] Initialized ${service} with ${domains.length} domains. Active: ${state[service].active}`);
  });
}

// Ensure initialized
init();

/**
 * Get the current active domain for a service
 * @param {string} service - 'annas' or 'zlib'
 * @returns {string} The active domain
 */
function getDomain(service) {
  if (!state[service]) return null;
  return state[service].active;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
};

/**
 * Check if a domain is reachable
 * @param {string} url - Full URL to check
 * @returns {Promise<boolean>}
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const options = {
      method: 'GET', // GET is sometimes more reliable than HEAD for CF
      timeout: 5000,
      headers: DEFAULT_HEADERS
    };
    
    const req = lib.request(url, options, (res) => {
      // Accept 2xx, 3xx, 403 (CF challenge is still "online")
      if (res.statusCode < 500) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

/**
 * Find a new working domain and set it as active.
 * Handles concurrent calls by using a single promise per service.
 * @param {string} service - 'annas' or 'zlib'
 * @returns {Promise<string>} The new active domain
 */
async function refreshDomain(service) {
  const config = state[service];
  if (!config || !config.domains.length) return null;

  // If already refreshing, wait for that same promise
  if (config.refreshPromise) {
    return config.refreshPromise;
  }

  // Create the refresh promise
  config.refreshPromise = (async () => {
    try {
      console.log(`[DOMAINS] Refreshing domain for ${service}...`);
      
      for (const domain of config.domains) {
        let testUrl = `https://${domain}`;
        
        console.log(`[DOMAINS] Checking ${testUrl}...`);
        const isUp = await checkUrl(testUrl);
        if (isUp) {
          console.log(`[DOMAINS] Found working domain: ${domain}`);
          config.active = domain;
          return domain;
        }
      }

      console.error(`[DOMAINS] All domains for ${service} seem down! Keeping last active: ${config.active}`);
      return config.active;
    } finally {
      // Clear the promise when done so future refreshes can happen
      config.refreshPromise = null;
    }
  })();

  return config.refreshPromise;
}

module.exports = {
  getDomain,
  refreshDomain
};
