# Deployment Workflow Documentation

## Overview

The deployment workflow is configured in `.github/workflows/deploy.yml` and handles automated testing, code quality analysis, and deployment to Cloudflare Workers for both staging and production environments.

## Workflow Triggers

### Push to Main Branch
- Triggers: Test → SonarCloud Analysis → Production Deployment
- Deploys to: `https://sentence-generator-worker.workers.dev`

### Pull Requests
- Triggers: Test → SonarCloud Analysis → Staging Deployment
- Deploys to: `https://sentence-generator-worker-staging.workers.dev`
- Target branches: `main`, `develop`

## Workflow Jobs

### 1. Test Job
**Purpose:** Run unit tests and type checking

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run tests with coverage (`npm run test:coverage`)
5. Run TypeScript type checking (`npx tsc --noEmit`)
6. Upload coverage reports as artifacts (retained for 7 days)

**Outputs:**
- Test results
- Coverage reports (uploaded as artifacts)
- Type checking validation

---

### 2. SonarCloud Analysis Job
**Purpose:** Analyze code quality and security

**Dependencies:** Requires `test` job to complete successfully

**Steps:**
1. Checkout code with full git history (`fetch-depth: 0`)
2. Setup Node.js 20
3. Install dependencies
4. Run tests with coverage (generates `coverage/lcov.info`)
5. Upload coverage and analysis to SonarCloud

**Required Secrets:**
- `SONAR_TOKEN` - SonarCloud authentication token
- `GITHUB_TOKEN` - Automatically provided by GitHub

**SonarCloud Project:**
- Organization: `jaunlast`
- Project Key: `JaunLast_sentence-generator-worker`
- URL: `https://sonarcloud.io/project/overview?id=JaunLast_sentence-generator-worker`

---

### 3. Deploy to Staging Job
**Purpose:** Deploy to staging environment on pull requests

**Dependencies:** Requires `test` and `sonarqube` jobs to complete successfully

**Trigger Condition:** Only runs on pull request events

**Environment:**
- Name: `staging`
- URL: `https://sentence-generator-worker-staging.workers.dev`
- Worker Name: `sentence-generator-worker-staging`

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Build validation (TypeScript type check)
5. Deploy to Cloudflare Workers with `--env staging`
6. Report deployment status

**Required Secrets:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API authentication
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier

**Wrangler Secrets (set via CLI):**
- `JWT_SECRET` - JWT signing secret for staging environment

---

### 4. Deploy to Production Job
**Purpose:** Deploy to production environment on main branch pushes

**Dependencies:** Requires `test` and `sonarqube` jobs to complete successfully

**Trigger Condition:** Only runs when pushing to `main` branch

**Environment:**
- Name: `production`
- URL: `https://sentence-generator-worker.workers.dev`
- Worker Name: `sentence-generator-worker`

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Build validation (TypeScript type check)
5. Deploy to Cloudflare Workers
6. Report deployment status

**Required Secrets:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API authentication
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier

**Wrangler Secrets (set via CLI):**
- `JWT_SECRET` - JWT signing secret for production environment

---

## Required GitHub Secrets

Configure these in **GitHub Repository Settings → Secrets and variables → Actions**:

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token for Cloudflare Workers deployment | Cloudflare Dashboard → My Profile → API Tokens → Create Token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare Dashboard → Workers & Pages → Overview (right sidebar) |
| `SONAR_TOKEN` | SonarCloud authentication token | SonarCloud → My Account → Security → Generate Token |

## Required Wrangler Secrets

These are set via Wrangler CLI and stored in Cloudflare (not in GitHub):

```bash
# Production
npx wrangler secret put JWT_SECRET --env production

# Staging
npx wrangler secret put JWT_SECRET --env staging
```

See `SECRETS_MANAGEMENT.md` for detailed instructions.

---

## Deployment Flow Diagram

```
┌─────────────────┐
│  Push to Main   │
│  or PR Created  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Test Job      │
│  - Unit Tests   │
│  - Coverage     │
│  - Type Check   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SonarCloud     │
│  - Code Quality │
│  - Coverage     │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   (if PR)           (if push to main)   (if failed)
┌─────────────┐    ┌─────────────┐    ┌─────────┐
│   Staging   │    │ Production  │    │  Stop   │
│ Deployment  │    │ Deployment  │    └─────────┘
└─────────────┘    └─────────────┘
```

---

## Deployment Checklist

Before deploying, ensure:

- ✅ All tests pass locally (`npm test`)
- ✅ Type checking passes (`npx tsc --noEmit`)
- ✅ Coverage reports are generated (`npm run test:coverage`)
- ✅ GitHub secrets are configured
- ✅ Wrangler secrets are set for target environment
- ✅ `wrangler.toml` is properly configured
- ✅ D1 database is set up in Cloudflare

---

## Troubleshooting

### Deployment Fails with "Missing Secret"

**Cause:** JWT_SECRET not set for the environment

**Solution:**
```bash
npx wrangler secret put JWT_SECRET --env production
# or
npx wrangler secret put JWT_SECRET --env staging
```

### SonarCloud Analysis Fails

**Cause:** Missing `SONAR_TOKEN` or coverage files

**Solution:**
1. Verify `SONAR_TOKEN` is set in GitHub Secrets
2. Ensure tests generate `coverage/lcov.info`
3. Check `sonar-project.properties` configuration

### Type Check Fails

**Cause:** TypeScript compilation errors

**Solution:**
1. Run `npx tsc --noEmit` locally
2. Fix TypeScript errors
3. Commit and push fixes

### Deployment Succeeds but Worker Not Working

**Cause:** Missing environment variables or database binding

**Solution:**
1. Verify `wrangler.toml` has correct D1 database configuration
2. Check Wrangler secrets are set
3. Review Cloudflare Workers logs

---

## Monitoring Deployments

### GitHub Actions
- View workflow runs: `https://github.com/JaunLast/sentence-generator-worker/actions`
- Check job logs for detailed output
- Review deployment status in PR checks

### Cloudflare Dashboard
- Workers & Pages → sentence-generator-worker
- View deployment history
- Check worker logs and metrics

### SonarCloud
- Project dashboard: `https://sonarcloud.io/project/overview?id=JaunLast_sentence-generator-worker`
- View code quality metrics
- Review coverage trends

---

## Rollback Strategy

If a production deployment fails or causes issues:

1. **Immediate:** Revert the commit that caused the issue
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Alternative:** Redeploy previous working version
   ```bash
   git checkout <previous-working-commit>
   npx wrangler deploy --env production
   ```

3. **Long-term:** Fix the issue, test thoroughly, and redeploy

---

## Workflow Maintenance

### Updating Node Version
Update `node-version` in all jobs:
- Test job
- SonarCloud job
- Deploy-staging job
- Deploy-production job

### Updating Dependencies
```bash
npm update
npm audit fix
npm test
```

### Updating Wrangler Action
Check for updates: `https://github.com/cloudflare/wrangler-action/releases`

Update in `deploy.yml`:
```yaml
uses: cloudflare/wrangler-action@v3  # Update version as needed
```

---

## Best Practices

✅ **Always test locally before pushing**
✅ **Use pull requests for all changes**
✅ **Review SonarCloud analysis before merging**
✅ **Monitor production deployments**
✅ **Keep secrets rotated and secure**
✅ **Document any workflow changes**
✅ **Test staging deployment before production**

---

## Related Documentation

- `SECRETS_MANAGEMENT.md` - Secrets configuration guide
- `wrangler.toml` - Cloudflare Workers configuration
- `sonar-project.properties` - SonarCloud configuration
- `.github/workflows/deploy.yml` - Workflow definition
