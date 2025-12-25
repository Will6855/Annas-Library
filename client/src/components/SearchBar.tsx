import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);

  // Sync with initialQuery when it changes (e.g. back/forward navigation)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form className="w-full relative group" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-lg shadow-sm font-sans text-lg text-ink placeholder-gray-400 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
         <Search size={20} />
      </div>
      <button 
        type="submit" 
        className="absolute right-2 top-2 bottom-2 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
      >
        {t('search.button')}
      </button>
    </form>
  );
}
