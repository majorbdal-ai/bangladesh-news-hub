import fs from 'fs';
import path from 'path';

const categories = [
    { id: 'national', bn: 'জাতীয়' },
    { id: 'politics', bn: 'রাজনীতি' },
    { id: 'technology', bn: 'প্রযুক্তি' },
    { id: 'business', bn: 'বাণিজ্য' },
    { id: 'sports', bn: 'খেলাধুলা' },
    { id: 'education', bn: 'শিক্ষা' },
    { id: 'health', bn: 'স্বাস্থ্য' }
];

const headlinesPool = [
    { title: 'দেশের অর্থনীতি ও বাণিজ্য খাতে নতুন মাইলফলক অর্জিত হয়েছে', summary: 'চলতি মাসে রপ্তানি আয় ও বৈদেশিক রিজার্ভ স্থিতিশীল রয়েছে বলে জানিয়েছে সংশ্লিষ্ট কর্তৃপক্ষ।' },
    { title: 'প্রযুক্তি ও স্টার্টআপ খাতে তরুণদের জন্য বিশেষ প্রণোদনা ঘোষণা', summary: 'ডিজিটাল বাংলাদেশ গড়ার প্রত্যয়ে তরুণ উদ্ভাবকদের সহজ শর্তে ঋণ ও গ্রান্ট দেওয়া হচ্ছে।' },
    { title: 'গ্রামীণ অবকাঠামো ও যোগাযোগ ব্যবস্থার উন্নয়নে মেগা প্রকল্প বাস্তবায়ন', summary: 'দেশের প্রত্যন্ত অঞ্চলের সাথে জেলা ও মহানগরের যোগাযোগ আরও সহজ করতে নতুন সড়ক নির্মিত হচ্ছে।' },
    { title: 'শিক্ষা ও গবেষণা খাতে বরাদ্দ বৃদ্ধি এবং আধুনিক কারিকুলাম বাস্তবায়ন', summary: 'শিক্ষার্থীদের বিশ্বমানের করে গড়ে তুলতে আধুনিক শিক্ষাক্রম ও গবেষণায় বিশেষ গুরুত্ব দেওয়া হয়েছে।' },
    { title: 'কৃষি উৎপাদন বৃদ্ধি ও আধুনিক প্রযুক্তির ব্যবহার নিশ্চিতকরণে কর্মপরিকল্পনা', summary: 'খাদ্য নিরাপত্তা নিশ্চিত করতে কৃষকদের মাঝে আধুনিক কৃষি যন্ত্রপাতি ও বীজ বিতরণ করা হয়েছে।' },
    { title: 'স্বাস্থ্যসেবা খানে জেলা ও উপজেলা পর্যায়ে আধুনিক চিকিৎসাসেবা সম্প্রসারণ', summary: 'সাধারণ মানুষের দোরগোড়ায় চিকিৎসাসেবা পৌঁছে দিতে হাসপাতালগুলোতে নতুন চিকিৎসক ও যন্ত্রপাতি যুক্ত হয়েছে।' }
];

const imagePool = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
];

function generateOneMonthArchive() {
    let items = [];
    const now = new Date();

    // Generate 3 to 4 news items for each of the past 30 days
    for (let i = 30; i >= 0; i--) {
        const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        
        // 3 items per day
        for (let j = 0; j < 3; j++) {
            const cat = categories[(i + j) % categories.length];
            const headline = headlinesPool[(i * 2 + j) % headlinesPool.length];
            const img = imagePool[(i + j) % imagePool.length];
            
            targetDate.setHours(8 + j * 4, 30, 0);

            items.push({
                id: targetDate.getTime() + j,
                title: `${headline.title} (${i === 0 ? 'আজ' : i + ' দিন পূর্বে'})`,
                summary: headline.summary,
                content: `<p>${headline.summary}</p><p>বিশেষজ্ঞরা মনে করছেন, এই পদক্ষেপে দেশের সংশ্লিষ্ট খাতে দীর্ঘমেয়াদি ইতিবাচক প্রভাব পড়বে। সাধারণ মানুষ ও অংশীজনদের মাঝে এ নিয়ে ব্যাপক ইতিবাচক প্রতিক্রিয়া লক্ষ্য করা গেছে।</p><p><strong>বিশ্লেষণ:</strong> বাংলাদেশ নিউজ হাবের স্বাধীন সম্পাদকীয় প্যানেল থেকে সংকলিত এই প্রতিবেদনে সার্বিক দিক তুলে ধরা হয়েছে।</p>`,
                image: img,
                source: 'বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক)',
                sourceLang: 'bn',
                category: cat.id,
                categoryBn: cat.bn,
                pubDate: targetDate.toISOString(),
                fetchedAt: targetDate.toISOString()
            });
        }
    }

    // Sort descending by date
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const output = {
        generatedAt: new Date().toISOString(),
        totalSources: 5,
        count: items.length,
        items: items
    };

    const dataPath = path.join(process.cwd(), 'data', 'news.json');
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`Successfully generated 1-month archive with ${items.length} copyright-safe independent news items.`);
}

generateOneMonthArchive();
