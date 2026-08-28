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
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'
];

const topicBank = [
    { cat: 'national', bn: 'জাতীয়', title: 'দেশজুড়ে গ্রামীণ অবকাঠামো ও ডিজিটাল সেবা সম্প্রসারণের নতুন মেগা প্রকল্প', summary: 'দেশের প্রতিটি উপজেলায় উন্নত যোগাযোগ ব্যবস্থা এবং ডিজিটাল সেবা পৌঁছে দিতে নতুন সরকারি প্রকল্প অনুমোদিত হয়েছে।' },
    { cat: 'politics', bn: 'রাজনীতি', title: 'রাষ্ট্রীয় প্রশাসন ও সংস্কার কার্যক্রম নিয়ে উচ্চপর্যায়ের গুরুত্বপূর্ণ বৈঠক', summary: 'রাষ্ট্রীয় শাসন ব্যবস্থাকে আরও স্বচ্ছ ও জবাবদিহিমূলক করতে সংশ্লিষ্ট অংশীজনদের সাথে গুরুত্বপূর্ণ আলোচনা অনুষ্ঠিত হয়েছে।' },
    { cat: 'technology', bn: 'প্রযুক্তি', title: 'আইসিটি ও ফ্রিল্যান্সিং খাতের প্রসারে তরুণদের জন্য বিশেষ আর্থিক অনুদান ঘোষণা', summary: 'তরুণ প্রজন্মকে তথ্যপ্রযুক্তি খাতে দক্ষ করে তুলতে সরকার থেকে বিশেষ গ্রান্ট এবং ফ্রি প্রশিক্ষণ কর্মসূচি ঘোষণা করা হয়েছে।' },
    { cat: 'business', bn: 'বাণিজ্য', title: 'বাজার স্থিতিশীল রাখতে নিত্যপণ্যের সরবরাহ ও মূল্য মনিটরিং কঠোরভাবে কার্যকর', summary: 'খুচরা ও পাইকারি বাজারে পণ্যের সঠিক মূল্য ও পর্যাপ্ত সরবরাহ বজায় রাখতে বাণিজ্য মন্ত্রণালয় থেকে বিশেষ টিম মাঠে রয়েছে।' },
    { cat: 'sports', bn: 'খেলাধুলা', title: 'ঘরোয়া ক্রীড়াঙ্গনে প্রতিভা অন্বেষণ ও বিশ্বমানের প্রশিক্ষণ ক্যাম্পের আনুষ্ঠানিক সূচনা', summary: 'দেশের সম্ভাবনাময় খেলোয়াড়দের আন্তর্জাতিক মানের অ্যাথলেট হিসেবে গড়ে তুলতে দেশব্যাপী নতুন ক্যাম্প শুরু হয়েছে।' }
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

async function runJournalisticSync() {
    const dataPath = path.join(process.cwd(), 'data', 'news.json');
    let data = { items: [] };
    if (fs.existsSync(dataPath)) {
        try {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch(e) {}
    }

    let items = data.items || [];
    let existingTitles = new Set(items.map(i => i.title.trim().toLowerCase()));
    let addedCount = 0;

    // Try RSS
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

                        const key = title.toLowerCase();
                        if (title && !existingTitles.has(key)) {
                            const img = uniqueImagePool[Math.floor(Math.random() * uniqueImagePool.length)];
                            
                            const currentDate = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
                            
                            const journalisticBody = `
                                <div class="space-y-4 text-slate-800 dark:text-slate-200 text-base leading-relaxed font-normal">
                                    <p class="font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                                        <strong>ঢাকা, ${currentDate}:</strong> ${summary}
                                    </p>
                                    <p>
                                        সংশ্লিষ্ট সূত্রে জানা গেছে, সাম্প্রতিক সময়ে এই বিষয়ে দীর্ঘ প্রস্তুতি নেওয়ার পর আজ আনুষ্ঠানিকভাবে সংশ্লিষ্ট দপ্তরে কার্যক্রম শুরু হয়েছে। কীভাবে এবং কোন প্রক্রিয়ায় এটি বাস্তবায়িত হবে, তার সুনির্দিষ্ট রূপরেখা ইতিমধ্যে প্রকাশ করা হয়েছে।
                                    </p>
                                    <blockquote class="border-l-4 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-r-2xl italic text-slate-700 dark:text-slate-300">
                                        “আমাদের মূল লক্ষ্য হলো সাধারণ মানুষের ভোগান্তি সম্পূর্ণ দূর করে নির্ধারিত সময়ের মধ্যে শতভাগ স্বচ্ছতা ও দক্ষতার সাথে পুরো প্রকল্পটি সফল করা।” — <strong>দায়িত্বপ্রাপ্ত ঊর্ধ্বতন কর্মকর্তা</strong>
                                    </blockquote>
                                    <p>
                                        বিশ্লেষকদের মতে, এই উদ্যোগের ফলে দীর্ঘমেয়াদে দেশের সংশ্লিষ্ট খাতে ইতিবাচক প্রভাব পড়বে এবং সেবার মান বহুগুণ বৃদ্ধি পাবে। ইতিপূর্বে এ ধরনের পদক্ষেপে সাধারণ নাগরিকরা বিশেষভাবে উপকৃত হয়েছেন।
                                    </p>
                                    <p class="font-semibold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                                        বর্তমানে মাঠপর্যায়ে এর প্রাথমিক প্রস্তুতি চলছে এবং খুব শীঘ্রই এর পরবর্তী ধাপ ও বাস্তবায়ন প্রক্রিয়া আনুষ্ঠানিকভাবে ঘোষণা করা হবে।
                                    </p>
                                    <div class="flex items-center justify-between text-xs text-slate-500 pt-2">
                                        <span><i class="fa-solid fa-shield-halved text-emerald-600 mr-1"></i> তথ্যের সূত্র: বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক)</span>
                                        <span>রিয়েল-টাইম আপডেট</span>
                                    </div>
                                </div>
                            `;

                            const newItem = {
                                id: Date.now() + Math.floor(Math.random() * 10000),
                                title: title,
                                summary: summary || title,
                                content: journalisticBody.trim(),
                                image: img,
                                source: 'বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক)',
                                sourceLang: 'bn',
                                pubDate: new Date().toISOString(),
                                fetchedAt: new Date().toISOString()
                            };

                            items.unshift(newItem);
                            existingTitles.add(key);
                            addedCount++;
                        }
                    }
                }
            }
        }
    }

    // Add backup item if needed
    const bankItem = topicBank[Math.floor(Math.random() * topicBank.length)];
    const timeStr = new Date().toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'});
    const dynamicTitle = `${bankItem.title} (${timeStr})`;
    const topicKey = dynamicTitle.toLowerCase();

    if (!existingTitles.has(topicKey)) {
        const img = uniqueImagePool[Math.floor(Math.random() * uniqueImagePool.length)];
        const currentDate = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
        
        const journalisticBody = `
            <div class="space-y-4 text-slate-800 dark:text-slate-200 text-base leading-relaxed font-normal">
                <p class="font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                    <strong>ঢাকা, ${currentDate}:</strong> ${bankItem.summary}
                </p>
                <p>
                    সংশ্লিষ্ট সূত্রে জানা গেছে, সাম্প্রতিক সময়ে এই বিষয়ে দীর্ঘ প্রস্তুতি নেওয়ার পর আজ আনুষ্ঠানিকভাবে সংশ্লিষ্ট দপ্তরে কার্যক্রম শুরু হয়েছে। কীভাবে এবং কোন প্রক্রিয়ায় এটি বাস্তবায়িত হবে, তার সুনির্দিষ্ট রূপরেখা ইতিমধ্যে প্রকাশ করা হয়েছে।
                </p>
                <blockquote class="border-l-4 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-r-2xl italic text-slate-700 dark:text-slate-300">
                    “আমাদের মূল লক্ষ্য হলো সাধারণ মানুষের ভোগান্তি সম্পূর্ণ দূর করে নির্ধারিত সময়ের মধ্যে শতভাগ স্বচ্ছতা ও দক্ষতার সাথে পুরো প্রকল্পটি সফল করা।” — <strong>দায়িত্বপ্রাপ্ত ঊর্ধ্বতন কর্মকর্তা</strong>
                </blockquote>
                <p>
                    বিশ্লেষকদের মতে, এই উদ্যোগের ফলে দীর্ঘমেয়াদে দেশের সংশ্লিষ্ট খাতে ইতিবাচক প্রভাব পড়বে এবং সেবার মান বহুগুণ বৃদ্ধি পাবে। ইতিপূর্বে এ ধরনের পদক্ষেপে সাধারণ নাগরিকরা বিশেষভাবে উপকৃত হয়েছেন।
                </p>
                <p class="font-semibold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    বর্তমানে মাঠপর্যায়ে এর প্রাথমিক প্রস্তুতি চলছে এবং খুব শীঘ্রই এর পরবর্তী ধাপ ও বাস্তবায়ন প্রক্রিয়া আনুষ্ঠানিকভাবে ঘোষণা করা হবে।
                </p>
                <div class="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <span><i class="fa-solid fa-shield-halved text-emerald-600 mr-1"></i> তথ্যের সূত্র: বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক)</span>
                    <span>রিয়েল-টাইম আপডেট</span>
                </div>
            </div>
        `;

        const newItem = {
            id: Date.now(),
            title: dynamicTitle,
            summary: bankItem.summary,
            content: journalisticBody.trim(),
            image: img,
            source: 'বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক)',
            sourceLang: 'bn',
            pubDate: new Date().toISOString(),
            fetchedAt: new Date().toISOString()
        };

        items.unshift(newItem);
        addedCount++;
    }

    // STRICT CHRONOLOGICAL SORTING: Newest at top
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const output = {
        generatedAt: new Date().toISOString(),
        totalSources: rssFeeds.length + 1,
        count: items.length,
        items: items
    };

    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`Journalistic format sync completed. Added ${addedCount} items. Total: ${items.length}`);
}

runJournalisticSync();
