import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// Comprehensive RSS feed sources for Bangladeshi news portals
const RSS_SOURCES = [
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/feed/', defaultCat: 'national' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/feed.xml', defaultCat: 'politics' },
    { name: 'Bdnews24 Bangla', url: 'https://bangla.bdnews24.com/feed', defaultCat: 'national' },
    { name: 'BBC Bangla', url: 'https://feeds.bbci.co.uk/bengali/rss.xml', defaultCat: 'international' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/rss.xml', defaultCat: 'national' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/feed/', defaultCat: 'national' },
    { name: 'Samakal', url: 'https://samakal.com/feed/', defaultCat: 'national' },
    { name: 'Bangla Tribune', url: 'https://www.banglatribune.com/feed/', defaultCat: 'national' }
];

// Category keyword mapping
const CATEGORY_KEYWORDS = {
    politics: ['রাজনীতি', 'election', 'vote', 'parliament', 'সরকার', 'মন্ত্রী', 'বিএনপি', 'আওয়ামী লীগ', 'সংসদ', 'রাজনৈতিক', 'নেতা'],
    economy: ['অর্থনীতি', 'business', 'economy', 'market', 'bank', 'taka', 'dollar', 'রপ্তানি', 'আমদানি', 'বাজার', 'ব্যাংক', 'শেয়ারবাজার', 'বাজেট', 'মূল্যস্ফীতি'],
    sports: ['খেলা', 'cricket', 'football', 'sports', 'match', 'goal', 'tournament', 'ক্রীড়া', 'ক্রিকেট', 'ফুটবল', 'ম্যাচ', 'আইপিএল', 'বিপিএল', 'বিশ্বকাপ'],
    technology: ['প্রযুক্তি', 'tech', 'ai', 'software', 'app', 'smartphone', 'cyber', 'ডিজিটাল', 'তথ্যপ্রযুক্তি', 'কৃত্রিম বুদ্ধিমত্তা', 'মোবাইল', 'ইন্টারনেট'],
    entertainment: ['বিনোদন', 'cinema', 'movie', 'film', 'actor', 'music', 'culture', 'চলচ্চিত্র', 'নাটক', 'অভিনেতা', 'অভিনেত্রী', 'গান', 'সিনেমা', 'ওটিটি'],
    education: ['শিক্ষা', 'school', 'college', 'university', 'student', 'exam', 'admission', 'স্কুল', 'কলেজ', 'বিশ্ববিদ্যালয়', 'শিক্ষার্থী', 'পরীক্ষা', 'ভর্তি'],
    health: ['স্বাস্থ্য', 'health', 'hospital', 'doctor', 'disease', 'medical', 'treatment', 'হাসপাতাল', 'চিকিৎসা', 'ডাক্তার', 'রোগ', 'ডেঙ্গু']
};

function determineCategory(title, summary, defaultCat) {
    const text = (title + ' ' + summary).toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of keywords) {
            if (text.includes(kw.toLowerCase())) {
                return cat;
            }
        }
    }
    return defaultCat;
}

const CATEGORY_NAMES_BN = {
    national: 'জাতীয়',
    politics: 'রাজনীতি',
    economy: 'অর্থনীতি ও ব্যবসা',
    sports: 'খেলাধুলা',
    technology: 'প্রযুক্তি',
    entertainment: 'বিনোদন',
    education: 'শিক্ষা',
    health: 'স্বাস্থ্য',
    international: 'আন্তর্জাতিক'
};

const DEFAULT_IMAGES = {
    national: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    politics: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80',
    economy: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    sports: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    entertainment: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
    education: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
    health: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    international: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80'
};

function fetchURL(urlString) {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(urlString);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            const req = client.get(parsedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let redirectUrl = res.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
                    }
                    return fetchURL(redirectUrl).then(resolve);
                }
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', () => resolve(''));
            req.setTimeout(8000, () => {
                req.destroy();
                resolve('');
            });
        } catch {
            resolve('');
        }
    });
}

function parseXMLItems(xml, defaultCat) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        
        const getTag = (tag) => {
            const m = itemContent.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
            if (!m) return '';
            let val = m[1].trim();
            val = val.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
            return val.replace(/<[^>]*>/g, '').trim();
        };

        const title = getTag('title');
        let summary = getTag('description') || getTag('summary');
        if (summary.length > 250) {
            summary = summary.substring(0, 247) + '...';
        }
        
        const pubDateStr = getTag('pubDate') || getTag('dc:date') || new Date().toISOString();
        let pubDate;
        try {
            pubDate = new Date(pubDateStr).toISOString();
        } catch {
            pubDate = new Date().toISOString();
        }

        // Extract image
        let imageUrl = '';
        const enclosureMatch = itemContent.match(/<enclosure[^>]+url="([^">]+)"/i);
        if (enclosureMatch) imageUrl = enclosureMatch[1];
        if (!imageUrl) {
            const mediaMatch = itemContent.match(/<media:content[^>]+url="([^">]+)"/i);
            if (mediaMatch) imageUrl = mediaMatch[1];
        }
        if (!imageUrl) {
            const imgTagMatch = itemContent.match(/<img[^>]+src="([^">]+)"/i);
            if (imgTagMatch) imageUrl = imgTagMatch[1];
        }

        const category = determineCategory(title, summary, defaultCat);
        const categoryBn = CATEGORY_NAMES_BN[category] || 'জাতীয়';

        if (title) {
            const finalImage = imageUrl || DEFAULT_IMAGES[category] || DEFAULT_IMAGES.national;
            items.push({
                id: Date.now() + Math.floor(Math.random() * 1000000),
                title: title,
                category: category,
                categoryBn: categoryBn,
                subCategory: categoryBn,
                status: 'UPDATE',
                author: 'বাংলাদেশ নিউজ হাব ডেস্ক',
                pubDate: pubDate,
                readTime: '৩ মিনিট',
                summary: summary || title,
                content: `<div class="space-y-4 text-slate-800 dark:text-slate-200 text-base leading-relaxed font-normal"><p class="font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800"><strong>বিশেষ প্রতিবেদন:</strong> ${summary || title}</p><p>এই সংবাদটি আমাদের রিয়েল-টাইম নিউজ সার্ভারের মাধ্যমে স্বয়ংক্রিয়ভাবে সংগৃহীত এবং প্রক্রিয়াজাত করা হয়েছে। দেশের সর্বশেষ ও গুরুত্বপূর্ণ আপডেট পেতে আমাদের সাথেই থাকুন।</p></div>`,
                image: finalImage,
                source: 'বাংলাদেশ নিউজ হাব (এক্সক্লুসিভ)'
            });
        }
    }
    return items;
}

async function runFetcher() {
    console.log('🔄 Fetching from multi-site RSS sources...');
    
    // Load used images tracking file
    const usedImagesPath = path.join('/home/hermes/workspace/projects/bangladesh-news-hub/data/used-images.json');
    let usedImagesData = { images: [] };
    try {
        if (fs.existsSync(usedImagesPath)) {
            usedImagesData = JSON.parse(fs.readFileSync(usedImagesPath, 'utf-8'));
        }
    } catch {
        usedImagesData = { images: [] };
    }

    let usedImagesSet = new Set(usedImagesData.images || []);

    let allItems = [];

    for (const src of RSS_SOURCES) {
        try {
            console.log(`Checking ${src.name}...`);
            const xml = await fetchURL(src.url);
            if (xml) {
                const parsed = parseXMLItems(xml, src.defaultCat);
                console.log(`-> Got ${parsed.length} items from ${src.name}`);
                allItems.push(...parsed);
            }
        } catch (e) {
            console.log(`-> Skipped ${src.name} due to fetch error.`);
        }
    }

    let filteredItems = [];
    for (const item of allItems) {
        if (usedImagesSet.has(item.image)) {
            item.image = DEFAULT_IMAGES[item.category] || DEFAULT_IMAGES.national;
        }
        usedImagesSet.add(item.image);
        filteredItems.push(item);
    }

    // Load existing news.json to merge/prepend properly without overwriting
    const newsPath = path.join('/home/hermes/workspace/projects/bangladesh-news-hub/data/news.json');
    let existingItems = [];
    try {
        if (fs.existsSync(newsPath)) {
            const existingData = JSON.parse(fs.readFileSync(newsPath, 'utf-8'));
            if (Array.isArray(existingData.items)) {
                existingItems = existingData.items;
            }
        }
    } catch {
        existingItems = [];
    }

    const existingTitles = new Set(existingItems.map(i => i.title));
    const newUniqueItems = filteredItems.filter(i => !existingTitles.has(i.title));

    console.log(`-> Added ${newUniqueItems.length} new unique items.`);

    const combinedItems = [...newUniqueItems, ...existingItems];
    combinedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const finalItems = combinedItems.slice(0, 150);

    const finalData = {
        generatedAt: new Date().toISOString(),
        totalSources: RSS_SOURCES.length,
        count: finalItems.length,
        items: finalItems
    };

    fs.writeFileSync(newsPath, JSON.stringify(finalData, null, 2), 'utf-8');

    const imagesArray = Array.from(usedImagesSet).slice(-300);
    fs.writeFileSync(usedImagesPath, JSON.stringify({ images: imagesArray }, null, 2), 'utf-8');

    console.log(`Successfully updated news.json with ${finalData.items.length} total items.`);
}

runFetcher();
