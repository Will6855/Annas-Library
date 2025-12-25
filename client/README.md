# OPDS Client

A modern, responsive web client for browsing and searching books from the OPDS server. Built with React, TypeScript, and Tailwind CSS, featuring a beautiful book-focused interface with internationalization support.

## Features

- 🎨 **Modern UI**: Clean, book-inspired design with smooth animations
- 🌍 **Internationalization**: English and French language support
- 🔍 **Advanced Search**: Search with filters for language, content type, and category
- ⭐ **Popular Books**: Browse trending books by language
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🎯 **Category Browsing**: Explore books by category and subcategory
- 📄 **Pagination**: Navigate through large result sets
- 🔖 **Book Details**: View detailed information about each book

## Technologies

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router** - Client-side routing
- **i18next** - Internationalization framework
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The client will be available at `http://localhost:5173` (or the port Vite assigns).

### Building for Production

Build the client for production:
```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be served by the Express server.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── BookCard.tsx      # Individual book card
│   │   ├── BookGrid.tsx      # Grid of books
│   │   ├── BookModal.tsx     # Book details modal
│   │   ├── Header.tsx        # App header/navigation
│   │   ├── Pagination.tsx    # Pagination controls
│   │   └── SearchBar.tsx     # Search input
│   ├── locales/         # Translation files
│   │   ├── en.json      # English translations
│   │   ├── fr.json      # French translations
│   │   └── _categories_*.json # Category translations
│   ├── utils/          # Utility functions
│   │   └── translations.ts   # Translation helpers
│   ├── App.tsx          # Main app component
│   ├── App.css          # App styles
│   ├── i18n.ts          # i18n configuration
│   ├── index.css        # Global styles
│   └── main.tsx         # Entry point
├── index.html           # HTML template
├── package.json
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
└── eslint.config.js     # ESLint configuration
```

## Available Scripts

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Search & Filters

- **Text Search**: Search books by title or author
- **Language Filter**: Filter by book language
- **Content Type Filter**: Filter by format (fiction, nonfiction, magazines, etc.)
- **Category Filter**: Browse by category with subcategory support
- **Popular Books**: View trending books by language

### Internationalization

The client supports multiple languages:
- English (en) - Default
- French (fr)

Language preference is saved in localStorage and persists across sessions.

### Responsive Design

The interface adapts to different screen sizes:
- **Desktop**: Full-width layout with optimal spacing
- **Tablet**: Adjusted grid columns and spacing
- **Mobile**: Single column layout with touch-friendly controls

## API Integration

The client communicates with the server's REST API:

- `GET /api/books` - Search books
- `GET /api/popular/:lang` - Get popular books
- `GET /api/categories` - Get categories
- `GET /api/content-types` - Get content types
- `GET /api/languages` - Get languages
- `GET /api/books/:md5` - Get book details

## Styling

The project uses Tailwind CSS 4 with a custom color palette:
- **Paper**: Light background color
- **Ink**: Text color
- **Accent**: Primary accent color
- **Border**: Border color

Custom animations and transitions provide a smooth user experience.

## Development

### Adding New Translations

1. Add translations to `src/locales/en.json` and `src/locales/fr.json`
2. Use the translation key in components with `t('key')` from `useTranslation()`

### Adding New Components

Components are located in `src/components/`. Follow the existing patterns:
- Use TypeScript interfaces for props
- Use Tailwind CSS for styling
- Support internationalization where applicable

### Code Style

The project uses ESLint for code quality. Run `npm run lint` to check for issues.

## License

MIT
