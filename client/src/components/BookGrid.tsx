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
  size?: string;
}

interface BookGridProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

export default function BookGrid({ books, onBookClick }: BookGridProps) {
  return (
    <div className="grid grid-cols-3 landscape:grid-cols-6 lg:landscape:grid-cols-6 xl:landscape:grid-cols-7 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-8 lg:gap-x-6 lg:gap-y-10 pb-12">
      {books.map((book) => (
        <BookCard 
          key={book.id + book.md5}
          book={book} 
          onClick={onBookClick} 
        />
      ))}
    </div>
  );
}
