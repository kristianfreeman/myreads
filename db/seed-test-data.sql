-- Seed test data for E2E tests

-- Insert some test books
INSERT OR IGNORE INTO books (id, title, author, description, cover_image_url, page_count, published_date, publisher) VALUES 
('TEST001', 'Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', 'The first book in the Harry Potter series', 'https://covers.openlibrary.org/b/id/8459075-L.jpg', 309, '1997', 'Scholastic'),
('TEST002', 'Lord of the Rings: The Fellowship of the Ring', 'J.R.R. Tolkien', 'The first book in the Lord of the Rings trilogy', 'https://covers.openlibrary.org/b/id/8406786-L.jpg', 423, '1954', 'Houghton Mifflin'),
('TEST003', '1984', 'George Orwell', 'A dystopian social science fiction novel', 'https://covers.openlibrary.org/b/id/7222246-L.jpg', 328, '1949', 'Signet Classic'),
('TEST004', 'The Great Gatsby', 'F. Scott Fitzgerald', 'A novel about the American Dream', 'https://covers.openlibrary.org/b/id/7899507-L.jpg', 180, '1925', 'Scribner'),
('TEST005', 'Python Programming', 'John Smith', 'Learn Python programming', null, 500, '2020', 'Tech Books'),
('TEST006', 'JavaScript: The Good Parts', 'Douglas Crockford', 'A JavaScript book', 'https://covers.openlibrary.org/b/id/7255135-L.jpg', 176, '2008', 'O''Reilly'),
('TEST007', 'Test Book', 'Test Author', 'A test book for E2E tests', null, 100, '2024', 'Test Publisher');

-- Insert some book entries for testing
INSERT OR IGNORE INTO book_entries (book_id, status, rating, review, start_date, finish_date) VALUES
('TEST001', 'read', 5, 'Amazing book! A magical journey that captivated me from start to finish.', '2024-01-01', '2024-01-15'),
('TEST002', 'reading', null, null, '2024-02-01', null),
('TEST003', 'read', 4, 'A chilling dystopian masterpiece.', '2024-01-20', '2024-01-25'),
('TEST004', 'want_to_read', null, null, null, null);

-- Insert some tags
INSERT OR IGNORE INTO tags (name) VALUES 
('fantasy'),
('classic'),
('dystopian'),
('fiction'),
('programming');

-- Associate tags with book entries (need to get the IDs first, so using a subquery)
INSERT OR IGNORE INTO book_tags (book_entry_id, tag_id) 
SELECT 
  (SELECT id FROM book_entries WHERE book_id = 'TEST001'),
  (SELECT id FROM tags WHERE name = 'fantasy')
UNION ALL
SELECT 
  (SELECT id FROM book_entries WHERE book_id = 'TEST001'),
  (SELECT id FROM tags WHERE name = 'fiction')
UNION ALL
SELECT 
  (SELECT id FROM book_entries WHERE book_id = 'TEST003'),
  (SELECT id FROM tags WHERE name = 'dystopian')
UNION ALL
SELECT 
  (SELECT id FROM book_entries WHERE book_id = 'TEST003'),
  (SELECT id FROM tags WHERE name = 'classic');