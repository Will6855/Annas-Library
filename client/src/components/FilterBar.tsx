import React, { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCategoryName, getContentTypeName } from '../utils/translations';
import { Category, ContentType, Language } from '../types';

interface FilterBarProps {
  booksCount: number;
  searchParams: URLSearchParams;
  languages: Language[];
  contentTypes: ContentType[];
  categories: Category[];
  activeParent: Category | undefined;
  handlePopular: () => void;
  handleFilterChange: (key: string, value: string) => void;
  handleResetSearch: (q: string) => void;
  categoryParam: string;
  langParam: string;
  contentParam: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  booksCount,
  searchParams,
  languages,
  contentTypes,
  categories,
  activeParent,
  handlePopular,
  handleFilterChange,
  handleResetSearch,
  categoryParam,
  langParam,
  contentParam,
}) => {
  const { t } = useTranslation();
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters =
    searchParams.get('popular') === 'true' || !!langParam || !!contentParam || !!categoryParam;

  return (
    <>
      {/* Desktop Layout */}
      <div
        className="sticky top-16 z-40 mb-8 hidden flex-wrap items-center justify-between gap-4 border-y border-border bg-white/75 py-4 backdrop-blur-sm md:top-20 lg:mb-12 lg:flex"
        style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50% + 1.5rem)',
          paddingRight: 'calc(50vw - 50% + 1.5rem)',
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-ink-light flex items-center gap-2 text-sm font-medium">
            <Filter size={18} />
            <span>{t('filter.by')}</span>
          </div>

          <button
            onClick={handlePopular}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              searchParams.get('popular')
                ? 'bg-accent text-white shadow-md'
                : 'text-ink hover:bg-gray-200 bg-gray-100'
            }`}
          >
            ⭐ <span>{t('filter.popular')}</span>
          </button>

          <select
            className="text-ink hover:text-accent bg-transparent border-none cursor-pointer text-sm font-medium transition-colors focus:ring-0"
            value={langParam}
            onChange={(e) => handleFilterChange('lang', e.target.value)}
          >
            {searchParams.get('popular') !== 'true' && (
              <option value="">{t('filter.all_languages')}</option>
            )}
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>

          <select
            className={`cursor-pointer border-none bg-transparent text-sm font-medium transition-colors focus:ring-0 ${
              searchParams.get('popular')
                ? 'cursor-not-allowed opacity-50 text-gray-400'
                : 'text-ink hover:text-accent'
            }`}
            value={contentParam}
            onChange={(e) => handleFilterChange('content', e.target.value)}
            disabled={searchParams.get('popular') === 'true'}
          >
            <option value="">{t('filter.all_formats')}</option>
            {contentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {getContentTypeName(t, type.id)}
              </option>
            ))}
          </select>

          <select
            className={`max-w-37.5 cursor-pointer truncate border-none bg-transparent text-sm font-medium transition-colors focus:ring-0 ${
              searchParams.get('popular')
                ? 'cursor-not-allowed opacity-50 text-gray-400'
                : 'text-ink hover:text-accent'
            }`}
            value={activeParent?.id || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            disabled={searchParams.get('popular') === 'true'}
          >
            <option value="">{t('filter.all_categories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {getCategoryName(t, c.id)}
              </option>
            ))}
          </select>

          {activeParent && activeParent.subcategories.length > 0 && !searchParams.get('popular') && (
            <div className="animate-fade-in flex items-center gap-2">
              <span className="text-gray-300">/</span>
              <select
                className="text-ink hover:text-accent max-w-37.5 bg-transparent border-none cursor-pointer truncate text-sm font-medium transition-colors focus:ring-0"
                value={categoryParam === activeParent.id ? '' : categoryParam}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFilterChange('category', val === '' ? activeParent.id : val);
                }}
              >
                <option value="">{t('filter.all_subcategories')}</option>
                {activeParent.subcategories.map((subId) => (
                  <option key={subId} value={subId}>
                    {getCategoryName(t, subId)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(langParam || contentParam || categoryParam) && (
              <button
                onClick={() => handleResetSearch(searchParams.get('q') || '')}
                className="ml-2 rounded bg-gray-400 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-gray-500"
              >
                {t('filter.reset', 'Reset')}
              </button>
            )}
        </div>

        <div className="text-ink-light flex items-center gap-2 font-mono text-xs">
          <span className="font-semibold uppercase">
            {booksCount} {t('results.count_suffix', 'results')}
          </span>
        </div>
      </div>

      {/* Mobile Layout (portrait + landscape) */}
      <div className="sticky left-0 right-0 top-16 z-40 -mx-4 mb-4 border-border bg-white/75 backdrop-blur-sm md:-mx-6 md:top-20 md:mb-12 lg:hidden">

        {/* Toggle button — always visible on mobile */}
        <div className="flex items-center justify-between border-b border-t border-border px-4 py-2 md:px-6">
          <button
            onClick={() => setShowMobileFilters((prev) => !prev)}
            className="text-ink-light hover:text-ink flex items-center gap-1.5 transition-colors"
            aria-label={t('filter.toggle_filters', 'Toggle Filters')}
          >
            <Filter size={14} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {showMobileFilters ? t('filter.hide', 'Hide') : t('filter.filters', 'Filters')}
            </span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                !
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform ${showMobileFilters ? 'rotate-180' : ''}`}
            />
          </button>

          <span className="font-mono text-xs font-semibold uppercase text-ink-light">
            {booksCount} {t('results.count_suffix', 'results')}
          </span>
        </div>

        {/* Collapsible filter panel */}
        {showMobileFilters && (
          <div className="animate-slide-in flex flex-col gap-2 px-4 py-3 md:gap-3 md:px-6 md:py-6">

            <div className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={handlePopular}
                className={`flex-shrink-0 cursor-pointer rounded-lg px-2 py-2 text-sm font-medium transition-all md:px-4 md:text-base ${
                  searchParams.get('popular')
                    ? 'bg-accent text-white shadow-md'
                    : 'text-ink hover:bg-gray-200 bg-gray-100'
                }`}
              >
                ⭐ <span className="hidden sm:inline">{t('filter.popular')}</span>
              </button>

              <select
                className="text-ink focus:border-accent focus:ring-accent/20 min-w-0 flex-1 cursor-pointer truncate rounded-lg border border-border bg-white px-2 py-2 text-sm font-medium transition-all hover:border-gray-400 focus:ring-2 md:px-4 md:text-base"
                value={langParam}
                onChange={(e) => handleFilterChange('lang', e.target.value)}
              >
                {searchParams.get('popular') !== 'true' && (
                  <option value="">{t('filter.all_languages')}</option>
                )}
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>

              {(langParam || contentParam || categoryParam) && (
                  <button
                    onClick={() => handleResetSearch(searchParams.get('q') || '')}
                    className="flex-shrink-0 rounded-lg border-0 bg-gray-400 px-2 py-2 text-sm font-medium text-white transition-all hover:bg-gray-500 active:scale-95 md:px-4 md:text-base"
                  >
                    {t('filter.reset', 'Reset')}
                  </button>
                )}
            </div>

            <div className="flex items-center gap-1.5 md:gap-3">
              <select
                className={`min-w-0 flex-1 cursor-pointer truncate rounded-lg border border-border bg-white px-2 py-2 text-sm font-medium transition-all focus:ring-2 focus:border-accent focus:ring-accent/20 hover:border-gray-400 md:px-4 md:text-base ${
                  searchParams.get('popular')
                    ? 'cursor-not-allowed opacity-50 text-gray-400'
                    : 'text-ink'
                }`}
                value={contentParam}
                onChange={(e) => handleFilterChange('content', e.target.value)}
                disabled={searchParams.get('popular') === 'true'}
              >
                <option value="">{t('filter.all_formats')}</option>
                {contentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {getContentTypeName(t, type.id)}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowSecondaryFilters(!showSecondaryFilters)}
                className={`relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium transition-all md:px-4 md:text-base ${
                  showSecondaryFilters
                    ? 'bg-accent text-white shadow-md'
                    : 'text-ink hover:bg-gray-200 bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">{t('filter.more', 'More')}</span>
                <span className="sm:hidden">+</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showSecondaryFilters ? 'rotate-180' : ''}`}
                />
                {!showSecondaryFilters && searchParams.get('category') && (
                  <span className="bg-accent absolute right-0 top-0 flex h-4 w-4 -translate-y-1/4 translate-x-1/4 transform items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md">
                    !
                  </span>
                )}
              </button>
            </div>

            {showSecondaryFilters && (
              <div className="animate-slide-in flex flex-col gap-2 md:gap-3">
                <select
                  className={`w-full cursor-pointer truncate rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium transition-all focus:ring-2 focus:border-accent focus:ring-accent/20 hover:border-gray-400 md:px-4 md:text-base ${
                    searchParams.get('popular')
                      ? 'cursor-not-allowed opacity-50 text-gray-400'
                      : 'text-ink'
                  }`}
                  value={activeParent?.id || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  disabled={searchParams.get('popular') === 'true'}
                >
                  <option value="">{t('filter.all_categories')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCategoryName(t, c.id)}
                    </option>
                  ))}
                </select>

                {activeParent && activeParent.subcategories.length > 0 && !searchParams.get('popular') && (
                  <select
                    className="text-ink focus:border-accent focus:ring-accent/20 w-full cursor-pointer truncate rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium transition-all hover:border-gray-400 focus:ring-2 md:px-4 md:text-base"
                    value={categoryParam === activeParent.id ? '' : categoryParam}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFilterChange('category', val === '' ? activeParent.id : val);
                    }}
                  >
                    <option value="">{t('filter.all_subcategories')}</option>
                    {activeParent.subcategories.map((subId) => (
                      <option key={subId} value={subId}>
                        {getCategoryName(t, subId)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FilterBar;