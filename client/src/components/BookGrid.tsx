import BookCard from './BookCard';

interface Book {
  id: string;
  md5: string;
  title: string;
  author?: string;
  coverUrl?: string;
  year?: string;
  languages?: string;
  format?: string;
  filesize?: string;
}

interface BookGridProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

export default function BookGrid({ books, onBookClick }: BookGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8 pb-12">
      {books.map((book) => (
        <BookCard 
          key={book.id + book.md5} // book.id might not be unique if search results mix sources, using MD5 composite if available in original type, but interface here says id. Let's stick to id or index.
          book={book} 
          onClick={onBookClick} 
        />
      ))}
    </div>
  );
}
