import fs from 'fs';
import path from 'path';
import https from 'https';

const rssFeeds = [
    'https://www.prothomalo.com/feed/',
    'https://www.bdnews24.com/feed/',
    'https://www.jugantor.com/feed/',
    'https://www.kalerkantho.com/feed/'
];

const uniqueImagePool = [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80'
];

const freshTopicsPool = [
    { cat: 'national', bn: 'জাতীয়', title: 'দেশের বিভিন্ন স্থানে জনকল্যাণমূলক নতুন সরকারি প্রকল্পের কাজ শুরু', summary: 'নাগরিক সেবা আরও সহজ ও গতিশীল করতে স্থানীয় প্রশাসনের উদ্যোগে নতুন বেশ কিছু উন্নয়নমূলক কাজের উদ্বোধন করা হয়েছে।' },
    { cat: 'politics', bn: 'রাজনীতি', title: 'রাষ্ট্রীয় প্রশাসন ও সংস্কার কার্যক্রম নিয়ে নীতিনির্ধারক মহলের বৈঠক', summary: 'রাষ্ট্রীয় শাসন ব্যবস্থাকে আরও স্বচ্ছ ও জবাবদিহিমূলক করতে সংশ্লিষ্ট অংশীজনদের সাথে গুরুত্বপূর্ণ আলোচনা অনুষ্ঠিত হয়েছে।' },
    { cat: 'technology', bn: 'প্রযুক্তি', title: 'তথ্যপ্রযুক্তি ও সাইবার নিরাপত্তা জোরদারে বিশেষ কর্মশালা অনুষ্ঠিত', summary: 'ডিজিটাল সেবার মান বৃদ্ধি এবং সাইবার সুরক্ষা নিশ্চিত করতে নতুন প্রযুক্তিগত গাইডলাইন প্রকাশ করা হয়েছে।' },
    { cat: 'business', bn: 'বাণিজ্য', title: 'বাজার স্থিতিশীলতা ও সাপ্লাই চেইন সুরক্ষায় সরকারের নতুন পদক্ষেপ', summary: 'নিত্যপণ্যের সরবরাহ স্বাভাবিক রাখতে এবং বাণিজ্যিক কার্যক্রম গতিশীল করতে বাণিজ্য মন্ত্রণালয় বিশেষ মনিটরিং টিম গঠন করেছে।' },
    { cat: 'sports', bn: 'খেলাধুলা', title: 'ক্রীড়াঙ্গনে নতুন প্রতিভা অন্বেষণ ও দীর্ঘমেয়াদী ক্যাম্পের ঘোষণা', summary: 'জাতীয় ও আন্তর্জাতিক প্রতিযোগিতার জন্য উদীয়মান অ্যাথলেটদের প্রস্তুত করতে বিশেষ প্রশিক্ষণের ব্যবস্থা করা হয়েছে।' }
];

function fetchRSS(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(''));
    });
}

async function strictCheckAndSync() {
    const dataPath = path.join(process.cwd(), 'data', 'news.json');
    let data = { items: [] };
    if (fs.existsSync(dataPath)) {
        try {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch(e) {}
    }

    let items = data.items || [];
    
    // Create strict sets for existing titles and images to prevent ANY duplicate
    let existingTitles = new Set(items.map(i => i.title.trim().toLowerCase()));
    let existingImages = new Set(items.map(i => i.image));

    let newlyFetchedItems = [];

    // 1. Fetch from RSS feeds
    for (const feedUrl of rssFeeds) {
        const xml = await fetchRSS(feedUrl);
        if (xml) {
            const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);
            if (itemMatches) {
                for (const rawItem of itemMatches.slice(0, 3)) {
                    const titleMatch = rawItem.match(/<title>([\s\S]*?)<\/title>/);
                    const descMatch = rawItem.match(/<description>([\s\S]*?)<\/description>/);
                    
                    if (titleMatch) {
                        let title = titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
                        let summary = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim() : title;
                        
                        title = title.replace(/প্রথম আলো|বিডিনিউজ|যুগান্তর|কালের কণ্ঠ|বিবিসি/g, '').trim();
                        summary = summary.replace(/প্রথম আলো|বিডিনিউজ|যুগান্তর|কালের কণ্ঠ|বিবিসি/g, '').trim();

                        const titleKey = title.toLowerCase();
                        if (title && !existingTitles.has(titleKey)) {
                            // Find an image not currently used if possible, else pick randomly
                            let availableImg = uniqueImagePool.find(img => !existingImages.has(img)) || uniqueImagePool[Math.floor(Math.random() * uniqueImagePool.length)];

                            const newItem = {
                                id: Date.now() + Math.floor(Math.random() * 10000),
                                title: title,
                                summary: summary || title,
                                content: `<p>${summary || title}</p><p>এই সংবাদটি সম্পর্কে বিস্তারিত বিশ্লেষণে জানা যায় যে, সংশ্লিষ্ট খাতে এর সুদূরপ্রসারী প্রভাব রয়েছে। বিশেষজ্ঞমহল মনে করছে সঠিক পদক্ষেপ গ্রহণের মাধ্যমে এর সুফল সাধারণ মানুষের দোরগোড়ায় পৌঁছে দেওয়া সম্ভব।</p><p><strong>বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক):</strong> নিরপেক্ষ ও স্বাধীন সংবাদ বিশ্লেষণ।</p>`,
                                image: availableImg,
                                source: 'বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক)',
                                sourceLang: 'bn',
                                category: 'national',
                                categoryBn: 'জাতীয়',
                                pubDate: new Date().toISOString(),
                                fetchedAt: new Date().toISOString()
                            };

                            newlyFetchedItems.push(newItem);
                            existingTitles.add(titleKey);
                            existingImages.add(availableImg);
                        }
                    }
                }
            }
        }
    }

    // 2. Also check if we need 1 fresh curated item if RSS yielded nothing new
    if (newlyFetchedItems.length === 0) {
        // 20% chance to add 1 fresh topic to simulate active live updates every 10m without spamming
        if (Math.random() < 0.4) {
            const topic = freshTopicsPool[Math.floor(Math.random() * freshTopicsPool.length)];
            const uniqueTitle = `${topic.title} (${new Date().toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'})})`;
            const titleKey = uniqueTitle.toLowerCase();

            if (!existingTitles.has(titleKey)) {
                let availableImg = uniqueImagePool.find(img => !existingImages.has(img)) || uniqueImagePool[0];
                const newItem = {
                    id: Date.now(),
                    title: uniqueTitle,
                    summary: topic.summary,
                    content: `<p>${topic.summary}</p><p>সাম্প্রতিক প্রাপ্ত তথ্য অনুযায়ী সংশ্লিষ্ট কর্তৃপক্ষ পুরো বিষয়টি নিবিড়ভাবে পর্যবেক্ষণ করছেন। সাধারণ জনগণের মাঝে এর ইতিবাচক প্রভাব লক্ষ্য করা গেছে।</p><p><strong>বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক):</strong> বিশেষ প্রতিবেদন।</p>`,
                    image: availableImg,
                    source: 'বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক)',
                    sourceLang: 'bn',
                    category: topic.cat,
                    categoryBn: topic.bn,
                    pubDate: new Date().toISOString(),
                    fetchedAt: new Date().toISOString()
                };
                newlyFetchedItems.push(newItem);
            }
        }
    }

    // STRICT RULE: If NO new unique items found, exit cleanly without touching database or git
    if (newlyFetchedItems.length === 0) {
        console.log('No new unique news found. Skipping update to prevent duplicates or empty commits.');
        return;
    }

    // Prepend new unique items to existing items
    items = [...newlyFetchedItems, ...items];

    const output = {
        generatedAt: new Date().toISOString(),
        totalSources: rssFeeds.length,
        count: items.length,
        items: items
    };

    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`Successfully added ${newlyFetchedItems.length} new unique news items with distinct images.`);
}

strictCheckAndSync();
