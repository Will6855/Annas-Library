import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';
import Header from './components/Header';
import BookModal from './components/BookModal';
import Home from './pages/Home';
import Collections from './pages/Collections';
import About from './pages/About';
import { Category, ContentType, Language, Book } from './types';

function App() {
  const { t, i18n } = useTranslation();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Load persisted language
  useEffect(() => {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  // Fetch metadata once
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/content-types').then(r => r.json()),
      fetch('/api/languages').then(r => r.json())
    ]).then(([cats, types, langs]) => {
      setCategories(cats.data || []);
      setContentTypes(types.data || []);
      setLanguages(langs.data || []);
    }).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />

      <main className="flex-1 w-full px-4 py-8 mx-auto md:px-6 md:py-12 max-w-7xl">
        <Routes>
          <Route path="/" element={
            <Home 
              categories={categories}
              contentTypes={contentTypes}
              languages={languages}
              setSelectedBook={setSelectedBook}
            />
          } />

          <Route path="/collections" element={
            <Collections categories={categories} />
          } />

          <Route path="/about" element={
            <About />
          } />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="py-8 mt-auto border-t border-border bg-white/50">
        <div className="px-6 mx-auto font-mono text-xs text-center max-w-7xl text-ink-light">
           {t('footer.text')}
        </div>
      </footer>
      
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}

export default App;
