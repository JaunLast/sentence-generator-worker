# Backend Setup Instructions

Quick setup guide for the Sentence Generator Worker (Backend).

## Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI (installed via npm)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
npx wrangler d1 create sentence-generator-db
```

Copy the `database_id` from the output.

### 3. Update Configuration

Edit `wrangler.toml` and replace the `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sentence-generator-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 4. Run Migrations

```bash
npm run db:migrate:local
```

### 5. Seed Database

```bash
npm run db:seed:local
```

### 6. Start Development Server

```bash
npm run dev
```

API will be available at `http://localhost:8787`

## Testing

### Using Postman

1. Import `postman/Sentence-Generator-API.postman_collection.json`
2. Import `postman/Local.postman_environment.json`
3. Run the collection

### Using cURL

```bash
# Health check
curl http://localhost:8787/api/health

# Get categories
curl http://localhost:8787/api/categories

# Generate sentence
curl -X POST http://localhost:8787/api/generate-sentence \
  -H "Content-Type: application/json" \
  -d '{"includeNoun":true,"includeVerb":true,"includeAdjective":true,"includeAdverb":false}'
```

## Deployment

### Production Deployment

1. Run migrations on remote database:
   ```bash
   npx wrangler d1 migrations apply sentence-generator-db --remote
   ```

2. Seed remote database:
   ```bash
   npx wrangler d1 execute sentence-generator-db --remote --file=./migrations/seed.sql
   ```

3. Deploy worker:
   ```bash
   npm run deploy
   ```

### Staging Deployment

```bash
npx wrangler deploy --env staging
```

## GitHub Actions

The repository includes automated CI/CD workflows. Configure these secrets in GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SONAR_TOKEN` (optional)
- `SONAR_HOST_URL` (optional)

## Troubleshooting

**Issue:** TypeScript errors about missing types
**Solution:** Run `npm install` to install `@cloudflare/workers-types`

**Issue:** Database not found
**Solution:** Ensure you've created the D1 database and updated `wrangler.toml`

**Issue:** Empty responses from API
**Solution:** Run the seed script: `npm run db:seed:local`
