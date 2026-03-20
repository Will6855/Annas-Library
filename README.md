# Anna's Library

A modern OPDS (Open Publication Distribution System) server powered by Anna's Archive, providing access to millions of books through a standardized catalog format. This server exposes Anna's Archive's vast collection via OPDS feeds that can be consumed by e-reader applications and also includes a beautiful web interface for browsing.

## Features

- 📚 **OPDS 1.0/2.0 Compatible**: Standard OPDS feeds for e-reader apps
- 🔍 **Advanced Search**: Search by title, author, language, content type, and category
- 🌍 **Multi-language Support**: English and French interfaces
- 📖 **Popular Books**: Browse trending books by language
- 🎨 **Modern Web Client**: Beautiful React-based web interface
- 🔗 **Direct Downloads**: Resolves and redirects to actual download links
- 📱 **E-reader Compatible**: Works with Readest, Moon+ Reader, FBReader, Aldiko, KOReader, ReadEra, and more

## Todo

- [ ] Add support for other languages
- [ ] Add book thickness based on page count
- [ ] Add user accounts
- [ ] Add book recommendations
- [ ] Add book rating

## Architecture

This project consists of two main components:

1. **Server** (`server.js`): Express.js server that:
   - Generates OPDS XML feeds
   - Scrapes and searches Anna's Archive
   - Provides REST API endpoints
   - Serves the React client

2. **Client** (`client/`): React + TypeScript web application with:
   - Modern UI built with Tailwind CSS
   - Internationalization (i18n) support
   - Book browsing and search interface
   - Category and filter management

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd opds
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

4. Build the client:
```bash
cd client
npm run build
cd ..
```

## Usage

### Development Mode

Run the server in development mode with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified by the `PORT` environment variable).

### Production Mode

1. Build the client first:
```bash
cd client
npm run build
cd ..
```

2. Start the server:
```bash
npm start
```

### Environment Variables

- `PORT`: Server port (default: 3000)

## API Endpoints

### OPDS Feeds

- `GET /opds` - Root OPDS catalog
- `GET /opds/search?q=query&lang=en&content=book_fiction&category=1&page=1` - Search books
- `GET /opds/:lang(en|fr)/popular?page=1` - Popular books by language
- `GET /opds/:lang(en|fr)/:contentType` - Books by content type
- `GET /opds/:lang(en|fr)/:contentType/:category` - Books by category
- `GET /opensearch.xml` - OpenSearch description

### REST API (JSON)

- `GET /api/books?q=query&lang=en&content=book_fiction&category=1&page=1` - Search books
- `GET /api/books/:md5` - Get book details
- `GET /api/popular/:lang?page=1` - Get popular books
- `GET /api/categories` - Get all categories
- `GET /api/content-types` - Get all content types
- `GET /api/languages` - Get all languages

### Downloads

- `GET /download/:md5` - Download a book (redirects to actual download link)

## Using with E-reader Apps

Add the following URL to your e-reader app:

```
http://your-server:3000/opds
```

### Supported Apps

- Readest
- Moon+ Reader
- FBReader
- Aldiko
- KOReader
- ReadEra
- And any other OPDS-compatible reader

## Project Structure

```
opds/
├── client/              # React web client
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── locales/     # Translation files
│   │   └── utils/       # Utility functions
│   └── package.json
├── lib/                 # Server libraries
│   ├── api.js          # REST API handlers
│   ├── catalog.js      # OPDS feed generation
│   ├── scraper.js      # Anna's Archive scraping
│   ├── translations.js # Translation utilities
│   └── categories.json # Category definitions
├── server.js           # Express server
└── package.json
```

## Technologies

### Server
- Express.js - Web framework
- Cheerio - HTML parsing

### Client
- React 19 - UI framework
- TypeScript - Type safety
- Vite - Build tool
- Tailwind CSS - Styling
- React Router - Routing
- i18next - Internationalization
- Lucide React - Icons

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

This project is for educational purposes. Please respect copyright laws and the terms of service of Anna's Archive when using this software.

