import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, hasNext, hasPrev, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-center gap-3 pt-8 pb-8 md:gap-4 md:pb-12">
      <button
        className="flex items-center justify-center h-10 p-2 px-2 py-2 transition-colors bg-white border rounded-lg md:p-0 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-border hover:bg-gray-50 md:h-auto md:px-4 md:py-2"
        disabled={!hasPrev}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label={`Go to previous page (page ${currentPage - 1})`}
      >
        <ChevronLeft size={18} />
        <span className="hidden text-sm font-medium md:inline md:text-base">{t('pagination.previous')}</span>
      </button>

      <div className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base font-mono font-semibold text-ink border border-accent/30 bg-accent/5 rounded-lg">
        {t('pagination.page', { page: currentPage })}
      </div>

      <button
        className="flex items-center justify-center h-10 p-2 px-2 py-2 transition-colors bg-white border rounded-lg md:p-0 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-border hover:bg-gray-50 md:h-auto md:px-4 md:py-2"
        disabled={!hasNext}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label={`Go to next page (page ${currentPage + 1})`}
      >
        <span className="hidden text-sm font-medium md:inline md:text-base">{t('pagination.next')}</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
