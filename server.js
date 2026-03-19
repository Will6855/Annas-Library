require('dotenv').config();

const os = require('os');
const path = require('path');
const express = require('express');
const { generateRootCatalog, generateBooksFeed, generateOpenSearch, generateLanguageCatalog, generateContentTypeCatalog, generateCategoryCatalog } = require('./lib/catalog');
const { searchBooks, getBookDetails, getActualDownloadLink, getPopularBooks } = require('./lib/scraper');
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
  const { resolve } = req.query;

  try {

    const book = await getBookDetails(md5);
    if (book?.downloadLinks?.length) {
      const actualLink = await getActualDownloadLink(book.downloadLinks[0]);
      
      if (resolve === 'true') {
        return res.json({ url: actualLink });
      }
      
      return res.redirect(actualLink);
    }
    return res.status(404).send('Could not download the book');
  } catch (error) {
    console.error(`Download error: ${error.message}`);
    return res.status(500).send('Could not download the book');
  }
};

const { createServer: createViteServer } = require('vite');

async function startServer() {
  const isDev = process.env.NODE_ENV === 'development';
  const clientBuildPath = path.join(__dirname, 'client', 'dist');

  let vite;
  if (isDev) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      root: path.join(__dirname, 'client')
    });
    app.use(vite.middlewares);
  }

  // API & OPDS Routes (same as before)
  const route = (contentType, generator) => (req, res) =>
    res.set('Content-Type', contentType)
      .send(generator(getBaseUrl(req), ...Object.values({ ...req.params, ...req.query })));

  app.get('/api/books', api.getBooks);
  app.get('/api/books/:md5', api.getBook);
  app.get('/api/popular/:lang', api.getPopular);
  app.get('/api/categories', api.getCategories);
  app.get('/api/content-types', api.getContentTypes);
  app.get('/api/languages', api.getLanguages);
  app.get('/api/zlib-detail/:lang/:id/:hash', api.getZlibDetail);
  
  // Translation endpoints - serve category translations with proper encoding
  app.get('/api/translations/categories/:lang', (req, res) => {
    try {
      const { getTranslation } = require('./lib/translations');
      const lang = req.params.lang === 'fr' ? 'fr' : 'en';
      const translations = getTranslation(lang, 'categories');
      res.json({ success: true, data: translations });
    } catch (error) {
      console.error('[API] Translations error:', error.message);
      res.status(500).json({ success: false, error: 'Failed to fetch translations' });
    }
  });

  app.get('/opds', route(OPDS_CONTENT_TYPE, generateRootCatalog));
  app.get('/opds/search', handleSearch);
  app.get('/opds/:lang(en|fr)', route(OPDS_CONTENT_TYPE, generateLanguageCatalog));
  app.get('/opds/:lang(en|fr)/popular', handlePopular);
  app.get('/opds/:lang(en|fr)/:contentType', route(OPDS_CONTENT_TYPE, generateContentTypeCatalog));
  app.get('/opds/:lang(en|fr)/:contentType/:category', route(OPDS_CONTENT_TYPE, generateCategoryCatalog));
  app.get('/download/:md5', handleDownload);
  app.get('/opensearch.xml', route('application/opensearchdescription+xml', generateOpenSearch));

  if (!isDev) {
    app.use(express.static(clientBuildPath));
  }

  // Catch-all
  app.get('*', async (req, res) => {
    const url = req.originalUrl;
    
    if (isDev) {
      try {
        let template = require('fs').readFileSync(path.resolve(__dirname, 'client/index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        res.status(500).end(e.stack);
      }
    } else {
      if (req.path.startsWith('/opds') || req.path.startsWith('/api')) {
        return res.status(404).send('Not found');
      }
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });


  app.listen(PORT, () => {
    console.log(`\n✨ OPDS Server (${isDev ? 'Development' : 'Production'}) started on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});