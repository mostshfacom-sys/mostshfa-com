import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';

export const pulseRevalidate = 900;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mostshfa.com';
export const defaultArticleImage = '/images/defaults/article.svg';
export const medicalBriefPath = '/medical-brief';

type SourceType = 'rss' | 'html';

type SourceConfig = {
  id: string;
  name: string;
  feedUrl: string;
  homeUrl: string;
  description: string;
  language: 'ar';
  sourceType: SourceType;
  categoryFilter?: RegExp;
  linkFilter?: RegExp;
  articleLinkPattern?: RegExp;
  maxItems?: number;
  relevanceThreshold?: number;
  aggressiveEnrichment?: boolean;
  listingTitleSelectors?: string[];
  listingSummarySelectors?: string[];
  listingDateSelectors?: string[];
  listingCategorySelectors?: string[];
  listingImageSelectors?: string[];
  articleSummarySelectors?: string[];
  articleDateSelectors?: string[];
  articleCategorySelectors?: string[];
  articleImageSelectors?: string[];
};

export type PulseArticle = {
  id: string;
  sourceId: string;
  title: string;
  link: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: Date | null;
  image: string | null;
  categories: string[];
  language: 'ar';
  specialtyId: string;
};

export type SpecialtyConfig = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  directCategories?: string[];
  tone: string;
  badgeTone: string;
  accent: string;
  searchHint: string;
};

export type HelpfulLink = {
  title: string;
  description: string;
  href: string;
};

export type PulseContentType = {
  label: string;
  description: string;
};

type PulseSourceSummary = SourceConfig & {
  itemCount: number;
};

export type PulseSpecialtyGroup = SpecialtyConfig & {
  items: PulseArticle[];
};

export type PulseData = {
  latestArticles: PulseArticle[];
  latestBySpecialty: PulseSpecialtyGroup[];
  sources: PulseSourceSummary[];
  totalArticles: number;
  totalSpecialties: number;
  totalSources: number;
  lastUpdated: Date | null;
};

const sourceConfigs: SourceConfig[] = [
  {
    id: 'sehatok',
    name: 'صحتك',
    feedUrl: 'https://www.sehatok.com/rss',
    homeUrl: 'https://www.sehatok.com',
    description: 'منصة عربية طبية متخصصة تنشر أخبار الصحة العامة والتغذية وصحة المرأة والطفل والمناعة.',
    language: 'ar',
    sourceType: 'rss',
    maxItems: 24,
    relevanceThreshold: 6,
    aggressiveEnrichment: true,
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="news_keywords"]', '[rel="tag"]', 'a[href*="tag"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img'],
  },
  {
    id: 'cnn-health',
    name: 'CNN Arabic',
    feedUrl: 'https://arabic.cnn.com/api/v1/rss/rss.xml',
    homeUrl: 'https://arabic.cnn.com/science-and-health',
    description: 'تغطية عربية للعلوم والصحة والدراسات الطبية الحديثة من CNN Arabic.',
    language: 'ar',
    sourceType: 'rss',
    categoryFilter: /علوم وصحة/i,
    linkFilter: /science-and-health|health|science/i,
    maxItems: 18,
    relevanceThreshold: 8,
    aggressiveEnrichment: true,
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img'],
  },
  {
    id: 'alarabiya-health',
    name: 'العربية صحة',
    feedUrl: 'https://www.alarabiya.net/feed/rss2/ar.xml',
    homeUrl: 'https://www.alarabiya.net/medicine-and-health',
    description: 'أخبار طبية وصحية عربية حديثة مع تركيز على الأبحاث والوقاية والأمراض الشائعة.',
    language: 'ar',
    sourceType: 'rss',
    linkFilter: /medicine-and-health/i,
    maxItems: 18,
    relevanceThreshold: 8,
    aggressiveEnrichment: true,
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img'],
  },
  {
    id: 'altibbi',
    name: 'الطبي',
    feedUrl: 'https://altibbi.com/اخبار-طبية',
    homeUrl: 'https://altibbi.com/%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1-%D8%B7%D8%A8%D9%8A%D8%A9',
    description: 'محتوى طبي عربي متخصص يجمع الأخبار السريرية والنصائح الصحية ومتابعات الأمراض.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /\/اخبار-طبية\/.+-\d+$/i,
    maxItems: 20,
    relevanceThreshold: 7,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'nav a'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', '.article-content p', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="tag"]', 'a[href*="category"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', '.article-content img', 'article img', 'main img'],
  },
  {
    id: 'altibbi-articles',
    name: 'الطبي مقالات',
    feedUrl: 'https://altibbi.com/%D9%85%D9%82%D8%A7%D9%84%D8%A7%D8%AA-%D8%B7%D8%A8%D9%8A%D8%A9',
    homeUrl: 'https://altibbi.com/%D9%85%D9%82%D8%A7%D9%84%D8%A7%D8%AA-%D8%B7%D8%A8%D9%8A%D8%A9',
    description: 'مقالات طبية عربية موسعة من الطبي تشرح الأمراض والأعراض والعلاجات بلغة مبسطة.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /\/مقالات-طبية\/.+-\d+$/i,
    maxItems: 18,
    relevanceThreshold: 8,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'nav a'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', '.article-content p', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="tag"]', 'a[href*="category"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', '.article-content img', 'article img', 'main img'],
  },
  {
    id: 'webteb',
    name: 'ويب طب',
    feedUrl: 'https://news.webteb.com/',
    homeUrl: 'https://news.webteb.com/',
    description: 'منصة صحية عربية متخصصة تعرض أخبار الأبحاث الطبية والوقاية والعلاجات الحديثة.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /^https:\/\/news\.webteb\.com\/.+_\d+$/i,
    maxItems: 20,
    relevanceThreshold: 8,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="category"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', '.article-content p', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="tag"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', '.article-content img', 'article img', 'main img'],
  },
  {
    id: 'dailymedicalinfo',
    name: 'كل يوم معلومة طبية',
    feedUrl: 'https://dailymedicalinfo.com/news',
    homeUrl: 'https://dailymedicalinfo.com',
    description: 'شبكة عربية طبية واسعة التحديث تغطي الأخبار الصحية والوقاية والعلاجات والتوعية الطبية.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /\/view-news\//i,
    maxItems: 18,
    relevanceThreshold: 7,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="category"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', '.entry-content p', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="category"]', 'a[href*="tag"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', '.entry-content img', 'article img', 'main img'],
  },
  {
    id: 'elconsolto',
    name: 'الكونسلتو',
    feedUrl: 'https://www.elconsolto.com/news/health-news/section/742/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1-%D8%B5%D8%AD%D8%A9',
    homeUrl: 'https://www.elconsolto.com',
    description: 'تحديثات عربية في الأخبار الصحية والصحة العامة والوقاية والمتابعة اليومية.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /\/news\/health-news\/details\//i,
    maxItems: 18,
    relevanceThreshold: 7,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="section"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', '.article-content p', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="tag"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', '.article-content img', 'article img', 'main img'],
  },
  {
    id: 'youm7-health',
    name: 'اليوم السابع صحة',
    feedUrl: 'https://www.youm7.com/Section/%D8%B5%D8%AD%D8%A9-%D9%88%D8%B7%D8%A8/245/1',
    homeUrl: 'https://www.youm7.com/Tags/index?id=1555&tag=%D8%A7%D9%84%D8%B5%D8%AD%D8%A9',
    description: 'أخبار صحية عربية سريعة التحديث تشمل الوقاية والعلاجات المنزلية والمستجدات الطبية اليومية.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /\/story\/\d{4}\/\d{1,2}\/\d{1,2}\/.+\/\d+$/i,
    maxItems: 18,
    relevanceThreshold: 8,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="/Section/"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', '.articleBody p', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="news_keywords"]', '[rel="tag"]', 'a[href*="/Section/"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', '.articleBody img', 'article img', 'main img'],
  },
  {
    id: 'skynews-health',
    name: 'سكاي نيوز عربية صحة',
    feedUrl: 'https://www.skynewsarabia.com/tag?s=%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1%20%D8%B5%D8%AD%D9%8A%D8%A9&offset=72&sort=DATE',
    homeUrl: 'https://www.skynewsarabia.com/tag?s=%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1%20%D8%B5%D8%AD%D9%8A%D8%A9&offset=72&sort=DATE',
    description: 'تغطية صحية عربية سريعة من سكاي نيوز عربية حول الدراسات والمخاطر الصحية والوقاية.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /^https:\/\/www\.skynewsarabia\.com\/[^?#]+\/\d+$/i,
    maxItems: 18,
    relevanceThreshold: 9,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="/tag"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="/tag"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img'],
  },
  {
    id: 'asharq-health',
    name: 'الشرق صحة',
    feedUrl: 'https://asharq.com/health/',
    homeUrl: 'https://asharq.com/health/',
    description: 'أخبار صحية عربية من الشرق تشمل الأبحاث الطبية والابتكارات العلاجية والمخاطر الصحية.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /^https:\/\/asharq\.com\/health\/\d+\/.+/i,
    maxItems: 20,
    relevanceThreshold: 8,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="/health/"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="/health"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img'],
  },
  {
    id: 'aawsat-health',
    name: 'الشرق الأوسط صحتك',
    feedUrl: 'https://aawsat.com/%D8%B5%D8%AD%D8%AA%D9%83',
    homeUrl: 'https://aawsat.com/%D8%B5%D8%AD%D8%AA%D9%83',
    description: 'محتوى صحي عربي من الشرق الأوسط يركز على التغذية والأمراض الشائعة وصحة الأسرة.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /^https:\/\/aawsat\.com\/%D8%B5%D8%AD%D8%AA%D9%83\/\d+-/i,
    maxItems: 18,
    relevanceThreshold: 8,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="%D8%B5%D8%AD%D8%AA%D9%83"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="%D8%B5%D8%AD%D8%AA%D9%83"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img'],
  },
  {
    id: 'mohp-eg',
    name: 'وزارة الصحة المصرية',
    feedUrl: 'https://www.mohp.gov.eg/News.aspx?csrt=10390269974528996803',
    homeUrl: 'https://www.mohp.gov.eg/News.aspx?csrt=10390269974528996803',
    description: 'أخبار رسمية من وزارة الصحة والسكان المصرية حول الحملات الصحية والخدمات والمبادرات الطبية.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /NewsDetails\.aspx\?subject_id=\d+/i,
    maxItems: 16,
    relevanceThreshold: 10,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="News"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p', 'table p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="News"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img', 'table img'],
  },
  {
    id: 'ajnet-health',
    name: 'الجزيرة نت صحة',
    feedUrl: 'https://www.ajnet.me/health/',
    homeUrl: 'https://www.ajnet.me/health/',
    description: 'محتوى صحي عربي من الجزيرة نت يغطي الوقاية والدراسات الطبية والصحة العامة.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /^https:\/\/www\.ajnet\.me\/health\/\d{4}\/\d{1,2}\/\d{1,2}\/.+/i,
    maxItems: 20,
    relevanceThreshold: 8,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="/health/"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="/health"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img'],
  },
  {
    id: 'rt-health',
    name: 'RT صحة',
    feedUrl: 'https://arabic.rt.com/health/',
    homeUrl: 'https://arabic.rt.com/health/',
    description: 'تغطية صحية عربية من RT حول الاكتشافات الطبية والعلاجات والأبحاث الصحية المتداولة.',
    language: 'ar',
    sourceType: 'html',
    articleLinkPattern: /^https:\/\/arabic\.rt\.com\/health\/\d+-/i,
    maxItems: 18,
    relevanceThreshold: 9,
    aggressiveEnrichment: true,
    listingTitleSelectors: ['h1', 'h2', 'h3', '[class*="title"]'],
    listingSummarySelectors: ['p', '[class*="summary"]', '[class*="excerpt"]', '[class*="desc"]'],
    listingDateSelectors: ['time', '[datetime]', '[class*="date"]', '[class*="publish"]'],
    listingCategorySelectors: ['[class*="category"]', '[class*="tag"]', 'a[href*="/health/"]'],
    listingImageSelectors: ['img', 'source'],
    articleSummarySelectors: ['meta[name="description"]', 'meta[property="og:description"]', 'article p', 'main p'],
    articleDateSelectors: ['meta[property="article:published_time"]', 'time', '[datetime]', '[class*="date"]'],
    articleCategorySelectors: ['meta[property="article:tag"]', 'meta[name="keywords"]', '[rel="tag"]', 'a[href*="/health"]'],
    articleImageSelectors: ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'article img', 'main img'],
  },
];

export const specialtyConfigs: SpecialtyConfig[] = [
  {
    id: 'cardio',
    title: 'القلب والأوعية',
    description: 'مستجدات القلب والشرايين والضغط والكوليسترول والجلطات والوقاية القلبية.',
    keywords: ['قلب', 'الشرايين', 'ضغط', 'كوليسترول', 'جلطة', 'ذبحة', 'heart', 'cardio', 'vascular', 'stroke'],
    tone: 'from-rose-50 via-white to-red-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20',
    badgeTone: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200',
    accent: 'rose',
    searchHint: 'القلب',
  },
  {
    id: 'nutrition',
    title: 'التغذية والتمثيل الغذائي',
    description: 'الغذاء والوزن والسكر والهرمونات ونمط الحياة الصحي والأيض.',
    keywords: ['تغذية', 'غذاء', 'سكر', 'سكري', 'سمنة', 'وزن', 'رجيم', 'nutrition', 'diet', 'diabetes', 'obesity'],
    directCategories: ['تغذية', 'أطعمة', 'سمنة'],
    tone: 'from-emerald-50 via-white to-lime-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20',
    badgeTone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
    accent: 'emerald',
    searchHint: 'تغذية',
  },
  {
    id: 'mental',
    title: 'الصحة النفسية والدماغ',
    description: 'الدماغ والنوم والذاكرة والقلق والاكتئاب والصحة الذهنية.',
    keywords: ['نفسية', 'نفسي', 'دماغ', 'مخ', 'اكتئاب', 'قلق', 'توتر', 'نوم', 'ذهني', 'brain', 'mental', 'sleep'],
    tone: 'from-violet-50 via-white to-fuchsia-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20',
    badgeTone: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200',
    accent: 'violet',
    searchHint: 'الصحة النفسية',
  },
  {
    id: 'women',
    title: 'صحة المرأة والأمومة',
    description: 'الحمل والخصوبة والرحم وصحة الثدي والهرمونات وصحة الأم.',
    keywords: ['حمل', 'حامل', 'خصوبة', 'رحم', 'نسائية', 'ثدي', 'ولادة', 'طمث', 'breast', 'pregnancy', 'women'],
    directCategories: ['الحمل', 'المرأة', 'الأمومة'],
    tone: 'from-pink-50 via-white to-rose-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-pink-950/20',
    badgeTone: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-200',
    accent: 'pink',
    searchHint: 'صحة المرأة',
  },
  {
    id: 'children',
    title: 'طب الأطفال',
    description: 'الرضع والأطفال والمراهقون والنمو واللقاحات والأمراض الشائعة عند الصغار.',
    keywords: ['طفل', 'أطفال', 'رضيع', 'مواليد', 'مراهق', 'لقاح الأطفال', 'حضانة', 'pediatric', 'child', 'children'],
    directCategories: ['الطفل', 'الأطفال'],
    tone: 'from-sky-50 via-white to-cyan-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20',
    badgeTone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
    accent: 'sky',
    searchHint: 'أطفال',
  },
  {
    id: 'cancer',
    title: 'الأورام والعلاجات',
    description: 'السرطان والفحوصات المبكرة والعلاجات المستجدة والدراسات العلاجية.',
    keywords: ['سرطان', 'ورم', 'أورام', 'علاج كيميائي', 'خلايا سرطانية', 'oncology', 'cancer', 'tumor'],
    tone: 'from-amber-50 via-white to-orange-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20',
    badgeTone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
    accent: 'amber',
    searchHint: 'سرطان',
  },
  {
    id: 'digestive',
    title: 'الجهاز الهضمي',
    description: 'المعدة والقولون والكبد والأمعاء وصحة الهضم والأغذية المرتبطة بها.',
    keywords: ['قولون', 'معدة', 'كبد', 'هضم', 'أمعاء', 'ارتجاع', 'إسهال', 'إمساك', 'digestive', 'gut', 'liver'],
    directCategories: ['القولون', 'الكبد'],
    tone: 'from-orange-50 via-white to-amber-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20',
    badgeTone: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200',
    accent: 'orange',
    searchHint: 'القولون',
  },
  {
    id: 'respiratory',
    title: 'الصدر والتنفس',
    description: 'الرئة والتنفس والحساسية والربو والعدوى التنفسية واضطرابات النوم التنفسي.',
    keywords: ['صدر', 'رئة', 'تنفس', 'ربو', 'حساسية صدر', 'سعال', 'التهاب رئوي', 'lung', 'asthma', 'respiratory'],
    tone: 'from-cyan-50 via-white to-sky-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20',
    badgeTone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-200',
    accent: 'cyan',
    searchHint: 'صدر',
  },
  {
    id: 'bones',
    title: 'العظام والمفاصل',
    description: 'العظام والمفاصل والعضلات والعمود الفقري وإصابات الحركة وآلام الظهر.',
    keywords: ['عظام', 'مفاصل', 'عضلات', 'ظهر', 'ركبة', 'مفصل', 'arthritis', 'joint', 'bone', 'spine'],
    tone: 'from-stone-50 via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800',
    badgeTone: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    accent: 'slate',
    searchHint: 'عظام',
  },
  {
    id: 'skin',
    title: 'الجلدية والعناية',
    description: 'الجلد والشعر والبشرة والحساسية والعناية اليومية ومشكلات الجلد.',
    keywords: ['جلد', 'جلدية', 'بشرة', 'شعر', 'حب الشباب', 'إكزيما', 'حساسية جلد', 'skin', 'dermatology', 'hair'],
    directCategories: ['عناية', 'البشرة'],
    tone: 'from-teal-50 via-white to-cyan-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20',
    badgeTone: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200',
    accent: 'teal',
    searchHint: 'جلدية',
  },
  {
    id: 'immunity',
    title: 'العدوى والمناعة',
    description: 'اللقاحات والفيروسات والبكتيريا والوقاية ومتابعة الأوبئة والمناعة.',
    keywords: ['فيروس', 'بكتيريا', 'لقاح', 'عدوى', 'مناعة', 'التهاب', 'وباء', 'infection', 'immune', 'vaccine'],
    tone: 'from-indigo-50 via-white to-blue-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20',
    badgeTone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
    accent: 'indigo',
    searchHint: 'مناعة',
  },
  {
    id: 'kidneys',
    title: 'الكلى والمسالك',
    description: 'الكلى والحصوات والتهابات المسالك والوظائف الكلوية والغسيل الكلوي.',
    keywords: ['كلى', 'كلية', 'بول', 'مسالك', 'حصوات', 'غسيل كلوي', 'urinary', 'kidney', 'renal', 'bladder'],
    tone: 'from-blue-50 via-white to-sky-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20',
    badgeTone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
    accent: 'blue',
    searchHint: 'الكلى',
  },
  {
    id: 'endocrine',
    title: 'الغدد والهرمونات',
    description: 'الغدة الدرقية والهرمونات والإنسولين واضطرابات الأيض والتكيسات.',
    keywords: ['غدة', 'هرمون', 'درقية', 'تكيس', 'إنسولين', 'هرمونات', 'thyroid', 'hormone', 'endocrine', 'pcos'],
    tone: 'from-lime-50 via-white to-emerald-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-lime-950/20',
    badgeTone: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-200',
    accent: 'lime',
    searchHint: 'الغدة الدرقية',
  },
  {
    id: 'general',
    title: 'الصحة العامة والوقاية',
    description: 'موضوعات الوقاية العامة والعادات الصحية ومتابعة الأخبار الطبية اليومية.',
    keywords: ['صحة', 'وقاية', 'عادات', 'نمط حياة', 'دراسة', 'بحث', 'طب', 'دواء'],
    tone: 'from-slate-50 via-white to-primary-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950/20',
    badgeTone: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200',
    accent: 'primary',
    searchHint: 'صحة',
  },
];

const medicalLexicon = Array.from(
  new Set(
    specialtyConfigs.flatMap((specialty) => [...specialty.keywords, ...(specialty.directCategories || [])]).concat([
      'طب',
      'طبي',
      'طبية',
      'صحة',
      'علاج',
      'علاجي',
      'دواء',
      'أدوية',
      'تشخيص',
      'فحص',
      'تحاليل',
      'وقاية',
      'لقاح',
      'أعراض',
      'مرض',
      'أمراض',
      'مريض',
      'مرضى',
      'جراحة',
      'سريري',
      'مخبري',
      'الرعاية الصحية',
      'الصحة العامة',
      'مستشفى',
      'عيادة',
      'الطوارئ',
      'فيروس',
      'بكتيريا',
      'وباء',
      'عدوى',
      'التهاب',
      'سمنة',
      'سكر',
      'سكري',
      'ضغط',
      'جلطة',
      'سرطان',
      'حمل',
      'ولادة',
      'هرمون',
      'صحة الشباب',
      'صحة الفم',
      'الصحة النفسية',
      'heart',
      'health',
      'medical',
      'medicine',
      'vaccine',
      'disease',
      'treatment',
      'diagnosis',
      'clinical',
      'research',
      'therapy',
      'prevention',
      'symptoms',
      'screening',
      'تحاليل مخبرية',
      'صحة القلب',
      'الجهاز العصبي',
      'المسالك البولية',
      'الكبد',
      'الكلى',
      'السكتة الدماغية',
      'الخصوبة',
      'الأشعة',
      'التهاب المفاصل',
      'السريرية',
    ]),
  ),
).map((item) => item.toLowerCase());

const nonMedicalLexicon = [
  'سياسة',
  'سياسي',
  'الانتخابات',
  'برلمان',
  'اقتصاد',
  'اقتصادي',
  'بورصة',
  'أسهم',
  'عملة',
  'دولار',
  'نفط',
  'رياضة',
  'رياضي',
  'كرة',
  'مباراة',
  'فنان',
  'فنانة',
  'سينما',
  'مسلسل',
  'ترفيه',
  'طقس',
  'أمن',
  'حرب',
  'عسكري',
  'سيارات',
  'هاتف',
  'تقنية',
  'سياحة',
  'عقار',
  'تعليم',
  'مدارس',
  'جامعة',
  'امتحان',
  'أسواق',
  'أسعار الوقود',
  'فيديو',
  'مهرجان',
  'احتفالية',
  'شراكة',
  'استثمار',
  'تمويل',
  'جوائز',
  'مشاهير',
  'نجوم',
  'موضة',
  'أزياء',
  'أبراج',
  'جريمة',
  'حوادث',
  'مرور',
  'بناء',
  'البناء',
  'مخالفات البناء',
  'التصالح',
  'عقارات',
  'محافظة',
  'محافظ',
  'محليات',
  'وحدات محلية',
  'تصاريح',
  'تراخيص',
  'طيران',
  'سفر',
  'هجرة',
  'عقار',
  'حفلات',
  'ترند',
].map((item) => item.toLowerCase());

const blockedTitlePatterns = [
  /(?:نتائج?|مباراة|دوري|لاعب|مدرب|هدف)/i,
  /(?:فيلم|مسلسل|مغني|ممثلة|نجمة|فنانة|فنان)/i,
  /(?:بورصة|أسهم|ذهب|عملة|نفط|استثمار|اقتصاد)/i,
  /(?:انتخابات|برلمان|وزراء|حكومة|دبلوماسي)/i,
  /(?:مهرجان|احتفالية|شراكة|إطلاق فعالية|مؤتمر صحفي|قمة)/i,
  /(?:مخالفات البناء|التصالح|البناء|محافظة|محافظ|محليات|تراخيص|تصاريح)/i,
];

const sourceIdToConfig = new Map(sourceConfigs.map((source) => [source.id, source]));

function normalizeText(value: string | null | undefined) {
  return (value || '').replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
}

function stripHtml(value: string | null | undefined) {
  const text = cheerio.load(`<div>${value || ''}</div>`).text();
  return normalizeText(text);
}

function isMostlyArabicText(value: string) {
  const cleaned = value.replace(/[^\u0600-\u06FFA-Za-z0-9\s]/g, '');
  if (!cleaned) return false;
  const arabicLetters = cleaned.match(/[\u0600-\u06FF]/g)?.length || 0;
  const latinLetters = cleaned.match(/[A-Za-z]/g)?.length || 0;
  return arabicLetters >= 6 && arabicLetters >= latinLetters * 1.4;
}

function getSafeExcerpt(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return 'ملخص عربي موجز للخبر الطبي مع رابط القراءة الكاملة من المصدر الأصلي.';
  return normalized.length > 260 ? `${normalized.slice(0, 257)}...` : normalized;
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const normalized = normalizeArabicDigits(stripHtml(value))
    .replace(/[،|]/g, ' ')
    .replace(/\b(منذ|قبل|قراءة|دقائق|دقيقة|ساعة|ساعات|updated|published)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;

  const parsedDirect = new Date(normalized);
  if (!Number.isNaN(parsedDirect.getTime())) return parsedDirect;

  const monthMap: Record<string, string> = {
    يناير: '01',
    فبراير: '02',
    مارس: '03',
    أبريل: '04',
    ابريل: '04',
    إبريل: '04',
    مايو: '05',
    يونيو: '06',
    يوليو: '07',
    أغسطس: '08',
    اغسطس: '08',
    سبتمبر: '09',
    أكتوبر: '10',
    اكتوبر: '10',
    نوفمبر: '11',
    ديسمبر: '12',
  };

  const monthPattern = Object.keys(monthMap).join('|');
  const arabicMatch = normalized.match(
    new RegExp(`(\\d{1,2})\\s+(${monthPattern})\\s+(\\d{4})(?:\\s+(\\d{1,2})(?::(\\d{2}))?)?`, 'i'),
  );

  if (arabicMatch) {
    const [, day, monthName, year, hour = '0', minute = '0'] = arabicMatch;
    const isoDate = `${year}-${monthMap[monthName]}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
    const parsedArabic = new Date(isoDate);
    if (!Number.isNaN(parsedArabic.getTime())) return parsedArabic;
  }

  const slashMatch = normalized.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2})(?::(\d{2}))?)?/);
  if (slashMatch) {
    const [, day, month, year, hour = '0', minute = '0'] = slashMatch;
    const parsedSlash = new Date(
      `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`,
    );
    if (!Number.isNaN(parsedSlash.getTime())) return parsedSlash;
  }

  return null;
}

function normalizeArabicDigits(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ocid'].forEach((key) =>
      url.searchParams.delete(key),
    );
    const search = url.searchParams.toString();
    return `${url.origin}${url.pathname.replace(/\/$/, '')}${search ? `?${search}` : ''}`;
  } catch {
    return value.trim().replace(/\/$/, '');
  }
}

function resolveUrl(baseUrl: string, value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.startsWith('data:')) return null;
  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return null;
  }
}

function parseSrcSet(value: string | null | undefined) {
  const first = normalizeText(value).split(',')[0]?.trim() || '';
  return first.split(' ')[0] || null;
}

function getSourceConfigById(sourceId: string) {
  return sourceIdToConfig.get(sourceId) || null;
}

function cleanTitle(value: string | null | undefined) {
  return normalizeText(stripHtml(value)).replace(
    /\s*[-–|]\s*(ويب طب|الطبي(?: مقالات)?|الكونسلتو|اليوم السابع(?: صحة)?|cnn arabic|العربية(?: صحة)?|صحتك|كل يوم معلومة طبية|سكاي نيوز عربية(?: صحة)?|الشرق(?: صحة)?|الجزيرة نت(?: صحة)?|rt(?: صحة)?|وزارة الصحة المصرية|الشرق الأوسط صحتك)\s*$/i,
    '',
  );
}

function countKeywordHits(haystack: string, keywords: string[]) {
  return keywords.reduce((count, keyword) => (haystack.includes(keyword) ? count + 1 : count), 0);
}

function getMedicalRelevanceScore(source: SourceConfig, article: Pick<PulseArticle, 'title' | 'summary' | 'categories' | 'link'>) {
  const title = article.title.toLowerCase();
  const summary = article.summary.toLowerCase();
  const categories = article.categories.join(' ').toLowerCase();
  const combined = `${title} ${summary} ${categories}`;

  let score = 0;
  score += countKeywordHits(title, medicalLexicon) * 3;
  score += countKeywordHits(summary, medicalLexicon) * 2;
  score += countKeywordHits(categories, medicalLexicon);

  if (/(طب|طبي|طبية|صحة|مرض|علاج|دواء|لقاح|وقاية|سرطان|دراسة|بحث|مستشفى|رعاية صحية|تشخيص|فحص)/i.test(title)) {
    score += 2;
  }

  if (/(health|medicine|اخبار-طبية|health-news|science-and-health|medicine-and-health|view-news|صحة-وطب)/i.test(article.link)) {
    score += 2;
  }

  score -= countKeywordHits(combined, nonMedicalLexicon) * 3;

  if (source.id === 'webteb' && /(اليوم الوطني|تهنئ|افتتاح|مؤتمر|قمة|معرض|شراكة|شريك|احتفالية)/i.test(title)) {
    score -= 3;
  }

  if (source.id === 'skynews-health' && !/(صحة|طب|علاج|مرض|دواء|بحث|دراسة|لقاح|مستشفى|وقاية)/i.test(title)) {
    score -= 4;
  }

  if (source.id === 'mohp-eg' && !/(صحة|طبية|علاج|مبادرة|حملة|تطعيم|لقاح|مستشفى|مرض)/i.test(combined)) {
    score -= 3;
  }

  return score;
}

function isMedicalArticle(source: SourceConfig, article: Pick<PulseArticle, 'title' | 'summary' | 'categories' | 'link'>) {
  const title = article.title.toLowerCase();
  const summary = article.summary.toLowerCase();
  const categories = article.categories.join(' ').toLowerCase();
  const combined = `${title} ${summary} ${categories}`;
  const score = getMedicalRelevanceScore(source, article);
  const threshold = source.relevanceThreshold || 6;
  const titleHits = countKeywordHits(title, medicalLexicon);
  const summaryHits = countKeywordHits(summary, medicalLexicon);
  const categoryHits = countKeywordHits(categories, medicalLexicon);
  const nonMedicalHits = countKeywordHits(combined, nonMedicalLexicon);
  const hasMedicalSignal = titleHits + summaryHits + categoryHits > 0;
  const tooGeneric = nonMedicalHits >= 2 && score < threshold + 2;
  const weakMedicalSignal = titleHits === 0 && categoryHits === 0 && summaryHits < 2 && score < threshold + 3;
  const weakMedicalTitle = titleHits === 0 && categoryHits === 0 && (summaryHits < 3 || score < threshold + 4);
  const blockedByTitle = blockedTitlePatterns.some((pattern) => pattern.test(article.title)) && titleHits === 0;

  if (source.id === 'youm7-health' && weakMedicalTitle) {
    return false;
  }

  return hasMedicalSignal && !tooGeneric && !weakMedicalSignal && !blockedByTitle && score >= threshold;
}

export function getPulseContentType(article: Pick<PulseArticle, 'title' | 'summary' | 'categories'>): PulseContentType {
  const combined = `${article.title} ${article.summary} ${article.categories.join(' ')}`.toLowerCase();

  if (/(دراسة|بحث|باحثون|تحليل|تحليلات|نتائج دراسة|رصد علمي)/i.test(combined)) {
    return {
      label: 'دراسة وبحث',
      description: 'يركز المحتوى على نتائج بحثية أو معطيات علمية جديدة تحتاج إلى قراءة متأنية وربطها بالسياق الطبي.',
    };
  }

  if (/(علاج|دواء|لقاح|حقنة|تقنية|ابتكار|جراحة|علاجي|therapy|treatment)/i.test(combined)) {
    return {
      label: 'تحديث علاجي',
      description: 'المحتوى يتناول تدخلًا علاجيًا أو دوائيًا أو تقنية طبية جديدة مرتبطة بالتشخيص أو العلاج.',
    };
  }

  if (/(تحذير|مخاطر|وقاية|مضاعفات|أعراض|عدوى|فيروس|بكتيريا|فحص|تشخيص)/i.test(combined)) {
    return {
      label: 'توعية وقائية',
      description: 'المحتوى يساعد القارئ على فهم المخاطر والأعراض والإشارات التي تستدعي الانتباه أو المتابعة.',
    };
  }

  if (/(غذاء|أطعمة|نوم|رياضة|عادات|نمط حياة|تغذية|صيام|القهوة|وزن)/i.test(combined)) {
    return {
      label: 'نمط حياة وصحة',
      description: 'المحتوى يربط العادات اليومية والتغذية ونمط الحياة بتأثيرها على الصحة العامة أو الوقاية.',
    };
  }

  return {
    label: 'خبر طبي',
    description: 'تغطية صحية مختصرة تنقل مستجدًا طبيًا أو وقائيًا أو خبريًا من مصدر خارجي موثوق.',
  };
}

function getScopedNode(node: cheerio.Cheerio<any>, selector: string) {
  return node.filter(selector).first().length ? node.filter(selector).first() : node.find(selector).first();
}

function getTextFromSelectors(node: cheerio.Cheerio<any>, selectors: string[] | undefined) {
  for (const selector of selectors || []) {
    const scoped = getScopedNode(node, selector);
    if (!scoped.length) continue;
    const value =
      normalizeText(scoped.attr('content')) ||
      normalizeText(scoped.attr('datetime')) ||
      normalizeText(scoped.attr('title')) ||
      normalizeText(scoped.attr('aria-label')) ||
      normalizeText(scoped.text());
    if (value) return value;
  }
  return '';
}

function getImageFromSelectors(node: cheerio.Cheerio<any>, baseUrl: string, selectors: string[] | undefined) {
  for (const selector of selectors || []) {
    const scoped = getScopedNode(node, selector);
    if (!scoped.length) continue;
    const raw =
      scoped.attr('content') ||
      scoped.attr('url') ||
      scoped.attr('src') ||
      scoped.attr('data-src') ||
      scoped.attr('data-lazy-src') ||
      parseSrcSet(scoped.attr('srcset')) ||
      parseSrcSet(scoped.attr('data-srcset'));
    const resolved = resolveUrl(baseUrl, raw);
    if (resolved) return resolved;
  }
  return null;
}

function collectCategoryValues(node: cheerio.Cheerio<any>, selectors: string[] | undefined) {
  const categories = new Set<string>();

  for (const selector of selectors || []) {
    const scopedItems = node.filter(selector).length ? node.filter(selector).toArray() : node.find(selector).toArray();
    scopedItems.forEach((item) => {
      const raw =
        normalizeText((item as any)?.attribs?.content) ||
        normalizeText((item as any)?.attribs?.title) ||
        normalizeText((item as any)?.attribs?.['aria-label']) ||
        normalizeText((item as any)?.children?.map((child: any) => child?.data || '').join(' '));

      raw
        .split(/[،,|]/)
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .slice(0, 4)
        .forEach((value) => categories.add(value));
    });
  }

  return Array.from(categories).slice(0, 8);
}

function parseJsonLd(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function flattenJsonLdNodes(value: unknown): Record<string, any>[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenJsonLdNodes(item));
  if (typeof value !== 'object') return [];

  const objectValue = value as Record<string, any>;
  const graphNodes = Array.isArray(objectValue['@graph']) ? objectValue['@graph'].flatMap((item) => flattenJsonLdNodes(item)) : [];

  return [objectValue, ...graphNodes];
}

function getJsonLdImage(value: any, baseUrl: string) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return null;
  if (typeof candidate === 'string') return resolveUrl(baseUrl, candidate);
  if (typeof candidate === 'object') return resolveUrl(baseUrl, candidate.url || candidate.contentUrl);
  return null;
}

function extractJsonLdArticleData($: cheerio.CheerioAPI, baseUrl: string) {
  const nodes = $('script[type="application/ld+json"]')
    .toArray()
    .flatMap((element) => flattenJsonLdNodes(parseJsonLd($(element).contents().text())));

  const articleNode = nodes.find((node) => {
    const typeValue = node?.['@type'];
    const types = Array.isArray(typeValue) ? typeValue : [typeValue];
    return types.some((type) => typeof type === 'string' && /Article|NewsArticle|ReportageNewsArticle/i.test(type));
  });

  if (!articleNode) {
    return {
      summary: '',
      image: null as string | null,
      publishedAt: null as Date | null,
      categories: [] as string[],
    };
  }

  const categories = [
    ...String(articleNode.articleSection || '')
      .split(/[،,|]/)
      .map((item) => normalizeText(item))
      .filter(Boolean),
    ...String(articleNode.keywords || '')
      .split(/[،,|]/)
      .map((item) => normalizeText(item))
      .filter(Boolean),
  ];

  return {
    summary: normalizeText(articleNode.description),
    image: getJsonLdImage(articleNode.image, baseUrl),
    publishedAt: parseDate(articleNode.datePublished || articleNode.dateCreated || articleNode.dateModified),
    categories,
  };
}

function extractImageFromNode(node: cheerio.Cheerio<any>, baseUrl: string) {
  const directImage =
    node.find('media\\:thumbnail').first().attr('url') ||
    node.find('media\\:content').first().attr('url') ||
    node.find('enclosure').first().attr('url') ||
    node.find('img').first().attr('src') ||
    node.find('img').first().attr('data-src') ||
    node.find('img').first().attr('data-lazy-src') ||
    parseSrcSet(node.find('img').first().attr('srcset')) ||
    parseSrcSet(node.find('source').first().attr('srcset'));

  if (directImage) {
    return resolveUrl(baseUrl, directImage);
  }

  const html =
    node.find('content\\:encoded').first().text() ||
    node.find('description').first().text() ||
    '';

  if (!html) return null;

  const $ = cheerio.load(html);
  return (
    resolveUrl(baseUrl, $('meta[property="og:image"]').attr('content')) ||
    resolveUrl(baseUrl, $('img').first().attr('src')) ||
    resolveUrl(baseUrl, $('img').first().attr('data-src')) ||
    resolveUrl(baseUrl, parseSrcSet($('img').first().attr('srcset')))
  );
}

function getArticleId(sourceId: string, link: string, title: string) {
  const seed = normalizeUrl(link) || `${sourceId}:${normalizeText(title)}`;
  return createHash('sha1').update(seed).digest('hex').slice(0, 16);
}

export function getInternalPulseHref(articleId: string) {
  return `${medicalBriefPath}/s/${articleId}`;
}

export function getPulseImageUrl(image: string | null | undefined) {
  const normalized = normalizeText(image);
  if (!normalized || normalized.startsWith('/')) return normalized || defaultArticleImage;
  return `/api/pulse-image?url=${encodeURIComponent(normalized)}`;
}

function normalizePublishedAt(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : parseDate(String(value));
}

function compareArticles(a: PulseArticle, b: PulseArticle) {
  const dateA = normalizePublishedAt(a.publishedAt)?.getTime() || 0;
  const dateB = normalizePublishedAt(b.publishedAt)?.getTime() || 0;
  if (dateA !== dateB) return dateB - dateA;
  return a.title.localeCompare(b.title, 'ar');
}

function revivePulseArticle(article: PulseArticle): PulseArticle {
  return {
    ...article,
    publishedAt: normalizePublishedAt(article.publishedAt),
  };
}

function classifyArticle(article: Omit<PulseArticle, 'id' | 'sourceId' | 'specialtyId'>) {
  const haystack = `${article.title} ${article.summary} ${article.categories.join(' ')}`.toLowerCase();

  for (const specialty of specialtyConfigs) {
    if (specialty.directCategories?.some((category) => article.categories.some((item) => item.includes(category)))) {
      return specialty.id;
    }
    if (specialty.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      return specialty.id;
    }
  }

  return 'general';
}

function normalizeArticleInput(
  source: SourceConfig,
  article: Omit<PulseArticle, 'id' | 'sourceId' | 'specialtyId' | 'language' | 'source' | 'sourceUrl'>,
) {
  const normalizedLink = normalizeUrl(article.link);
  const normalizedTitle = cleanTitle(article.title);
  const normalizedSummary = getSafeExcerpt(stripHtml(article.summary));
  const normalizedCategories = article.categories.map((item) => normalizeText(item)).filter(Boolean);

  if (!normalizedLink || !normalizedTitle || !isMostlyArabicText(normalizedTitle)) {
    return null;
  }

  const baseArticle = {
    title: normalizedTitle,
    link: normalizedLink,
    summary: normalizedSummary,
    publishedAt: article.publishedAt,
    image: article.image,
    categories: normalizedCategories,
    source: source.name,
    sourceUrl: source.homeUrl,
    language: 'ar' as const,
  };

  if (!isMedicalArticle(source, { ...baseArticle, categories: normalizedCategories })) {
    return null;
  }

  return {
    ...baseArticle,
    id: getArticleId(source.id, normalizedLink, normalizedTitle),
    sourceId: source.id,
    specialtyId: classifyArticle(baseArticle),
  } satisfies PulseArticle;
}

async function fetchRssFeed(source: SourceConfig): Promise<PulseArticle[]> {
  try {
    const response = await fetch(source.feedUrl, {
      next: { revalidate: pulseRevalidate },
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'ar,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; mostshfa-medical-pulse/2.0)',
      },
    });

    if (!response.ok) return [];

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const articles: PulseArticle[] = [];
    const limit = source.maxItems || 16;

    $('item').each((index, element) => {
      if (index >= limit) return false;

      const item = $(element);
      const title = normalizeText(item.find('title').first().text());
      const link = normalizeText(item.find('link').first().text());
      const description = normalizeText(
        item.find('description').first().text() || item.find('content\\:encoded').first().text(),
      );
      const categories = item
        .find('category')
        .toArray()
        .map((category) => normalizeText($(category).text()))
        .filter(Boolean);

      if (!title || !link) return;
      if (source.categoryFilter && !source.categoryFilter.test(categories.join(' ') || link)) return;
      if (source.linkFilter && !source.linkFilter.test(link)) return;

      const normalizedArticle = normalizeArticleInput(source, {
        title,
        link,
        summary: description,
        publishedAt: parseDate(item.find('pubDate').first().text()),
        image: extractImageFromNode(item, source.homeUrl),
        categories,
      });

      if (normalizedArticle) {
        articles.push(normalizedArticle);
      }
    });

    return articles;
  } catch {
    return [];
  }
}

async function fetchHtmlFeed(source: SourceConfig): Promise<PulseArticle[]> {
  if (!source.articleLinkPattern) return [];

  try {
    const response = await fetch(source.feedUrl, {
      next: { revalidate: pulseRevalidate },
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; mostshfa-medical-pulse/2.0)',
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const deduped = new Map<string, PulseArticle>();
    const limit = source.maxItems || 16;

    $('a[href]').each((_, element) => {
      if (deduped.size >= limit) return false;

      const anchor = $(element);
      const href = resolveUrl(source.homeUrl, anchor.attr('href'));
      if (!href || !source.articleLinkPattern?.test(href)) return;
      if (source.linkFilter && !source.linkFilter.test(href)) return;

      const container = anchor.closest('article, li, section, div');
      const title =
        cleanTitle(anchor.attr('title')) ||
        normalizeText(anchor.find('img').attr('alt')) ||
        normalizeText(anchor.text()) ||
        getTextFromSelectors(container, source.listingTitleSelectors) ||
        normalizeText(container.find('h1, h2, h3, h4').first().text());

      const summary =
        getTextFromSelectors(container, source.listingSummarySelectors) ||
        normalizeText(container.find('p').first().text()) ||
        normalizeText(container.find('[class*="summary"], [class*="excerpt"]').first().text());

      const dateText =
        getTextFromSelectors(container, source.listingDateSelectors) ||
        normalizeText(container.find('time').first().attr('datetime')) ||
        normalizeText(container.find('time').first().text());

      const categories = [
        ...collectCategoryValues(container, source.listingCategorySelectors),
        normalizeText(container.find('[class*="category"], [class*="section"], nav a').first().text()),
        source.name,
      ].filter(Boolean);

      const image =
        getImageFromSelectors(container, source.homeUrl, source.listingImageSelectors) ||
        extractImageFromNode(container, source.homeUrl) ||
        resolveUrl(source.homeUrl, $('meta[property="og:image"]').attr('content'));

      const normalizedArticle = normalizeArticleInput(source, {
        title,
        link: href,
        summary,
        publishedAt: parseDate(dateText),
        image,
        categories,
      });

      if (normalizedArticle) {
        deduped.set(normalizedArticle.link, normalizedArticle);
      }
    });

    return Array.from(deduped.values());
  } catch {
    return [];
  }
}

async function fetchSource(source: SourceConfig) {
  return source.sourceType === 'rss' ? fetchRssFeed(source) : fetchHtmlFeed(source);
}

function shouldEnrichArticle(article: PulseArticle) {
  const source = getSourceConfigById(article.sourceId);
  return (
    !article.image ||
    !article.publishedAt ||
    article.summary.length < 140 ||
    article.categories.length < 2 ||
    Boolean(source?.aggressiveEnrichment)
  );
}

async function enrichArticle(article: PulseArticle): Promise<PulseArticle> {
  if (!shouldEnrichArticle(article)) return article;

  try {
    const response = await fetch(article.link, {
      next: { revalidate: pulseRevalidate },
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; mostshfa-medical-pulse/2.0)',
      },
    });

    if (!response.ok) return article;

    const html = await response.text();
    const $ = cheerio.load(html);
    const source = getSourceConfigById(article.sourceId);
    const root = $('html');
    const contentRoot = $('article, main').first();
    const jsonLd = extractJsonLdArticleData($, article.link);

    const summary =
      getSafeExcerpt(
        getTextFromSelectors(root, source?.articleSummarySelectors) ||
          getTextFromSelectors(contentRoot, source?.articleSummarySelectors) ||
          jsonLd.summary ||
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          $('article p').first().text() ||
          article.summary,
      ) || article.summary;

    const image =
      getImageFromSelectors(root, article.link, source?.articleImageSelectors) ||
      getImageFromSelectors(contentRoot, article.link, source?.articleImageSelectors) ||
      jsonLd.image ||
      resolveUrl(article.link, $('meta[property="og:image"]').attr('content')) ||
      resolveUrl(article.link, $('meta[name="twitter:image"]').attr('content')) ||
      extractImageFromNode($('article').first(), article.link) ||
      article.image;

    const publishedAt =
      parseDate(
        getTextFromSelectors(root, source?.articleDateSelectors) ||
          getTextFromSelectors(contentRoot, source?.articleDateSelectors) ||
          jsonLd.publishedAt?.toISOString() ||
          $('meta[property="article:published_time"]').attr('content') ||
          $('time').first().attr('datetime') ||
          $('time').first().text(),
      ) || article.publishedAt;

    const categories = Array.from(
      new Set([
        ...article.categories,
        ...jsonLd.categories,
        ...collectCategoryValues(root, source?.articleCategorySelectors),
        ...collectCategoryValues(contentRoot, source?.articleCategorySelectors),
        ...$('meta[property="article:tag"]')
          .toArray()
          .map((tag) => normalizeText($(tag).attr('content')))
          .filter(Boolean),
      ]),
    );

    const enrichedBase = {
      ...article,
      summary,
      image,
      publishedAt,
      categories,
    };

    return {
      ...enrichedBase,
      specialtyId: classifyArticle(enrichedBase),
    };
  } catch {
    return article;
  }
}

const getCachedRawPulseArticles = unstable_cache(async () => {
  const results = await Promise.all(sourceConfigs.map(fetchSource));
  const deduped = new Map<string, PulseArticle>();

  results.flat().forEach((article) => {
    const key = normalizeUrl(article.link) || article.id;
    if (!deduped.has(key)) {
      deduped.set(key, article);
    }
  });

  const articles = Array.from(deduped.values()).sort(compareArticles);
  const enrichedIds = new Set(
    articles
      .filter(shouldEnrichArticle)
      .slice(0, 40)
      .map((article) => article.id),
  );

  const enrichedArticles = await Promise.all(
    articles.map((article) => (enrichedIds.has(article.id) ? enrichArticle(article) : Promise.resolve(article))),
  );

  return enrichedArticles.sort(compareArticles);
}, ['pulse-raw-articles'], { revalidate: pulseRevalidate });

const getRawPulseArticles = cache(async () => {
  const articles = await getCachedRawPulseArticles();
  return articles.map(revivePulseArticle).sort(compareArticles);
});

export const getPulseData = cache(async (): Promise<PulseData> => {
  const articles = await getRawPulseArticles();
  const latestArticles = articles.slice(0, 36);
  const latestBySpecialty = specialtyConfigs
    .map((specialty) => ({
      ...specialty,
      items: articles.filter((article) => article.specialtyId === specialty.id).slice(0, 8),
    }))
    .filter((specialty) => specialty.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length || a.title.localeCompare(b.title, 'ar'));

  const sources = sourceConfigs.map((source) => ({
    ...source,
    itemCount: articles.filter((article) => article.source === source.name).length,
  }));

  const lastUpdated = latestArticles[0]?.publishedAt || null;

  return {
    latestArticles,
    latestBySpecialty,
    sources,
    totalArticles: articles.length,
    totalSpecialties: latestBySpecialty.length,
    totalSources: sources.filter((source) => source.itemCount > 0).length,
    lastUpdated,
  };
});

export const getPulseArticleById = cache(async (articleId: string) => {
  const articles = await getRawPulseArticles();
  const article = articles.find((item) => item.id === articleId) || null;
  if (!article) return null;
  if (shouldEnrichArticle(article)) {
    return enrichArticle(article);
  }
  return article;
});

export async function getPulseStaticParams() {
  const articles = await getRawPulseArticles();
  return articles.slice(0, 200).map((article) => ({ id: article.id }));
}

export function getSpecialtyConfig(specialtyId: string) {
  return specialtyConfigs.find((item) => item.id === specialtyId) || specialtyConfigs.find((item) => item.id === 'general')!;
}

export function getHelpfulLinksForArticle(article: PulseArticle): HelpfulLink[] {
  const specialty = getSpecialtyConfig(article.specialtyId);
  const keyword = specialty.searchHint || specialty.title;
  const isDrugFocused = article.specialtyId === 'nutrition' || article.specialtyId === 'endocrine';

  return [
    {
      title: `ابحث عن ${keyword} داخل الموقع`,
      description: 'نتائج داخلية ذكية تربط الخبر بالأدلة والمقالات والخدمات ذات الصلة.',
      href: `/search?q=${encodeURIComponent(keyword)}`,
    },
    {
      title: 'مقالات عربية من مستشفى.كوم',
      description: 'محتوى تحريري داخلي يشرح الموضوع بلغة مبسطة ويكمل الخبر الخارجي.',
      href: '/articles',
    },
    {
      title: 'دليل الأطباء والخدمات',
      description: 'انتقل من الخبر إلى الخدمة العملية وابحث عن طبيب أو عيادة أو مستشفى مناسب.',
      href: article.specialtyId === 'children' ? '/doctors' : '/directories',
    },
    {
      title: isDrugFocused ? 'الأدوية والبدائل' : 'الفحوصات والتحاليل',
      description:
        isDrugFocused
          ? 'راجع الأدوية المرتبطة بالحالة والبدائل والأسعار المتاحة.'
          : 'اكتشف المعامل والتحاليل والخدمات المرتبطة بالموضوع الصحي.',
      href: isDrugFocused ? '/drugs' : '/labs',
    },
    {
      title: 'اسأل عبر البحث العام',
      description: `اكتب ${keyword} أو اسم العرض أو المرض للوصول السريع إلى كل النتائج المرتبطة داخل الموقع.`,
      href: `/search?q=${encodeURIComponent(article.categories[0] || keyword)}`,
    },
  ];
}

export function getRelatedPulseArticles(data: PulseData, article: PulseArticle, limit = 4) {
  return data.latestArticles
    .filter((item) => item.id !== article.id)
    .sort((a, b) => {
      const specialtyMatch = Number(b.specialtyId === article.specialtyId) - Number(a.specialtyId === article.specialtyId);
      if (specialtyMatch !== 0) return specialtyMatch;
      return compareArticles(a, b);
    })
    .slice(0, limit);
}
