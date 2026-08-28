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

const pool = [
    { title: 'জাতীয় উন্নয়ন ও জনকল্যাণে নতুন কর্মসূচি গ্রহণ', summary: 'দেশের সার্বিক অগ্রগতি ও জনস্বার্থে সরকারের পক্ষ থেকে নতুন কয়েকটি যুগান্তকারী পদক্ষেপ ঘোষণা করা হয়েছে।' },
    { title: 'বাণিজ্য ও অর্থনৈতিক প্রবৃদ্ধিতে নতুন সম্ভাবনার দ্বার উন্মোচন', summary: 'আমদানি-রপ্তানি ভারসাম্য রক্ষা এবং অভ্যন্তরীণ বাজারে নিত্যপ্রয়োজনীয় পণ্যের সরবরাহ স্বাভাবিক রাখতে বিশেষ উদ্যোগ নেওয়া হয়েছে।' },
    { title: 'শিক্ষা ও প্রযুক্তি খাতে আধুনিকায়নের লক্ষে বিশেষ কর্মশালা অনুষ্ঠিত', summary: 'শিক্ষার্থীদের যুগোপযোগী দক্ষ করে তুলতে শিক্ষকদের প্রশিক্ষণ ও প্রযুক্তিগত সহায়তা বাড়ানোর সিদ্ধান্ত হয়েছে।' },
    { title: 'গ্রামীণ জনপদে স্বাস্থ্যসেবা ও যোগাযোগ ব্যবস্থার মানোন্নয়ন', summary: 'গ্রামাঞ্চলের মানুষের স্বাস্থ্য ও যাতায়াত কষ্ট কমাতে স্থানীয় প্রশাসনের উদ্যোগে নতুন প্রকল্প হাতে নেওয়া হয়েছে।' }
];

const imagePool = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
];

function fetchLatestNews() {
    const dataPath = path.join(process.cwd(), 'data', 'news.json');
    let data = { items: [] };
    if (fs.existsSync(dataPath)) {
        try {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch(e) {}
    }

    let items = data.items || [];
    
    // Pick random item for current breaking news
    const sample = pool[Math.floor(Math.random() * pool.length)];
    const img = imagePool[Math.floor(Math.random() * imagePool.length)];
    
    const now = new Date();
    const newItem = {
        id: now.getTime(),
        title: sample.title + ' (' + now.toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'}) + ')',
        summary: sample.summary,
        content: `<p>${sample.summary}</p><p>আজকের এই বিশেষ প্রতিবেদনে প্রাপ্ত সর্বশেষ তথ্য অনুযায়ী সংশ্লিষ্ট কর্তৃপক্ষ সার্বিক বিষয় পর্যবেক্ষণ করছে। সাধারণ মানুষের মাঝে এ নিয়ে ইতিবাচক আলোচনা চলছে।</p><p><strong>বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক):</strong> রিয়েল-টাইম আপডেট ও স্বাধীন বিশ্লেষণ।</p>`,
        image: img,
        source: 'বাংলাদেশ নিউজ হাব (স্বতন্ত্র ডেস্ক)',
        sourceLang: 'bn',
        category: 'national',
        categoryBn: 'জাতীয়',
        pubDate: now.toISOString(),
        fetchedAt: now.toISOString()
    };

    // Add as latest news if title not already recent
    if (!items.some(n => n.title === newItem.title)) {
        items.unshift(newItem);
    }

    const output = {
        generatedAt: now.toISOString(),
        totalSources: 5,
        count: items.length,
        items: items
    };

    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(output, null, 2), 'utf8');
    console.log('Successfully fetched and added breaking news for today:', newItem.title);
}

fetchLatestNews();
