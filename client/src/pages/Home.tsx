import React from 'react';
import { Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import BookGrid from '../components/BookGrid';
import Pagination from '../components/Pagination';
import { useBooks } from '../hooks/useBooks';
import { Category, ContentType, Language, Book } from '../types';

interface HomeProps {
  categories: Category[];
  contentTypes: ContentType[];
  languages: Language[];
  setSelectedBook: React.Dispatch<React.SetStateAction<Book | null>>;
}

const Home: React.FC<HomeProps> = ({
  categories,
  contentTypes,
  languages,
  setSelectedBook,
}) => {
  const { t } = useTranslation();
  const {
    books,
    loading,
    filters,
    pagination,
    searchParams,
    setSearchParams,
    handleSearch,
    handlePopular,
    handleFilterChange,
    handleResetSearch,
  } = useBooks();

  const categoryParam = searchParams.get('category') || '';
  const langParam = searchParams.get('lang') || '';
  const contentParam = searchParams.get('content') || '';

  const activeParent =
    categories.find((c) => c.id === categoryParam) ||
    categories.find((c) => c.subcategories.includes(categoryParam));

  return (
    <>
      <div className="animate-fade-in mx-auto mb-12 max-w-3xl text-center md:mb-16">
        <h1 className="text-ink mb-4 font-serif text-3xl font-bold tracking-tight md:mb-6 md:text-5xl lg:text-6xl">
          {t('hero.title')}
        </h1>
        <p className="text-ink-light mb-6 font-serif text-base italic md:mb-8 md:text-lg">
          {t('hero.subtitle')}
        </p>

        <div className="relative">
          <SearchBar
            onSearch={handleSearch}
            initialQuery={searchParams.get('q') ?? ''}
            isPopularActive={searchParams.get('popular') === 'true'}
          />
        </div>
      </div>

      <FilterBar
        booksCount={books.length}
        searchParams={searchParams}
        languages={languages}
        contentTypes={contentTypes}
        categories={categories}
        activeParent={activeParent}
        handlePopular={handlePopular}
        handleFilterChange={handleFilterChange}
        handleResetSearch={handleResetSearch}
        categoryParam={categoryParam}
        langParam={langParam}
        contentParam={contentParam}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 opacity-50">
          <div className="border-ink animate-spin rounded-full border-4 border-t-transparent h-8 w-8"></div>
          <span className="text-ink-light font-serif italic">
            {t('loading.retrieving')}
          </span>
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
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          ) : (
            <div className="animate-fade-in border-border bg-gray-50/50 rounded-lg border border-dashed py-20 text-center md:py-32">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Archive size={24} className="text-gray-400" />
              </div>
              <p className="text-ink-light mb-2 font-serif text-lg md:text-xl">
                {t('results.empty')}
              </p>
              <p className="text-sm text-gray-400 md:text-base">
                {t('results.empty_desc')}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Home;
