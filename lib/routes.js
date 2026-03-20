const { searchBooks, getBookDetails, getActualDownloadLink, getPopularBooks } = require('./scraper');
const { generateBooksFeed } = require('./catalog');

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;
const OPDS_CONTENT_TYPE = 'application/atom+xml;profile=opds-catalog';

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

module.exports = {
  handleSearch,
  handlePopular,
  handleDownload,
  getBaseUrl,
  OPDS_CONTENT_TYPE
};
