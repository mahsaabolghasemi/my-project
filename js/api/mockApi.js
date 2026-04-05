/**
 * Mock backend API for the bookstore.
 * Books with isDeleted === 1 are hidden from all listings (same rule as real API).
 */

const MOCK_BOOKS = [
  { id: '1', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 24.99, coverImage: 'https://placehold.co/400x600/4F46E5/FFFFFF?text=JS+Good+Parts', pdfUrl: '#', genre: 'Programming', description: 'Most programming languages contain good and bad parts, but JavaScript has more than its share of the bad. This book helps you learn all the beautiful, elegant, lightweight parts of JavaScript, including syntax, objects, functions, inheritance, arrays, regular expressions, methods, and style.', isDeleted: 0, stock: 12 },
  { id: '2', title: 'Clean Code', author: 'Robert C. Martin', price: 34.99, coverImage: 'https://placehold.co/400x600/059669/FFFFFF?text=Clean+Code', pdfUrl: '#', genre: 'Programming', description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. This book teaches you how to write clean code: code that is readable, maintainable, and follows best practices.', isDeleted: 0, stock: 5 },
  { id: '3', title: 'You Don\'t Know JS', author: 'Kyle Simpson', price: 29.99, coverImage: 'https://placehold.co/400x600/DC2626/FFFFFF?text=YDKJS', pdfUrl: '#', genre: 'Programming', description: 'A series of books diving deep into the core mechanisms of the JavaScript language. This book series covers JavaScript fundamentals, scope and closures, this and object prototypes, types and grammar, async and performance, and ES6 and beyond.', isDeleted: 0, stock: 8 },
  { id: '4', title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', price: 39.99, coverImage: 'https://placehold.co/400x600/7C3AED/FFFFFF?text=Pragmatic', pdfUrl: '#', genre: 'Programming', description: 'The Pragmatic Programmer cuts through the increasing specialization and technicalities of modern software development to examine the core process—taking a requirement and producing working, maintainable code that delights its users.', isDeleted: 0, stock: 3 },
  { id: '5', title: 'Design Patterns', author: 'Gang of Four', price: 44.99, coverImage: 'https://placehold.co/400x600/EA580C/FFFFFF?text=Design+Patterns', pdfUrl: '#', genre: 'Programming', description: 'Design Patterns: Elements of Reusable Object-Oriented Software is a software engineering book describing software design patterns. The book\'s authors are Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides, with a foreword by Grady Booch.', isDeleted: 0, stock: 6 },
  { id: '6', title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 0, coverImage: 'https://placehold.co/400x600/0891B2/FFFFFF?text=Eloquent+JS', pdfUrl: '#', genre: 'Programming', description: 'This is a book about JavaScript, programming, and the wonders of the digital. You can read it online here, or get your own paperback copy. Eloquent JavaScript dives deep into the JavaScript language to show you how to write beautiful, effective code.', isDeleted: 0, stock: 20 },
  { id: '99', title: '[حذف‌شده — نباید دیده شود]', author: '—', price: 1, coverImage: 'https://placehold.co/400x600/999/fff?text=deleted', pdfUrl: '#', genre: '—', description: 'Soft-deleted book for mock tests.', isDeleted: 1, stock: 0 },
];

function isVisibleBook(b) {
  return b && Number(b.isDeleted) !== 1;
}

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function visibleBooks() {
  return MOCK_BOOKS.filter(isVisibleBook);
}

function getBooks() {
  return delay().then(() => [...visibleBooks()]);
}

function searchBooks(query) {
  return delay().then(() => {
    const q = (query || '').toLowerCase().trim();
    const list = visibleBooks();
    if (!q) return [...list];
    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q)
    );
  });
}

function getBookById(id) {
  return delay().then(() => {
    const b = MOCK_BOOKS.find((x) => x.id === id) || null;
    if (!b || !isVisibleBook(b)) return null;
    return b;
  });
}

window.mockApi = { getBooks, searchBooks, getBookById };

(function useBookStoreApiWhenConfigured() {
  if (typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL || !window.bookStoreApi) return;
  window.mockApi = {
    getBooks: function () {
      return window.bookStoreApi.getBooks();
    },
    searchBooks: function (query) {
      return window.bookStoreApi.searchBooks(query);
    },
    getBookById: function (id) {
      return window.bookStoreApi.getBookById(id);
    },
  };
})();
