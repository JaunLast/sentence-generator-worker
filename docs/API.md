# API Documentation

Base URL: `https://sentence-generator-worker.jaun98last.workers.dev`

## Endpoints

### Health Check

**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-07T20:32:00.000Z"
}
```

---

### Get Categories

**GET** `/api/categories`

Get all word categories (noun, verb, adjective, adverb).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "noun",
      "description": "Person, place, or thing",
      "created_at": "2026-05-05 19:20:52"
    },
    {
      "id": 2,
      "name": "verb",
      "description": "Action or state of being",
      "created_at": "2026-05-05 19:20:52"
    },
    {
      "id": 3,
      "name": "adjective",
      "description": "Describes a noun",
      "created_at": "2026-05-05 19:20:52"
    },
    {
      "id": 4,
      "name": "adverb",
      "description": "Describes a verb or adjective",
      "created_at": "2026-05-05 19:20:52"
    }
  ]
}
```

---

### Get Words

**GET** `/api/words`

Get all words, optionally filtered by category.

**Query Parameters:**
- `category_id` (optional): Filter by category ID (1-4)

**Examples:**

Get all words:
```
GET /api/words
```

Get only nouns:
```
GET /api/words?category_id=1
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "word": "cat",
      "category_id": 1,
      "created_at": "2026-05-05 19:20:52"
    },
    {
      "id": 2,
      "word": "dog",
      "category_id": 1,
      "created_at": "2026-05-05 19:20:52"
    }
  ]
}
```

---

### Get Statistics

**GET** `/api/stats`

Get word count statistics by category.

**Response:**
```json
{
  "success": true,
  "data": {
    "noun": 15,
    "verb": 15,
    "adjective": 15,
    "adverb": 15
  }
}
```

---

### Generate Sentence

**POST** `/api/generate-sentence`

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

**Parameters:**
- `includeNoun` (boolean, optional): Include a noun in the sentence
- `includeVerb` (boolean, optional): Include a verb in the sentence
- `includeAdjective` (boolean, optional): Include an adjective in the sentence
- `includeAdverb` (boolean, optional): Include an adverb in the sentence

**Note:** At least one parameter must be `true`.

**Success Response:**
```json
{
  "success": true,
  "data": {
    "sentence": "Happy cat quickly runs."
  }
}
```

**Error Response (no options selected):**
```json
{
  "success": false,
  "error": "At least one part of speech must be selected"
}
```

**Error Response (database empty):**
```json
{
  "success": false,
  "error": "Unable to generate sentence. Database may be empty."
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## CORS

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

---

## Examples

### cURL Examples

**Health Check:**
```bash
curl https://sentence-generator-worker.jaun98last.workers.dev/api/health
```

**Get Categories:**
```bash
curl https://sentence-generator-worker.jaun98last.workers.dev/api/categories
```

**Get Nouns:**
```bash
curl "https://sentence-generator-worker.jaun98last.workers.dev/api/words?category_id=1"
```

**Generate Sentence:**
```bash
curl -X POST https://sentence-generator-worker.jaun98last.workers.dev/api/generate-sentence \
  -H "Content-Type: application/json" \
  -d '{"includeNoun":true,"includeVerb":true,"includeAdjective":true,"includeAdverb":false}'
```

### JavaScript/Fetch Examples

**Generate Sentence:**
```javascript
const response = await fetch('/api/generate-sentence', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    includeNoun: true,
    includeVerb: true,
    includeAdjective: true,
    includeAdverb: false,
  }),
});

const data = await response.json();
console.log(data.data.sentence);
```

**Get Categories:**
```javascript
const response = await fetch('/api/categories');
const data = await response.json();
console.log(data.data);
```

---

## Rate Limiting

Currently, there are no rate limits on the API. This may change in the future.

---

## Changelog

### v1.0.0 (2026-05-07)
- Initial API release
- Health check endpoint
- Categories endpoint
- Words endpoint with filtering
- Statistics endpoint
- Sentence generation endpoint
- CORS support

---

**Last Updated:** 2026-05-07
