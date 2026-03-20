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
  const [description, setDescription] = useState(book.description || '');
  const imgRef = useRef<HTMLImageElement>(null);

  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);

  const dragStartY = useRef(0);
  const currentY = useRef(0);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    // Slide down fully off screen
    setTranslateY(typeof window !== 'undefined' ? window.innerHeight : 1000);
    setTimeout(() => {
      onClose();
    }, 300); // 300ms matches Tailwind duration-300
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const scrollArea = document.getElementById('modal-scroll-area');
    if (scrollArea && scrollArea.contains(e.target as Node)) {
      // If we're inside the text content and it's scrolled down, allow native scroll
      if (scrollArea.scrollTop > 0) return;
    }
    dragStartY.current = e.touches[0].clientY;
    currentY.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    
    // If scrolling up when at the top of the scroll area, let it do native scroll / bounce
    if (deltaY < 0) {
      setTranslateY(0);
      currentY.current = 0;
      return;
    }
    
    setTranslateY(deltaY);
    currentY.current = deltaY;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Lower threshold for easier closing
    if (currentY.current > 80) {
      handleClose();
    } else {
      setTranslateY(0);
      currentY.current = 0;
    }
  };

  useEffect(() => {
    if (imgRef.current?.complete) setImageLoaded(true);
  }, []);

  useEffect(() => {
    if (!description && book.id.startsWith('zlib:') && (book as any).zlibHash) {
      const zlibId = (book as any).zlibId;
      const zlibHash = (book as any).zlibHash;
      const lang = (book.languages || 'en').toLowerCase();
      
      fetch(`/api/zlib-detail/${lang}/${zlibId}/${zlibHash}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.description) {
            setDescription(data.description);
          }
        })
        .catch(() => {});
    }
  }, [book, description]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/download/${book.md5}?resolve=true`);
      if (!response.ok) throw new Error('Download failed');
      const data = await response.json();
      if (data.url) window.location.assign(data.url);
      else throw new Error('No URL returned');
    } catch (error) {
      console.error('Download error:', error);
      alert(t('book.download_error') || 'Could not start download');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleEscape);
    
    // Prevent scrolling on html and body for better mobile support
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const hasCover = book.coverUrl && !imageError;

  const metaItems = [
    { icon: <Calendar size={11} />, value: book.year },
    { icon: <Globe size={11} />,    value: book.languages?.toUpperCase() },
    { icon: <FileText size={11} />, value: book.format?.toUpperCase() },
    { icon: <HardDrive size={11} />,value: book.size },
  ].filter(m => m.value);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-5 overscroll-none transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      <div
        className={`flex flex-col w-full max-w-3xl overflow-hidden bg-white shadow-2xl rounded-t-3xl sm:rounded-3xl ${!isDragging ? 'transition-transform duration-300' : ''} ${isClosing ? '' : 'animate-slide-up'}`}
        style={{ maxHeight: '92vh', transform: `translateY(${translateY}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 bg-gray-200 rounded-full w-9" />
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden sm:flex-row">

          {/* ── Cover column ── */}
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-6 border-b border-gray-100 shrink-0 bg-gray-50 sm:w-52 sm:justify-start sm:border-b-0 sm:border-r sm:pt-10">

            {/* Book cover */}
            <div
              className="relative h-44 w-[116px] shrink-0 bg-stone-300 sm:h-56 sm:w-[148px]"
              style={{ borderRadius: '0 4px 4px 0' }}
            >
              <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '0 4px 4px 0' }}>

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
              </div>

              {/* Book Cover Overlay Style */}
              <div
                className="absolute inset-0 z-30 pointer-events-none "
                style={{
                  borderRadius: '0 4px 4px 0',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                  backgroundImage: `url("data:image/svg+xml,%0A%3Csvg width='6' height='150' viewBox='0 0 6 150' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='6' height='150' fill='url(%23paint0_linear)'/%3E%3Cdefs%3E%3ClinearGradient id='paint0_linear' x1='6' y1='61.5234' x2='-9.54301e-06' y2='61.5315' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='white' stop-opacity='0'/%3E%3Cstop offset='0.139111' stop-color='white' stop-opacity='0.2'/%3E%3Cstop offset='0.290477' stop-opacity='0.18'/%3E%3Cstop offset='0.726819' stop-color='%23D8D8D8' stop-opacity='0.273181'/%3E%3Cstop offset='0.839352' stop-opacity='0.15'/%3E%3Cstop offset='1' stop-opacity='0.19'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E%0A")`,
                  backgroundRepeat: 'repeat-y',
                }}
              />
            </div>
          </div>

          {/* ── Detail column ── */}
          <div className="flex flex-col flex-1 min-h-0 relative">

            {/* PINNED CLOSE BUTTON */}
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 text-gray-400 transition-all rounded-lg bg-white/80 backdrop-blur-sm sm:bg-transparent hover:bg-gray-100 hover:text-gray-600 active:scale-90"
            >
              <X size={20} />
            </button>

            {/* Content (Scrolls everything else) */}
            <div id="modal-scroll-area" className="flex flex-col flex-1 min-h-0 overflow-y-auto px-6 pt-5 pb-6 sm:pt-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">

              {/* Title */}
              <div className="mb-2 shrink-0 pr-10">
                <h2 className="text-xl font-semibold leading-snug tracking-tight pt-0.5 text-gray-900 sm:text-2xl">
                  {book.title}
                </h2>
              </div>

              {/* Author */}
              <p className="mb-1 text-sm italic text-gray-400 shrink-0 pr-8">
                {book.author || t('book.unknown_author')}
              </p>

              {/* Publisher */}
              {book.publisher && (
                <p className="mb-1 text-xs text-gray-300 shrink-0 pr-8">
                  {book.publisher}
                </p>
              )}

              <div className="h-px my-4 bg-gray-100 shrink-0" />

              {/* Metadata chips */}
              {metaItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5 shrink-0">
                  {metaItems.map(({ icon, value }, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500"
                    >
                      <span className="text-gray-300">{icon}</span>
                      {value}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="mb-5 shrink-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-300">
                    {t('book.description')}
                  </p>
                  <div className="pr-2">
                    <p className="text-sm leading-relaxed text-gray-500" dangerouslySetInnerHTML={{ __html: description }} />
                  </div>
                </div>
              )}

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="mb-5 shrink-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-300">
                    {t('book.subject_tags')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {book.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="cursor-default rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-400 transition-colors hover:border-gray-800 hover:text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* MD5 */}
              <p className="mt-auto break-all font-mono text-[10px] text-gray-200 shrink-0">
                {book.md5}
              </p>
            </div>

            {/* Download — pinned */}
            <div className="px-6 pt-3 shrink-0 bg-gradient-to-t from-white via-white to-transparent pb-7">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-200 ${
                  isDownloading
                    ? 'cursor-wait bg-gray-400'
                    : 'bg-gray-900 hover:-translate-y-px hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]'
                }`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('book.preparing_download') || 'Preparing…'}
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    {t('book.download')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}