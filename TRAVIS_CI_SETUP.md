# Travis CI Setup Guide

## Quick Start

1. **Enable Travis CI for your repository:**
   - Go to https://travis-ci.com/
   - Sign in with your GitHub account
   - Click on your profile picture → Settings
   - Find "Webiste-for-gaming" repository
   - Toggle the switch to enable builds

2. **Configure Environment Variables (Optional):**
   If you want to deploy to GitHub Pages:
   - Go to repository settings in Travis CI
   - Click "Settings"
   - Add environment variable:
     - Name: `GITHUB_TOKEN`
     - Value: Your GitHub Personal Access Token
     - Keep "Display value in build log" OFF

3. **Create GitHub Personal Access Token (for deployment):**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name: "Travis CI Deploy"
   - Select scopes: `repo` (all), `public_repo`
   - Click "Generate token"
   - Copy the token and add it to Travis CI settings

## Build Badge

Add this to your README.md to show build status:

```markdown
[![Build Status](https://travis-ci.com/Dexter5000000/Webiste-for-gaming.svg?branch=main)](https://travis-ci.com/Dexter5000000/Webiste-for-gaming)
```

## What Travis CI Will Do

✅ **On every push/PR:**
- Install dependencies
- Run linter (`npm run lint`)
- Build the project (`npm run build`)
- Run tests (`npm test`)

✅ **On main branch (Node 20 only):**
- Deploy to GitHub Pages (if GITHUB_TOKEN is set)

## Test Multiple Node Versions

The configuration tests against:
- Node.js 18
- Node.js 20
- Latest LTS version

## Build Stages

1. **Build Stage**: Quick build check
2. **Test Stage**: Run unit tests and linting in parallel

## Customization

### Update Email Notifications

Edit `.travis.yml`:
```yaml
notifications:
  email:
    recipients:
      - your-email@example.com
    on_success: change
    on_failure: always
```

### Disable GitHub Pages Deployment

Comment out or remove the `deploy` section in `.travis.yml`

### Add Custom Domain for GitHub Pages

Update in `.travis.yml`:
```yaml
deploy:
  fqdn: your-custom-domain.com
```

## Troubleshooting

### Build Fails on Install
- Check if all dependencies are in package.json
- Ensure package-lock.json is committed

### Build Fails on Test
- Run `npm test` locally first
- Check test setup in `vitest.config.ts`

### Deployment Fails
- Verify GITHUB_TOKEN is set correctly
- Ensure token has `repo` permissions
- Check branch is `main`

## Local Testing

Test the build locally before pushing:

```bash
# Install dependencies
npm ci

# Run linter
npm run lint

# Run tests
npm test

# Build project
npm run build
```

## Status Badge Colors

- 🟢 **Green (passing)**: All builds successful
- 🔴 **Red (failing)**: Build or tests failed
- 🟡 **Yellow (pending)**: Build in progress
- ⚪ **Gray (unknown)**: No builds yet

## Next Steps

1. Commit `.travis.yml` to your repository
2. Push to GitHub
3. Enable repository in Travis CI
4. Watch your first build!

```bash
git add .travis.yml
git commit -m "Add Travis CI configuration"
git push origin main
```
