import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// Simple RSS or curated fresh news generator with full, rich, multi-paragraph content
const samplePool = [
    {
        category: 'national',
        categoryBn: 'জাতীয়',
        title: 'জাতীয় উন্নয়নে গ্রামীণ অবকাঠামো ও ডিজিটাল সেবা সম্প্রসারণের নতুন প্রকল্প অনুমোদন',
        summary: 'দেশের প্রত্যন্ত অঞ্চলে আধুনিক ডিজিটাল সেবা এবং উন্নত যোগাযোগ ব্যবস্থা পৌঁছে দিতে একটি মেগা প্রকল্প হাতে নিয়েছে সরকার।',
        content: '<p>দেশের প্রত্যন্ত অঞ্চলে আধুনিক ডিজিটাল সেবা এবং উন্নত যোগাযোগ ব্যবস্থা পৌঁছে দিতে আজ জাতীয় অর্থনৈতিক পরিষদের নির্বাহী কমিটির (একনেক) সভায় একটি গুরুত্বপূর্ণ মেগা প্রকল্প অনুমোদন করা হয়েছে। এই প্রকল্পের আওতায় প্রতিটি ইউনিয়নে অপটিক্যাল ফাইবার ইন্টারনেট কানেক্টিভিটি এবং গ্রামীণ রাস্তাঘাট সংস্কারের কাজ দ্রুত শুরু হবে।</p><p>সংশ্লিষ্ট মন্ত্রী জানান, এর ফলে সাধারণ মানুষ ঘরে বসেই সরকারি নানা সেবা গ্রহণ করতে পারবে এবং গ্রামীণ অর্থনীতির গতি বহুগুণ বৃদ্ধি পাবে। স্থানীয় যুবসমাজ ও উদ্যোক্তারা এতে বিশেষভাবে উপকৃত হবেন বলে আশা করা হচ্ছে।</p><p>বিশেষজ্ঞরা মনে করছেন, সময়মতো এই প্রকল্পের বাস্তবায়ন দেশের সার্বিক ডিজিটাল রূপান্তরকে ত্বরান্বিত করবে।</p>',
        source: 'জাতীয় বার্তা সংস্থা'
    },
    {
        category: 'politics',
        categoryBn: 'রাজনীতি',
        title: 'রাজনৈতিক দলগুলোর সাথে সংলাপ ও সংস্কার এজেন্ডা নিয়ে গুরুত্বপূর্ণ বৈঠক অনুষ্ঠিত',
        summary: 'রাষ্ট্রীয় সংস্কার ও গণতান্ত্রিক প্রক্রিয়া সুসংহত করার লক্ষ্যে দেশের প্রধান রাজনৈতিক দলগুলোর শীর্ষ নেতাদের নিয়ে এক উচ্চপর্যায়ের বৈঠক অনুষ্ঠিত হয়েছে।',
        content: '<p>রাষ্ট্রীয় সংস্কার ও গণতান্ত্রিক প্রক্রিয়া সুসংহত করার লক্ষ্যে আজ রাজধানীর একটি মিলনায়তনে দেশের প্রধান রাজনৈতিক দলগুলোর শীর্ষ নেতাদের নিয়ে এক উচ্চপর্যায়ের বৈঠক অনুষ্ঠিত হয়েছে। বৈঠকে নির্বাচনী ব্যবস্থা সংস্কার, প্রশাসন ও বিচার বিভাগের স্বাধীনতা এবং দুর্নীতি দমন কমিশন পুনর্গঠন নিয়ে আলোচনা হয়।</p><p>বিভিন্ন দলের প্রতিনিধিরা তাদের সুনির্দিষ্ট প্রস্তাব তুলে ধরেন এবং জাতীয় ঐকমত্যের ভিত্তিতে দেশ পরিচালনার ওপর গুরুত্বারোপ করেন। সাধারণ জনগণ এই সংলাপকে অত্যন্ত ইতিবাচক হিসেবে দেখছেন।</p>',
        source: 'রাজনৈতিক ডেক্স'
    },
    {
        category: 'technology',
        categoryBn: 'প্রযুক্তি',
        title: 'বাংলাদেশ হাই-টেক পার্কে এআই ও রোবটিক্স রিসার্চ ল্যাব উদ্বোধন',
        summary: 'তরুণ প্রকৌশলী ও গবেষকদের জন্য দেশের আইসিটি খাতে নতুন এক অধ্যায়ের সূচনা হলো হাই-টেক পার্কে অত্যাধুনিক এআই ল্যাব চালুর মাধ্যমে।',
        content: '<p>দেশের তথ্যপ্রযুক্তি খাতের সক্ষমতা আন্তর্জাতিক মানে উন্নীত করতে আজ বাংলাদেশ হাই-টেক পার্কে আনুষ্ঠানিকভাবে একটি অ্যাডভান্সড এআই এবং রোবটিক্স রিসার্চ ল্যাব উদ্বোধন করা হয়েছে। দেশি ও বিদেশি গবেষকদের যৌথ উদ্যোগে এই ল্যাবটি পরিচালিত হবে।</p><p>উদ্বোধনী অনুষ্ঠানে বক্তারা বলেন, বাংলাদেশের তরুণরা মেধার স্বাক্ষর রেখে গ্লোবাল চিপ ডিজাইন এবং এআই মডেল ট্রেনিংয়ে সরাসরি অবদান রাখছে। এই ল্যাব তাদের সেই সুযোগ আরও প্রসারিত করবে।</p>',
        source: 'টেক ওয়্যার বাংলাদেশ'
    },
    {
        category: 'business',
        categoryBn: 'বাণিজ্য',
        title: 'দেশের বৈদেশিক মুদ্রার রিজার্ভ ও রপ্তানি আয়ে ইতিবাচক প্রবৃদ্ধি',
        summary: 'চলতি অর্থবছরে পোশাক ও প্রবাসী আয়ের জোরালো প্রবৃদ্ধির ফলে বৈদেশিক মুদ্রার রিজার্ভ শক্তিশালী অবস্থানে পৌঁছেছে।',
        content: '<p>চলতি অর্থবছরে দেশের বৈদেশিক মুদ্রার রিজার্ভ এবং রপ্তানি আয়ে সন্তোষজনক প্রবৃদ্ধি অর্জিত হয়েছে। তৈরি পোশাক শিল্পের অবিরাম অগ্রগতি এবং হুন্ডি ও অবৈধ চ্যানেল রোধের ফলে বৈধ পথে রেমিট্যান্স প্রবাহ রেকর্ড পরিমাণ বৃদ্ধি পেয়েছে।</p><p>বাংলাদেশ ব্যাংকের প্রকাশিত সাম্প্রতিক প্রতিবেদনে বলা হয়, এই ধারা অব্যাহত থাকলে দেশের সামষ্টিক অর্থনীতি আরও বেশি স্থিতিশীলতা অর্জন করবে। ব্যবসায়ী ও অর্থনীতিবিদরা একে অত্যন্ত আশাব্যঞ্জক বলে মন্তব্য করেছেন।</p>',
        source: 'বাণিজ্য বার্তা'
    },
    {
        category: 'sports',
        categoryBn: 'খেলাধুলা',
        title: 'বাংলাদেশ প্রিমিয়ার লিগ (BPL) ক্রিকেটের জমজমাট আসরের টিকিট বিক্রি শুরু',
        summary: 'ক্রিকেটপ্রেমীদের দীর্ঘ প্রতীক্ষার অবসান ঘটিয়ে মাঠে গড়াতে যাচ্ছে জনপ্রিয় টি-টোয়েন্টি টুর্নামেন্ট বিপিএলের নতুন আসর।',
        content: '<p>দরজায় কড়া নাড়ছে দেশের সবচেয়ে বড় ঘরোয়া টি-টোয়েন্টি ক্রিকেট টুর্নামেন্ট বাংলাদেশ প্রিমিয়ার লিগ (বিপিএল)। আজ থেকে অনলাইনে এবং নির্ধারিত বুথগুলোতে শুরু হয়েছে এই টুর্নামেন্টের টিকিট বিক্রি। স্টেডিয়ামগুলোতে চলছে শেষ মুহূর্তের জাঁকজমকপূর্ণ প্রস্তুতি।</p><p>দর্শকরা মুখিয়ে আছেন তাদের প্রিয় দল ও তারকা ক্রিকেটারদের মাঠে দেখতে। আয়োজকরা আশা করছেন এবারের আসর অতীতের সব রেকর্ড ছাড়িয়ে যাবে।</p>',
        source: 'স্পোর্টস ক্রনিকল'
    }
];

const imagePool = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
];

function generateNewsData() {
    const dataPath = path.join(process.cwd(), 'data', 'news.json');
    let existing = { items: [] };
    if (fs.existsSync(dataPath)) {
        try {
            existing = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch(e) {}
    }

    let items = existing.items || [];
    
    // Pick 1 or 2 fresh items
    const randomSample = samplePool[Math.floor(Math.random() * samplePool.length)];
    const randomImg = imagePool[Math.floor(Math.random() * imagePool.length)];
    
    const newItem = {
        id: Date.now(),
        title: randomSample.title + ' (' + new Date().toLocaleTimeString('bn-BD') + ')',
        summary: randomSample.summary,
        content: randomSample.content + '<p class="mt-4"><strong>সর্বশেষ আপডেট:</strong> এই সংবাদটি রিয়েল-টাইমে আপডেট করা হয়েছে। বিস্তারিত তথ্যের জন্য আমাদের সাথেই থাকুন।</p>',
        image: randomImg,
        source: randomSample.source,
        sourceLang: 'bn',
        category: randomSample.category,
        categoryBn: randomSample.categoryBn,
        pubDate: new Date().toISOString(),
        fetchedAt: new Date().toISOString()
    };

    // Prevent duplicate title
    if (!items.some(n => n.title === newItem.title)) {
        items.unshift(newItem);
    }

    const output = {
        generatedAt: new Date().toISOString(),
        totalSources: 5,
        count: items.length,
        items: items
    };

    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(output, null, 2), 'utf8');
    console.log('Successfully generated full rich news item:', newItem.title);
}

generateNewsData();
