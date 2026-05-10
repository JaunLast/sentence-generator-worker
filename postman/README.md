# Postman Collection for Sentence Generator API

This folder contains the Postman collection and environment files for testing the Sentence Generator API.

## Files

- `Sentence-Generator-API.postman_collection.json` - Main API collection with all endpoints and tests
- `Local.postman_environment.json` - Environment variables for local development
- `Production.postman_environment.json` - Environment variables for production

## Setup

1. Import the collection into Postman:
   - Open Postman
   - Click "Import" button
   - Select `Sentence-Generator-API.postman_collection.json`

2. Import the environment:
   - Click "Import" button
   - Select the appropriate environment file
   - Select the environment from the dropdown in the top right

## Running Tests

### Individual Request
1. Select a request from the collection
2. Click "Send"
3. View the test results in the "Test Results" tab

### Collection Runner
1. Click on the collection name
2. Click "Run" button
3. Select the environment
4. Click "Run Sentence Generator API"
5. View the test results summary

### Newman (CLI)
Run the collection from the command line:

```bash
npm install -g newman
newman run Sentence-Generator-API.postman_collection.json -e Local.postman_environment.json
```

## Endpoints

### GET /api/health
Health check endpoint to verify the API is running.

**Tests:**
- Status code is 200
- Response has status field
- Response has timestamp

### GET /api/categories
Retrieve all word categories.

**Tests:**
- Status code is 200
- Response has success field
- Response contains categories data
- Categories have required fields

### GET /api/words
Retrieve all words or filter by category.

**Query Parameters:**
- `category_id` (optional): Filter by category ID

**Tests:**
- Status code is 200
- Response has success field
- Response contains words data
- Words have required fields

### POST /api/generate-sentence
Generate a random sentence based on selected parts of speech.

**Request Body:**
```json
{
  "includeNoun": true,
  "includeVerb": true,
  "includeAdjective": false,
  "includeAdverb": false
}
```

**Tests (Happy Path):**
- Status code is 200
- Response has success field
- Response contains sentence
- Sentence starts with capital letter
- Sentence ends with period

**Tests (Sad Path):**
- Status code is 400
- Response indicates failure
- Response contains error message

## Environment Variables

### Local Environment
- `baseUrl`: `http://localhost:8787`

### Production Environment
- `baseUrl`: `https://sentence-generator-worker.YOUR_SUBDOMAIN.workers.dev`

## Test Coverage

The collection includes tests for:
- ✅ Happy Path: Valid sentence generation
- ✅ Sad Path: Error handling for empty database/no selection
- ✅ Response structure validation
- ✅ Data type validation
- ✅ Business logic validation (capitalization, punctuation)

## JSON Schema Validation

### What is JSON Schema Validation?

JSON Schema validation ensures that API responses match a predefined structure. This catches breaking changes early and ensures consistency across your API.

### New Collection with Schema Validation

A new enhanced collection is available: `sentence-generator-api-with-schema-validation.postman_collection.json`

This collection includes:
- **Strict JSON Schema validation** for all endpoints
- **Response time assertions** (< 500ms)
- **Content-Type header validation**
- **Business logic validation** (e.g., sentence format, data ranges)
- **Error response schema validation**

### Schema Validation Examples

**Health Check Schema:**
```javascript
{
  type: 'object',
  required: ['status', 'timestamp'],
  properties: {
    status: { type: 'string', enum: ['healthy'] },
    timestamp: { type: 'string', format: 'date-time' }
  },
  additionalProperties: false
}
```

**Categories Schema:**
```javascript
{
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'description', 'created_at'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          name: { type: 'string', enum: ['noun', 'verb', 'adjective', 'adverb'] },
          description: { type: 'string' },
          created_at: { type: 'string' }
        }
      }
    }
  }
}
```

**Generate Sentence Success Schema:**
```javascript
{
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      required: ['sentence'],
      properties: {
        sentence: { 
          type: 'string',
          minLength: 1,
          pattern: '^[A-Z].*\\.$'  // Must start with capital, end with period
        }
      }
    }
  }
}
```

**Error Response Schema:**
```javascript
{
  type: 'object',
  required: ['success', 'error'],
  properties: {
    success: { type: 'boolean', enum: [false] },
    error: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
}
```

### How to Use Schema Validation in Postman

1. **Import the enhanced collection:**
   ```
   sentence-generator-api-with-schema-validation.postman_collection.json
   ```

2. **Run a request** - Schema validation runs automatically in the Tests tab

3. **View results** - Failed schema validation shows exactly what's wrong:
   ```
   AssertionError: expected response to have valid JSON schema
   - data.sentence: should match pattern "^[A-Z].*\.$"
   ```

### Benefits of Schema Validation

- **Catch breaking changes** before they reach production
- **Ensure API consistency** across all endpoints
- **Document expected responses** in executable tests
- **Prevent regression** when refactoring
- **Validate data types** (string, integer, boolean, etc.)
- **Enforce business rules** (min/max values, patterns, enums)

## Continuous Integration

This collection can be integrated into CI/CD pipelines using Newman:

```yaml
- name: Run API Tests
  run: |
    npm install -g newman
    newman run postman/sentence-generator-api-with-schema-validation.postman_collection.json \
      -e postman/Production.postman_environment.json \
      --reporters cli,json \
      --reporter-json-export results.json
```

### CI/CD Best Practices

1. **Run tests on every PR** to catch issues early
2. **Use both collections**: Basic tests for smoke testing, schema validation for comprehensive testing
3. **Set up alerts** when tests fail in production
4. **Version your collections** alongside your API code
