#!/usr/bin/env node
/**
 * Bangladesh News Hub — real news fetcher
 * ----------------------------------------
 * Pulls live headlines from real RSS feeds of major Bangladeshi (and Bengali)
 * news outlets, auto-categorizes them, de-duplicates against history, and
 * writes the merged result to data/news.json.
 *
 * Deliberately ZERO npm dependencies (only Node's built-in `https`/`http`/`fs`)
 * so this keeps working for years without `npm install` ever breaking it.
 * Every feed is fetched independently and wrapped in try/catch — if one
 * source goes down or changes its RSS format, the rest still update.
 *
 * Run with: node scripts/fetch-news.mjs
 */

import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'data', 'news.json');
const MAX_ITEMS = 800; // keeps the site fast; history still spans weeks
const FETCH_TIMEOUT_MS = 15000;

// ---------------------------------------------------------------------------
// Sources — plain whole-site RSS feeds. Kept intentionally simple (one feed
// per outlet, not per-category) because category-specific feed URLs change
// far more often than a paper's main feed does. Category is inferred below
// from the URL slug + title keywords instead, which is much more durable.
// ---------------------------------------------------------------------------
const SOURCES = [
  { name: 'প্রথম আলো', url: 'https://www.prothomalo.com/feed/', lang: 'bn' },
  { name: 'দ্য ডেইলি স্টার (বাংলা)', url: 'https://bangla.thedailystar.net/rss', lang: 'bn' },
  { name: 'The Daily Star', url: 'https://www.thedailystar.net/frontpage/rss.xml', lang: 'en' },
  { name: 'বাংলা নিউজ ২৪', url: 'https://www.banglanews24.com/rss/rss.xml', lang: 'bn' },
  { name: 'যুগান্তর', url: 'https://www.jugantor.com/feed/rss.xml', lang: 'bn' },
  { name: 'জাগো নিউজ ২৪', url: 'https://www.jagonews24.com/rss/rss.xml', lang: 'bn' },
  { name: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/rss.xml', lang: 'bn' },
  { name: 'বিডিনিউজ২৪', url: 'https://rss.bdnews24.com/rss/bangla/home/rss.xml', lang: 'bn' },
  { name: 'বিবিসি বাংলা', url: 'https://www.bbc.com/bengali/index.xml', lang: 'bn' },
  { name: 'বিবিসি বাংলা', url: 'http://www.bbc.co.uk/bengali/index.xml', lang: 'bn' }, // fallback mirror
];

// ---------------------------------------------------------------------------
// Category inference — looks at the URL path + title (Bangla & English
// keywords) rather than relying on a fixed feed-to-category map, since a
// single whole-site feed mixes every topic together.
// ---------------------------------------------------------------------------
const CATEGORY_RULES = [
  { id: 'sports', bn: 'খেলাধুলা', kw: ['খেলা', 'ক্রিকেট', 'ফুটবল', 'বিপিএল', 'টাইগার', 'sport', 'cricket', 'football', 'bpl'] },
  { id: 'international', bn: 'আন্তর্জাতিক', kw: ['আন্তর্জাতিক', 'বিশ্ব', 'world', 'international'] },
  { id: 'business', bn: 'অর্থনীতি ও বাণিজ্য', kw: ['অর্থনীতি', 'বাণিজ্য', 'ব্যাংক', 'শেয়ারবাজার', 'বাজেট', 'business', 'economy', 'trade', 'market'] },
  { id: 'entertainment', bn: 'বিনোদন', kw: ['বিনোদন', 'চলচ্চিত্র', 'নাটক', 'সিনেমা', 'entertainment', 'cinema', 'showbiz'] },
  { id: 'technology', bn: 'প্রযুক্তি', kw: ['প্রযুক্তি', 'টেক', 'technology', 'tech', 'science-technology'] },
  { id: 'education', bn: 'শিক্ষা', kw: ['শিক্ষা', 'ভর্তি', 'education', 'campus'] },
  { id: 'health', bn: 'স্বাস্থ্য', kw: ['স্বাস্থ্য', 'হাসপাতাল', 'health'] },
  { id: 'politics', bn: 'রাজনীতি', kw: ['রাজনীতি', 'নির্বাচন', 'politics', 'election'] },
  { id: 'opinion', bn: 'মতামত', kw: ['মতামত', 'opinion', 'editorial'] },
  { id: 'national', bn: 'জাতীয়', kw: ['জাতীয়', 'বাংলাদেশ', 'national', 'bangladesh'] },
];
const DEFAULT_CATEGORY = { id: 'national', bn: 'জাতীয়' };

function categorize(title, link) {
  const hay = `${title} ${link}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.kw.some((k) => hay.includes(k.toLowerCase()))) {
      return { id: rule.id, bn: rule.bn };
    }
  }
  return DEFAULT_CATEGORY;
}

// ---------------------------------------------------------------------------
// Tiny HTTP(S) GET with timeout + redirect following (no dependencies)
// ---------------------------------------------------------------------------
function fetchUrl(urlStr, redirects = 5) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(urlStr);
    } catch (e) {
      return reject(new Error(`Invalid URL: ${urlStr}`));
    }
    const lib = target.protocol === 'http:' ? http : https;
    const req = lib.get(
      target,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BangladeshNewsHubBot/1.0; +https://github.com)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        timeout: FETCH_TIMEOUT_MS,
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
          res.resume();
          const nextUrl = new URL(res.headers.location, target).toString();
          return resolve(fetchUrl(nextUrl, redirects - 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${urlStr}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      }
    );
    req.on('timeout', () => req.destroy(new Error(`Timeout fetching ${urlStr}`)));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Minimal, dependency-free RSS/Atom parser. Standard feeds only — good
// enough for every source in SOURCES above; anything odd is simply skipped
// per-item rather than crashing the whole run.
// ---------------------------------------------------------------------------
function decodeEntities(str = '') {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/<[^>]+>/g, '') // strip any leftover inline HTML tags
    .trim();
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
}

function extractImage(block) {
  let m = block.match(/<media:content[^>]*url=["']([^"']+)["']/i);
  if (m) return m[1];
  m = block.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
  if (m) return m[1];
  m = block.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i);
  if (m) return m[1];
  m = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  return '';
}

function parseRss(xml) {
  const items = [];
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const itemTag = isAtom ? 'entry' : 'item';
  const itemRe = new RegExp(`<${itemTag}[\\s\\S]*?<\\/${itemTag}>`, 'gi');
  const blocks = xml.match(itemRe) || [];

  for (const block of blocks) {
    let title = decodeEntities(extractTag(block, 'title'));
    let link = '';
    if (isAtom) {
      const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = linkMatch ? linkMatch[1] : '';
    } else {
      link = decodeEntities(extractTag(block, 'link'));
      if (!link) {
        const guid = block.match(/<guid[^>]*isPermaLink=["']true["'][^>]*>([\s\S]*?)<\/guid>/i);
        if (guid) link = decodeEntities(guid[1]);
      }
    }
    const descRaw = extractTag(block, 'description') || extractTag(block, 'summary') || extractTag(block, 'content:encoded') || extractTag(block, 'content');
    const summary = decodeEntities(descRaw).slice(0, 400);
    const pubDateRaw = extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated') || extractTag(block, 'dc:date');
    const image = extractImage(block) || extractImage(descRaw);

    if (!title || !link) continue;

    let pubDate = new Date(pubDateRaw);
    if (isNaN(pubDate.getTime())) pubDate = new Date();

    items.push({ title, link, summary, image, pubDate: pubDate.toISOString() });
  }
  return items;
}

function makeId(link) {
  // small stable hash, dependency-free
  let h = 0;
  for (let i = 0; i < link.length; i++) {
    h = (h * 31 + link.charCodeAt(i)) | 0;
  }
  return `n${(h >>> 0).toString(36)}`;
}

async function fetchSource(source) {
  try {
    const xml = await fetchUrl(source.url);
    const items = parseRss(xml);
    return items.map((it) => {
      const cat = categorize(it.title, it.link);
      return {
        id: makeId(it.link),
        title: it.title,
        summary: it.summary,
        link: it.link,
        image: it.image || '',
        source: source.name,
        sourceLang: source.lang,
        category: cat.id,
        categoryBn: cat.bn,
        pubDate: it.pubDate,
        fetchedAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error(`[skip] ${source.name} (${source.url}) -> ${err.message}`);
    return [];
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Fetching ${SOURCES.length} sources...`);

  const results = await Promise.all(SOURCES.map(fetchSource));
  const fresh = results.flat();
  console.log(`Fetched ${fresh.length} raw items.`);

  let existing = [];
  if (fs.existsSync(OUT_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
      existing = Array.isArray(parsed.items) ? parsed.items : [];
    } catch {
      existing = [];
    }
  }

  const byId = new Map();
  for (const it of existing) byId.set(it.id, it);
  for (const it of fresh) byId.set(it.id, it); // fresh data wins on conflict

  let merged = Array.from(byId.values());
  merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  if (merged.length > MAX_ITEMS) merged = merged.slice(0, MAX_ITEMS);

  const categoryCounts = {};
  for (const it of merged) {
    categoryCounts[it.category] = (categoryCounts[it.category] || 0) + 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    totalSources: SOURCES.length,
    count: merged.length,
    categoryCounts,
    items: merged,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ${merged.length} items to ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error('Fatal error in fetch-news.mjs:', err);
  process.exitCode = 1;
});
