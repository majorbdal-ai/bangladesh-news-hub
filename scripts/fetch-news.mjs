import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_ITEMS = 800;
const NEWS_DATA_PATH = path.join(__dirname, '../data/news.json');

const NEWS_SOURCES = [
  {
    name: 'Prothom Alo',
    url: 'https://feeds.prothomalo.com/bangla/feed',
    language: 'bn'
  },
  {
    name: 'Daily Star',
    url: 'https://www.thedailystar.net/rss/home',
    language: 'en'
  },
  {
    name: 'Bangla News 24',
    url: 'https://banglanews24.com/rss/bangla',
    language: 'bn'
  },
  {
    name: 'Jugantor',
    url: 'https://www.jugantor.com/feed/rss',
    language: 'bn'
  },
  {
    name: 'BBC Bangla',
    url: 'https://www.bbc.com/bengali/index.xml',
    language: 'bn'
  }
];

const CATEGORY_MAP = {
  'politics': { bn: 'রাজনীতি', icon: 'fa-solid fa-landmark' },
  'national': { bn: 'জাতীয়', icon: 'fa-solid fa-flag' },
  'international': { bn: 'আন্তর্জাতিক', icon: 'fa-solid fa-earth-asia' },
  'business': { bn: 'বাণিজ্য ও অর্থনীতি', icon: 'fa-solid fa-chart-line' },
  'economy': { bn: 'অর্থনীতি', icon: 'fa-solid fa-chart-line' },
  'sports': { bn: 'খেলাধুলা', icon: 'fa-solid fa-futbol' },
  'entertainment': { bn: 'বিনোদন', icon: 'fa-solid fa-clapperboard' },
  'technology': { bn: 'প্রযুক্তি', icon: 'fa-solid fa-microchip' },
  'education': { bn: 'শিক্ষা', icon: 'fa-solid fa-graduation-cap' },
  'health': { bn: 'স্বাস্থ্য', icon: 'fa-solid fa-heart-pulse' },
  'weather': { bn: 'আবহাওয়া ও পরিবেশ', icon: 'fa-solid fa-cloud-rain' },
  'bangladesh': { bn: 'বাংলাদেশ', icon: 'fa-solid fa-flag' },
  'crime': { bn: 'অপরাধ ও আইন', icon: 'fa-solid fa-scale-balanced' },
  'religion': { bn: 'ধর্ম', icon: 'fa-solid fa-mosque' },
  'agriculture': { bn: 'কৃষি', icon: 'fa-solid fa-seedling' },
  'opinion': { bn: 'মতামত', icon: 'fa-solid fa-comment-dots' }
};

function detectCategory(title, summary, source) {
  const text = `${title} ${summary}`.toLowerCase();
  const sourceLC = source.toLowerCase();
  
  if (text.includes('রাজনীতি') || text.includes('politics') || text.includes('parliament')) return 'politics';
  if (text.includes('ক্রিকেট') || text.includes('football') || text.includes('sports')) return 'sports';
  if (text.includes('প্রযুক্তি') || text.includes('technology') || text.includes('ai') || text.includes('software')) return 'technology';
  if (text.includes('অর্থনীতি') || text.includes('business') || text.includes('economy') || text.includes('trade')) return 'economy';
  if (text.includes('বিনোদন') || text.includes('entertainment') || text.includes('movie') || text.includes('actor')) return 'entertainment';
  if (text.includes('শিক্ষা') || text.includes('education') || text.includes('university')) return 'education';
  if (text.includes('স্বাস্থ্য') || text.includes('health') || text.includes('medical')) return 'health';
  if (text.includes('আবহাওয়া') || text.includes('weather') || text.includes('environment')) return 'weather';
  if (text.includes('আন্তর্জাতিক') || text.includes('international') || text.includes('global')) return 'international';
  if (text.includes('অপরাধ') || text.includes('crime') || text.includes('police')) return 'crime';
  if (text.includes('ধর্ম') || text.includes('religion') || text.includes('islamic')) return 'religion';
  if (text.includes('কৃষি') || text.includes('agriculture') || text.includes('farmer')) return 'agriculture';
  if (text.includes('মতামত') || text.includes('opinion') || text.includes('column')) return 'opinion';
  
  return 'bangladesh';
}

function fetchRSS(source) {
  return new Promise((resolve) => {
    const req = https.get(source.url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const items = parseRSS(data, source);
          resolve(items);
        } catch (e) {
          console.error(`Error parsing ${source.name}:`, e.message);
          resolve([]);
        }
      });
    }).on('error', (e) => {
      console.error(`Error fetching ${source.name}:`, e.message);
      resolve([]);
    });
    req.end();
  });
}

function parseRSS(xml, source) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemXml);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'No Title';
    
    const descMatch = /<description>([\s\S]*?)<\/description>/.exec(itemXml);
    const summary = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 300) : '';
    
    const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemXml);
    const link = linkMatch ? linkMatch[1].trim() : '';
    
    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml) || /<published>([\s\S]*?)<\/published>/.exec(itemXml);
    const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
    
    const imageMatch = /<image>\s*<url>([\s\S]*?)<\/url>/.exec(itemXml) || /<media:content url="([^"]*)/.exec(itemXml);
    const image = imageMatch ? imageMatch[1].trim() : '';
    
    if (title && title !== 'No Title') {
      const category = detectCategory(title, summary, source.name);
      const categoryMeta = CATEGORY_MAP[category] || CATEGORY_MAP['bangladesh'];
      
      items.push({
        id: Date.now() + Math.random() * 100000,
        title: title.substring(0, 150),
        summary: summary,
        content: `<p>${summary}</p>`,
        category: category,
        categoryBn: categoryMeta.bn,
        pubDate: pubDate,
        image: image,
        source: source.name,
        sourceUrl: link,
        sourceLang: source.language,
        fetchedAt: new Date().toISOString()
      });
    }
  }
  
  return items;
}

async function loadExistingNews() {
  try {
    if (fs.existsSync(NEWS_DATA_PATH)) {
      const content = fs.readFileSync(NEWS_DATA_PATH, 'utf8');
      const data = JSON.parse(content);
      return Array.isArray(data.items) ? data.items : [];
    }
  } catch (e) {
    console.error('Error loading existing news:', e.message);
  }
  return [];
}

function mergeDuplicates(allItems) {
  const uniqueMap = new Map();
  
  for (const item of allItems) {
    const key = item.title.toLowerCase().substring(0, 50);
    if (!uniqueMap.has(key) || new Date(item.pubDate) > new Date(uniqueMap.get(key).pubDate)) {
      uniqueMap.set(key, item);
    }
  }
  
  return Array.from(uniqueMap.values());
}

async function updateNews() {
  console.log(`[${new Date().toISOString()}] Starting news fetch...`);
  
  try {
    const existingNews = await loadExistingNews();
    const newsFetches = await Promise.all(
      NEWS_SOURCES.map(source => fetchRSS(source))
    );
    
    const allFetchedNews = newsFetches.flat();
    console.log(`Fetched ${allFetchedNews.length} articles from all sources`);
    
    const combined = [...allFetchedNews, ...existingNews];
    const merged = mergeDuplicates(combined);
    
    merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    const limited = merged.slice(0, MAX_ITEMS);
    
    const output = {
      generatedAt: new Date().toISOString(),
      totalSources: NEWS_SOURCES.length,
      count: limited.length,
      items: limited
    };
    
    fs.mkdirSync(path.dirname(NEWS_DATA_PATH), { recursive: true });
    fs.writeFileSync(NEWS_DATA_PATH, JSON.stringify(output, null, 2), 'utf8');
    
    const timestamp = new Date().toUTCString();
    fs.writeFileSync(path.join(__dirname, '../.sync-stamp'), timestamp, 'utf8');
    
    console.log(`✓ Updated news.json with ${limited.length} items`);
    console.log(`✓ Sync stamp updated: ${timestamp}`);
  } catch (e) {
    console.error('Fatal error during news update:', e);
    process.exit(1);
  }
}

await updateNews();
