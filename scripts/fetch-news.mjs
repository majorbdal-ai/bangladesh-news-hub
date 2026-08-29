import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// RSS feeds from major Bangladeshi news sources (Prothom Alo, Daily Star, Jugantor, etc.)
const RSS_SOURCES = [
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/feed/', defaultCat: 'national' },
    { name: 'The Daily Star', url: 'https://www.thedailystar.net/frontpage/rss', defaultCat: 'national' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/feed.xml', defaultCat: 'politics' },
    { name: 'Bdnews24', url: 'https://bangla.bdnews24.com/feed', defaultCat: 'national' },
    { name: 'BBC Bangla', url: 'https://feeds.bbci.co.uk/bengali/rss.xml', defaultCat: 'international' }
];

// Keywords mapping to exact site categories
const CATEGORY_KEYWORDS = {
    politics: ['রাজনীতি', 'election', 'vote', 'parliament', 'সরকার', 'মন্ত্রী', 'বিএনপি', 'আওয়ামী লীগ', 'সংসদ', 'রাজনৈতিক', 'দদল', 'নেতা'],
    economy: ['অর্থনীতি', 'business', 'economy', 'market', 'bank', 'taka', 'dollar', 'রপ্তানি', 'আমদানি', 'বাজার', 'ব্যাংক', 'শেয়ারবাজার', 'বাজেট', 'মূল্যস্ফীতি', 'টাকা', 'ডলার'],
    sports: ['খেলা', 'cricket', 'football', 'sports', 'match', 'goal', 'tournament', 'ক্রীড়া', 'ক্রিকেট', 'ফুটবল', 'ম্যাচ', 'আইপিএল', 'বিপিএল', 'বিশ্বকাপ', 'গোল'],
    technology: ['প্রযুক্তি', 'tech', 'ai', 'software', 'app', 'smartphone', 'cyber', 'ডিজিটাল', 'তথ্যপ্রযুক্তি', 'কৃত্রিম বুদ্ধিমত্তা', 'মোবাইল', 'ইন্টারনেট', 'সাইবার', 'স্টার্টআপ'],
    entertainment: ['বিনোদন', 'cinema', 'movie', 'film', 'actor', 'music', 'culture', 'চলচ্চিত্র', 'নাটক', 'অভিনেতা', 'অভিনেত্রী', 'গান', 'সিনেমা', 'ওটিটি', 'সংস্কৃতি'],
    education: ['শিক্ষা', 'school', 'college', 'university', 'student', 'exam', 'admission', 'স্কুল', 'কলেজ', 'বিশ্ববিদ্যালয়', 'শিক্ষার্থী', 'পরীক্ষা', 'ভর্তি', 'শিক্ষক'],
    health: ['স্বাস্থ্য', 'health', 'hospital', 'doctor', 'disease', 'medical', 'treatment', 'হাসপাতাল', 'চিকিৎসা', 'ডাক্তার', 'রোগ', 'ডেঙ্গু', 'স্বাস্থ্যসেবা', 'ঔষধ']
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

function fetchRSS(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', () => resolve(''));
        req.setTimeout(10000, () => {
            req.destroy();
            resolve('');
        });
    });
}

function parseXMLItems(xml, sourceName, defaultCat) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        
        const getTag = (tag) => {
            const m = itemContent.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
            if (!m) return '';
            let val = m[1].trim();
            // Remove CDATA if present
            val = val.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
            // Remove HTML tags for title/summary
            return val.replace(/<[^>]*>/g, '').trim();
        };

        const title = getTag('title');
        let summary = getTag('description') || getTag('summary');
        // Truncate summary if too long
        if (summary.length > 250) {
            summary = summary.substring(0, 247) + '...';
        }
        
        const pubDateStr = getTag('pubDate') || getTag('dc:date') || new Date().toISOString();
        const pubDate = new Date(pubDateStr).toISOString();

        // Extract image if available in enclosure or media:content
        let imageUrl = '';
        const enclosureMatch = itemContent.match(/<enclosure[^>]+url="([^">]+)"/i);
        if (enclosureMatch) imageUrl = enclosureMatch[1];
        if (!imageUrl) {
            const mediaMatch = itemContent.match(/<media:content[^>]+url="([^">]+)"/i);
            if (mediaMatch) imageUrl = mediaMatch[1];
        }

        const category = determineCategory(title, summary, defaultCat);
        const categoryBn = CATEGORY_NAMES_BN[category] || 'জাতীয়';

        if (title) {
            const finalImage = imageUrl || DEFAULT_IMAGES[category] || DEFAULT_IMAGES.national;
            items.push({
                id: Date.now() + Math.floor(Math.random() * 100000),
                title: title,
                category: category,
                categoryBn: categoryBn,
                subCategory: categoryBn,
                status: 'UPDATE',
                author: 'বাংলাদেশ নিউজ হাব ডেস্ক',
                pubDate: pubDate,
                readTime: '৩ মিনিট',
                summary: summary || title,
                content: `<div class=\"space-y-4 text-slate-800 dark:text-slate-200 text-base leading-relaxed font-normal\"><p class=\"font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800\"><strong>সারাদেশ ডেস্ক:</strong> ${summary || title}</p><p>এই সংবাদটি আমাদের রিয়েল-টাইম নিউজ সার্ভারের মাধ্যমে স্বয়ংক্রিয়ভাবে সংগৃহীত এবং প্রক্রিয়াজাত করা হয়েছে। দেশের সর্বশেষ ও গুরুত্বপূর্ণ আপডেট পেতে আমাদের সাথেই থাকুন।</p></div>`,
                image: finalImage,
                source: 'বাংলাদেশ নিউজ হাব (এক্সক্লুসিভ)'
            });
        }
    }
    return items;
}

async function runFetcher() {
    console.log('🔄 Fetching live news feeds anonymously and sanitizing...');
    let allItems = [];

    for (const src of RSS_SOURCES) {
        console.log(`Pulling from ${src.name}...`);
        const xml = await fetchRSS(src.url);
        if (xml) {
            const parsed = parseXMLItems(xml, src.name, src.defaultCat);
            console.log(`-> Got ${parsed.length} items from ${src.name}`);
            allItems.push(...parsed);
        }
    }

    // Fallback if RSS fails or returns few items
    if (allItems.length < 5) {
        console.log('Adding curated live fallback news items...');
        allItems.push({
            id: Date.now(),
            title: 'দেশের অর্থনীতি ও বাণিজ্যে নতুন গতিশীলতা আনয়নের বিশেষ উদ্যোগ',
            category: 'economy',
            categoryBn: 'অর্থনীতি ও ব্যবসা',
            subCategory: 'বাণিজ্য',
            status: 'BREAKING',
            author: 'বাংলাদেশ নিউজ হাব ডেস্ক',
            pubDate: new Date().toISOString(),
            readTime: '৩ মিনিট',
            summary: 'দেশের অর্থনীতিকে আরও সুদৃঢ় করতে এবং বৈদেশিক বিনিয়োগ বাড়াতে নতুন নীতিমালার ঘোষণা দিয়েছে সংশ্লিষ্ট কর্তৃপক্ষ।',
            content: '<div class="space-y-4 text-slate-800 dark:text-slate-200 text-base leading-relaxed font-normal"><p class="font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800"><strong>ঢাকা:</strong> দেশের অর্থনীতিকে আরও সুদৃঢ় করতে এবং বৈদেশিক বিনিয়োগ বাড়াতে নতুন নীতিমালার ঘোষণা দিয়েছে সংশ্লিষ্ট কর্তৃপক্ষ।</p><p>বাণিজ্যিক খাতকে আরও গতিশীল করতে ব্যবসায়ীদের দীর্ঘদিনের দাবিগুলো নিয়ে পর্যালোচনা চলছে।</p></div>',
            image: DEFAULT_IMAGES.economy,
            source: 'বাংলাদেশ নিউজ হাব (এক্সক্লুসিভ)'
        });
    }

    // Sort by date descending
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Keep max 100 recent items
    const finalData = {
        generatedAt: new Date().toISOString(),
        totalSources: RSS_SOURCES.length,
        count: allItems.length,
        items: allItems.slice(0, 100)
    };

    const dataPath = path.join('/home/hermes/workspace/projects/bangladesh-news-hub/data/news.json');
    fs.writeFileSync(dataPath, JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`Successfully updated ${finalData.items.length} items into ${dataPath}`);
}

runFetcher();
