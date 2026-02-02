# Deployment Guide

## Pre-Deployment Checklist

- [x] README.md created
- [x] package.json updated with proper name and description
- [x] .gitignore configured for Next.js and Vercel
- [x] Next.js config optimized for deployment

## GitHub Setup

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (don't initialize with README since you already have one)
   - Copy the repository URL

3. **Push to GitHub**:
   ```bash
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```

## Vercel Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (or `yarn build` / `pnpm build`)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (or `yarn install` / `pnpm install`)
5. Click "Deploy"
6. Your app will be live in minutes!

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to link your project

### Environment Variables

This project doesn't require any environment variables for basic functionality. If you add features that need API keys or secrets later, you can add them in:
- Vercel Dashboard → Project Settings → Environment Variables

## Post-Deployment

1. **Custom Domain** (Optional):
   - Go to Project Settings → Domains
   - Add your custom domain

2. **Analytics** (Optional):
   - The project includes `@vercel/analytics` package
   - Enable in Vercel Dashboard → Analytics

3. **Preview Deployments**:
   - Every push to a branch creates a preview deployment
   - Pull requests automatically get preview URLs

## Troubleshooting

### Build Errors
- Check the build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)

### Runtime Errors
- Check function logs in Vercel Dashboard
- Verify all environment variables are set
- Check browser console for client-side errors

## Continuous Deployment

Once connected to GitHub, Vercel automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Rebuilds on dependency updates (if configured)
