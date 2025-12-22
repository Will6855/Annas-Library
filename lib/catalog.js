const { getTranslation } = require('./translations');

const NAMESPACES = {
  ATOM: 'http://www.w3.org/2005/Atom',
  DC: 'http://purl.org/dc/terms/',
  OPDS: 'http://opds-spec.org/2010/catalog',
  OPENSEARCH: 'http://a9.com/-/spec/opensearch/1.1/'
};

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

const SUBCATEGORIES = require('./categories.json');
const CATEGORIES = Object.keys(SUBCATEGORIES);

const escapeXml = (str) => str ? str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;') : '';

const feedHeader = (title, id, baseUrl, selfUrl, searchUrl) => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="${NAMESPACES.ATOM}" xmlns:dc="${NAMESPACES.DC}" xmlns:opds="${NAMESPACES.OPDS}">
  <id>${id}</id>
  <title>${escapeXml(title)}</title>
  <updated>${new Date().toISOString()}</updated>
  <author><name>OPDS Server - Anna's Archive</name></author>
  <link rel="self" href="${escapeXml(selfUrl || baseUrl)}" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
  <link rel="start" href="${baseUrl}/opds" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
  <link rel="search" href="${escapeXml(searchUrl || baseUrl + '/opensearch.xml')}" type="application/opensearchdescription+xml"/>
`;

const bookEntry = (book, baseUrl, t) => {
  const author = book.author || t.unknownAuthor;
  const title = book.title || t.unknownTitle;
  
  return `
  <entry>
    <title>${escapeXml(title)}</title>
    <author><name>${escapeXml(author)}</name></author>
    <id>urn:md5:${book.md5}</id>
    <updated>${(book.modified || new Date()).toISOString()}</updated>
    ${book.publisher ? `<dc:publisher>${escapeXml(book.publisher)}</dc:publisher>` : ''}
    ${book.year ? `<dc:date>${book.year}</dc:date>` : ''}
    ${book.languages ? `<dc:language>${escapeXml(book.languages)}</dc:language>` : ''}
    ${book.coverUrl ? `<link rel="http://opds-spec.org/image" href="${escapeXml(book.coverUrl)}"/>
    <link rel="http://opds-spec.org/image/thumbnail" href="${escapeXml(book.coverUrl)}"/>` : ''}
    <link rel="http://opds-spec.org/acquisition/"
          href="${baseUrl}/download/${book.md5}"
          type="${book.mimeType || 'application/octet-stream'}"/>
    ${book.tags ? book.tags.map(tag => `<category term="${escapeXml(tag)}"/>`).join('') : ''}
  </entry>`;
};

const generateRootCatalog = (baseUrl) => {
  console.log('[CATALOG] Generating root catalog');
  
  let xml = feedHeader('Anna\'s Archive OPDS', 'urn:opds:root', baseUrl, `${baseUrl}/opds`);
  
  ['en', 'fr'].forEach(langCode => {
    const t = getTranslation(langCode);
    xml += `
  <entry>
    <title>${escapeXml(t.languageTitle)}</title>
    <id>urn:opds:${langCode}</id>
    <updated>${new Date().toISOString()}</updated>
    <content type="text">${escapeXml(langCode === 'fr' ? t.frenchDesc : t.englishDesc)}</content>
    <link rel="subsection" href="${baseUrl}/opds/${langCode}" 
          type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
  </entry>`;
  });
  
  return xml + '</feed>';
};

const generateBooksFeed = (books, baseUrl, query, id = 'urn:opds:search', searchUrl = null, lang = 'en', category = null, content = null, page = 1, hasNext = false) => {
  const t = getTranslation(lang);
  const displayQuery = (category ? t.categories[category] || category : query) || '';
  const feedTitle = t.searchResults + (displayQuery ? `: ${displayQuery}` : '');
  console.log(`[CATALOG] Content type catalog: ${lang ? lang : 'en'}/${content ? content : 'all'}/${category ? category : 'all'}/${page ? page : 1}`);
  console.log(`[CATALOG] Books feed: ${feedTitle} (${books.length} books)`);
  let xml = feedHeader(feedTitle, id, baseUrl, `${baseUrl}/opds/search`, searchUrl);

  if (page > 1) {
      if (content === 'popular') {
          xml += `  <link rel="previous" href="${baseUrl}/opds/${lang}/popular?page=${page - 1}" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>\n`;
      } else {
          const searchData = {
              q: query || '',
              lang: lang || '',
              content: content || '',
              category: category || '',
              page: page - 1
          };
          const encodedData = encodeURIComponent(JSON.stringify(searchData));
          xml += `  <link rel="previous" href="${baseUrl}/opds/search?data=${encodedData}" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>\n`;
      }
  }

  if (hasNext) {
      if (content === 'popular') {
          xml += `  <link rel="next" href="${baseUrl}/opds/${lang}/popular?page=${page + 1}" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>\n`;
      } else {
          const searchData = {
              q: query || '',
              lang: lang || '',
              content: content || '',
              category: category || '',
              page: page + 1
          };
          const encodedData = encodeURIComponent(JSON.stringify(searchData));
          xml += `  <link rel="next" href="${baseUrl}/opds/search?data=${encodedData}" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>\n`;
      }
  }
  
  books.forEach(book => xml += bookEntry(book, baseUrl, t));
  return xml + '</feed>';
};

const generateLanguageCatalog = (baseUrl, langCode) => {
  console.log(`[CATALOG] Language catalog: ${langCode}`);
  const t = getTranslation(langCode);
  const searchUrl = `${baseUrl}/opensearch.xml?lang=${langCode}`;
  
  let xml = feedHeader(t.languageTitle, `urn:opds:${langCode}`, baseUrl, 
                        `${baseUrl}/opds/${langCode}`, searchUrl);

  // Add "Most Popular" entry
  xml += `
  <entry>
    <title>${escapeXml(t.popular)}</title>
    <id>urn:opds:${langCode}:popular</id>
    <updated>${new Date().toISOString()}</updated>
    <content type="text">${escapeXml(t.popular)}</content>
    <link rel="subsection" href="${baseUrl}/opds/${langCode}/popular" 
          type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
  </entry>`;

  // Add "All" entry
  xml += `
  <entry>
    <title>${escapeXml(t.all)}</title>
    <id>urn:opds:${langCode}:all</id>
    <updated>${new Date().toISOString()}</updated>
    <content type="text">${escapeXml(t.all)}</content>
    <link rel="subsection" href="${baseUrl}/opds/${langCode}/all" 
          type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
  </entry>`;

  CONTENT_TYPES.forEach(contentType => {
    xml += `
  <entry>
    <title>${escapeXml(t[contentType] || contentType)}</title>
    <id>urn:opds:${langCode}:${contentType}</id>
    <updated>${new Date().toISOString()}</updated>
    <content type="text">${escapeXml(t[contentType] || contentType)}</content>
    <link rel="subsection" href="${baseUrl}/opds/${langCode}/${contentType}" 
          type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
  </entry>`;
  });
  
  return xml + '</feed>';
};

const generateContentTypeCatalog = (baseUrl, langCode, contentType) => {
  console.log(`[CATALOG] Content type catalog: ${langCode}/${contentType}`);
  const t = getTranslation(langCode);
  const displayTitle = `${t[contentType] || contentType} (${langCode.toUpperCase()})`;
  const searchUrl = `${baseUrl}/opensearch.xml?lang=${langCode}&content=${contentType}`;
  
  let xml = feedHeader(displayTitle, `urn:opds:${langCode}:${contentType}`, baseUrl, 
                        `${baseUrl}/opds/${langCode}/${contentType}`, searchUrl);

  const categories = getTranslation(langCode, 'categories') || {};
  
  // "All" entry for this content type
  xml += `
    <entry>
      <title>${escapeXml(t.all)} ${escapeXml(t[contentType] || contentType)}</title>
      <id>urn:opds:search:${langCode}:${contentType}:all</id>
      <updated>${new Date().toISOString()}</updated>
      <content type="text">${escapeXml(t.all)} ${escapeXml(t[contentType] || contentType)}</content>
      <link rel="search" href="${baseUrl}/opensearch.xml?lang=${langCode}&amp;content=${contentType}" type="application/opensearchdescription+xml"/>
      <link rel="subsection" href="${baseUrl}/opds/search?q=&amp;lang=${langCode}&amp;content=${contentType}" 
            type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
    </entry>`;

  CATEGORIES.forEach(category => {
    const categoryName = categories[category] || category;
    const hasSubcategories = SUBCATEGORIES[category];
    
    if (hasSubcategories) {
       // Navigation entry for category with subcategories
       xml += `
    <entry>
      <title>${escapeXml(categoryName)}</title>
      <id>urn:opds:nav:${langCode}:${contentType}:${category}</id>
      <updated>${new Date().toISOString()}</updated>
      <content type="text">${escapeXml(categoryName)}</content>
      <link rel="subsection" href="${baseUrl}/opds/${langCode}/${contentType}/${category}" 
            type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
    </entry>`;
    } else {
        // Standard acquisition/search entry
        xml += `
    <entry>
      <title>${escapeXml(categoryName)}</title>
      <id>urn:opds:search:${langCode}:${contentType}:${category}</id>
      <updated>${new Date().toISOString()}</updated>
      <content type="text">${escapeXml(categoryName)}</content>
      <link rel="search" href="${baseUrl}/opensearch.xml?lang=${langCode}&amp;content=${contentType}&amp;category=${encodeURIComponent(category)}" type="application/opensearchdescription+xml"/>
      <link rel="subsection" href="${baseUrl}/opds/search?q=${encodeURIComponent(category)}&amp;lang=${langCode}&amp;content=${contentType}&amp;category=${encodeURIComponent(category)}" 
            type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
    </entry>`;
    }
  });
  
  return xml + '</feed>';
};

const generateCategoryCatalog = (baseUrl, langCode, contentType, categoryId) => {
  console.log(`[CATALOG] Category catalog: ${langCode}/${contentType}/${categoryId}`);
  const t = getTranslation(langCode);
  const categories = getTranslation(langCode, 'categories') || {};
  const categoryName = categories[categoryId] || categoryId;
  
  const displayTitle = `${categoryName} (${langCode.toUpperCase()})`;
  const searchUrl = `${baseUrl}/opensearch.xml?lang=${langCode}&content=${contentType}&category=${encodeURIComponent(categoryId)}`;
  
  let xml = feedHeader(displayTitle, `urn:opds:${langCode}:${contentType}:${categoryId}`, baseUrl, 
                        `${baseUrl}/opds/${langCode}/${contentType}/${categoryId}`, searchUrl);

  // "All" entry for this category
  xml += `
    <entry>
      <title>${escapeXml(t.all)} ${escapeXml(categoryName)}</title>
      <id>urn:opds:search:${langCode}:${contentType}:${categoryId}:all</id>
      <updated>${new Date().toISOString()}</updated>
      <content type="text">${escapeXml(t.all)} ${escapeXml(categoryName)}</content>
      <link rel="search" href="${baseUrl}/opensearch.xml?lang=${langCode}&amp;content=${contentType}&amp;category=${encodeURIComponent(categoryId)}" type="application/opensearchdescription+xml"/>
      <link rel="subsection" href="${baseUrl}/opds/search?q=${encodeURIComponent(categoryId)}&amp;lang=${langCode}&amp;content=${contentType}&amp;category=${encodeURIComponent(categoryId)}" 
            type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
    </entry>`;

  const subCategories = SUBCATEGORIES[categoryId] || [];
  
  subCategories.forEach(subCatId => {
    const subCatName = categories[subCatId] || subCatId;
    
    xml += `
    <entry>
      <title>${escapeXml(subCatName)}</title>
      <id>urn:opds:search:${langCode}:${contentType}:${subCatId}</id>
      <updated>${new Date().toISOString()}</updated>
      <content type="text">${escapeXml(subCatName)}</content>
      <link rel="search" href="${baseUrl}/opensearch.xml?lang=${langCode}&amp;content=${contentType}&amp;category=${encodeURIComponent(subCatId)}" type="application/opensearchdescription+xml"/>
      <link rel="subsection" href="${baseUrl}/opds/search?q=${encodeURIComponent(subCatId)}&amp;lang=${langCode}&amp;content=${contentType}&amp;category=${encodeURIComponent(subCatId)}" 
            type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
    </entry>`;
  });

  return xml + '</feed>';
};

const generateOpenSearch = (baseUrl, lang = null, contentType = null, category = null) => {
  console.log(`[CATALOG] OpenSearch (lang: ${lang}, content: ${contentType}, category: ${category})`);
  const t = getTranslation(lang);
  let suffix = '';
  if (lang) suffix += ` (${lang.toUpperCase()})`;
  if (contentType) suffix += ` - ${t[contentType] || contentType}`;
  if (category) suffix += ` - ${t.categories[category] || category}`;
  
  const langParam = lang ? `&amp;lang=${lang}` : '';
  const contentParam = contentType ? `&amp;content=${contentType}` : '';
  const categoryParam = category ? `&amp;category=${encodeURIComponent(category)}` : '';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="${NAMESPACES.OPENSEARCH}">
  <ShortName>${escapeXml(t.openSearchShortName + suffix)}</ShortName>
  <Description>${escapeXml(t.openSearchDescription + suffix)}</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <OutputEncoding>UTF-8</OutputEncoding>
  <Url type="application/atom+xml;profile=opds-catalog;kind=acquisition" 
       template="${baseUrl}/opds/search?q={searchTerms}${langParam}${contentParam}${categoryParam}"/>
</OpenSearchDescription>`;
};

module.exports = {
  generateRootCatalog,
  generateBooksFeed,
  generateLanguageCatalog,
  generateContentTypeCatalog,
  generateCategoryCatalog,
  generateOpenSearch,
  escapeXml,
  SUBCATEGORIES
};