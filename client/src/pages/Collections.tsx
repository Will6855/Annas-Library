import React from 'react';
import { Book as BookIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCategoryName } from '../utils/translations';
import { Category } from '../types';

interface CollectionsProps {
  categories: Category[];
}

const Collections: React.FC<CollectionsProps> = ({ categories }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const handleCategoryClick = (catId: string) => {
    const newParams = new URLSearchParams();
    newParams.set('category', catId);
    newParams.set('page', '1');
    setSearchParams(newParams);
    navigate(`/?${newParams.toString()}`);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-5xl">
      <div className="mb-12 text-center md:mb-16">
        <h1 className="text-ink mb-3 font-serif text-3xl font-bold md:mb-4 md:text-5xl">
          {t('categories.title')}
        </h1>
        <p className="text-ink-light font-serif text-base italic md:text-lg">
          {t('categories.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4 landscape:grid-cols-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="border-border hover:border-accent touch-target group flex min-h-48 transform flex-col items-center justify-center rounded-lg border bg-white p-4 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 md:min-h-64 md:p-8 landscape:min-h-32 md:landscape:min-h-64"
          >
            <div className="text-ink-light group-hover:text-accent group-hover:bg-accent/10 mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-all md:mb-4 md:h-12 md:w-12">
              <BookIcon size={24} />
            </div>
            <h3 className="text-ink group-hover:text-accent font-serif text-sm font-bold transition-colors md:text-lg">
              {getCategoryName(t, cat.id)}
            </h3>
            <span className="mt-2 font-mono text-xs tracking-wide text-gray-400 uppercase">
              {t('categories.collection')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Collections;
