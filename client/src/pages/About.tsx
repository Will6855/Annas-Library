import React from 'react';
import { Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <div className="mb-12 text-center md:mb-16">
        <h1 className="text-ink mb-4 font-serif text-3xl font-bold md:mb-6 md:text-5xl">
          {t('about.title')}
        </h1>
        <div className="bg-accent mx-auto h-1 w-12 rounded-full md:w-16"></div>
      </div>

      <div className="space-y-8 md:space-y-12">
        <p className="text-ink-light mx-auto mb-8 max-w-2xl text-center font-serif text-base leading-relaxed md:mb-12 md:text-lg">
          {t('about.description')}
        </p>

        <div className="border-border hover:shadow-md rounded-lg border bg-white p-6 shadow-sm transition-shadow md:p-8">
          <h2 className="text-ink mb-4 flex items-center gap-3 font-serif text-2xl font-bold md:mb-6 md:text-3xl">
            <Archive size={28} className="text-accent shrink-0" />{' '}
            {t('about.mission_title')}
          </h2>
          <p className="text-ink-light font-serif text-base leading-relaxed md:text-lg">
            {t('about.mission_text')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div className="border-border hover:shadow-md rounded-lg border bg-gradient-to-br from-white to-gray-50 p-6 text-center transition-all md:p-8">
            <div className="text-accent mb-3 font-serif text-3xl font-bold md:text-4xl">
              60M+
            </div>
            <div className="text-ink-light font-mono text-xs font-semibold tracking-widest uppercase md:text-sm">
              {t('about.stats_books')}
            </div>
          </div>
          <div className="border-border hover:shadow-md rounded-lg border bg-gradient-to-br from-white to-gray-50 p-6 text-center transition-all md:p-8">
            <div className="text-accent mb-3 font-serif text-3xl font-bold md:text-4xl">
              1PB
            </div>
            <div className="text-ink-light font-mono text-xs font-semibold tracking-widest uppercase md:text-sm">
              {t('about.stats_data')}
            </div>
          </div>
          <div className="border-border hover:shadow-md rounded-lg border bg-gradient-to-br from-white to-gray-50 p-6 text-center transition-all md:p-8">
            <div className="text-accent mb-3 font-serif text-3xl font-bold md:text-4xl">
              100%
            </div>
            <div className="text-ink-light font-mono text-xs font-semibold tracking-widest uppercase md:text-sm">
              {t('about.stats_free')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
