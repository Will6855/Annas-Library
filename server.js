const os = require('os');
const path = require('path');
const express = require('express');
const { generateRootCatalog, generateBooksFeed, generateOpenSearch, generateLanguageCatalog, generateContentTypeCatalog, generateCategoryCatalog } = require('./lib/catalog');
const { searchBooks, getBookDetails, getActualDownloadLink, getPopularBooks, resolveZlibIdToMd5, ANNAS_ARCHIVE_BASE } = require('./lib/scraper');
const api = require('./lib/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Helper
const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;
const OPDS_CONTENT_TYPE = 'application/atom+xml;profile=opds-catalog';

// Route handlers
const handleSearch = async (req, res) => {
  try {
    let { q = '', lang = '', content = '', category = '', page = 1 } = req.query;
    
    // Parse JSON data if provided
    if (req.query.data) {
      try {
        ({ q, lang, content, category, page } = JSON.parse(decodeURIComponent(req.query.data)));
      } catch (e) { 
        console.error('Parse error:', e); 
      }
    }
    
    const baseUrl = getBaseUrl(req);
    const books = await searchBooks(q, lang, content, category, +page);
    
    // Build search URL
    const params = new URLSearchParams({ lang, content, category });
    params.toString(); // Filters empty values
    
    res.set('Content-Type', OPDS_CONTENT_TYPE).send(generateBooksFeed(
      books, 
      baseUrl, 
      q,
      `urn:opds:search:${[q, lang, content, category, page > 1 ? page : ''].filter(Boolean).join(':')}`,
      `${baseUrl}/opensearch.xml${params ? '?' + params : ''}`,
      lang || 'en', 
      category, 
      content, 
      +page, 
      books.length === 50
    ));
  } catch (error) {
    console.error(`Search error: ${error.message}`);
    res.status(500).send('Search failed');
  }
};

const handlePopular = async (req, res) => {
  try {
    const { lang = 'en' } = req.params;
    const { page = 1 } = req.query;
    const baseUrl = getBaseUrl(req);
    
    const { books, nextPage } = await getPopularBooks(lang, +page);
    
    res.set('Content-Type', OPDS_CONTENT_TYPE).send(generateBooksFeed(
      books,
      baseUrl,
      '',
      `urn:opds:popular:${lang}:${page}`,
      null,
      lang,
      null,
      'popular',
      +page,
      !!nextPage
    ));
  } catch (error) {
    console.error(`Popular books error: ${error.message}`);
    res.status(500).send('Failed to fetch popular books');
  }
};

const handleDownload = async (req, res) => {
  let { md5 } = req.params;
  try {
    if (md5.startsWith('zlib:')) {
      const resolved = await resolveZlibIdToMd5(md5.replace('zlib:', ''));
      if (!resolved) {
        return res.status(404).send('Could not resolve Zlib ID to Anna\'s Archive MD5');
      }
      md5 = resolved;
    }
    
    const book = await getBookDetails(md5);
    if (book?.downloadLinks?.length) {
      return res.redirect(await getActualDownloadLink(book.downloadLinks[0]));
    }
    res.redirect(`${ANNAS_ARCHIVE_BASE}/md5/${md5}`);
  } catch (error) {
    console.error(`Download error: ${error.message}`);
    res.redirect(`${ANNAS_ARCHIVE_BASE}/md5/${md5}`);
  }
};

// API Routes (JSON)
app.get('/api/books', api.getBooks);
app.get('/api/books/:md5', api.getBook);
app.get('/api/popular/:lang', api.getPopular);
app.get('/api/categories', api.getCategories);
app.get('/api/content-types', api.getContentTypes);
app.get('/api/languages', api.getLanguages);

// Serve React build (static files)
const clientBuildPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuildPath));

// OPDS Routes
const route = (contentType, generator) => (req, res) =>
  res.set('Content-Type', contentType)
    .send(generator(getBaseUrl(req), ...Object.values({ ...req.params, ...req.query })));

app.get('/opds', route(OPDS_CONTENT_TYPE, generateRootCatalog));
app.get('/opds/search', handleSearch);
app.get('/opds/:lang(en|fr)', route(OPDS_CONTENT_TYPE, generateLanguageCatalog));
app.get('/opds/:lang(en|fr)/popular', handlePopular);
app.get('/opds/:lang(en|fr)/:contentType', route(OPDS_CONTENT_TYPE, generateContentTypeCatalog));
app.get('/opds/:lang(en|fr)/:contentType/:category', route(OPDS_CONTENT_TYPE, generateCategoryCatalog));
app.get('/download/:md5', handleDownload);
app.get('/opensearch.xml', route('application/opensearchdescription+xml', generateOpenSearch));

// Fallback for React client-side routing (must be last)
app.get('*', (req, res) => {
  // Don't serve index.html for OPDS routes
  if (req.path.startsWith('/opds') || req.path.startsWith('/api')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});


// Start server
app.listen(PORT, () => {
  console.log('\n\x1b[5;1;36m' + '✨ OPDS SERVER STARTED ✨' + '\x1b[0m');
  console.log('\x1b[1;33m' + '─'.repeat(50) + '\x1b[0m');

  // Local
  console.log(`\x1b[1;33m● Local:\x1b[0m http://localhost:${PORT}`);

  // Network interfaces
  Object.values(os.networkInterfaces()).flat().forEach(alias => {
    if (alias.family === 'IPv4' && !alias.internal) {
      console.log(`\x1b[1;32m● Network:\x1b[0m http://${alias.address}:${PORT}`);
    }
  });

  console.log('\x1b[1;36m' + '─'.repeat(50) + '\x1b[0m');
  console.log(`\x1b[1;34m● Use:\x1b[0m http://localhost:${PORT}/opds\n`);
});