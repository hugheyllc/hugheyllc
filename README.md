# Hughey LLC - Law Firm Marketing Website

A modern, high-performance marketing website for Hughey LLC built with Astro 6, featuring integrated content management via Decap CMS, automated content generation with Claude AI, and GitHub Actions automation.

**Live Site**: https://hugheyllc.com

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- npm or yarn
- A GitHub account with push access to this repository

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Environment Variables

Create a `.env` file in the root directory with:

```env
# Resend Email API (for contact form and cron notifications)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Anthropic API (for AI-generated blog content)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Vercel Cron Secret (for securing cron endpoints)
CRON_SECRET=your_secret_string_here
```

### Getting API Keys

**RESEND_API_KEY**:
1. Go to https://resend.com
2. Sign up or log in
3. Create a new API key in Settings
4. Copy the key starting with `re_`

**ANTHROPIC_API_KEY**:
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Create an API key in Settings
4. Copy the key starting with `sk-ant-`

**CRON_SECRET**:
- Generate a random string: `openssl rand -hex 32`
- Keep this secure - it's used to verify cron requests

## 📝 Content Management

### Decap CMS

The site uses Decap CMS (formerly Netlify CMS) for content management. Access it at:

```
https://hugheyllc.com/admin
```

Or for local development:
```
https://localhost:4321/admin
```

#### CMS Login

1. **First Time Setup**:
   - Go to `/admin` on your deployed site
   - Click "Login" or "Sign up"
   - Use Netlify Identity to authenticate
   - You'll need Netlify set up on this repository

2. **After Setup**:
   - Navigate to `/admin`
   - Sign in with your Netlify Identity credentials
   - Manage collections: Blog Posts, Insights, Services, Site Settings, Testimonials

#### Collections Available

**Blog Posts**
- Title, slug, date, author, excerpt
- Content (markdown), tags
- SEO title and description
- Draft status toggle

**Insights**
- Title, slug, excerpt
- Full markdown content
- Published immediately on merge

**Services**
- Service name, description
- Full content with benefits
- Icon and display order
- Linked from services page

**Site Settings**
- Firm narrative and values
- Joe Hughey biography
- Contact and location copy
- Brand messaging

**Testimonials**
- Client name and firm
- Practice area and quote
- Optional client image
- Featured status for homepage

### Direct File Editing

Content files are standard markdown:

```
src/content/blog/          # Blog posts (60+ articles)
src/content/insights/      # Insights hub content (5 pages)
src/content/services/      # Service descriptions
src/content/testimonials/  # Client testimonials
```

Each file uses YAML frontmatter:

```yaml
---
title: "Post Title"
slug: "post-slug"
date: 2026-05-03
author: "Joe Hughey"
excerpt: "Short summary..."
tags: ["tag1", "tag2"]
seo_title: "SEO Title"
seo_description: "Meta description..."
draft: false
---

# Content starts here in markdown...
```

## 🤖 Automated Content Generation

### Scheduled Blog Draft Generation

**Schedule**: Every Monday at 9:00 AM UTC

The `scheduled-content-check.yml` GitHub Actions workflow:
1. Reads next week's topic from `.github/content-calendar.json`
2. Calls Anthropic's Claude API to generate a full blog post
3. Creates a draft markdown file with proper frontmatter
4. Opens a GitHub Pull Request for review

**To use**:
1. Ensure `ANTHROPIC_API_KEY` is set in GitHub Secrets
2. Approve and merge the PR to publish
3. Edit the generated draft in CMS if needed

**Content Calendar** (`.github/content-calendar.json`):
- 12 topics spanning the year
- Organized by week
- Includes focus areas for each topic
- Topics cover: AI, analytics, intake, compliance, local SEO, vendor evaluation

### Link Checking

**Schedule**: Every Sunday at 8:00 AM UTC

The `link-check.yml` workflow:
1. Extracts all external URLs from markdown files
2. Checks HTTP status codes
3. Opens a GitHub Issue if broken links found
4. Helps maintain content freshness and avoid link rot

## ⏰ Cron Jobs (Vercel)

Two automated health checks run on a schedule via Vercel crons:

### 1. Sitemap Ping (`/api/cron/ping-sitemap`)
- **Schedule**: 1st of every month
- **Action**: Pings Google and Bing with updated sitemap
- **Purpose**: Ensures new content is discovered by search engines
- **Environment**: Requires `CRON_SECRET` for verification

### 2. Schema Validation (`/api/cron/schema-validate`)
- **Schedule**: Every Monday at 7:00 AM UTC
- **Action**: Validates JSON-LD schema markup on key pages
- **Alert**: Emails issues via Resend if problems detected
- **Pages checked**: Homepage, Location, About, Services
- **Requires**: `RESEND_API_KEY` and `CRON_SECRET`

Configure these in `vercel.json` or Vercel dashboard.

## 🔄 Deployment

### Automatic Deployment

Every push to `main` automatically deploys to production:

1. **GitHub** → Code committed to `main`
2. **Vercel** → Detects change, triggers build
3. **Build** → `npm run build` generates static site
4. **Deploy** → Site goes live immediately
5. **Crons** → Scheduled jobs activate (sitemap ping, schema validation)

### Manual Deployment

```bash
# Vercel CLI
vercel deploy

# Or trigger from GitHub
git push origin main
```

### Environment Variables on Vercel

Set these in Vercel Dashboard → Project Settings → Environment Variables:

- `RESEND_API_KEY`
- `ANTHROPIC_API_KEY`
- `CRON_SECRET`

## 🛡️ Security

### Headers & Redirects

All configured in `vercel.json`:

**Security Headers**:
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-Frame-Options: SAMEORIGIN` - Prevent clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Disable camera, microphone, geolocation

**Caching**:
- Static assets (images): 1 year cache
- API responses: No cache
- Admin pages: No cache

**WordPress Redirects**:
- Old WordPress URLs redirect with 301 status
- Preserves SEO value from old site
- Examples: `/blog/post/`, `/case-studies/`, `/team/`

### Admin Security

- Decap CMS requires Netlify Identity authentication
- Admin interface at `/admin` (requires login)
- `robots.txt` blocks indexing of admin pages
- GitHub Actions require `CRON_SECRET` verification

## 📊 Monitoring & Maintenance

### Weekly Tasks

- Review auto-generated blog drafts (if published)
- Check link checker GitHub Issues
- Monitor Google Search Console for new content

### Monthly Tasks

- Verify sitemap ping completed
- Review Google Analytics
- Check email notifications from cron jobs

### Quarterly Tasks

- Update content calendar for next quarter
- Review and refresh old blog posts
- Audit service descriptions for accuracy
- Check testimonials relevance

## 🏗️ Site Structure

```
├── src/
│   ├── pages/              # Astro pages (routes)
│   │   ├── index.astro     # Homepage
│   │   ├── about.astro     # About page
│   │   ├── services.astro  # Services hub
│   │   ├── contact.astro   # Contact form
│   │   ├── insights.astro  # Insights hub
│   │   ├── blog/           # Blog hub
│   │   └── api/            # API endpoints
│   ├── components/         # Reusable components
│   │   ├── Nav.astro       # Navigation
│   │   ├── Hero.astro      # Hero section
│   │   └── Footer.astro    # Footer
│   ├── layouts/
│   │   └── BaseLayout.astro # Main layout wrapper
│   └── content/            # Content collections
│       ├── blog/           # Blog posts (.md files)
│       ├── insights/       # Insights articles
│       ├── services/       # Service descriptions
│       └── testimonials/   # Client testimonials
├── public/
│   ├── admin/
│   │   ├── index.html      # Decap CMS entry point
│   │   └── config.yml      # CMS configuration
│   ├── robots.txt          # Search engine directives
│   ├── llms.txt            # AI model reference
│   └── images/             # Static images
├── .github/
│   ├── workflows/          # GitHub Actions
│   │   ├── scheduled-content-check.yml
│   │   └── link-check.yml
│   └── content-calendar.json # Topics for AI content
├── vercel.json             # Vercel config & redirects
├── astro.config.mjs        # Astro configuration
└── package.json            # Dependencies
```

## 🧩 Technology Stack

- **Framework**: Astro 6 (static site generation)
- **Styling**: CSS custom properties (variables)
- **CMS**: Decap CMS (git-based, no database)
- **Forms**: Resend email API
- **Content Generation**: Anthropic Claude API
- **Hosting**: Vercel (serverless, cron jobs)
- **CI/CD**: GitHub Actions
- **Link Checking**: GitHub Actions + Node.js

## 🐛 Troubleshooting

### CMS Won't Load

```
- Ensure Netlify Identity is enabled on Netlify dashboard
- Check that branch is set to 'main' in config.yml
- Clear browser cache and try again
- Check browser console for errors (Dev Tools → Console)
```

### Cron Jobs Not Running

```
- Verify vercel.json has correct cron paths
- Check Vercel Project Settings → Crons
- Ensure CRON_SECRET environment variable is set
- View cron logs in Vercel Dashboard → Logs
```

### Scheduled Content Generation Failed

```
- Check GitHub Actions tab for workflow logs
- Verify ANTHROPIC_API_KEY is set in GitHub Secrets
- Confirm API key has credits available
- Check that .github/content-calendar.json is valid JSON
```

### Build Failures

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run build locally to see exact error
npm run build

# Check Vercel build logs for details
vercel logs
```

## 📧 Support & Contact

- **Website**: https://hugheyllc.com
- **Email**: joe@joehughey.com
- **Location**: St. Petersburg, FL
- **Response Time**: Within 1 business day

## 📄 License

Private repository. Unauthorized access is prohibited.

---

**Last Updated**: May 2026
**Astro Version**: 6.2.1
**Node Version**: 18+
