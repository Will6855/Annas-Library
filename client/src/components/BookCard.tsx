import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

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
}

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) setImageLoaded(true);
  }, []);

  const hasCover = book.coverUrl && !imageError;

  return (
    <div
      className="flex flex-col items-center h-full cursor-pointer group"
      onClick={() => onClick(book)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${book.title} by ${book.author || 'Unknown'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(book);
        }
      }}
    >
      {/* Cover */}
      <div className="relative flex justify-center w-full mb-3">
        <div
          className={`relative overflow-hidden bg-stone-300 rounded-l-sm rounded-r-xl transition-all duration-300 aspect-[2/3] w-full max-w-[140px] ${
            hasCover
              ? 'shadow-[6px_6px_24px_rgba(0,0,0,0.28),-2px_0_2px_rgba(0,0,0,0.12),inset_-3px_0_6px_rgba(0,0,0,0.08)] group-hover:shadow-[8px_10px_28px_rgba(0,0,0,0.32),-2px_0_2px_rgba(0,0,0,0.14),inset_-3px_0_6px_rgba(0,0,0,0.08)] group-hover:-translate-y-1'
              : 'shadow-[4px_4px_16px_rgba(0,0,0,0.15)] group-hover:shadow-[6px_8px_20px_rgba(0,0,0,0.2)] group-hover:-translate-y-1'
          }`}
        >
          {/* Spine */}
          <div className="absolute bottom-0 left-0 top-0 z-10 w-1.5 bg-gradient-to-r from-black/20 to-black/[0.03]" />

          {/* Format badge */}
          {book.format && (
            <div className="absolute top-2 right-2 z-30 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white uppercase rounded shadow-md bg-accent">
              {book.format}
            </div>
          )}

          {/* Fallback */}
          {(!hasCover || !imageLoaded) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-stone-400 to-stone-500">
              <span className="line-clamp-5 text-[10px] font-medium leading-snug text-white/90">
                {book.title}
              </span>
            </div>
          )}

          {hasCover && (
            <img
              ref={imgRef}
              src={book.coverUrl}
              alt={book.title}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`relative z-[1] h-full w-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              decoding="async"
            />
          )}

          {/* Hover overlay */}
          <div className={`absolute inset-0 z-20 flex items-end justify-center pb-4 transition-all duration-300 ${
            isHovered
              ? 'bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100'
              : 'bg-black/0 opacity-0'
          }`}>
            <button
              onClick={(e) => { e.stopPropagation(); onClick(book); }}
              className="flex items-center gap-2 px-3 py-2 mx-3 text-sm font-semibold transition-all duration-300 bg-white rounded-lg shadow-lg text-ink hover:bg-accent hover:text-white active:scale-95"
            >
              {t('book.view_details')}
              {/* <ChevronRight size={16} /> */}
            </button>
          </div>
        </div>
      </div>

      {/* Title and Author */}
      <div className="flex flex-col w-full max-w-[140px] gap-1">
        <h3 className="font-serif text-sm font-bold leading-tight transition-colors md:text-base text-ink line-clamp-2 group-hover:text-accent">
          {book.title}
        </h3>
        <p className="text-xs font-medium md:text-sm text-ink-light line-clamp-1">
          {book.author || t('book.unknown_author')}
        </p>
      </div>
    </div>
  );
}