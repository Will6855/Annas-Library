const cheerio = require('cheerio');
const { SUBCATEGORIES } = require('./catalog');

const ANNAS_ARCHIVE_BASE = 'https://annas-archive.org';

// List all file extensions from the HTML
const FILE_EXTENSIONS = [
  'pdf', 'epub', 'mobi', 'zip', 'fb2', 'cbr', 'txt', 'djvu', 'cbz', 'azw3',
  'doc', 'lit', 'rtf', 'rar', 'htm', 'html', 'mht', 'docx', 'lrf', 'jpg',
  'chm', 'azw', 'pdb', 'odt', 'ppt', 'xls', 'xlsx', 'json', 'prc', 'tar',
  'tif', 'snb', 'updb', 'htmlz', '7z', 'cb7', 'gz', 'pptx', 'exe', 'ai'
];

/**
 * Search Anna's Archive for books
 * @param {string} query - Search query
 * @param {string} [lang] - Language code (e.g., 'en', 'fr')
 * @param {string|string[]} [content] - Content type(s)
 * @param {string} [category] - Category
 * @param {number} [page=1] - Page number
 * @returns {Promise<Array>} Array of book objects
 */
async function searchBooks(query, lang, content, category, page = 1) {

  // Handle category expansion using SUBCATEGORIES map
  let fullQuery = query;
  
  if (category) {
    if (SUBCATEGORIES[category]) {
      // If the category has subcategories, construct OR query
      const subCats = SUBCATEGORIES[category];
      const categoriesQuery = subCats.map(cat => `"${cat}"`).join('||');
      
      // If query already exists, append with space, else just use categories
      if (query && query.trim() !== '') {
        fullQuery = `${query} ${categoriesQuery}`;
      } else {
        fullQuery = categoriesQuery;
      }
    } else if (!query.includes(category)) {
      // Standard single category
      fullQuery = query && query.trim() !== '' ? `${query} ${category}` : category;
    }
  }
  let searchUrl = `${ANNAS_ARCHIVE_BASE}/search?q=${encodeURIComponent(fullQuery)}`;
  if (lang) searchUrl += `&lang=${lang}`;
  if (content && content !== 'all') searchUrl += `&content=${content}`;
  if (page > 1) searchUrl += `&page=${page}`;
  console.log(`[SEARCH] Search URL: ${searchUrl}`);
  
  try {
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.error(`[SEARCH] HTTP error: ${response.status}`);
      return [];
    }

    const html = await response.text();
    
    return parseSearchResults(html);
  } catch (error) {
    console.error(`[SEARCH] Error: ${error.message}`);
    return [];
  }
}

/**
 * Parse search results HTML to extract book information
 * @param {string} html - HTML content
 * @returns {Array} Array of book objects
 */
function parseSearchResults(html) {
  const $ = cheerio.load(html);
  const books = [];

  // Find each book result container
  const $partial = $('div.italic.mt-4.mb-1.text-sm.font-bold:contains("partial match")').first();
  $('div.pt-3').filter((i, el) => {
      if (!$partial.length) return true;
      
      // Check if partial matches element is NOT in the previous elements of current element
      return $(el).prevAll().addBack().index($partial[0]) === -1;
  }).each((index, element) => {
    const $el = $(element);
    
    // Extract cover image URL
    const coverImg = $el.find('img[src^="http"]').attr('src');
    const fallbackCover = $el.find('.js-aarecord-list-fallback-cover');
    const titleFromFallback = fallbackCover.find('div[data-content]:first-child').attr('data-content') || '';
    const authorFromFallback = fallbackCover.find('div[data-content]:nth-child(2)').attr('data-content') || '';
    
    // Extract book link and MD5
    const bookLink = $el.find('a[href^="/md5/"]').attr('href');
    if (!bookLink) return;
    
    const md5 = bookLink.replace('/md5/', '');
    
    // Extract title from multiple possible locations
    const titleElement = $el.find('a[href^="/md5/"]').eq(1); // Second link with title
    const title = titleElement.text().trim() || titleFromFallback || 'Unknown Title';
    
    // Extract author
    const authorElement = $el.find('a[href^="/search?q="]').eq(0);
    const author = authorElement.text().trim() || authorFromFallback || 'Unknown Author';
    
    // Extract publisher and year
    const publisherElement = $el.find('a[href^="/search?q="]').eq(1);
    let publisher = '';
    let year = '';
    if (publisherElement.length) {
      const publisherText = publisherElement.text().trim();
      // Try to extract year from publisher text (e.g., "Bragelonne, 2014")
      const yearMatch = publisherText.match(/(\d{4})$/);
      if (yearMatch) {
        year = yearMatch[1];
        publisher = publisherText.replace(/, \d{4}$/, '').trim();
      } else {
        publisher = publisherText;
      }
    }
    
    // Extract file info from the text description
    const infoText = $el.find('div.text-gray-800, div.text-slate-400').first().text().trim();
    
    // Parse language, format, size, year (again), and type from info text
    let languages = '';
    let format = '';
    let size = '';
    let tags = [];
    
    if (infoText) {
      // Extract language (e.g., "French [fr]")
      const langMatches = infoText.matchAll(/([\w\s]+)\s*\[(\w+)\]/g);
      languages = [...langMatches].map(m => m[1].trim()).join(', ').toUpperCase();
      
      // Extract format (e.g., "EPUB", "PDF", etc.)
      const formatMatch = infoText.match(/\b(EPUB|PDF|MOBI|AZW3|AZW|DOC|DOCX|RTF|TXT|CBZ|CBR)\b/i);
      if (formatMatch) {
        format = formatMatch[1].toUpperCase();
      }
      
      // Extract size (e.g., "0.6MB")
      const sizeMatch = infoText.match(/(\d+(?:\.\d+)?)\s*(MB|KB|GB)/i);
      if (sizeMatch) {
        size = `${sizeMatch[1]}${sizeMatch[2].toUpperCase()}`;
      }
      
      // Extract year if not already found
      if (!year) {
        const yearMatch = infoText.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          year = yearMatch[0];
        }
      }

      tags.push(size);
      tags.push(format);
    }
    
    // Extract original file path
    const filePath = $el.find('div.text-gray-500.font-mono').text().trim();
    
    // Extract description/summary
    const description = $el.find('div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)').text().trim();

    // Extract download count
    let downloads = 0;
    const downloadsMatch = $el.html().match(/title="Downloads".*?icon-\[typcn--download\].*?>(\d+)</);
    if (downloadsMatch) {
      downloads = parseInt(downloadsMatch[1]);
    }
    
    // Extract save/list count
    let lists = 0;
    const listsMatch = $el.html().match(/title="Lists".*?icon-\[pepicons-pencil--bookmark-filled\].*?>(\d+)</);
    if (listsMatch) {
      lists = parseInt(listsMatch[1]);
    }
    
    // Extract upload date from the timestamp in cover image
    let uploadDate = '';
    const dateElement = $el.find('span[title="Download time"]');
    if (dateElement.length) {
      uploadDate = dateElement.text().trim();
    }
    
    // Get MIME type based on format
    const mimeType = getMimeType(format);
    
    // Extract source (e.g., "🚀/lgli/zlib")
    let source = '';
    const sourceMatch = infoText.match(/🚀\/([^·]+)/);
    if (sourceMatch) {
      source = sourceMatch[1].trim();
    }
    
    // Avoid duplicates
    const existingBook = books.find(b => b.md5 === md5);
    if (!existingBook) {
      books.push({
        id: md5,
        md5,
        title,
        author,
        publisher,
        year,
        languages,
        format,
        size,
        tags,
        description,
        coverUrl: coverImg || null,
        filePath,
        source,
        downloads,
        lists,
        uploadDate,
        downloadUrl: `${ANNAS_ARCHIVE_BASE}/md5/${md5}`,
        mimeType,
        modified: new Date()
      });
    }
  });

  return books;
}

// Helper function to determine MIME type
function getMimeType(format) {
  const mimeTypes = {
    'EPUB': 'application/epub+zip',
    'PDF': 'application/pdf',
    'MOBI': 'application/x-mobipocket-ebook',
    'AZW3': 'application/vnd.amazon.ebook',
    'AZW': 'application/vnd.amazon.ebook',
    'DOC': 'application/msword',
    'DOCX': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'RTF': 'application/rtf',
    'TXT': 'text/plain',
    'CBZ': 'application/vnd.comicbook+zip',
    'CBR': 'application/vnd.comicbook-rar'
  };
  return mimeTypes[format.toUpperCase()] || 'application/octet-stream';
}

/**
 * Get popular books from Zlib API
 * @param {string} langCode - Language code (e.g., 'en', 'fr')
 * @param {number} [page=1] - Page number
 * @returns {Promise<Array>} Array of book objects
 */
async function getPopularBooks(langCode, page = 1) {
  const domain = langCode === 'fr' ? 'fr.1lib.sk' : '1lib.sk';
  const url = `https://${domain}/papi/book/mostpopular/mosaic/20/${page}`;
  console.log(`[ZLIB] Fetching popular books: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[ZLIB] API error: ${response.status}`);
      return { books: [], nextPage: null };
    }
    
    const data = await response.json();
    if (!data.success || !data.books) return { books: [], nextPage: null };
    
    return {
      books: data.books.map(book => ({
        id: `zlib:${book.id}`,
        md5: `zlib:${book.id}`, // Placeholder
        title: book.title,
        author: book.author,
        coverUrl: book.cover,
        year: '',
        languages: langCode.toUpperCase(),
        format: (book.url.match(/\.(\w+)\.html$/) || [])[1]?.toUpperCase() || 'UNKNOWN',
        tags: ['Popular on Zlib'],
        modified: new Date()
      })),
      nextPage: data.nextPage
    };
  } catch (error) {
    console.error(`[ZLIB] Error: ${error.message}`);
    return { books: [], nextPage: null };
  }
}

/**
 * Resolve a Zlib ID to an Anna's Archive MD5
 * @param {string} zlibId - The Zlib numeric ID
 * @returns {Promise<string|null>} Resolved MD5
 */
async function resolveZlibIdToMd5(zlibId) {
  const searchUrl = `${ANNAS_ARCHIVE_BASE}/search?q=${encodeURIComponent(`"zlib:${zlibId}"`)}`;
  console.log(`[RESOLVE] Resolving Zlib ID ${zlibId} via: ${searchUrl}`);
  
  try {
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find each book result container and skip partial matches
    const $partial = $('div.italic.mt-4.mb-1.text-sm.font-bold:contains("partial match")').first();
    const bookLink = $('div.pt-3').filter((i, el) => {
        if (!$partial.length) return true;
        // Check if partial matches element is NOT in the previous elements of current element
        return $(el).prevAll().addBack().index($partial[0]) === -1;
    }).find('a[href^="/md5/"]').first().attr('href');

    if (bookLink) {
      const md5 = bookLink.replace('/md5/', '');
      console.log(`[RESOLVE] Resolved ${zlibId} to MD5: ${md5}`);
      return md5;
    }
    
    console.warn(`[RESOLVE] Could not find MD5 for Zlib ID: ${zlibId}`);
    return null;
  } catch (error) {
    console.error(`[RESOLVE] Error: ${error.message}`);
    return null;
  }
}

/**
 * Get book details page to find download links
 * @param {string} md5 - Book MD5 hash or zlib:ID
 * @returns {Promise<Object|null>} Book details with download links
 */
async function getBookDetails(md5) {
  let actualMd5 = md5;
  
  if (md5.startsWith('zlib:')) {
    const resolved = await resolveZlibIdToMd5(md5.replace('zlib:', ''));
    if (!resolved) return null;
    actualMd5 = resolved;
  }
  
  const bookUrl = `${ANNAS_ARCHIVE_BASE}/md5/${actualMd5}`;

  try {
    const response = await fetch(bookUrl);

    if (!response.ok) {
      console.error(`[BOOK] HTTP error: ${response.status}`);
      return null;
    }

    const html = await response.text();
    return parseBookDetails(html, md5);
  } catch (error) {
    console.error(`[BOOK] Error: ${error.message}`);
    return null;
  }
}

/**
 * Parse book details page for download links
 */
function parseBookDetails(html, md5) {
  const $ = cheerio.load(html);
  
  // Get title from page
  const title = $('div.font-semibold:nth-child(4)').first().text().trim() || 'Unknown Title';
  
  // Find download links - Anna's Archive has various mirror links
  const downloadLinks = [];
  
  $('a.js-download-link').each((i, el) => {
    const $link = $(el);
    const href = $link.attr('href');
    const text = $link.text();
    const parentText = $link.parent().text();
    
    // Only include links that have "(no waitlist" in the parent li text
    if (href && href.includes('/slow_download/') && parentText.includes('(no waitlist')) {
      const fullUrl = `${ANNAS_ARCHIVE_BASE}${href}`;
      
      downloadLinks.push({
        url: fullUrl,
        text: text,
        isWaitlist: false
      });
    }
  });
  
  // If no "no waitlist" links found, fall back to any slow_download link
  if (downloadLinks.length === 0) {
    console.log(`[ANNA] No "no waitlist" links found, falling back to external download`);
    // TODO: implement external download
  }

  console.log(`[BOOK] Found ${downloadLinks.length} download links for: ${title}`);
  
  return {
    md5,
    title,
    downloadLinks,
    pageUrl: `${ANNAS_ARCHIVE_BASE}/md5/${md5}`
  };
}

/**
 * Get actual download link using FlareSolverr to bypass Cloudflare
 * @param {string} slowDownloadUrl - The "slow" download page URL
 * @returns {Promise<string|null>} Direct download URL
 */
async function getActualDownloadLink(slowDownloadUrl) {
  console.log(`[FLARESOLVERR] Requesting: ${slowDownloadUrl.url}`);
  
  try {
    const response = await fetch(process.env.FLARESOLVERR_URL || 'http://localhost:32768/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cmd: 'request.get',
        url: slowDownloadUrl.url,
        maxTimeout: 60000,
      }),
    });

    if (!response.ok) {
      console.error(`[FLARESOLVERR] HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
      console.error(`[FLARESOLVERR] Error status: ${data.status}`);
      // If there's an error message, log it
      if (data.message) console.error(`[FLARESOLVERR] Message: ${data.message}`);
      return null;
    }

    const html = data.solution.response;
    const $ = cheerio.load(html);

    // Create regex pattern
    const extensionPattern = FILE_EXTENSIONS.join('|');
    const urlRegex = new RegExp(`https?://\\S+?\\.(${extensionPattern})(?:\\?\\S*)?`, 'gi');
    const hrefRegex = new RegExp(`\\.(${extensionPattern})(?:\\?|$)`, 'i');

    const downloadUrl = [
      // Text URLs
      ...($('body').text().match(urlRegex) || []),
      
      // Href URLs  
      ...($('[href*="http"]').map((_, el) => $(el).attr('href')).get()
        .filter(href => hrefRegex.test(href)))
    ][0];

    if (downloadUrl) {
      console.log(`[FLARESOLVERR] Found download link: ${downloadUrl}`);
    } else {
      console.log(`[FLARESOLVERR] No download link found with expected extension`);
    }

    return downloadUrl;
  } catch (error) {
    console.error(`[FLARESOLVERR] System Error: ${error.message}`);
    return null;
  }
}

module.exports = { searchBooks, getBookDetails, getActualDownloadLink, getPopularBooks, resolveZlibIdToMd5, ANNAS_ARCHIVE_BASE };
