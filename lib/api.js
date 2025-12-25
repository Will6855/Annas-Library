const { searchBooks, getBookDetails, getPopularBooks } = require('./scraper');
const SUBCATEGORIES = require('./categories.json');

const CONTENT_TYPES = [
  'book_nonfiction',
  'book_fiction',
  'book_unknown',
  'magazine',
  'book_comic',
  'standards_document',
  'musical_score',
  'other'
];

const CATEGORIES = Object.keys(SUBCATEGORIES);

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' }
];

/**
 * Get books with search/filter support
 * @route GET /api/books
 */
async function getBooks(req, res) {
  try {
    const { q = '', lang = '', content = '', category = '', page = 1 } = req.query;
    
    const books = await searchBooks(q, lang, content, category, +page);
    
    res.json({
      success: true,
      data: {
        books: books.map(book => ({
          id: book.md5,
          md5: book.md5,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          year: book.year,
          languages: book.languages,
          format: book.format,
          tags: book.tags,
          filesize: book.filesize,
          modified: book.modified
        })),
        pagination: {
          page: +page,
          hasNext: books.length === 50,
          hasPrev: +page > 1
        },
        filters: { q, lang, content, category }
      }
    });
  } catch (error) {
    console.error(`[API] Books error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch books'
    });
  }
}

/**
 * Get book details
 * @route GET /api/books/:md5
 */
async function getBook(req, res) {
  try {
    const { md5 } = req.params;
    const book = await getBookDetails(md5);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error(`[API] Book details error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch book details'
    });
  }
}

/**
 * Get popular books by language
 * @route GET /api/popular/:lang
 */
async function getPopular(req, res) {
  try {
    const { lang = 'en' } = req.params;
    const { page = 1 } = req.query;
    
    const { books, nextPage } = await getPopularBooks(lang, +page);
    
    res.json({
      success: true,
      data: {
        books: books.map(book => ({
          id: book.md5,
          md5: book.md5,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          year: book.year,
          languages: book.languages,
          format: book.format,
          tags: book.tags
        })),
        pagination: {
          page: +page,
          hasNext: !!nextPage,
          hasPrev: +page > 1
        }
      }
    });
  } catch (error) {
    console.error(`[API] Popular books error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular books'
    });
  }
}

/**
 * Get all categories
 * @route GET /api/categories
 */
function getCategories(req, res) {
  try {
    const categoriesWithSubs = CATEGORIES.map(categoryId => ({
      id: categoryId,
      subcategories: SUBCATEGORIES[categoryId] || []
    }));
    
    res.json({
      success: true,
      data: categoriesWithSubs
    });
  } catch (error) {
    console.error(`[API] Categories error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
}

/**
 * Get supported content types
 * @route GET /api/content-types
 */
function getContentTypes(req, res) {
  try {
    const contentTypes = CONTENT_TYPES.map(type => ({
      id: type
    }));
    
    res.json({
      success: true,
      data: contentTypes
    });
  } catch (error) {
    console.error(`[API] Content types error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content types'
    });
  }
}

/**
 * Get supported languages
 * @route GET /api/languages
 */
function getLanguages(req, res) {
  try {
    res.json({
      success: true,
      data: LANGUAGES
    });
  } catch (error) {
    console.error(`[API] Languages error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch languages'
    });
  }
}

module.exports = {
  getBooks,
  getBook,
  getPopular,
  getCategories,
  getContentTypes,
  getLanguages
};
