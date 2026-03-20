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
    setIsMobileMenuOpen(false); // Close menu after language change
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
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `transition-colors hover:text-accent ${isActive ? 'text-ink font-bold' : 'text-ink-light'}`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `block py-3 px-4 text-base font-medium transition-colors ${isActive ? 'text-accent font-bold border-l-4 border-accent bg-gray-50' : 'text-ink-light hover:text-ink'}`;

  return (
    <>
      {/* Backdrop blur overlay — sits below header, above page content */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <header className="sticky top-0 z-50 border-b shadow-sm bg-paper/95 backdrop-blur-md border-border">
        <div className="relative flex items-center justify-between h-16 container-safe md:h-20">
          {/* Logo */}
          <Link 
            // to={{ pathname: '/', search: location.search }} 
            to={`/?popular=true&lang=${i18n.language}`}
            className="flex items-center flex-shrink-0 gap-2 transition-opacity md:gap-3 hover:opacity-80"
          >
            <div className="flex items-center justify-center w-8 h-8 font-serif text-lg font-bold rounded-md md:w-10 md:h-10 md:text-xl bg-ink text-paper">
              A
            </div>
            <span className="hidden font-serif text-xl font-bold tracking-tight sm:inline md:text-2xl text-ink">
              {t('app.title')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="absolute hidden gap-8 text-sm font-medium -translate-x-1/2 lg:flex left-1/2">
            <NavLink 
              // to={{ pathname: '/', search: location.search }} 
              to={`/?popular=true&lang=${i18n.language}`}
              className={navLinkClass}
            >
              {t('header.catalog')}
            </NavLink>
            <NavLink 
              to="/collections" 
              className={navLinkClass}
            >
              {t('header.collections')}
            </NavLink>
            <NavLink 
              to="/about" 
              className={navLinkClass}
            >
              {t('header.about')}
            </NavLink>
          </nav>

          {/* Right side: Controls */}
          <div className="flex items-center justify-end flex-shrink-0 gap-2 md:gap-4">
            {/* Copy OPDS URL Button - Desktop */}
            <button
              onClick={copyOpdsUrl}
              className="items-center hidden gap-2 px-3 py-2 text-xs font-medium transition-all rounded-lg lg:flex text-ink-light hover:text-ink hover:bg-gray-100 min-h-10 min-w-10"
              title={t('header.copy_opds')}
            >
              {opdsCopied ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span className="text-green-600">{t('header.opds_copied')}</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span className="hidden lg:inline">{t('header.copy_opds')}</span>
                </>
              )}
            </button>

            {/* Language Selector - Desktop */}
            <div className='items-center justify-between hidden gap-2 lg:flex'>
              <Globe size={16} className="text-ink-light" />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="px-3 py-2 text-xs font-medium transition-all bg-white border rounded-lg cursor-pointer border-border text-ink hover:border-accent"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 transition-colors rounded-lg lg:hidden text-ink hover:bg-gray-100 min-h-10 min-w-10"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t lg:hidden border-border bg-paper animate-slide-in">
            <nav className="py-4 space-y-1 container-safe">
              <NavLink
                // to={{ pathname: '/', search: location.search }}
                to={`/?popular=true&lang=${i18n.language}`}
                className={mobileNavLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('header.catalog')}
              </NavLink>
              <NavLink
                to="/collections"
                className={mobileNavLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('header.collections')}
              </NavLink>
              <NavLink
                to="/about"
                className={mobileNavLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('header.about')}
              </NavLink>
            </nav>

            {/* Mobile Language Selector & OPDS Copy */}
            <div className="px-0 border-t border-border">
              <div className="py-4 space-y-3 container-safe">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-ink-light" />
                  <span className="text-sm font-medium text-ink-light">{t('header.language')}</span>
                </div>
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-medium border rounded-lg cursor-pointer bg-white text-ink border-border hover:border-accent transition-all"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
                <button
                  onClick={() => {
                    copyOpdsUrl();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center w-full gap-2 py-3 text-sm font-medium transition-all bg-gray-100 rounded-lg hover:bg-gray-200 text-ink"
                >
                  {opdsCopied ? (
                    <>
                      <Check size={16} className="text-green-600" />
                      <span className="text-green-600">{t('header.opds_copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>{t('header.copy_opds')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}