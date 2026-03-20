import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  onSearch: (query: string, clearPopular?: boolean) => void;
  initialQuery?: string;
  isPopularActive?: boolean;
}

export default function SearchBar({ onSearch, initialQuery = '', isPopularActive = false }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);

  // Sync with initialQuery when it changes (e.g. back/forward navigation)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If popular filter is active and user is searching, clear it
    onSearch(query, isPopularActive && !!query);
  };

  const clearQuery = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form className="w-full relative group" onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="input-mobile w-full h-12 md:h-[52px] text-base md:text-lg font-sans"
            aria-label="Search books"
          />

          {/* Clear button - appears when there's text */}
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-light hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="btn-primary h-12 md:h-[52px] px-6 md:px-8 whitespace-nowrap text-sm md:text-base flex items-center justify-center"
          aria-label="Search"
        >
          <span className="hidden sm:inline">{t('search.button')}</span>
          <Search size={20} className="sm:hidden" />
        </button>
      </div>
    </form>
  );
}