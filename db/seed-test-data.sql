-- Seed test data for E2E tests

-- Insert some test books
INSERT OR IGNORE INTO books (id, title, author, isbn, publishedYear, coverImageUrl, description, pageCount, publisher) VALUES 
('TEST001', 'Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', '9780439708180', 1997, 'https://covers.openlibrary.org/b/id/8459075-L.jpg', 'The first book in the Harry Potter series', 309, 'Scholastic'),
('TEST002', 'Lord of the Rings: The Fellowship of the Ring', 'J.R.R. Tolkien', '9780547928210', 1954, 'https://covers.openlibrary.org/b/id/8406786-L.jpg', 'The first book in the Lord of the Rings trilogy', 423, 'Houghton Mifflin'),
('TEST003', '1984', 'George Orwell', '9780451524935', 1949, 'https://covers.openlibrary.org/b/id/7222246-L.jpg', 'A dystopian social science fiction novel', 328, 'Signet Classic'),
('TEST004', 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 1925, 'https://covers.openlibrary.org/b/id/7899507-L.jpg', 'A novel about the American Dream', 180, 'Scribner'),
('TEST005', 'Python Programming', 'John Smith', '9781234567890', 2020, null, 'Learn Python programming', 500, 'Tech Books'),
('TEST006', 'JavaScript: The Good Parts', 'Douglas Crockford', '9780596517748', 2008, 'https://covers.openlibrary.org/b/id/7255135-L.jpg', 'A JavaScript book', 176, 'O''Reilly'),
('TEST007', 'Test Book', 'Test Author', '9780000000001', 2024, null, 'A test book for E2E tests', 100, 'Test Publisher');