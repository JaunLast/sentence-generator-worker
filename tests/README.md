# Migration Integrity Tests

This directory contains unit tests to verify the integrity of database migrations.

## Test Coverage

### Schema Migration Tests (`migrations.test.ts`)

**Categories Table:**
- ✅ Table creation with IF NOT EXISTS
- ✅ Primary key (id) with AUTOINCREMENT
- ✅ Unique constraint on name
- ✅ Description field
- ✅ Timestamp field with default value

**Words Table:**
- ✅ Table creation with IF NOT EXISTS
- ✅ Primary key (id) with AUTOINCREMENT
- ✅ Word field (NOT NULL)
- ✅ Foreign key to Categories
- ✅ CASCADE delete behavior
- ✅ Timestamp field with default value

**Indexes:**
- ✅ Index on Words.category_id
- ✅ Index on Categories.name

**Seed Data:**
- ✅ INSERT OR IGNORE for idempotency
- ✅ All 4 categories present (noun, verb, adjective, adverb)
- ✅ Category descriptions
- ✅ At least 10 words per category
- ✅ Valid category_id references (1-4)
- ✅ No duplicate category names

**SQL Syntax:**
- ✅ No syntax errors
- ✅ Proper statement termination
- ✅ Consistent quote style
- ✅ Migration headers and comments

## Running Tests

### Run all tests:
```bash
npm test
```

### Run with coverage:
```bash
npm run test:coverage
```

### Run in watch mode:
```bash
npm test -- --watch
```

### Run specific test file:
```bash
npm test migrations.test.ts
```

## Test Results

All tests verify that:
1. Migration files are syntactically correct
2. Schema matches ERD design
3. Foreign key relationships are properly defined
4. Indexes are created for performance
5. Seed data is complete and valid
6. Migrations are idempotent (safe to run multiple times)

## What These Tests Validate

### Data Integrity
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate categories
- NOT NULL constraints ensure required fields

### Migration Safety
- IF NOT EXISTS prevents errors on re-run
- INSERT OR IGNORE allows safe re-seeding
- ON DELETE CASCADE maintains consistency

### Performance
- Indexes on frequently queried columns
- Proper data types for efficient storage

### Completeness
- All required categories present
- Sufficient word variety (60+ words)
- Proper categorization (nouns, verbs, adjectives, adverbs)

## Continuous Integration

These tests should run:
- Before every deployment
- On every pull request
- As part of CI/CD pipeline

## Adding New Tests

When adding new migrations:
1. Create migration file in `migrations/` folder
2. Add corresponding tests in `tests/migrations.test.ts`
3. Verify schema changes don't break existing tests
4. Run full test suite before committing

## Test Framework

- **Framework:** Vitest
- **Language:** TypeScript
- **Coverage:** V8 provider
- **Environment:** Node.js

---

**Last Updated:** 2026-05-07
