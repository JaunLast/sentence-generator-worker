# Postman Quick Start Guide

Get started testing the Sentence Generator API in 5 minutes.

## Prerequisites

- [Postman](https://www.postman.com/downloads/) installed (or use Postman web)
- Backend server running locally OR deployed to Cloudflare Workers

## Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select one or both collection files:
   - `sentence-generator-api-with-schema-validation.postman_collection.json` (recommended)
   - `Sentence-Generator-API.postman_collection.json` (basic tests)
4. Click **Import**

## Step 2: Import Environment

1. Click **Import** button again
2. Select environment file:
   - `Local.postman_environment.json` (for local testing)
   - `Production.postman_environment.json` (for deployed API)
3. Click **Import**

## Step 3: Select Environment

1. Look at the top-right corner of Postman
2. Click the environment dropdown (shows "No Environment" by default)
3. Select **Local Development** or **Production**

## Step 4: Start Your Server (Local Only)

If testing locally:

```bash
cd C:\sentence-generator-worker
npm run dev
```

Server should start on `http://localhost:8787`

## Step 5: Run Your First Test

1. In the left sidebar, expand the collection
2. Click on **Health Check**
3. Click the blue **Send** button
4. View the response and test results

✅ You should see:
- Status: `200 OK`
- Response body with `"status": "healthy"`
- All tests passing (green checkmarks)

## Step 6: Run All Tests

### Option A: Collection Runner (GUI)

1. Click on the collection name in the left sidebar
2. Click **Run** button
3. Ensure correct environment is selected
4. Click **Run Sentence Generator API**
5. Watch tests execute and view results

### Option B: Newman (CLI)

```bash
# Install Newman globally
npm install -g newman

# Run tests
newman run sentence-generator-api-with-schema-validation.postman_collection.json -e Local.postman_environment.json
```

## Understanding Test Results

### ✅ Passing Tests

```
✓ Status code is 200
✓ Response time is less than 500ms
✓ Response matches JSON schema
✓ Sentence starts with capital letter
```

All tests passed! Your API is working correctly.

### ❌ Failing Tests

```
✗ Status code is 200
  AssertionError: expected 500 to equal 200
```

Something is wrong. Check:
1. Is your server running?
2. Is the database seeded with data?
3. Are you using the correct environment?

## Common Test Scenarios

### Test 1: Get All Categories

**Request:** `GET {{baseUrl}}/api/categories`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "noun", ...},
    {"id": 2, "name": "verb", ...},
    {"id": 3, "name": "adjective", ...},
    {"id": 4, "name": "adverb", ...}
  ]
}
```

**Tests:**
- Returns exactly 4 categories
- Each category has required fields
- Category names are correct

### Test 2: Get Words by Category

**Request:** `GET {{baseUrl}}/api/words?category_id=1`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "word": "cat", "category_id": 1, ...},
    {"id": 2, "word": "dog", "category_id": 1, ...}
  ]
}
```

**Tests:**
- All words belong to category 1 (nouns)
- Each word has required fields
- Response structure is valid

### Test 3: Generate Sentence (Happy Path)

**Request:** `POST {{baseUrl}}/api/generate-sentence`

**Body:**
```json
{
  "includeNoun": true,
  "includeVerb": true,
  "includeAdjective": true,
  "includeAdverb": false
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sentence": "Happy cat runs."
  }
}
```

**Tests:**
- Sentence starts with capital letter
- Sentence ends with period
- Contains multiple words
- Response structure is valid

### Test 4: Generate Sentence (Sad Path)

**Request:** `POST {{baseUrl}}/api/generate-sentence`

**Body:**
```json
{
  "includeNoun": false,
  "includeVerb": false,
  "includeAdjective": false,
  "includeAdverb": false
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "At least one part of speech must be selected"
}
```

**Tests:**
- Status code is 400
- Response indicates failure
- Error message is descriptive

## Troubleshooting

### "Could not get any response"

**Problem:** Request fails to connect

**Solutions:**
1. Check server is running: `npm run dev`
2. Verify `baseUrl` in environment matches your server
3. Check firewall/antivirus isn't blocking localhost:8787

### "Response time is too slow"

**Problem:** Response time test fails

**Solutions:**
1. Adjust `maxResponseTime` variable in environment
2. Check database performance
3. Restart your local server

### "Response doesn't match schema"

**Problem:** JSON Schema validation fails

**Solutions:**
1. Check API response structure matches expected format
2. Verify database has correct data
3. Review error message for specific field that failed

### "No environment selected"

**Problem:** Variables like `{{baseUrl}}` aren't replaced

**Solutions:**
1. Select environment from dropdown (top right)
2. Verify environment is imported
3. Check variable names match exactly

## Next Steps

### 1. Explore All Endpoints

Try each endpoint in the collection:
- Health Check
- Get Categories
- Get All Words
- Get Words by Category
- Get Statistics
- Generate Sentence (various scenarios)

### 2. Understand JSON Schema Validation

Open the **Tests** tab for any request to see:
- Schema definitions
- Validation logic
- Business rule checks

### 3. Customize Tests

Modify test scripts to add your own validations:
```javascript
pm.test("Custom test", function () {
    const jsonData = pm.response.json();
    // Add your assertions here
});
```

### 4. Set Up CI/CD

Integrate Newman into your deployment pipeline:
```yaml
- name: API Tests
  run: newman run postman/sentence-generator-api-with-schema-validation.postman_collection.json -e postman/Production.postman_environment.json
```

## Resources

- **README.md** - Overview of collections and setup
- **ENVIRONMENT_GUIDE.md** - Detailed environment variables documentation
- **API.md** - Full API documentation (in `docs/` folder)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the API documentation
3. Verify your database is seeded with test data
4. Check server logs for errors

---

**Happy Testing! 🚀**
