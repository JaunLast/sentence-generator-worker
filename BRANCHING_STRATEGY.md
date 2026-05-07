# Branching Strategy

This document outlines the Git branching strategy for the Sentence Generator Worker (backend) repository.

## Branch Structure

### Main Branches

- **`master`** (or `main`)
  - The primary branch containing production-ready code
  - Always stable and deployable
  - Protected branch with required reviews
  - All feature branches are created from and merged back into `master`

## Workflow

### 1. Creating a Feature Branch

Always branch off from `master`:

```bash
git checkout master
git pull origin master
git checkout -b feature/your-feature-name
```

### 2. Branch Naming Conventions

Use descriptive, lowercase names with hyphens:

**Feature Branches:**
```
feature/add-word-categories
feature/improve-sentence-algorithm
feature/add-caching-layer
```

**Bug Fix Branches:**
```
bugfix/fix-database-query
bugfix/resolve-cors-issue
bugfix/correct-word-selection
```

**Hotfix Branches:**
```
hotfix/critical-database-error
hotfix/security-vulnerability
```

**Chore/Maintenance Branches:**
```
chore/update-dependencies
chore/optimize-queries
chore/add-unit-tests
```

**Documentation Branches:**
```
docs/update-api-documentation
docs/add-deployment-guide
docs/improve-readme
```

**Database Migration Branches:**
```
migration/add-user-table
migration/update-words-schema
```

### 3. Working on Your Branch

Make commits with clear, descriptive messages:

```bash
git add .
git commit -m "feat: add word categories endpoint"
git commit -m "fix: resolve CORS configuration issue"
git commit -m "docs: update API documentation"
```

**Commit Message Conventions:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `migration:` - Database migrations

### 4. Keeping Your Branch Updated

Regularly sync with `master` to avoid conflicts:

```bash
git checkout master
git pull origin master
git checkout feature/your-feature-name
git merge master
```

Or use rebase for a cleaner history:

```bash
git checkout feature/your-feature-name
git rebase master
```

### 5. Creating a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request on GitHub:
   - Base branch: `master`
   - Compare branch: `feature/your-feature-name`
   - Add a clear title and description
   - Link related issues
   - Request reviewers

3. PR Title Format:
   ```
   feat: Add word categories endpoint
   fix: Resolve CORS configuration issue
   docs: Update API documentation
   migration: Add user preferences table
   ```

### 6. Code Review Process

- At least **1 approval** required before merging
- All CI/CD checks must pass
- No merge conflicts
- Code follows project standards
- Database migrations reviewed carefully

### 7. Merging

Once approved:
- Use **"Squash and merge"** for feature branches (cleaner history)
- Use **"Merge commit"** for important milestones
- Delete the branch after merging

```bash
# After PR is merged, clean up locally
git checkout master
git pull origin master
git branch -d feature/your-feature-name
```

## Branch Protection Rules

### Master Branch Protection

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators in restrictions
- ✅ Restrict who can push to matching branches

## Release Process

### Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards-compatible)
- **PATCH** version for bug fixes (backwards-compatible)

Example: `v1.2.3`

### Creating a Release

1. Ensure `master` is stable and all tests pass
2. Update version in `package.json`
3. Run database migrations on staging
4. Create a git tag:
   ```bash
   git tag -a v1.2.3 -m "Release version 1.2.3"
   git push origin v1.2.3
   ```
5. Create a GitHub Release with changelog
6. Deploy to production
7. Run database migrations on production

## Hotfix Process

For critical production issues:

1. Create hotfix branch from `master`:
   ```bash
   git checkout master
   git checkout -b hotfix/critical-issue-name
   ```

2. Fix the issue and commit:
   ```bash
   git commit -m "hotfix: resolve critical database timeout"
   ```

3. Create PR and get expedited review

4. Merge to `master` immediately after approval

5. Deploy to production

6. Update version (patch increment)

## Database Migration Strategy

### Creating Migrations

1. Create migration branch:
   ```bash
   git checkout -b migration/add-new-table
   ```

2. Create migration file in `migrations/` folder:
   ```
   migrations/0002_add_user_preferences.sql
   ```

3. Test migration locally:
   ```bash
   npm run db:migrate:local
   ```

4. Create rollback script if needed

5. Document migration in PR description

### Migration Best Practices

- ✅ Always test migrations locally first
- ✅ Create migrations in sequential order
- ✅ Never modify existing migrations
- ✅ Include rollback procedures
- ✅ Test on staging before production
- ✅ Backup database before running migrations

## Best Practices

### DO:
- ✅ Always branch from `master`
- ✅ Keep branches focused on a single feature/fix
- ✅ Write clear commit messages
- ✅ Keep branches up to date with `master`
- ✅ Delete branches after merging
- ✅ Run tests before pushing
- ✅ Keep PRs small and reviewable
- ✅ Test database migrations thoroughly

### DON'T:
- ❌ Commit directly to `master`
- ❌ Create long-lived feature branches
- ❌ Mix multiple features in one branch
- ❌ Force push to shared branches
- ❌ Merge without review
- ❌ Leave stale branches
- ❌ Modify existing migrations
- ❌ Skip migration testing

## Quick Reference

```bash
# Start new feature
git checkout master
git pull origin master
git checkout -b feature/my-feature

# Work on feature
git add .
git commit -m "feat: add new feature"

# Keep updated
git checkout master
git pull origin master
git checkout feature/my-feature
git merge master

# Push and create PR
git push origin feature/my-feature
# Then create PR on GitHub

# After merge, cleanup
git checkout master
git pull origin master
git branch -d feature/my-feature
```

## Cloudflare Worker Specific Notes

### Testing Before Merge

```bash
# Test locally
npm run dev

# Test migrations
npm run db:migrate:local
npm run db:seed:local

# Run tests
npm test
```

### Deployment

- Staging deploys automatically on merge to `master`
- Production deploys via GitHub Actions after tag creation
- Always test on staging before production deployment

## Questions?

If you have questions about the branching strategy, please:
1. Check this document first
2. Ask in team chat
3. Consult with the team lead

---

**Last Updated:** May 2026
