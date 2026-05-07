# Sentence Generator Worker

Cloudflare Worker backend API for the Sentence Generator application.

## Tech Stack

- Cloudflare Workers
- TypeScript
- Cloudflare D1 (SQLite)
- Wrangler CLI

## Repository

**Backend Repository:** sentence-generator-worker  
**Frontend Repository:** sentence-generator

## Setup

### Prerequisites

- Node.js 18+ (or use npx for wrangler commands)
- Cloudflare account
- Wrangler CLI

### Installation

```bash
npm install
```

### Database Setup

1. Create D1 database:
```bash
npx wrangler d1 create sentence-generator-db
```

2. Update `wrangler.toml` with the database_id from the output

3. Run migrations locally:
```bash
npm run db:migrate:local
```

4. Seed the database locally:
```bash
npm run db:seed:local
```

### Development

Run the worker locally:
```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## API Endpoints

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/categories
Get all word categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "noun",
      "description": "Person, place, or thing"
    }
  ]
}
```

### GET /api/words?category_id=1
Get words, optionally filtered by category.

**Query Parameters:**
- `category_id` (optional): Filter by category ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "word": "cat",
      "category_id": 1
    }
  ]
}
```

### POST /api/generate-sentence
Generate a random sentence based on selected parts of speech.

**Request Body:**
```json
{
  "includeNoun": true,
  "includeVerb": true,
  "includeAdjective": true,
  "includeAdverb": false
}
```

**Response (Happy Path):**
```json
{
  "success": true,
  "data": {
    "sentence": "Happy cat quickly runs."
  }
}
```

**Error Response (Sad Path):**
```json
{
  "success": false,
  "error": "Unable to generate sentence. Database may be empty."
}
```

## Database Schema

See `migrations/0001_create_tables.sql` for the complete schema.

### Categories Table
- `id`: Primary key
- `name`: Category name (noun, verb, adjective, adverb)
- `description`: Category description
- `created_at`: Timestamp

### Words Table
- `id`: Primary key
- `word`: The word content
- `category_id`: Foreign key to Categories
- `created_at`: Timestamp

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test:coverage
```

## Deployment

### Production

1. Run migrations on production database:
```bash
npx wrangler d1 migrations apply sentence-generator-db --remote
```

2. Seed production database:
```bash
npm run db:seed
```

3. Deploy worker:
```bash
npm run deploy
```

### Staging

Deploy to staging environment:
```bash
npx wrangler deploy --env staging
```

## Environment Variables

No environment variables required. Database binding is configured in `wrangler.toml`.

## Security

- CORS enabled for all origins (configure for production)
- No hardcoded connection strings
- Database binding via Cloudflare managed identities
- All endpoints use TypeScript strict mode

## CORS Configuration

The API allows cross-origin requests from any origin. For production, update the CORS headers in `src/index.ts` to restrict to your frontend domain:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-frontend-domain.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```
