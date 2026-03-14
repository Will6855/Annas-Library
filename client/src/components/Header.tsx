import { Menu, X, Globe, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [opdsCopied, setOpdsCopied] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('preferredLanguage', lng);
  };

  const copyOpdsUrl = async () => {
    const opdsUrl = `${window.location.origin}/opds`;
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(opdsUrl);
      } else {
        // Fallback for older browsers/mobile
        const textArea = document.createElement('textarea');
        textArea.value = opdsUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
      }
      setOpdsCopied(true);
      setTimeout(() => setOpdsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy OPDS URL:', err);
      // Try fallback on error
      try {
        const textArea = document.createElement('textarea');
        textArea.value = opdsUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setOpdsCopied(true);
        setTimeout(() => setOpdsCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `transition-colors hover:text-ink ${isActive ? 'text-ink font-bold' : 'text-ink-light'}`;

  return (
    <header className="sticky top-0 z-50 border-b bg-paper/80 backdrop-blur-md border-border">
      <div className="flex items-center h-16 px-6 mx-auto max-w-7xl">
        
        {/* Far Left: Title/Logo - Takes 2/3 on mobile, flex-1 on desktop */}
        <div className="flex justify-start flex-none w-2/3 md:flex-1 md:w-auto">
          <Link to={{ pathname: '/', search: location.search }} className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex items-center justify-center w-8 h-8 font-serif text-lg font-bold rounded-sm bg-ink text-paper">
              A
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-ink">
              {t('app.title')}
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="items-center hidden gap-8 text-sm font-medium md:flex">
          <NavLink to={{ pathname: '/', search: location.search }} className={navLinkClass}>{t('header.catalog')}</NavLink>
          <NavLink to="/collections" className={navLinkClass}>{t('header.collections')}</NavLink>
          <NavLink to="/about" className={navLinkClass}>{t('header.about')}</NavLink>
        </nav>

        {/* Far Right: Language Selector, OPDS Copy Button & Mobile Trigger - Takes 1/3 on mobile, flex-1 on desktop */}
        <div className="flex items-center justify-end flex-none w-1/3 gap-4 md:flex-1 md:w-auto md:gap-6">
          {/* Copy OPDS URL Button - Desktop */}
          <button
            onClick={copyOpdsUrl}
            className="hidden items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded md:flex text-ink-light hover:text-ink hover:bg-gray-100"
            title={t('header.copy_opds')}
          >
            {opdsCopied ? (
              <>
                <Check size={14} className="text-green-600" />
                <span className="text-green-600">{t('header.opds_copied')}</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="font-mono">OPDS</span>
              </>
            )}
          </button>

          <div className="relative items-center hidden gap-2 md:flex group">
            <Globe size={16} className="text-gray-400 transition-colors group-hover:text-ink" />
            <select 
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent border-none text-[10px] font-mono uppercase tracking-widest cursor-pointer focus:ring-0 p-0 pr-4 min-w-22.5 text-ink-light hover:text-ink transition-colors"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <button className="p-2 md:hidden text-ink" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="p-4 space-y-4 border-t shadow-lg md:hidden border-border bg-paper animate-fade-in">
          <NavLink to={{ pathname: '/', search: location.search }} onClick={() => setIsMobileMenuOpen(false)} className="block py-2 font-medium text-ink">{t('header.catalog')}</NavLink>
          <NavLink to="/collections" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 font-medium text-ink">{t('header.collections')}</NavLink>
          <NavLink to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 font-medium text-ink">{t('header.about')}</NavLink>
          
          {/* Copy OPDS URL Button - Mobile */}
          <button
            onClick={async () => {
              await copyOpdsUrl();
              // Keep menu open briefly to show success message, then close
              setTimeout(() => {
                setIsMobileMenuOpen(false);
              }, 1500);
            }}
            className="flex items-center gap-2 py-2 font-medium text-ink"
          >
            {opdsCopied ? (
              <>
                <Check size={16} className="text-green-600" />
                <span className="text-green-600">{t('header.opds_copied')}</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>OPDS</span>
              </>
            )}
          </button>
          
          <div className="pt-4 border-t border-border">
             <div className="flex items-center gap-2 text-ink-light">
               <Globe size={16} />
               <select 
                 value={i18n.language}
                 onChange={(e) => {
                   changeLanguage(e.target.value);
                   setIsMobileMenuOpen(false);
                 }}
                 className="p-0 font-mono text-xs uppercase bg-transparent border-none focus:ring-0"
               >
                 <option value="en">English</option>
                 <option value="fr">Français</option>
               </select>
             </div>
          </div>
        </div>
      )}
    </header>
  );
}
