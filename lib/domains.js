require('dotenv').config();
const https = require('https');
const http = require('http');

const SERVICES = {
  annas: {
    default: [
      'https://annas-archive.org', 
      'https://annas-archive.li', 
      'https://annas-archive.se', 
      'https://annas-archive.in',
      'https://annas-archive.pm'
    ],
    protocol: 'https://'
  },
  zlib: {
    default: [
      '1lib.sk', 
      'z-library.sk', 
      'z-lib.fm'
    ],
    protocol: 'https://' 
  }
};

// State to store domains and current active domain
// Structure: { [service]: { domains: string[], active: string } }
const state = {};

function init() {
  Object.keys(SERVICES).forEach(service => {
    const config = SERVICES[service];
    let domains = [...config.default];

    // Normalize: ensure no trailing slashes, ensure protocol if needed (mostly for Anna's)
    // For Zlib, the code often expects just the domain because it prepends subdomains (e.g. "en.1lib.sk")
    // But Anna's code expects full URL.
    
    if (service === 'annas') {
      domains = domains.map(d => {
        if (!d.startsWith('http')) return `https://${d}`;
        return d.replace(/\/$/, '');
      });
    } else {
      // Zlib
      domains = domains.map(d => {
        return d.replace(/^https?:\/\//, '').replace(/\/$/, '');
      });
    }

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

/**
 * Check if a domain is reachable
 * @param {string} url - Full URL to check
 * @returns {Promise<boolean>}
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
      // Accept 2xx, 3xx, 403 (Cloudflare often returns 403 but it means it's "online" just protected)
      // Actually, for API usage we might need 200. But for "is it down", connection refused is the main bad one.
      // However, if we get 5xx it's internal error.
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
 * Find a new working domain and set it as active
 * @param {string} service - 'annas' or 'zlib'
 * @returns {Promise<string>} The new active domain
 */
async function refreshDomain(service) {
  console.log(`[DOMAINS] Refreshing domain for ${service}...`);
  const config = state[service];
  if (!config || !config.domains.length) return null;

  for (const domain of config.domains) {
    let testUrl = domain;
    if (service === 'zlib') {
      testUrl = `https://${domain}`; 
    }
    
    console.log(`[DOMAINS] Checking ${testUrl}...`);
    const isUp = await checkUrl(testUrl);
    if (isUp) {
      console.log(`[DOMAINS] Found working domain: ${domain}`);
      config.active = domain;
      return domain;
    }
  }

  console.error(`[DOMAINS] All domains for ${service} seem down! Keeping last active: ${config.active}`);
  return config.active; // Keep the old one if all fail, maybe temporary glitch
}

module.exports = {
  getDomain,
  refreshDomain
};
