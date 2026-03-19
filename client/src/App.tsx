import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import BookGrid from './components/BookGrid';
import Pagination from './components/Pagination';
import BookModal from './components/BookModal';
import { Filter, Archive, Book as BookIcon, ChevronDown } from 'lucide-react';
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
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);
  
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
      const keys = Array.from(searchParams.keys());
      const isPopular = searchParams.get('popular') === 'true';
      const currentLang = searchParams.get('lang');
      const localeLang = i18n.language || 'en';
      
      if (keys.length === 0 || (isPopular && !currentLang)) {
        const newParams = new URLSearchParams(searchParams);
        if (keys.length === 0) newParams.set('popular', 'true');
        if (newParams.get('popular') === 'true' && !newParams.get('lang')) {
          newParams.set('lang', localeLang);
        }
        setSearchParams(newParams, { replace: true });
      } else {
        fetchBooks();
      }
    }
  }, [searchParams, i18n.language]);

  // Reset search params when navigating to / from other pages
  useEffect(() => {
    if (location.pathname === '/' && previousPathname.current !== '/') {
      setSearchParams({ popular: 'true', lang: i18n.language || 'en' }, { replace: true });
    }
    previousPathname.current = location.pathname;
    sessionStorage.setItem('previousPathname', location.pathname);
  }, [location, setSearchParams, i18n.language]);

  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('q', query);
    } else {
      newParams.delete('q');
    }
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
    setSearchParams({ popular: 'true', lang: i18n.language || 'en' });
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

      <main className="flex-1 w-full px-4 py-8 mx-auto md:px-6 md:py-12 max-w-7xl">
        <Routes>
          <Route path="/" element={
            <>
              {/* Search Section */}
              <div className="max-w-3xl mx-auto mb-12 text-center md:mb-16 animate-fade-in">
                 <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight md:mb-6 md:text-5xl lg:text-6xl text-ink">
                   {t('hero.title')}
                 </h1>
                 <p className="mb-6 font-serif text-base italic md:mb-8 md:text-lg text-ink-light">
                   {t('hero.subtitle')}
                 </p>
                 
                 <div className="relative">
                   <SearchBar onSearch={handleSearch} initialQuery={searchParams.get('q') || ''}/>
                 </div>
              </div>

              {/* Filter Toolbar */}
              {/* Desktop Layout */}
              <div
                className="sticky z-40 flex-wrap items-center justify-between hidden gap-4 py-4 mb-8 border-y border-border bg-white/75 backdrop-blur-sm top-16 md:top-20 lg:flex lg:mb-12"
                style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', paddingLeft: 'calc(50vw - 50% + 1.5rem)', paddingRight: 'calc(50vw - 50% + 1.5rem)' }}
              >
                 <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-2 text-sm font-medium text-ink-light">
                     <Filter size={18} />
                     <span>{t('filter.by')}</span>
                   </div>

                   {/* Popular Button */}
                   <button
                     onClick={handlePopular}
                     className={`px-3 py-1 text-sm font-medium rounded transition-colors ${searchParams.get('popular') ? 'bg-accent text-white shadow-md' : 'bg-gray-100 text-ink hover:bg-gray-200'}`}
                   >
                     ⭐ <span>{t('filter.popular')}</span>
                   </button>
                   
                   {/* Language Select */}
                   <select 
                     className="text-sm font-medium transition-colors bg-transparent border-none cursor-pointer text-ink focus:ring-0 hover:text-accent"
                     value={langParam}
                     onChange={(e) => handleFilterChange('lang', e.target.value)}
                   >
                     {searchParams.get('popular') !== 'true' && <option value="">{t('filter.all_languages')}</option>}
                     {languages.map(l => (
                       <option key={l.code} value={l.code}>{l.name}</option>
                     ))}
                   </select>

                   {/* Format Select */}
                   <select 
                     className={`text-sm font-medium transition-colors bg-transparent border-none cursor-pointer focus:ring-0 ${searchParams.get('popular') ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-ink hover:text-accent'}`}
                     value={contentParam}
                     onChange={(e) => handleFilterChange('content', e.target.value)}
                     disabled={searchParams.get('popular') === 'true'}
                   >
                     <option value="">{t('filter.all_formats')}</option>
                     {contentTypes.map(type => (
                       <option key={type.id} value={type.id}>{getContentTypeName(t, type.id)}</option>
                     ))}
                   </select>

                   {/* Category Select */}
                   <select 
                     className={`text-sm font-medium transition-colors bg-transparent border-none cursor-pointer focus:ring-0 max-w-37.5 truncate ${searchParams.get('popular') ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-ink hover:text-accent'}`}
                     value={activeParent?.id || ""}
                     onChange={(e) => handleFilterChange('category', e.target.value)}
                     disabled={searchParams.get('popular') === 'true'}
                   >
                     <option value="">{t('filter.all_categories')}</option>
                     {categories.map(c => (
                       <option key={c.id} value={c.id}>{getCategoryName(t, c.id)}</option>
                     ))}
                   </select>

                   {/* Divider & Subcategory */}
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

                   {/* Reset Button */}
                   {searchParams.get('popular') !== 'true' && (searchParams.get('q') || langParam || contentParam || categoryParam) && (
                     <button 
                       onClick={handleResetSearch}
                       className="px-3 py-1 ml-2 text-sm font-medium text-white transition-colors bg-gray-400 rounded hover:bg-gray-500"
                     >
                       {t('filter.reset', 'Reset')}
                     </button>
                   )}
                 </div>

                 {/* Results Count */}
                 <div className="flex items-center gap-2 font-mono text-xs text-ink-light">
                   <span className="font-semibold uppercase">{books.length} {t('results.count_suffix', 'results')}</span>
                 </div>
              </div>

              {/* Mobile Layout */}
              <div className="sticky left-0 right-0 z-40 flex flex-col gap-2 px-4 py-3 mb-4 -mx-4 lg:hidden top-16 md:top-20 md:gap-3 md:py-6 md:mb-12 border-y border-border bg-white/75 backdrop-blur-sm md:-mx-6 md:px-6">
                 <div className="px-3 md:px-0">
                   <div className="items-center hidden gap-3 mb-4 text-sm font-medium md:flex text-ink-light">
                     <Filter size={18} />
                     <span>{t('filter.by')}</span>
                   </div>

                   {/* Row 1: Popular, Language, Reset */}
                   <div className="flex items-center gap-1.5 md:gap-3 mb-2 md:mb-3">
                     <button
                       onClick={handlePopular}
                       className={`px-2 md:px-4 py-2 text-sm md:text-base font-medium rounded-lg transition-all flex-shrink-0 ${searchParams.get('popular') ? 'bg-accent text-white shadow-md' : 'bg-gray-100 text-ink hover:bg-gray-200'}`}
                     >
                       ⭐ <span className="hidden sm:inline">{t('filter.popular')}</span>
                     </button>
                     
                     <select 
                       className="flex-1 min-w-0 px-2 py-2 text-sm font-medium truncate transition-all bg-white border rounded-lg cursor-pointer md:px-4 md:text-base border-border text-ink focus:ring-2 focus:ring-accent/20 focus:border-accent hover:border-gray-400"
                       value={langParam}
                       onChange={(e) => handleFilterChange('lang', e.target.value)}
                     >
                       {searchParams.get('popular') !== 'true' && <option value="">{t('filter.all_languages')}</option>}
                       {languages.map(l => (
                         <option key={l.code} value={l.code}>{l.name}</option>
                       ))}
                     </select>

                     {/* Reset Button */}
                     {searchParams.get('popular') !== 'true' && (searchParams.get('q') || langParam || contentParam || categoryParam) && (
                       <button 
                         onClick={handleResetSearch}
                         className="flex-shrink-0 px-2 py-2 text-sm font-medium text-white transition-all bg-gray-400 border-0 rounded-lg md:px-4 md:text-base hover:bg-gray-500 active:scale-95"
                       >
                         {t('filter.reset', 'Reset')}
                       </button>
                     )}
                   </div>

                   {/* Row 2: Format, More Button */}
                   <div className="flex items-center gap-1.5 md:gap-3">
                     <select 
                       className={`px-2 md:px-4 py-2 text-sm md:text-base font-medium rounded-lg border border-border bg-white transition-all focus:ring-2 focus:ring-accent/20 focus:border-accent hover:border-gray-400 cursor-pointer truncate flex-1 min-w-0 ${searchParams.get('popular') ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-ink'}`}
                       value={contentParam}
                       onChange={(e) => handleFilterChange('content', e.target.value)}
                       disabled={searchParams.get('popular') === 'true'}
                     >
                        <option value="">{t('filter.all_formats')}</option>
                       {contentTypes.map(type => (
                         <option key={type.id} value={type.id}>{getContentTypeName(t, type.id)}</option>
                       ))}
                     </select>

                     {/* Toggle More Filters Button */}
                    <button
                      onClick={() => setShowSecondaryFilters(!showSecondaryFilters)}
                      className={`px-2 md:px-4 py-2 text-sm md:text-base font-medium rounded-lg transition-all flex items-center gap-1 flex-shrink-0 relative ${showSecondaryFilters ? 'bg-accent text-white shadow-md' : 'bg-gray-100 text-ink hover:bg-gray-200'}`}
                    >
                      <span className="hidden sm:inline">More</span>
                      <span className="sm:hidden">+</span>
                      <ChevronDown size={16} className={`transition-transform ${showSecondaryFilters ? 'rotate-180' : ''}`} />
                      
                      {/* Badge notification on the button */}
                      {!showSecondaryFilters && searchParams.get('category') && (
                        <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-md">
                          !
                        </span>
                      )}
                    </button>
                   </div>

                   {/* Row 3 & 4: Categories and Subcategories (stacked full width) */}
                   {showSecondaryFilters && (
                     <div className="flex flex-col gap-2 mt-4 md:gap-3 animate-slide-in">
                       <select 
                         className={`px-3 md:px-4 py-2 text-sm md:text-base font-medium rounded-lg border border-border bg-white transition-all focus:ring-2 focus:ring-accent/20 focus:border-accent hover:border-gray-400 cursor-pointer truncate w-full ${searchParams.get('popular') ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-ink'}`}
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
                         <select 
                           className="w-full px-3 py-2 text-sm font-medium truncate transition-all bg-white border rounded-lg cursor-pointer md:px-4 md:text-base border-border text-ink focus:ring-2 focus:ring-accent/20 focus:border-accent hover:border-gray-400"
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
                       )}
                     </div>
                   )}
                 </div>

                 {/* Results count */}
                 {/* <div className="flex items-center justify-between px-3 pt-2 font-mono text-xs md:px-0 md:pt-0 md:text-sm text-ink-light">
                   <div className="flex items-center gap-2">
                     <span className="font-semibold">{books.length}</span>
                     <span>{t('results.count_suffix', 'results')}</span>
                   </div>
                   <span className="hidden md:inline">{t('pagination.page', { page: pagination.page })}</span>
                 </div> */}
              </div>

              {/* Book Grid Content */}
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 opacity-50">
                  <div className="w-8 h-8 border-4 rounded-full border-ink border-t-transparent animate-spin"></div>
                  <span className="font-serif italic text-ink-light">{t('loading.retrieving')}</span>
                </div>
              ) : (
                <div className="animate-fade-in">
                   {books.length > 0 ? (
                     <>
                       <BookGrid books={books} onBookClick={setSelectedBook} />
                       <Pagination 
                         currentPage={pagination.page}
                         hasNext={pagination.hasNext}
                         hasPrev={pagination.hasPrev}
                         onPageChange={(p) => {
                           const newParams = new URLSearchParams(searchParams);
                           newParams.set('page', p.toString());
                           setSearchParams(newParams);
                           // Scroll to top
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         }}
                       />
                     </>
                   ) : (
                      <div className="py-20 text-center border border-dashed rounded-lg md:py-32 border-border bg-gray-50/50 animate-fade-in">
                         <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full">
                           <Archive size={24} className="text-gray-400" />
                         </div>
                         <p className="mb-2 font-serif text-lg md:text-xl text-ink-light">{t('results.empty')}</p>
                         <p className="text-sm text-gray-400 md:text-base">{t('results.empty_desc')}</p>
                      </div>
                   )}
                </div>
              )}
            </>
          } />

          <Route path="/collections" element={
            <div className="max-w-5xl mx-auto animate-fade-in">
              <div className="mb-12 text-center md:mb-16">
                <h1 className="mb-3 font-serif text-3xl font-bold md:mb-4 md:text-5xl text-ink">{t('categories.title')}</h1>
                <p className="font-serif text-base italic md:text-lg text-ink-light">{t('categories.subtitle')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                {categories.map(cat => (
                  <button 
                   key={cat.id}
                   onClick={() => handleCategoryClick(cat.id)}
                   className="flex flex-col items-center justify-center p-4 text-center transition-all duration-200 transform bg-white border rounded-lg md:p-8 group border-border hover:border-accent hover:shadow-lg hover:scale-105 active:scale-95 min-h-48 md:min-h-64 touch-target"
                  >
                    <div className="flex items-center justify-center w-10 h-10 mb-3 transition-all rounded-full md:w-12 md:h-12 md:mb-4 text-ink-light group-hover:text-accent bg-gray-50 group-hover:bg-accent/10">
                      <BookIcon size={24} />
                    </div>
                    <h3 className="font-serif text-sm font-bold transition-colors md:text-lg text-ink group-hover:text-accent">{getCategoryName(t, cat.id)}</h3>
                    <span className="mt-2 font-mono text-xs tracking-wide text-gray-400 uppercase">{t('categories.collection')}</span>
                  </button>
                ))}
              </div>
            </div>
          } />

          <Route path="/about" element={
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="mb-12 text-center md:mb-16">
                <h1 className="mb-4 font-serif text-3xl font-bold md:mb-6 md:text-5xl text-ink">{t('about.title')}</h1>
                <div className="w-12 h-1 mx-auto rounded-full md:w-16 bg-accent"></div>
              </div>

              <div className="space-y-8 md:space-y-12">
                {/* Description */}
                <p className="max-w-2xl mx-auto mb-8 font-serif text-base leading-relaxed text-center md:mb-12 md:text-lg text-ink-light">
                  {t('about.description')}
                </p>

                {/* Mission Card */}
                <div className="p-6 transition-shadow bg-white border rounded-lg shadow-sm md:p-8 border-border hover:shadow-md">
                  <h2 className="flex items-center gap-3 mb-4 font-serif text-2xl font-bold md:mb-6 md:text-3xl text-ink">
                    <Archive size={28} className="text-accent shrink-0" /> {t('about.mission_title')}
                  </h2>
                  <p className="font-serif text-base leading-relaxed md:text-lg text-ink-light">
                    {t('about.mission_text')}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3">
                   <div className="p-6 text-center transition-all border rounded-lg md:p-8 bg-gradient-to-br from-white to-gray-50 border-border hover:shadow-md">
                     <div className="mb-3 font-serif text-3xl font-bold md:text-4xl text-accent">60M+</div>
                     <div className="font-mono text-xs font-semibold tracking-widest uppercase md:text-sm text-ink-light">{t('about.stats_books')}</div>
                   </div>
                   <div className="p-6 text-center transition-all border rounded-lg md:p-8 bg-gradient-to-br from-white to-gray-50 border-border hover:shadow-md">
                     <div className="mb-3 font-serif text-3xl font-bold md:text-4xl text-accent">1PB</div>
                     <div className="font-mono text-xs font-semibold tracking-widest uppercase md:text-sm text-ink-light">{t('about.stats_data')}</div>
                   </div>
                   <div className="p-6 text-center transition-all border rounded-lg md:p-8 bg-gradient-to-br from-white to-gray-50 border-border hover:shadow-md">
                     <div className="mb-3 font-serif text-3xl font-bold md:text-4xl text-accent">100%</div>
                     <div className="font-mono text-xs font-semibold tracking-widest uppercase md:text-sm text-ink-light">{t('about.stats_free')}</div>
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
