---
title: "How to Set Up GA4 for a Law Firm: The Configuration Guide Agencies Skip"
slug: "ga4-setup-law-firm-guide"
date: 2025-09-24
author: "Joe Hughey"
excerpt: "Most law firm GA4 installations are essentially traffic counters — missing the conversion events, custom dimensions, and integrations that make analytics useful"
tags: ["ga4-law-firm", "ga4-setup-attorney", "google-analytics-law-firm", "law-firm-analytics-configuration"]
seo_title: "How to Set Up GA4 for a Law Firm: The Configuration Guide Agencies Skip"
seo_description: "Most law firm GA4 installations are essentially traffic counters — missing the conversion events, custom dimensions, and integrations that make analytics useful"
draft: false
image: "/images/blog/ga4-setup-law-firm-guide.jpg"
---

There's a version of Google Analytics 4 that's useful for a law firm — and a version installed on most law firm websites. The version installed on most law firm websites is a tracking code that records pageviews and sessions. Usable — but barely. It tells you almost nothing about what's actually driving leads and cases.

The useful version requires configuration work that takes 3–6 hours to do correctly — and that most content agencies either don't know how to do or don't include in their scope.

## Why GA4 Setup Matters More Than Most Firms Realize

GA4 is the central nervous system of your marketing attribution stack. When properly configured, it collects and routes the conversion data that enables: Google Ads smart bidding to optimize toward actual leads rather than clicks; accurate source attribution for every form submission and phone call; identification of which pages and content are generating qualified prospects; and the foundation for [true marketing ROI tracking](/blog/) from first click to signed retainer.

## Step 1: Implement via Google Tag Manager

Set up [Google Tag Manager](/blog/) (GTM) as your implementation layer. GTM allows you to deploy and update tracking code without editing the site's source code directly. All tracking changes can be made in GTM without developer involvement, additional platforms can be added without new code deployments, and GTM's preview and debug mode lets you verify tracking before publishing.

Install GTM on every page of your website, then deploy GA4 through a GTM tag rather than directly in the site code.

## Step 2: Configure Conversion Events

This is the most important configuration step and the one most commonly skipped. Conversion events every law firm website needs:

**Contact form submission** — fires when a visitor successfully submits any contact or intake form. Configure via GTM trigger on form submission confirmation or on the thank-you page URL.

**Phone number click** — fires when a visitor clicks a phone number link on mobile. Configure via a GTM click trigger on elements with your phone number's href value.

**Consultation booking completion** — fires when a consultation is successfully booked via [Calendly](/blog/) or embedded booking tool.

**Live chat initiation** — fires when a visitor initiates a conversation via live chat.

Once configured in GTM, mark each as a conversion in GA4 (Admin → Events → toggle the Conversion switch).

## Step 3: Connect CallRail

As detailed in our [CallRail setup guide](/blog/), configure CallRail to push call events into GA4 as conversion events. Once in place, phone calls appear in your GA4 conversion reports alongside form submissions — a complete view of all leads, not just digital forms.

## Step 4: Configure Custom Dimensions

Custom dimensions allow you to attach additional data to your GA4 events not captured by default. For a law firm, configure:

- **Practice area** — tag pages and events with the relevant practice area so you can analyze conversion rates by practice area

- **Lead type** — tag form submissions with the type of matter indicated if your form includes a matter type field

- **Geographic region** — useful for firms serving multiple markets (Tampa vs. St. Pete vs. Clearwater)

## Step 5: Link to Google Ads and Search Console

In GA4, go to Admin → Product Links and connect:

- **Google Ads** — enables conversion import, audience sharing, and bidirectional data flow. Mark your conversion events as Google Ads import-eligible to enable smart bidding optimization.

- **Google Search Console** — enables organic search query data to appear in GA4 reports, connecting search ranking performance to on-site behavior and conversions.

## Step 6: Build the Core Reports Dashboard

Build a custom exploration (GA4 → Explore → Free Form) for monthly review: organic sessions by geographic region; conversion events by source/medium; landing page by conversion events; practice area page engagement rate. This dashboard, reviewed monthly alongside your [CallRail](/blog/) reports and intake CRM data, is the core of the [analytics review process](/blog/) we recommend for law firms.

<hr />
<div>

**Want GA4 configured correctly — the first time?** We implement the complete configuration as part of our attribution stack setup.

[Set Up My Analytics Properly →](/blog/)
</div>

### Related Reading

- [The Law Firm Marketing Technology Stack: A Complete Guide](/blog/ai-tools-law-firm-marketing/)

- [CallRail for Law Firms: The Complete Setup Guide](/blog/callrail-law-firm-setup-guide/)

- [What Your Law Firm's Website Analytics Are Actually Telling You](/blog/law-firm-website-analytics/)

- [Track Law Firm Marketing ROI From First Click to Signed Retainer](/blog/law-firm-marketing-roi-tracking/)