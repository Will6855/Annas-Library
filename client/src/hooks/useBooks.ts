import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Book, Filters, PaginationData } from '../types';

export function useBooks() {
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isInitialMount = useRef(true);
  const previousPathname = useRef(sessionStorage.getItem('previousPathname') || '/');

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, [filters, setSearchParams]);

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
    if (location.pathname === '/') {
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
  }, [searchParams, i18n.language, location.pathname, setSearchParams]);

  // Reset search params when navigating to / from other pages
  useEffect(() => {
    if (location.pathname === '/' && previousPathname.current !== '/') {
      setSearchParams({ popular: 'true', lang: i18n.language || 'en' }, { replace: true });
    }
    previousPathname.current = location.pathname;
    sessionStorage.setItem('previousPathname', location.pathname);
  }, [location, setSearchParams, i18n.language]);

  const handleSearch = (query: string, clearPopular = false) => {
    const params = new URLSearchParams(searchParams);
    if (query) params.set('q', query);
    else params.delete('q');
    if (clearPopular) params.delete('popular');
    setSearchParams(params);
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
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

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

  const handleResetSearch = (q: string) => {
    setSearchParams({ q });
  };

  return {
    books,
    loading,
    filters,
    pagination,
    searchParams,
    setSearchParams,
    handleSearch,
    handlePopular,
    handleFilterChange,
    handleResetSearch
  };
}
