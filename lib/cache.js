const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const CACHE_DB_PATH = path.join(__dirname, '..', '.cache', 'cache.db');
const CACHE_DIR = path.dirname(CACHE_DB_PATH);

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Initialize database connection
const db = new sqlite3.Database(CACHE_DB_PATH, (err) => {
  if (err) {
    console.error('[CACHE] Database connection error:', err.message);
  } else {
    console.log('[CACHE] Connected to SQLite cache database');
    initializeSchema();
  }
});

/**
 * Initialize the cache table schema
 */
function initializeSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expiry INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('[CACHE] Schema initialization error:', err.message);
    } else {
      console.log('[CACHE] Schema initialized');
      // Clean up expired entries on startup
      cleanupExpired();
    }
  });

  // Create index on expiry for faster cleanup queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_cache_expiry ON cache(expiry)`, (err) => {
    if (err) {
      console.error('[CACHE] Index creation error:', err.message);
    }
  });
}

/**
 * Clean up expired cache entries
 */
function cleanupExpired() {
  const now = Date.now();
  db.run(
    'DELETE FROM cache WHERE expiry < ?',
    [now],
    function(err) {
      if (err) {
        console.error('[CACHE] Cleanup error:', err.message);
      } else if (this.changes > 0) {
        console.log(`[CACHE] Cleaned up ${this.changes} expired entries`);
      }
    }
  );
}

/**
 * Set a cache value with optional TTL
 * @param {string} key - Cache key
 * @param {*} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
 * @returns {Promise<void>}
 */
function set(key, value, ttl = 3600000) {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    const expiry = now + ttl;
    const serializedValue = JSON.stringify(value);

    db.run(
      `INSERT OR REPLACE INTO cache (key, value, expiry, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [key, serializedValue, expiry, now, now],
      (err) => {
        if (err) {
          console.error(`[CACHE] Set error for key "${key}":`, err.message);
          reject(err);
        } else {
          console.log(`[CACHE] Set "${key}" (TTL: ${ttl}ms)`);
          resolve();
        }
      }
    );
  });
}

/**
 * Get a cache value
 * @param {string} key - Cache key
 * @returns {Promise<*|null>} Cached value or null if not found/expired
 */
function get(key) {
  return new Promise((resolve, reject) => {
    const now = Date.now();

    db.get(
      'SELECT value, expiry FROM cache WHERE key = ? AND expiry > ?',
      [key, now],
      (err, row) => {
        if (err) {
          console.error(`[CACHE] Get error for key "${key}":`, err.message);
          reject(err);
        } else if (row) {
          try {
            const value = JSON.parse(row.value);
            console.log(`[CACHE] Hit "${key}" (expires in ${row.expiry - now}ms)`);
            resolve(value);
          } catch (parseErr) {
            console.error(`[CACHE] Parse error for key "${key}":`, parseErr.message);
            reject(parseErr);
          }
        } else {
          console.log(`[CACHE] Miss "${key}"`);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Check if a key exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {Promise<boolean>}
 */
function has(key) {
  return new Promise((resolve, reject) => {
    const now = Date.now();

    db.get(
      'SELECT 1 FROM cache WHERE key = ? AND expiry > ? LIMIT 1',
      [key, now],
      (err, row) => {
        if (err) {
          console.error(`[CACHE] Has error for key "${key}":`, err.message);
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

/**
 * Delete a cache entry
 * @param {string} key - Cache key
 * @returns {Promise<void>}
 */
function remove(key) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM cache WHERE key = ?',
      [key],
      function(err) {
        if (err) {
          console.error(`[CACHE] Remove error for key "${key}":`, err.message);
          reject(err);
        } else {
          console.log(`[CACHE] Removed "${key}"`);
          resolve();
        }
      }
    );
  });
}

/**
 * Clear all cache entries
 * @returns {Promise<void>}
 */
function clear() {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM cache',
      function(err) {
        if (err) {
          console.error('[CACHE] Clear error:', err.message);
          reject(err);
        } else {
          console.log(`[CACHE] Cleared all entries`);
          resolve();
        }
      }
    );
  });
}

/**
 * Get cache statistics
 * @returns {Promise<Object>}
 */
function stats() {
  return new Promise((resolve, reject) => {
    const now = Date.now();

    db.get(
      `SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN expiry > ? THEN 1 END) as valid_entries,
        COUNT(CASE WHEN expiry <= ? THEN 1 END) as expired_entries,
        ROUND(SUM(LENGTH(value)) / 1024.0 / 1024.0, 2) as size_mb
       FROM cache`,
      [now, now],
      (err, row) => {
        if (err) {
          console.error('[CACHE] Stats error:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

/**
 * Close database connection
 */
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('[CACHE] Close error:', err.message);
        reject(err);
      } else {
        console.log('[CACHE] Database connection closed');
        resolve();
      }
    });
  });
}

// Periodically cleanup expired entries every 10 minutes
setInterval(cleanupExpired, 10 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  await close();
  process.exit(0);
});

module.exports = {
  set,
  get,
  has,
  remove,
  clear,
  stats,
  close
};
