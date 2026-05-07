import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Migration Integrity Tests', () => {
  let createTablesSql: string
  let seedSql: string

  beforeAll(() => {
    createTablesSql = readFileSync(
      join(__dirname, '../migrations/0001_create_tables.sql'),
      'utf-8'
    )
    seedSql = readFileSync(
      join(__dirname, '../migrations/seed.sql'),
      'utf-8'
    )
  })

  describe('Schema Migration (0001_create_tables.sql)', () => {
    it('should contain Categories table creation', () => {
      expect(createTablesSql).toContain('CREATE TABLE IF NOT EXISTS Categories')
    })

    it('should contain Words table creation', () => {
      expect(createTablesSql).toContain('CREATE TABLE IF NOT EXISTS Words')
    })

    it('should define Categories table with correct columns', () => {
      expect(createTablesSql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT')
      expect(createTablesSql).toContain('name TEXT NOT NULL UNIQUE')
      expect(createTablesSql).toContain('description TEXT')
      expect(createTablesSql).toContain('created_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    })

    it('should define Words table with correct columns', () => {
      expect(createTablesSql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT')
      expect(createTablesSql).toContain('word TEXT NOT NULL')
      expect(createTablesSql).toContain('category_id INTEGER NOT NULL')
      expect(createTablesSql).toContain('created_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    })

    it('should define foreign key constraint on Words table', () => {
      expect(createTablesSql).toContain('FOREIGN KEY (category_id) REFERENCES Categories(id)')
      expect(createTablesSql).toContain('ON DELETE CASCADE')
    })

    it('should create index on Words.category_id', () => {
      expect(createTablesSql).toContain('CREATE INDEX IF NOT EXISTS idx_words_category ON Words(category_id)')
    })

    it('should create index on Categories.name', () => {
      expect(createTablesSql).toContain('CREATE INDEX IF NOT EXISTS idx_categories_name ON Categories(name)')
    })

    it('should use IF NOT EXISTS for idempotency', () => {
      const createTableMatches = createTablesSql.match(/CREATE TABLE IF NOT EXISTS/g)
      expect(createTableMatches).toBeTruthy()
      expect(createTableMatches!.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Seed Data Migration (seed.sql)', () => {
    it('should use INSERT OR IGNORE for idempotency', () => {
      expect(seedSql).toContain('INSERT OR IGNORE INTO Categories')
      expect(seedSql).toContain('INSERT OR IGNORE INTO Words')
    })

    it('should insert exactly 4 categories', () => {
      const categoryInserts = seedSql.match(/\('(noun|verb|adjective|adverb)'/g)
      expect(categoryInserts).toBeTruthy()
      expect(categoryInserts!.length).toBe(4)
    })

    it('should insert all required categories', () => {
      expect(seedSql).toContain("'noun'")
      expect(seedSql).toContain("'verb'")
      expect(seedSql).toContain("'adjective'")
      expect(seedSql).toContain("'adverb'")
    })

    it('should have category descriptions', () => {
      expect(seedSql).toContain('Person, place, or thing')
      expect(seedSql).toContain('Action or state of being')
      expect(seedSql).toContain('Describes a noun')
      expect(seedSql).toContain('Describes a verb or adjective')
    })

    it('should insert words with valid category_id references', () => {
      // Check that category_id values are 1, 2, 3, or 4
      const categoryIdMatches = seedSql.match(/,\s*[1-4]\)/g)
      expect(categoryIdMatches).toBeTruthy()
      expect(categoryIdMatches!.length).toBeGreaterThan(0)
    })

    it('should insert nouns (category_id = 1)', () => {
      expect(seedSql).toContain("'cat', 1")
      expect(seedSql).toContain("'dog', 1")
      expect(seedSql).toContain("'house', 1")
    })

    it('should insert verbs (category_id = 2)', () => {
      expect(seedSql).toContain("'run', 2")
      expect(seedSql).toContain("'jump', 2")
      expect(seedSql).toContain("'sleep', 2")
    })

    it('should insert adjectives (category_id = 3)', () => {
      expect(seedSql).toContain("'happy', 3")
      expect(seedSql).toContain("'sad', 3")
      expect(seedSql).toContain("'quick', 3")
    })

    it('should insert adverbs (category_id = 4)', () => {
      expect(seedSql).toContain("'quickly', 4")
      expect(seedSql).toContain("'slowly', 4")
      expect(seedSql).toContain("'happily', 4")
    })

    it('should have at least 10 words per category', () => {
      // Count words for each category
      const nounsCount = (seedSql.match(/'\w+',\s*1\)/g) || []).length
      const verbsCount = (seedSql.match(/'\w+',\s*2\)/g) || []).length
      const adjectivesCount = (seedSql.match(/'\w+',\s*3\)/g) || []).length
      const adverbsCount = (seedSql.match(/'\w+',\s*4\)/g) || []).length

      expect(nounsCount).toBeGreaterThanOrEqual(10)
      expect(verbsCount).toBeGreaterThanOrEqual(10)
      expect(adjectivesCount).toBeGreaterThanOrEqual(10)
      expect(adverbsCount).toBeGreaterThanOrEqual(10)
    })
  })

  describe('SQL Syntax Validation', () => {
    it('should not contain syntax errors in schema migration', () => {
      // Check for common SQL syntax issues
      expect(createTablesSql).not.toContain(';;')
      expect(createTablesSql).not.toContain('CREAT TABLE') // typo
      expect(createTablesSql).not.toContain('PRIMRY KEY') // typo
    })

    it('should not contain syntax errors in seed migration', () => {
      expect(seedSql).not.toContain(';;')
      expect(seedSql).not.toContain('INSRT') // typo
      expect(seedSql).not.toContain('VLUES') // typo
    })

    it('should have proper SQL statement termination', () => {
      // Each CREATE/INSERT statement should end with semicolon
      const createStatements = createTablesSql.match(/CREATE\s+(TABLE|INDEX)/gi)
      const semicolons = createTablesSql.match(/;/g)
      
      expect(createStatements).toBeTruthy()
      expect(semicolons).toBeTruthy()
      expect(semicolons!.length).toBeGreaterThanOrEqual(createStatements!.length)
    })
  })

  describe('Data Integrity Rules', () => {
    it('should not have duplicate category names in seed data', () => {
      const categoryNames = seedSql.match(/\('(noun|verb|adjective|adverb)'/g)
      const uniqueCategories = new Set(categoryNames)
      expect(categoryNames!.length).toBe(uniqueCategories.size)
    })

    it('should not have empty strings in seed data', () => {
      expect(seedSql).not.toContain("''")
      expect(seedSql).not.toContain('""')
    })

    it('should use consistent quote style', () => {
      // Should use single quotes for SQL strings
      const singleQuoteCount = (seedSql.match(/'/g) || []).length
      expect(singleQuoteCount).toBeGreaterThan(0)
    })
  })

  describe('Migration File Structure', () => {
    it('should have migration comment header in schema file', () => {
      expect(createTablesSql).toContain('-- Migration:')
    })

    it('should have descriptive comment in seed file', () => {
      expect(seedSql).toContain('-- Seed data')
    })

    it('should not be empty files', () => {
      expect(createTablesSql.trim().length).toBeGreaterThan(0)
      expect(seedSql.trim().length).toBeGreaterThan(0)
    })
  })
})
