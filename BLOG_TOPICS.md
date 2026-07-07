# Blog Topics Inventory

**Last Updated:** Jul 7, 2026  
**Total Posts:** 119  
**Purpose:** Prevent duplicate/redundant content generation

## Topics Covered (By Category)

### Marketing Agency Comparisons (9 posts)
Topic covered extensively. **DO NOT** generate more posts on:
- Agency vs. consultant comparisons
- Agency management/negotiation
- When to fire an agency
- Technical partner vs. agency

**Existing posts:**
- Law Firm Marketing Agency vs. Independent Consultant
- How to Set & Manage Your Law-Firm Marketing Agency
- When to Choose an Independent Consultant Over a Marketing Agency
- Law Firm Marketing Agency vs. Consultant (multiple angles on growth, accountability, technical)
- How to Negotiate Better Terms With Your Law Firm Marketing Agency
- Why Law Firms Fire Their Marketing Agency

**Next topic instead:** Client outcomes, ROI tracking, retention strategy

---

### SEO (11 posts)
Topic heavily covered. **DO NOT** generate:
- General SEO best practices
- SEO audits (we have 2 already)
- Schema markup (covered)
- Local SEO basics (we have 2)
- SEO vs. PPC

**Existing posts:**
- Do Law Firms Actually Need an SEO Agency?
- From SEO to AEO
- Law Firm Schema Markup
- The SEO Audit (2 variations: general + Florida)
- Law Firm Website ADA Compliance (SEO angle)
- Local SEO (2 posts)
- Paid Search vs. Organic SEO

**Next topic instead:** AI indexing changes, AEO specifics, semantic search

---

### Local Search & Geographic (14 posts)
Topic heavily covered with Florida locations + Tampa, St. Petersburg, Sarasota, Clearwater, etc.

**DO NOT** generate more local market posts. Geographic coverage is complete.

---

### Practice Area Marketing (8 posts)
**Covered:**
- Personal Injury (3 posts: general, Tampa, Tampa Bay)
- Family Law (2 posts)
- Business Law (2 posts)
- Criminal Defense (1 post)
- Immigration (1 post)

**Next practice area if needed:** Elder law, employment law, estate planning

---

### Content, Email, Video, Social (7 posts)
**Covered:**
- Content Marketing (2 posts)
- Email Marketing
- Video Marketing
- Social Media Marketing
- Video/Visual/Interactive Content for SEO

**DO NOT** duplicate content marketing angles.

---

### Analytics, Tracking, Attribution (8 posts)
**Covered:**
- GA4 Setup
- Law Firm Website Analytics
- Law Firm Marketing ROI Tracking/Metrics
- Law Firm Marketing Attribution
- Call Tracking & CRM Integration
- Law Firm Referral Tracking
- Lead Quality vs. Volume

**DO NOT** generate more analytics posts. Coverage is comprehensive.

---

### Tools & Platforms (5 posts)
**Covered:**
- CallRail Setup Guide
- Lawmatics vs. Clio Grow
- Scorpion Legal Marketing Review
- Law Firm CRM (2 posts: general + automation)

**Next tool if needed:** Document automation, Zapier/Make, practice management reviews

---

### Website & Design (9 posts)
**Covered:**
- Law Firm Website Design Company (how to choose)
- Law Firm Website Homepage Design
- Law Firm Website Launch Checklist
- Law Firm Website ADA Compliance
- Law Firm Website Analytics
- Law Firm Website Losing Clients
- Law Firm Website Ownership
- Law Firm Website SEO and Conversion
- WordPress migration

**DO NOT** generate more website design posts.

---

### Landing Pages & Conversion (3 posts)
**Covered:**
- Law Firm Landing Page Optimization
- Practice Area Landing Pages That Convert
- Why Law Firm Landing Pages Fail

**Coverage is sufficient.**

---

### Keyword Research (2 posts)
**Covered:**
- Keyword Research for Law Firms
- Competitor Keyword Research for Law Firms

**Coverage is sufficient.**

---

### Lead Generation & Intake (6 posts)
**Covered:**
- Law Firm Intake Process Audit
- Law Firm Intake Speed
- Law Firm CRM/Automation
- More Leads Wrong Goal
- Lead Quality vs. Volume
- Call Tracking & CRM Integration

**DO NOT** generate more intake posts.

---

### Industry Trends & Strategy (8 posts)
**Covered:**
- AI Search for Law Firms (2026)
- AI Tools for Law Firm Marketing
- Prompt Engineering for Law Firms
- Predictive Analytics for Law Firms
- Evolving Law Firm Business Models & Pricing
- Legal Marketing in 2025: Trends
- Hyper-Personalization in 2025
- AEO / AIO Advertising

**Next trend if applicable:** Regulation changes, market shifts

---

### Misc Topics (7 posts)
**Covered:**
- 2025 Review
- Florida Bar Advertising Rules
- Why Law Firms Are Ditching WordPress
- FindLaw/Martindale Directory Value
- Link Building for Law Firms
- Reputation Management
- Google Review Strategy
- What High-Growth Law Firms Do Differently

---

## Topics to AVOID (Duplicate Risk)

### Exact Duplicates (Remove These)
1. `30-minute-marketing-audit` ↔ `30-minute-marketing-audit-agency-dashboard` (same title!)
2. `lawyer-keyword-research`, `mobile-first-indexing`, `the-seo-graveyard` (3 posts missing frontmatter)

### Thematic Overload (Too Many Similar Posts)
- **Agency vs. Consultant:** 9 posts. Stop generating on this topic.
- **SEO Best Practices:** 11 posts. Only generate if focused on **new developments** (e.g., Google updates, AI indexing).
- **Local Search:** 14+ posts. Complete coverage.
- **Marketing Budget/ROI:** 8+ posts. Complete coverage.

---

## Approved New Topics (2026)

Based on coverage gaps, these topics are safe to generate:

✅ **Emerging AI Search:** AI overviews updates, perplexity vs. Google, agent-based indexing  
✅ **Regulatory Changes:** Florida Bar updates, ethics in digital marketing  
✅ **Underserved Practice Areas:** Elder law, estate planning, employment, DUI defense  
✅ **Client Experience:** Retention, onboarding, post-case communication  
✅ **Operational Efficiency:** Staffing, workflow automation, billing integration  
✅ **Competitive Intelligence:** Win-loss analysis, market positioning  
✅ **Firm Growth Stages:** Solo to 5-person, scaling beyond 10, merger strategies  

---

## Generator Rules (Update blog-generator.mjs)

Before generating a new post:

1. **Check exact title match** (current logic ✅)
2. **Check keyword overlap** (>60% word match = reject) (current logic ✅)
3. **Check topic categories above** (new logic 🔄)
   - If topic is in "AVOID" list → skip
   - If topic is in "Approved" list → proceed
   - If topic is ambiguous → check similarity percentage

4. **Require thematic novelty**
   - Not just a geographic variation
   - Not just a practice area swap of existing content
   - Unique angle or new information

---

## Cleanup Tasks

1. ⚠️ **Remove or rename exact duplicates:**
   - Keep: `30-minute-marketing-audit` (older, more established)
   - Remove: `30-minute-marketing-audit-agency-dashboard`

2. ⚠️ **Fix missing frontmatter:**
   - `lawyer-keyword-research`
   - `mobile-first-indexing-and-law-firm-websites-is-yours-actuall`
   - `the-seo-graveyard-why-law-firm-websites-stop-ranking-and-how`

3. 🔄 **Consider consolidating 9 agency comparison posts** into 3-4 definitive guides:
   - Agency Vs. Consultant (general)
   - Agency Contract Red Flags & Negotiation
   - When to Hire In-House, Consultant, or Agency
   - Why Firms Fire Agencies & How to Fix It
