import { useEffect, useState, useRef } from 'react';
import { X, Download, FileText, Calendar, Globe, HardDrive, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Book {
  id: string;
  md5: string;
  title: string;
  author?: string;
  publisher?: string;
  coverUrl?: string;
  year?: string;
  languages?: string;
  format?: string;
  size?: string;
  description?: string;
  tags?: string[];
}

interface BookModalProps {
  book: Book;
  onClose: () => void;
}

export default function BookModal({ book, onClose }: BookModalProps) {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/download/${book.md5}?resolve=true`);
      if (!response.ok) throw new Error('Download failed');
      
      const data = await response.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error('No URL returned');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(t('book.download_error') || 'Could not start download');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full max-w-2xl shadow-2xl rounded-sm border border-border flex flex-col max-h-[90vh] animate-[slideIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border flex-shrink-0">
          <span className="font-mono text-xs tracking-widest uppercase text-ink-light">
            {t('book.modal_accession')}: {book.md5}
          </span>
          <button
            onClick={onClose}
            className="transition-colors text-ink-light hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Cover Column */}
            <div className="flex-shrink-0 w-full md:w-1/3">
              <div className="aspect-[2/3] bg-[#f8f8f5] border border-border shadow-sm relative overflow-hidden sticky top-0">
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
                    className={`w-full h-full object-cover transition-all duration-700 relative z-10 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                  />
                )}
              </div>
            </div>

            {/* Details Column */}
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="mb-2 font-serif text-3xl font-bold leading-tight md:text-4xl text-ink">
                  {book.title}
                </h2>
                <div className="font-serif text-xl italic text-ink-light space-y-1">
                  <p>{book.author || t('book.unknown_author')}</p>
                  {book.publisher && (
                    <p className="text-sm not-italic text-ink-lighter">{book.publisher}</p>
                  )}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 py-6 gap-y-4 gap-x-8 border-y border-border">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-ink-light">
                    <Calendar size={14} /> {t('book.year')}
                  </div>
                  <span className="font-mono text-ink">{book.year || '—'}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-ink-light">
                    <Globe size={14} /> {t('book.language')}
                  </div>
                  <span className="font-mono uppercase text-ink">{book.languages || '—'}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-ink-light">
                    <FileText size={14} /> {t('book.format')}
                  </div>
                  <span className="font-mono uppercase text-ink">{book.format || '—'}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-ink-light">
                    <HardDrive size={14} /> {t('book.size')}
                  </div>
                  <span className="font-mono uppercase text-ink">{book.size || '—'}</span>
                </div>
              </div>

              {/* Description */}
              {book.description && (
                <div className="space-y-2">
                   {/* <span className="text-xs font-bold tracking-wider uppercase text-ink-light">{t('book.description')}</span> */}
                  <div className="font-serif text-sm leading-relaxed text-ink/80 bg-[#f8f8f5] p-4 border border-border/50 rounded-sm">
                    {book.description}
                  </div>
                </div>
              )}

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-ink-light">{t('book.subject_tags')}</span>
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 text-xs font-medium bg-gray-100 border border-gray-200 rounded-sm text-ink-light">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="pt-2">
                <a
                  href={`/download/${book.md5}`}
                  onClick={handleDownload}
                  className={`flex items-center justify-center w-full gap-3 py-4 text-sm tracking-widest uppercase transition-all border shadow-none btn-primary hover:bg-accent hover:border-accent hover:text-white border-ink ${
                    isDownloading ? 'opacity-80 cursor-wait' : ''
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t('book.preparing_download') || 'Preparing...'}
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      {t('book.download')}
                    </>
                  )}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
