-- Migration: Convert to single-user system
-- Created: 2025-01-06

-- Drop user-related tables
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS user_book_tags;
DROP TABLE IF EXISTS user_books;
DROP TABLE IF EXISTS users;

-- Recreate books table (unchanged)
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  page_count INTEGER,
  published_date TEXT,
  publisher TEXT,
  language TEXT DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create simplified book_entries table (no user_id)
CREATE TABLE IF NOT EXISTS book_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('want_to_read', 'reading', 'read')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  start_date DATE,
  finish_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id),
  UNIQUE(book_id)
);

-- Tags table (unchanged)
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Simplified book tags table
CREATE TABLE IF NOT EXISTS book_tags (
  book_entry_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_entry_id) REFERENCES book_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (book_entry_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_entries_status ON book_entries(status);
CREATE INDEX IF NOT EXISTS idx_book_entries_rating ON book_entries(rating);
CREATE INDEX IF NOT EXISTS idx_book_entries_book_id ON book_entries(book_id);