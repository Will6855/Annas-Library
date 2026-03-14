import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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

  // Handle cached images
  useEffect(() => {
    if (imgRef.current?.complete) {
      setImageLoaded(true);
    }
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className="flex flex-col h-full overflow-hidden transition-all bg-white rounded-lg cursor-pointer card-classic group" // Moved rounded-lg here
      onClick={() => onClick(book)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover / Spine */}
      <div className="relative aspect-2/3 w-full bg-[#f8f8f5] overflow-hidden"> {/* Removed border-b */}
        {/* Placeholder / Default Cover (visible if loading or error) */}
        {(!imageLoaded || imageError || !book.coverUrl) && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center w-full h-full p-6 text-center">
            <div className="flex items-center justify-center w-12 h-16 mb-3 border-2 border-gray-200 rounded-sm">
              <span className="font-serif italic text-gray-300">A</span>
            </div>
            <span className="text-[10px] font-serif text-gray-400 line-clamp-2 uppercase tracking-tight">{book.title}</span>
          </div>
        )}

        {book.coverUrl && !imageError && (
          <img 
            ref={imgRef}
            src={book.coverUrl} 
            alt={book.title}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 relative z-10 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
          />
        )}
        
        {/* Hover Action */}
        <div className={`absolute inset-0 bg-black/5 flex items-center justify-center transition-opacity duration-300 z-20 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
           <button className="px-4 py-2 text-sm font-medium transition-transform duration-300 transform translate-y-2 bg-white rounded shadow-md text-ink group-hover:translate-y-0">
             {t('book.view_details')}
           </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="mb-1 font-serif text-lg font-bold leading-tight transition-colors text-ink line-clamp-2 group-hover:text-accent">
          {book.title}
        </h3>
        <p className="mb-3 text-sm font-medium text-ink-light line-clamp-1">
          {book.author || t('book.unknown_author')}
        </p>

        <div className="flex items-center justify-between pt-3 mt-auto font-mono text-xs text-gray-500 border-t border-gray-200 border-dashed">
          <div className="flex gap-2">
             {book.year && <span>{book.year}</span>}
             {book.languages && <span>{book.languages.toUpperCase()}</span>}
          </div>
          <div>
            {book.format && <span className="uppercase">{book.format}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}