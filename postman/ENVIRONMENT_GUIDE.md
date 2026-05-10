# Postman Environment Variables Guide

This guide explains all environment variables used in the Sentence Generator API Postman collections.

## Available Environments

### 1. Local Development
**File:** `Local.postman_environment.json`

Use this environment when testing against your local development server.

### 2. Production
**File:** `Production.postman_environment.json`

Use this environment when testing against the deployed Cloudflare Worker.

## Environment Variables

| Variable | Local Value | Production Value | Description |
|----------|-------------|------------------|-------------|
| `baseUrl` | `http://localhost:8787` | `https://sentence-generator-worker.jaun98last.workers.dev` | Base URL for all API requests |
| `nounCategoryId` | `1` | `1` | Category ID for nouns |
| `verbCategoryId` | `2` | `2` | Category ID for verbs |
| `adjectiveCategoryId` | `3` | `3` | Category ID for adjectives |
| `adverbCategoryId` | `4` | `4` | Category ID for adverbs |
| `maxResponseTime` | `500` | `1000` | Maximum acceptable response time in milliseconds |

## How to Use

### In Postman GUI

1. **Import Environment:**
   - Click "Import" in Postman
   - Select `Local.postman_environment.json` or `Production.postman_environment.json`
   - The environment will appear in the environments dropdown (top right)

2. **Select Environment:**
   - Click the environment dropdown (top right)
   - Select "Local Development" or "Production"

3. **Use Variables in Requests:**
   Variables are automatically used in the collection requests:
   ```
   {{baseUrl}}/api/health
   {{baseUrl}}/api/words?category_id={{nounCategoryId}}
   ```

4. **View/Edit Variables:**
   - Click the eye icon next to the environment dropdown
   - Click "Edit" to modify values
   - Changes are saved automatically

### In Newman CLI

Specify the environment file when running tests:

```bash
# Local environment
newman run sentence-generator-api-with-schema-validation.postman_collection.json \
  -e Local.postman_environment.json

# Production environment
newman run sentence-generator-api-with-schema-validation.postman_collection.json \
  -e Production.postman_environment.json
```

### Override Variables

You can override environment variables from the command line:

```bash
newman run sentence-generator-api-with-schema-validation.postman_collection.json \
  -e Local.postman_environment.json \
  --env-var "baseUrl=http://localhost:3000"
```

## Variable Usage Examples

### In Request URLs

```
GET {{baseUrl}}/api/categories
GET {{baseUrl}}/api/words?category_id={{nounCategoryId}}
POST {{baseUrl}}/api/generate-sentence
```

### In Test Scripts

```javascript
// Check response time against environment variable
pm.test("Response time is acceptable", function () {
    const maxTime = pm.environment.get("maxResponseTime");
    pm.expect(pm.response.responseTime).to.be.below(parseInt(maxTime));
});

// Use category IDs in tests
pm.test("Returns noun category", function () {
    const nounId = pm.environment.get("nounCategoryId");
    const jsonData = pm.response.json();
    pm.expect(jsonData.data[0].category_id).to.eql(parseInt(nounId));
});
```

### In Pre-request Scripts

```javascript
// Set dynamic variables
pm.environment.set("timestamp", new Date().toISOString());

// Get category ID for request
const categoryId = pm.environment.get("nounCategoryId");
pm.request.url.query.add({key: "category_id", value: categoryId});
```

## Creating Custom Environments

To create a new environment (e.g., Staging):

1. **Duplicate an existing environment file:**
   ```bash
   cp Local.postman_environment.json Staging.postman_environment.json
   ```

2. **Update the values:**
   ```json
   {
     "id": "staging-environment",
     "name": "Staging",
     "values": [
       {
         "key": "baseUrl",
         "value": "https://staging-api.example.com",
         "type": "default",
         "enabled": true
       },
       ...
     ]
   }
   ```

3. **Import into Postman**

## Best Practices

### 1. Never Commit Secrets
- Don't store API keys, tokens, or passwords in environment files
- Use Postman Vault or environment variables for sensitive data
- Add `*.postman_environment.json` to `.gitignore` if it contains secrets

### 2. Use Descriptive Names
- Name environments clearly: "Local Development", "Production", "Staging"
- Use consistent variable naming: camelCase or snake_case

### 3. Document Variables
- Add descriptions to variables in Postman
- Keep this guide updated when adding new variables

### 4. Version Control
- Commit environment templates with placeholder values
- Document required variables in README

### 5. Validate Variables
- Add tests to verify environment variables are set correctly
- Check for missing or invalid values in pre-request scripts

## Troubleshooting

### Variable Not Found Error

**Error:** `{{baseUrl}} is not defined`

**Solution:**
1. Ensure an environment is selected (top right dropdown)
2. Verify the variable exists in the environment
3. Check variable spelling matches exactly

### Wrong Base URL

**Error:** Request fails with connection error

**Solution:**
1. Verify the correct environment is selected
2. Check `baseUrl` value matches your server
3. Ensure local server is running (for Local environment)

### Response Time Failures

**Error:** Response time tests fail

**Solution:**
1. Adjust `maxResponseTime` variable for your environment
2. Local: 500ms is typical
3. Production: 1000ms accounts for network latency

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run API Tests (Local)
  run: |
    npm install -g newman
    newman run postman/sentence-generator-api-with-schema-validation.postman_collection.json \
      -e postman/Local.postman_environment.json \
      --reporters cli,json

- name: Run API Tests (Production)
  run: |
    newman run postman/sentence-generator-api-with-schema-validation.postman_collection.json \
      -e postman/Production.postman_environment.json \
      --reporters cli,json
```

### Environment-Specific Tests

Run different test suites based on environment:

```bash
# Quick smoke tests on local
newman run postman/Sentence-Generator-API.postman_collection.json \
  -e postman/Local.postman_environment.json

# Full schema validation on production
newman run postman/sentence-generator-api-with-schema-validation.postman_collection.json \
  -e postman/Production.postman_environment.json
```

## Additional Resources

- [Postman Environment Documentation](https://learning.postman.com/docs/sending-requests/managing-environments/)
- [Newman CLI Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [Postman Variables Guide](https://learning.postman.com/docs/sending-requests/variables/)
