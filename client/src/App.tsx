import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import BookGrid from './components/BookGrid';
import Pagination from './components/Pagination';
import BookModal from './components/BookModal';
import { Filter, Archive, Book as BookIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCategoryName, getContentTypeName } from './utils/translations';

interface Book {
  id: string;
  md5: string;
  title: string;
  author?: string;
  coverUrl?: string;
  year?: string;
  languages?: string;
  format?: string;
  size?: string;
  tags?: string[];
}

interface Filters {
  q: string;
  lang: string;
  content: string;
  category: string;
  page: number;
  popular: boolean;
}

interface PaginationData {
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Category {
  id: string;
  subcategories: string[];
}

interface ContentType {
  id: string;
  name: string;
}

interface Language {
  code: string;
  name: string;
}

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isInitialMount = useRef(true);
  const previousPathname = useRef(sessionStorage.getItem('previousPathname') || '/');
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Initialize filters from URL search params
  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get('q') || '',
    lang: searchParams.get('lang') || '',
    content: searchParams.get('content') || '',
    category: searchParams.get('category') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    popular: searchParams.get('popular') === 'true' || false
  });

  const [pagination, setPagination] = useState<PaginationData>({
    page: 1, hasNext: false, hasPrev: false
  });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Load persisted language
  useEffect(() => {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, []);

  // Fetch metadata once
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/content-types').then(r => r.json()),
      fetch('/api/languages').then(r => r.json())
    ]).then(([cats, types, langs]) => {
      setCategories(cats.data || []);
      setContentTypes(types.data || []);
      setLanguages(langs.data || []);
    }).catch(console.error);
  }, []);

  // Sync state to URL params whenever filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const newParams = new URLSearchParams();
    if (filters.q) newParams.set('q', filters.q);
    if (filters.lang) newParams.set('lang', filters.lang);
    if (filters.content) newParams.set('content', filters.content);
    if (filters.category) newParams.set('category', filters.category);
    if (filters.page > 1) newParams.set('page', filters.page.toString());
    if (filters.popular) newParams.set('popular', filters.popular.toString());
    
    setSearchParams(newParams);
  }, [filters]);

  // Handle URL param changes (e.g. browser back button)
  useEffect(() => {
    setFilters({
      q: searchParams.get('q') || '',
      lang: searchParams.get('lang') || '',
      content: searchParams.get('content') || '',
      category: searchParams.get('category') || '',
      page: parseInt(searchParams.get('page') || '1', 10),
      popular: searchParams.get('popular') === 'true' || false
    });
  }, [searchParams]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const isPopular = searchParams.get('popular') === 'true';
      const lang = searchParams.get('lang') || i18n.language || 'en';
      
      let endpoint, queryString;
      
      if (isPopular) {
        endpoint = `/api/popular/${lang}`;
        const page = searchParams.get('page');
        queryString = page && page !== '1' ? `?page=${page}` : '';
      } else {
        endpoint = '/api/books';
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
          if (value && key !== 'popular') params.append(key, value);
        });
        queryString = params.toString() ? `?${params.toString()}` : '';
      }
      
      const response = await fetch(`${endpoint}${queryString}`);
      const data = await response.json();
      if (data.success) {
        setBooks(data.data.books);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.location.pathname === '/') {
      fetchBooks();
    }
  }, [searchParams]);

  // Reset search params when navigating to / from other pages
  useEffect(() => {
    if (location.pathname === '/' && previousPathname.current !== '/') {
      setSearchParams(new URLSearchParams());
      fetchBooks();
    }
    previousPathname.current = location.pathname;
    sessionStorage.setItem('previousPathname', location.pathname);
  }, [location, setSearchParams]);

  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', query);
    setSearchParams(newParams);
  };

  const handlePopular = () => {
    const newParams = new URLSearchParams(searchParams);
    if (searchParams.get('popular') === 'true') {
      newParams.delete('popular');
    } else {
      newParams.set('popular', 'true');
      // Set default language filter when activating popular
      const defaultLang = i18n.language || 'en';
      newParams.set('lang', defaultLang);
    }
    setSearchParams(newParams);
  }

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleResetSearch = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleCategoryClick = (catId: string) => {
    const newParams = new URLSearchParams();
    newParams.set('category', catId);
    newParams.set('page', '1');
    setSearchParams(newParams);
    navigate(`/?${newParams.toString()}`);
  };

  const categoryParam = searchParams.get('category') || '';
  const langParam = searchParams.get('lang') || '';
  const contentParam = searchParams.get('content') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const activeParent = categories.find(c => c.id === categoryParam) || 
                       categories.find(c => c.subcategories.includes(categoryParam));

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />

      <main className="flex-1 w-full px-6 py-12 mx-auto max-w-7xl">
        <Routes>
          <Route path="/" element={
            <>
              {/* Search Section */}
              <div className="max-w-2xl mx-auto mb-16 text-center animate-fade-in">
                 <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-ink">
                   {t('hero.title')}
                 </h1>
                 <p className="mb-8 font-serif text-lg italic text-ink-light">
                   {t('hero.subtitle')}
                 </p>
                 
                 <div className="relative">
                   <SearchBar onSearch={handleSearch} initialQuery={searchParams.get('q') || ''}/>
                 </div>
              </div>

              {/* Filter Toolbar */}
              <div className="sticky z-40 flex flex-wrap items-center justify-between gap-4 py-4 mb-8 border-y border-border bg-white/50 backdrop-blur-sm top-16 max-lg:static">
                 <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-2 text-sm font-medium text-ink-light">
                     <Filter size={16} />
                     <span>{t('filter.by')}</span>
                   </div>

                   <button
                     onClick={handlePopular}
                     className={`px-3 py-1 text-sm font-medium rounded transition-colors ${searchParams.get('popular') ? 'bg-accent text-white' : 'bg-gray-100 text-ink hover:bg-gray-200'}`}
                   >
                     ⭐ {t('filter.popular')}
                   </button>
                   
                   <select 
                     className="text-sm font-medium transition-colors bg-transparent border-none cursor-pointer text-ink focus:ring-0 hover:text-accent"
                     value={langParam}
                     onChange={(e) => handleFilterChange('lang', e.target.value)}
                   >
                     <option value="">{t('filter.all_languages')}</option>
                     {languages.map(l => (
                       <option key={l.code} value={l.code}>{l.name}</option>
                     ))}
                   </select>

                   <select 
                     className={`text-sm font-medium transition-colors bg-transparent border-none cursor-pointer focus:ring-0 hover:text-accent ${searchParams.get('popular') ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-ink'}`}
                     value={contentParam}
                     onChange={(e) => handleFilterChange('content', e.target.value)}
                     disabled={searchParams.get('popular') === 'true'}
                   >
                      <option value="">{t('filter.all_formats')}</option>
                     {contentTypes.map(type => (
                       <option key={type.id} value={type.id}>{getContentTypeName(t, type.id)}</option>
                     ))}
                   </select>
                   
                   <select 
                     className={`border-none text-sm font-medium focus:ring-0 cursor-pointer transition-colors max-w-37.5 truncate bg-transparent ${searchParams.get('popular') ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-ink hover:text-accent'}`}
                     value={activeParent?.id || ""}
                     onChange={(e) => handleFilterChange('category', e.target.value)}
                     disabled={searchParams.get('popular') === 'true'}
                   >
                     <option value="">{t('filter.all_categories')}</option>
                     {categories.map(c => (
                       <option key={c.id} value={c.id}>{getCategoryName(t, c.id)}</option>
                     ))}
                   </select>

                   {activeParent && activeParent.subcategories.length > 0 && !searchParams.get('popular') && (
                     <div className="flex items-center gap-2 animate-fade-in">
                       <span className="text-gray-300">/</span>
                       <select 
                         className="bg-transparent border-none text-sm font-medium text-ink focus:ring-0 cursor-pointer hover:text-accent transition-colors max-w-37.5 truncate"
                         value={categoryParam === activeParent.id ? "" : categoryParam}
                         onChange={(e) => {
                           const val = e.target.value;
                           handleFilterChange('category', val === "" ? activeParent.id : val);
                         }}
                       >
                         <option value="">{t('filter.all_subcategories')}</option>
                         {activeParent.subcategories.map(subId => (
                           <option key={subId} value={subId}>{getCategoryName(t, subId)}</option>
                         ))}
                       </select>
                     </div>
                   )}

                   {(searchParams.get('q') || langParam || contentParam || categoryParam || searchParams.get('popular')) && (
                     <button 
                       onClick={handleResetSearch}
                       className="px-3 py-1 ml-2 text-sm font-medium text-white transition-colors bg-gray-400 rounded hover:bg-gray-500"
                     >
                       {t('filter.reset', 'Reset')}
                     </button>
                   )}
                 </div>

                 <div className="flex items-center gap-2 font-mono text-xs text-ink-light">
                   <span>{t('results.count', { count: books.length })}</span>
                 </div>
              </div>

              {/* Book Grid Content */}
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 opacity-50">
                  <div className="w-8 h-8 border-2 rounded-full border-ink border-t-transparent animate-spin"></div>
                  <span className="font-serif italic text-ink-light">{t('loading.retrieving')}</span>
                </div>
              ) : (
                <div className="animate-fade-in">
                   {books.length > 0 ? (
                     <>
                       <BookGrid books={books} onBookClick={setSelectedBook} />
                       <div className="flex justify-center mt-16">
                          <Pagination 
                            currentPage={pagination.page}
                            hasNext={pagination.hasNext}
                            hasPrev={pagination.hasPrev}
                            onPageChange={(p) => {
                              const newParams = new URLSearchParams(searchParams);
                              newParams.set('page', p.toString());
                              setSearchParams(newParams);
                            }}
                          />
                       </div>
                     </>
                   ) : (
                      <div className="py-24 text-center border border-dashed rounded-lg border-border bg-gray-50/50">
                         <p className="mb-2 font-serif text-xl text-ink-light">{t('results.empty')}</p>
                         <p className="text-sm text-gray-400">{t('results.empty_desc')}</p>
                      </div>
                   )}
                </div>
              )}
            </>
          } />

          <Route path="/collections" element={
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="mb-16 text-center">
                <h1 className="mb-4 font-serif text-4xl font-bold md:text-5xl text-ink">{t('categories.title')}</h1>
                <p className="font-serif text-lg italic text-ink-light">{t('categories.subtitle')}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {categories.map(cat => (
                  <button 
                   key={cat.id}
                   onClick={() => handleCategoryClick(cat.id)}
                   className="flex flex-col items-center justify-center p-8 text-center transition-all bg-white border rounded-lg group border-border hover:border-accent hover:shadow-lg min-h-64"
                  >
                    <div className="flex items-center justify-center w-12 h-12 mb-4 transition-colors rounded-full text-ink-light group-hover:text-accent bg-gray-50 group-hover:bg-accent/10">
                      <BookIcon size={24} />
                    </div>
                    <h3 className="font-serif text-lg font-bold transition-colors text-ink group-hover:text-accent">{getCategoryName(t, cat.id)}</h3>
                    <span className="mt-2 font-mono text-xs tracking-wide text-gray-400 uppercase">{t('categories.collection')}</span>
                  </button>
                ))}
              </div>
            </div>
          } />

          <Route path="/about" element={
            <div className="max-w-3xl mx-auto animate-fade-in">
              <div className="mb-16 text-center">
                <h1 className="mb-4 font-serif text-4xl font-bold md:text-5xl text-ink">{t('about.title')}</h1>
                <div className="w-16 h-1 mx-auto bg-accent"></div>
              </div>

              <div className="mx-auto font-serif prose prose-slate lg:prose-lg">
                <p className="mb-12 text-xl leading-relaxed text-center text-ink-light">
                  {t('about.description')}
                </p>

                <div className="p-8 mb-12 bg-white border rounded-lg shadow-sm border-border">
                  <h2 className="flex items-center gap-3 mb-4 text-2xl font-bold text-ink">
                    <Archive className="text-accent" /> {t('about.mission_title')}
                  </h2>
                  <p className="text-slate-700">
                    {t('about.mission_text')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
                   <div className="p-6 rounded-lg bg-gray-50">
                     <div className="mb-2 text-3xl font-bold text-ink">60M+</div>
                     <div className="font-mono text-xs tracking-widest text-gray-500 uppercase">{t('about.stats_books')}</div>
                   </div>
                   <div className="p-6 rounded-lg bg-gray-50">
                     <div className="mb-2 text-3xl font-bold text-ink">1PB</div>
                     <div className="font-mono text-xs tracking-widest text-gray-500 uppercase">{t('about.stats_data')}</div>
                   </div>
                   <div className="p-6 rounded-lg bg-gray-50">
                     <div className="mb-2 text-3xl font-bold text-ink">100%</div>
                     <div className="font-mono text-xs tracking-widest text-gray-500 uppercase">{t('about.stats_free')}</div>
                   </div>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="py-8 mt-auto border-t border-border bg-white/50">
        <div className="px-6 mx-auto font-mono text-xs text-center max-w-7xl text-ink-light">
           {t('footer.text')}
        </div>
      </footer>
      
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}

export default App;
