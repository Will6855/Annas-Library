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
    <div className="flex items-center gap-2">
      <button
        className="btn-minimal border border-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 bg-white"
        disabled={!hasPrev}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={16} />
        <span>{t('pagination.previous')}</span>
      </button>

      <span className="px-4 text-sm font-medium font-mono text-ink-light">
        PAGE {currentPage}
      </span>

      <button
        className="btn-minimal border border-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 bg-white"
        disabled={!hasNext}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span>{t('pagination.next')}</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
