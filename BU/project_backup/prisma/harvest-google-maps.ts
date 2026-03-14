
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

// Comprehensive list of locations in Egypt
const LOCATIONS = [
    // Greater Cairo
    'التجمع الخامس', 'الجيزة',
    'القاهرة', 'القليوبية', '6 اكتوبر', 'الشيخ زايد', 'المعادي', 'مدينة نصر', 'مصر الجديدة', 'حلوان', 'شبرا', 'المرج', 'عين شمس', 'المطرية',
    // Delta
    'الاسكندرية', 'طنطا', 'المنصورة', 'الزقازيق', 'بنها', 'دمنهور', 'شبين الكوم', 'كفر الشيخ', 'دمياط', 'المحلة الكبرى', 'دسوق', 'منيا القمح', 'بلبيس',
    // Canal & Sinai
    'بورسعيد', 'الاسماعيلية', 'السويس', 'العريش', 'الطور', 'شرم الشيخ', 'دهب', 'راس سدر',
    // Upper Egypt
    'بني سويف', 'المنيا', 'اسيوط', 'سوهاج', 'قنا', 'الاقصر', 'اسوان', 'الفيوم', 'ملوي', 'منفلوط', 'ابوتيج', 'جرجا', 'نجع حمادي', 'ادفو', 'كوم امبو',
    // Coastal/Tourist/Frontier
    'مرسى مطروح', 'الغردقة', 'سفاجا', 'القصير', 'مرسى علم', 'الخارجة', 'الداخلة'
];

// Global mapping of Hospital Types (fetched from DB)
const HOSPITAL_TYPES_MAP: Record<string, number> = {
    'تخصصي': 25,
    'تعليمي / جامعي': 28,
    'حكومي': 27,
    'خاص': 26,
    'خيري / غير ربحي': 23,
    'رعاية طويلة الأمد': 22,
    'عام': 24,
    'عسكري': 29,
    'عيادات خارجية': 21,
    'عيادة': 5,
    'لإعادة التأهيل': 20,
    'للأطفال': 17,
    'للصحة النفسية': 19,
    'للنساء والولادة': 18,
    'مجمع طبي': 6,
    'مركز طبي': 30, // New ID
    'مستشفى تخصصي': 25,
    'مستشفى تعليمي': 28,
    'مستشفى جامعي': 28,
    'مستشفى حكومي': 27,
    'مستشفى خاص': 26,
    'مستشفى عام': 24,
    'مستشفى عسكري': 29,
    'المستشفى العسكري': 29,
    'مستشفى': 24, // Fallback to General
    'المستشفى': 24,
    'مركز': 30, // Fallback to Center
    'المركز': 30,
    'عيادة_fallback': 5, // Generic fallback to Clinic
    'General Hospital': 24,
    'Private Hospital': 26,
    'Specialized Hospital': 25,
    'University Hospital': 28,
    'Military Hospital': 29,
    'Children\'s Hospital': 17,
    'Maternity Hospital': 18,
    'Mental Health Hospital': 19,
    'Medical Center': 30,
    'Clinic': 5
};

// Helper to find type ID
function findHospitalTypeId(category: string): number | null {
    if (!category) return null;
    // Normalize text
    const normalized = category.trim();
    
    // Direct match
    if (HOSPITAL_TYPES_MAP[normalized]) return HOSPITAL_TYPES_MAP[normalized];
    
    // Keyword match (longest first to avoid partial matches on shorter substrings)
    const keys = Object.keys(HOSPITAL_TYPES_MAP).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        if (key.includes('_fallback')) continue;
        // Check if normalized contains key (simple)
        if (normalized.includes(key)) {
            return HOSPITAL_TYPES_MAP[key];
        }
        // Check if removing 'ال' from normalized helps
        const noAl = normalized.replace(/^ال/, '');
        if (noAl.includes(key)) {
            return HOSPITAL_TYPES_MAP[key];
        }
    }
    
    // Fallbacks
    if (normalized.includes('عيادة')) return HOSPITAL_TYPES_MAP['عيادة_fallback'];
    
    // Special English mapping
    // English -> Arabic mapping
    const ENGLISH_MAP: Record<string, number> = {
        'General Hospital': 24,
        'Private Hospital': 26,
        'Specialized Hospital': 25,
        'University Hospital': 28,
        'Military Hospital': 29,
        'Children\'s Hospital': 17,
        'Maternity Hospital': 18,
        'Mental Health Hospital': 19,
        'Medical Center': 30,
        'Clinic': 5
    };
    
    for (const [eng, id] of Object.entries(ENGLISH_MAP)) {
        if (normalized.includes(eng)) return id;
    }
    
    if (normalized.includes('Hospital')) return 24; // General Hospital fallback
    if (normalized.includes('Clinic')) return 5;
    
    return null;
}

// Helper to clean text (Node context)
const cleanTextNode = (text: string | null | undefined) => {
    if (!text) return '';
    return text.replace(/[\uE000-\uF8FF]/g, '')
               .replace(/[\uE14D\uE0C8]/g, '')
               .replace(/[]/g, '')
               .trim();
};

// Specialized cleaner for descriptions (Node context)
const cleanDescriptionNode = (text: string | null | undefined) => {
    if (!text) return '';
    let cleaned = cleanTextNode(text);
    // Remove common Google Maps UI phrases (Arabic & English)
    const garbage = [
        'الموقع الإلكتروني', 'Website',
        'الاتجاهات', 'Directions',
        'حفظ', 'Save',
        'مشاركة', 'Share',
        'نسخ', 'Copy',
        'إرسال إلى هاتفك', 'Send to your phone',
        'مفتوح على مدار الساعة', 'Open 24 hours',
        'مغلق', 'Closed',
        'يفتح في', 'Opens at',
        'اقتراح تعديل', 'Suggest an edit',
        'هل تملك هذا النشاط التجاري؟', 'Own this business?',
        '·', // Middle dot
    ];
    
    // Remove phone numbers patterns roughly
     cleaned = cleaned.replace(/\+?\d[\d\s-]{8,}\d/g, ''); 
     // Remove short phone numbers (hotlines) e.g. 16259 or 7-digit landlines
     cleaned = cleaned.replace(/\b\d{5,}\b/g, '');
     
     garbage.forEach(g => {
        cleaned = cleaned.split(g).join('');
    });
    
    // Remove empty lines or short junk
    return cleaned.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 3)
        .join('\n')
        .trim();
};

async function harvestGoogleMaps() {
    console.log('Launching browser for Comprehensive Google Maps harvesting...');
    
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized', '--lang=ar']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // Set language to Arabic for consistent scraping
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'ar'
    });

    // Limit for testing purposes as requested
    let hospitalsProcessed = 0;
    const MAX_HOSPITALS = 3;

    for (const location of LOCATIONS) {
        if (hospitalsProcessed >= MAX_HOSPITALS) break;

        const query = `مستشفيات في ${location}`;
        console.log(`Searching for: ${query}`);
        
        try {
            await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`, { waitUntil: 'networkidle2', timeout: 60000 });
            
            try {
                await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
            } catch (e) {
                console.log('Feed not found immediately');
            }
            
            // Only scroll a little bit for the test
            await autoScroll(page); 

            const places = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('div[role="article"]'));
                return items.map(item => {
                    const text = (item as HTMLElement).innerText;
                    const lines = text.split('\n');
                    const name = item.querySelector('div.fontHeadlineSmall')?.textContent || lines[0];
                    const linkEl = item.querySelector('a');
                    const link = linkEl ? linkEl.href : '';
                    return { name, link, rawText: text };
                });
            });

            console.log(`Found ${places.length} places in ${location}`);

            for (const place of places) {
                if (hospitalsProcessed >= MAX_HOSPITALS) break;
                if (!place.link || place.name.length < 3) continue;

                // Basic check to skip non-hospitals if possible (e.g. pharmacies if they slipped in)
                if (place.name.includes('صيدلية')) continue;

                const existing = await prisma.hospital.findFirst({
                    where: { nameAr: place.name }
                });

                console.log(`Processing: ${place.name} (Exists: ${!!existing})`);
                
                try {
                    await page.goto(place.link, { waitUntil: 'networkidle2', timeout: 30000 });
                    
                    // Wait for details pane
                    try {
                        await page.waitForSelector('h1', { timeout: 5000 });
                    } catch(e) {}

                    // Click to expand hours if possible
                    try {
                        let hoursClicked = false;
                        
                        // Strategy: Iterate through all potential clickable elements that might be the hours expander
                        // Look for elements with aria-expanded="false" OR specific icons/text
                        
                        // 1. Try data-item-id="oh" (Standard)
                        const ohBtn = await page.$('[data-item-id="oh"]');
                        if (ohBtn) {
                            await ohBtn.click();
                            hoursClicked = true;
                        }

                        // 2. Try the specific DIV class found in debug for "Mustashfa Al Salam"
                        // Class: OMl5r hH0dDd jBYmhd
                        // Try clicking via evaluate to ensure native click
                        if (!hoursClicked) {
                            hoursClicked = await page.evaluate(function() {
                                // Try finding the arrow icon explicitly
                                function isArrow(el: Element) { return el.textContent?.includes(''); }
                                const arrowIcon = Array.from(document.querySelectorAll('div, span')).find(isArrow); // U+E5CF
                                if (arrowIcon) {
                                    (arrowIcon as HTMLElement).scrollIntoView();
                                    (arrowIcon as HTMLElement).click();
                                    return true;
                                }
                                
                                const divBtn = document.querySelector('div.hH0dDd[aria-expanded="false"]');
                                if (divBtn) {
                                    (divBtn as HTMLElement).scrollIntoView();
                                    (divBtn as HTMLElement).click();
                                    return true;
                                }
                                return false;
                            });
                        }

                        // 3. Generic aria-expanded="false" (Relaxed)
                        if (!hoursClicked) {
                            const buttons = await page.$$('[aria-expanded="false"]');
                            for (const btn of buttons) {
                                const text = await page.evaluate(function(el: any) { return el.textContent + ' ' + el.getAttribute('aria-label'); }, btn);
                                // If it has keywords OR if it has NO text (likely just an icon/arrow like in Shifa case)
                                if ((text && (text.includes('مفتوح') || text.includes('مغلق') || text.includes('يفتح') || text.includes('ساعات'))) ||
                                    (!text || text.trim().length === 0)) {
                                    try {
                                        await btn.click();
                                        hoursClicked = true;
                                        await new Promise(r => setTimeout(r, 1000)); // Wait for animation
                                        break;
                                    } catch(e) {}
                                }
                            }
                        }
                        
                        // 4. Click by text content (last resort) - generic span/div
                        if (!hoursClicked) {
                             hoursClicked = await page.evaluate(function() {
                                 const elements = Array.from(document.querySelectorAll('div, span, button'));
                                 for (const el of elements) {
                                     const text = el.textContent || '';
                                     if ((text.includes('مفتوح') || text.includes('مغلق') || text.includes('يفتح في')) && 
                                         (el.getAttribute('role') === 'button' || (el as HTMLElement).onclick || el.className.includes('button'))) {
                                         (el as HTMLElement).click();
                                         return true;
                                     }
                                 }
                                 return false;
                             });
                        }
                        
                        // 5. Explicitly search for the dropdown arrow again if still not clicked
                        if (!hoursClicked) {
                            hoursClicked = await page.evaluate(function() {
                                // Specific path for the arrow often found in new UI
                                const arrow = document.querySelector('img[src*="arrow_down"], img[src*="chevron_down"]');
                                if (arrow) {
                                    (arrow as HTMLElement).click();
                                    return true;
                                }
                                return false;
                            });
                        }

                        // Wait for table to expand
                        await new Promise(r => setTimeout(r, 2000));

                    } catch (e) {
                        // Ignore click errors
                    }

                    // Extract Overview Data (Name, Category, Hours, Basic Info)
                    const overviewData = await page.evaluate(function() {
                        // Helper to clean text
                        function cleanText(text: string | null | undefined) {
                            if (!text) return '';
                            return text.replace(/[\uE000-\uF8FF]/g, '')
                                       .replace(/[\uE14D\uE0C8]/g, '')
                                       .replace(/[]/g, '')
                                       .trim();
                        }
                        

                        // Specialized cleaner for descriptions
                        function cleanDescription(text: string | null | undefined) {
                            if (!text) return '';
                            let cleaned = cleanText(text);
                            // Remove common Google Maps UI phrases (Arabic & English)
                            const garbage = [
                                'الموقع الإلكتروني', 'Website',
                                'الاتجاهات', 'Directions',
                                'حفظ', 'Save',
                                'مشاركة', 'Share',
                                'نسخ', 'Copy',
                                'إرسال إلى هاتفك', 'Send to your phone',
                                'مفتوح على مدار الساعة', 'Open 24 hours', // We have this in hours field
                                'مغلق', 'Closed',
                                'يفتح في', 'Opens at',
                                'اقتراح تعديل', 'Suggest an edit',
                                'هل تملك هذا النشاط التجاري؟', 'Own this business?',
                                '·', // Middle dot
                                'لمحة عن هذه البيانات', 'About this data',
                                'تعديل البيانات', 'Edit data',
                            ];
                            
                            // Remove phone numbers patterns roughly
                            // e.g. 010 92001443 or +20 10...
                            cleaned = cleaned.replace(/\+?\d[\d\s-]{8,}\d/g, ''); 

                            // Remove Plus Codes (e.g. 253X+PVG, 4)
                            // Pattern: 4+ alphanumeric chars, plus sign, 2+ alphanumeric chars
                            cleaned = cleaned.replace(/\b[A-Z0-9]{4}\+[A-Z0-9]{2,}(,\s*\d+)?\b/g, '');
                            cleaned = cleaned.replace(/^[A-Z0-9]{4}\+[A-Z0-9]{2,}.*?$/gm, ''); // Remove lines starting with plus code
                            
                            garbage.forEach(g => {
                                cleaned = cleaned.split(g).join('');
                            });
                            
                            // Remove empty lines or short junk
                            return cleaned.split('\n')
                                .map(line => line.trim())
                                .filter(line => line.length > 3)
                                .join('\n')
                                .trim();
                        }

                        const h1s = Array.from(document.querySelectorAll('h1'));
                        const mainH1 = h1s.find(h => h.textContent && !h.textContent.includes('النتائج') && !h.textContent.includes('Results')) || h1s[0];
                        const name = cleanText(mainH1?.textContent);
                        
                        // Category extraction
                        let category = '';
                        const categoryBtn = Array.from(document.querySelectorAll('button')).find(b => 
                            b.getAttribute('jsaction')?.includes('category') && 
                            b.textContent && 
                            b.textContent.length < 30
                        );
                        if (categoryBtn) {
                            category = cleanText(categoryBtn.textContent);
                        }

                        const addressBtn = document.querySelector('button[data-item-id="address"]');
                        const address = cleanText(addressBtn?.textContent);
                        
                        const phoneBtn = document.querySelector('button[data-item-id*="phone"]');
                        const phone = cleanText(phoneBtn?.textContent);
                        
                        const websiteBtn = document.querySelector('a[data-item-id="authority"]');
                        const website = websiteBtn ? websiteBtn.getAttribute('href') : '';
                        
                        let rating = 0;
                        
                        // Strategy 1: Specific selectors
                        const ratingEl = document.querySelector('div.fontDisplayLarge, span[aria-label*="stars"], span[aria-label*="نجوم"]');
                        if (ratingEl) {
                            const text = ratingEl.getAttribute('aria-label') || ratingEl.textContent || '';
                            const match = text.match(/(\d+[.,]\d+)/);
                            if (match) {
                                rating = parseFloat(match[1].replace(',', '.'));
                            }
                        }
                        
                        // Strategy 2: Text search for rating pattern (e.g. "4.5" followed by stars or count)
                        if (!rating) {
                            const allSpans = Array.from(document.querySelectorAll('span, div'));
                            for (const span of allSpans) {
                                const text = span.textContent || '';
                                if (/^\s*\d+[.,]\d+\s*$/.test(text)) { // Exact match "4.5"
                                    const val = parseFloat(text.replace(',', '.'));
                                    if (val >= 1 && val <= 5) {
                                        rating = val;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        const reviewsEl = document.querySelector('button[jsaction="pane.rating.moreReviews"]');
                        let reviewsCount = 0;
                        if (reviewsEl && reviewsEl.textContent) {
                            reviewsCount = parseInt(reviewsEl.textContent.replace(/\D/g, '')) || 0;
                        } else {
                            // Fallback: look for text like "(100)" next to stars
                            const spans = Array.from(document.querySelectorAll('span'));
                            for (const span of spans) {
                                const text = span.textContent || '';
                                if (/^\(\d+\)$/.test(text)) {
                                    reviewsCount = parseInt(text.replace(/\D/g, ''));
                                    break;
                                }
                                if (/^\d+ reviews$/.test(text) || /^\d+ مراجعة$/.test(text)) {
                                    reviewsCount = parseInt(text.replace(/\D/g, ''));
                                    break;
                                }
                            }
                        }

                        // Image Extraction
                        let logo = null;
                        const heroImg = document.querySelector('button[data-item-id="photo"] img');
                        if (heroImg) {
                            logo = (heroImg as HTMLImageElement).src;
                        } else {
                            const imgs = Array.from(document.querySelectorAll('img'));
                            const largeImg = imgs.find(img => img.width > 200 && img.height > 200 && !img.src.includes('street_view'));
                            if (largeImg) logo = largeImg.src;
                        }

                        // Working Hours Extraction
                        let workingHours: Record<string, string> = {};
                        let hasEmergency = false;

                        const hoursTable = document.querySelector('table');
                        if (hoursTable) {
                             const rows = Array.from(hoursTable.querySelectorAll('tr'));
                             rows.forEach(row => {
                                 const day = cleanText(row.querySelector('td:first-child')?.textContent);
                                 
                                 const rowClone = row.cloneNode(true) as HTMLElement;
                                 const buttons = rowClone.querySelectorAll('button');
                                 buttons.forEach(b => b.remove());
                                 
                                 let timeCell = rowClone.querySelector('td[role="text"]');
                                 if (!timeCell) {
                                     const cells = rowClone.querySelectorAll('td');
                                     if (cells.length >= 2) timeCell = cells[1];
                                 }
                                 
                                 let time = cleanText(timeCell?.textContent);
                                 
                                 const timeDiv = timeCell?.querySelector('div[aria-label]');
                                 if (timeDiv) {
                                     time = cleanText(timeDiv.getAttribute('aria-label'));
                                 }

                                 if (time && (time.includes('24 ساعة') || time.includes('٢٤ ساعة') || time.includes('مفتوح على مدار') || time.includes('Open 24 hours'))) {
                                     hasEmergency = true;
                                 }

                                 if (day && time) {
                                     workingHours[day] = time;
                                 }
                             });
                        } 
                        
                        // Fallback for hours (if table empty)
                        if (Object.keys(workingHours).length <= 1) {
                            const hoursContainer = document.querySelector('[aria-label*="Hours"], [aria-label*="ساعات العمل"], [aria-label*="مفتوح"], [aria-label*="مغلق"]');
                            if (hoursContainer) {
                                const label = hoursContainer.getAttribute('aria-label');
                                if (label && (label.includes(';') || label.includes('،'))) {
                                    const days = label.split(/;|،/); 
                                    days.forEach(dayStr => {
                                        dayStr = dayStr.trim();
                                        if (!dayStr) return;
                                        
                                        const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 
                                                          'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                                        
                                        for (const dName of dayNames) {
                                            if (dayStr.startsWith(dName)) {
                                                let timePart = dayStr.substring(dName.length).replace(/^[,،]\s*/, '').trim();
                                                timePart = cleanText(timePart);
                                                if (timePart) {
                                                    workingHours[dName] = timePart;
                                                }
                                                break;
                                            }
                                        }
                                    });
                                }
                            }
                        }

                        // 5. Fallback: If we still don't have hours, look for "Open 24 hours" text anywhere in the overview
                        if (Object.keys(workingHours).length === 0) {
                            const fullText = document.body.innerText;
                            if (fullText.includes('مفتوح على مدار 24 ساعة') || fullText.includes('Open 24 hours') || fullText.includes('نعمل على مدار 24 ساعة')) {
                                hasEmergency = true;
                                const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
                                days.forEach(d => {
                                    workingHours[d] = 'نعمل على مدار 24 ساعة';
                                });
                            }
                        }

                        // Smart Gap Filling for 24h Hospitals
                        // If we detected it's a 24h hospital (hasEmergency is true) but we only captured 1 day (today),
                        // it's safe to assume it's 24h for all days.
                        if (hasEmergency && Object.keys(workingHours).length < 7) {
                             const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
                             const standardTime = 'نعمل على مدار 24 ساعة'; // Or use the one we found
                             
                             days.forEach(d => {
                                 if (!workingHours[d]) {
                                     workingHours[d] = standardTime;
                                 }
                             });
                        }

                        return { name, category, address, phone, website, rating, reviewsCount, logo, workingHours, hasEmergency };
                    });

                    // Click About Tab to get Description and Accessibility
                    let aboutData = { description: '', wheelchairAccessible: false, services: [] as string[] };
                    
                    try {
                        // Try to click 'About' / 'لمحة' tab
                        const aboutClicked = await page.evaluate(() => {
                            const buttons = Array.from(document.querySelectorAll('button, div[role="tab"]'));
                            
                            // Strategy 1: Exact text match
                            const aboutBtn = buttons.find(b => b.textContent?.trim() === 'لمحة' || b.textContent?.trim() === 'About');
                            if (aboutBtn) {
                                (aboutBtn as HTMLElement).click();
                                return true;
                            }

                            // Strategy 2: Aria label
                            const aboutBtn2 = buttons.find(b => {
                                const label = b.getAttribute('aria-label') || '';
                                return label.includes('حول') || label.includes('About') || label.includes('لمحة');
                            });
                            if (aboutBtn2) {
                                (aboutBtn2 as HTMLElement).click();
                                return true;
                            }

                            // Strategy 3: Tab index (usually the second tab)
                            const tabs = document.querySelectorAll('div[role="tablist"] button, div[role="tab"]');
                            if (tabs.length >= 2) {
                                if (tabs[1].getAttribute('aria-selected') === 'true') return true;
                                (tabs[1] as HTMLElement).click();
                                return true;
                            }
                            return false;
                        });

                        if (aboutClicked) {
                            await new Promise(r => setTimeout(r, 3000)); // Wait for content load

                            const aboutExtracted = await page.evaluate(() => {
                                const cleanText = (text: string | null | undefined) => {
                                    if (!text) return '';
                                    return text.replace(/[\uE000-\uF8FF]/g, '')
                                               .replace(/[\uE14D\uE0C8]/g, '')
                                               .replace(/[]/g, '')
                                               .trim();
                                };

                                const collectedServices: string[] = [];
                                let fullDescription = '';
                                let wheelchair = false;

                                const DENY_SERVICES = [
                                    'تم الحفظ', 'الأحدث', 'تثبيت التطبيق', 'نقل عام', 'حركة المرور', 'ركوب الدرّاجات', 
                                    'التضاريس', 'التجوّل الافتراضي', 'حرائق الغابات', 'أداة جودة الهواء', 'مدة الرحلة', 
                                    'القياس', 'تلقائي', 'القمر الصناعي', 'عرض الكرة الأرضية', 'التصنيفات', 'مرحبا', 
                                    'العربية', 'لوحة المفاتيح', 'إخفاء لوحة المفاتيح', 'عرض لوحة المفاتيح', 'مشاركه',
                                    'Saved', 'Latest', 'Install App', 'Public transport', 'Traffic', 'Bicycling',
                                    'Terrain', 'Street View', 'Wildfires', 'Air Quality', 'Travel time', 'Measure',
                                    'Automatic', 'Satellite', 'Globe', 'Categories', 'Welcome', 'Arabic', 'Keyboard', 'Share',
                                    'أداة "جودة الهواء"', 'جودة الهواء', 'Air Quality',
                                    'Save', 'Share', 'Directions', 'Website', 'Call', 'حفظ', 'مشاركة', 'اتجاهات', 'موقع', 'اتصال', 'Review', 'مراجعة',
                                    'Edit', 'تعديل', 'See more', 'المزيد', 'نظرة عامة', 'لمحة', 'Overview', 'About'
                                ];

                                // 1. Scrape Description - Try multiple selectors
                                const descriptionSelectors = [
                                    'div[aria-label*="About"] div[role="presentation"]', 
                                    'div[aria-label*="لمحة"] div[role="presentation"]',
                                    '.PYvSYb', 
                                    'div.WeS02d.fontBodyMedium', 
                                    'div[aria-label*="About"]', 
                                    'div[aria-label*="لمحة"]'
                                ];
                                
                                for (const sel of descriptionSelectors) {
                                    const el = document.querySelector(sel);
                                    if (el && el.textContent && el.textContent.length > 50) {
                                        fullDescription = cleanText(el.textContent);
                                        break;
                                    }
                                }

                                if (!fullDescription) {
                                    const allPs = Array.from(document.querySelectorAll('div[role="main"] p, div[role="main"] span'));
                                    const longest = allPs.reduce((a, b) => (a.textContent?.length || 0) > (b.textContent?.length || 0) ? a : b, {textContent: ''});
                                    if (longest.textContent && longest.textContent.length > 100) {
                                        fullDescription = cleanText(longest.textContent);
                                    }
                                }

                                // 2. Scrape Attributes/Services
                                const allListItems = document.querySelectorAll('div[role="listitem"], ul li, .HpLZTd, .iP2t7d'); 
                                
                                allListItems.forEach(item => {
                                    const text = cleanText(item.textContent);
                                    if (text && text.length > 2 && text.length < 100) {
                                         const isDenied = DENY_SERVICES.some(d => text.includes(d) || d.includes(text));
                                         if (!isDenied) {
                                             collectedServices.push(text);
                                         }
                                    }
                                });

                                const aboutTabText = document.body.innerText;
                                
                                if (
                                    aboutTabText.includes('Wheelchair accessible') || 
                                    aboutTabText.includes('مدخل صالح للكراسي المتحركة') ||
                                    aboutTabText.includes('موقف سيارات صالح للكراسي المتحركة') ||
                                    aboutTabText.includes('مصعد صالح للكراسي المتحركة')
                                ) {
                                     wheelchair = true;
                                     if (!collectedServices.includes('مدخل صالح للكراسي المتحركة')) {
                                         collectedServices.push('مدخل صالح للكراسي المتحركة');
                                     }
                                }

                                if (
                                    aboutTabText.includes('Emergency room') || 
                                    aboutTabText.includes('Emergency service') ||
                                    aboutTabText.includes('غرفة طوارئ') ||
                                    aboutTabText.includes('مركز طوارئ') ||
                                    aboutTabText.includes('طوارئ')
                                ) {
                                     if (!collectedServices.includes('خدمة طوارئ')) {
                                         collectedServices.push('خدمة طوارئ');
                                     }
                                }

                                return { 
                                    description: fullDescription, 
                                    services: Array.from(new Set(collectedServices)),
                                    wheelchair
                                };
                            });

                            // Merge extracted data
                            if (aboutExtracted.description) aboutData.description = aboutExtracted.description;
                            if (aboutExtracted.services.length > 0) {
                                aboutData.services = [...aboutData.services, ...aboutExtracted.services];
                            }
                            if (aboutExtracted.wheelchair) aboutData.wheelchairAccessible = true;
                        }
                    } catch (e) {
                        console.log('Error processing About tab:', e);
                    }

                    // Click Reviews Tab to get Reviews
                    let reviewsData: any[] = [];
                    try {
                        const reviewsClicked = await page.evaluate(function() {
                                // Helper to click safely
                                function clickEl(el: Element) {
                                    try {
                                        (el as HTMLElement).scrollIntoView({ behavior: 'instant', block: 'center' });
                                        (el as HTMLElement).click();
                                        return true;
                                    } catch (e) { return false; }
                                }

                                // Strategy 1: XPath for precise text match
                                const xpath = "//button[contains(., 'Reviews')] | //button[contains(., 'المراجعات')] | //div[@role='tab'][contains(., 'Reviews')] | //div[@role='tab'][contains(., 'المراجعات')]";
                                const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                                const node = result.singleNodeValue;
                                if (node) return clickEl(node as Element);

                                // Strategy 2: Filter all buttons/tabs
                            const buttons = Array.from(document.querySelectorAll('button, div[role="tab"]'));
                            const reviewsBtn = buttons.find(b => {
                                const txt = b.textContent || '';
                                return (txt.includes('المراجعات') || txt.includes('Reviews')) && txt.length < 20; // Ensure it's not a review content
                            });
                            if (reviewsBtn) return clickEl(reviewsBtn);

                            // Strategy 3: Fallback to aria-label
                            const reviewsBtn2 = buttons.find(b => {
                                const label = b.getAttribute('aria-label') || '';
                                return label.includes('المراجعات') || label.includes('Reviews');
                            });
                            if (reviewsBtn2) return clickEl(reviewsBtn2);
                            
                            // Strategy 4: Fallback by index (Riskier)
                            const allTabs = document.querySelectorAll('div[role="tablist"] > *');
                            if (allTabs.length >= 3) return clickEl(allTabs[2]);
                            
                            // Strategy 5: Click on Stars/Rating container (often scrolls to reviews)
                            const stars = document.querySelector('.qaGDee, span[aria-label*="نجمة"], span[aria-label*="stars"]');
                            if (stars) return clickEl(stars);

                            // Strategy 6: Click on Review Count text (e.g. "100 reviews")
                            const reviewCountBtn = Array.from(document.querySelectorAll('button')).find(b => {
                                const t = b.textContent || '';
                                return t.includes('reviews') || t.includes('مراجعة') || t.includes('Review');
                            });
                            if (reviewCountBtn) return clickEl(reviewCountBtn);

                            return false;
                        });

                        // Always try to extract reviews, whether tab clicked or not (fallback to Overview)
                        await new Promise(r => setTimeout(r, 3000)); // Wait for load
                        
                        // Scroll to load more reviews / find reviews in overview
                        await page.evaluate(async function() {
                            const container = document.querySelector('.m6QErb.DxyBCb.kA9KIf.dS8AEf, [role="main"]');
                            if (container) {
                                container.scrollTop = container.scrollHeight;
                                await new Promise(r => setTimeout(r, 1500));
                                container.scrollTop = container.scrollHeight;
                                await new Promise(r => setTimeout(r, 1500));
                            }
                        });

                        reviewsData = await page.evaluate(function() {
                            const reviews: any[] = [];
                            let reviewEls = document.querySelectorAll('div[data-review-id]');
                            
                            // Also try finding reviews by class if data attribute missing
                            if (reviewEls.length === 0) {
                                reviewEls = document.querySelectorAll('div.jftiEf');
                            }
                            
                            // Fallback: look for divs with role="article" inside the review list container
                            if (reviewEls.length === 0) {
                                const container = document.querySelector('.m6QErb.DxyBCb.kA9KIf.dS8AEf');
                                if (container) {
                                    reviewEls = container.querySelectorAll('div[role="article"], div[class*="fontBodyMedium"]');
                                }
                            }

                            for (const el of Array.from(reviewEls)) {
                                if (reviews.length >= 10) break; 
                                
                                const authorEl = el.querySelector('div.d4r55, div.TSUbDb, button.al6Kxe');
                                const author = authorEl ? authorEl.textContent?.trim() : 'Anonymous';
                                
                                const ratingEl = el.querySelector('span[role="img"]');
                                const ratingLabel = ratingEl ? ratingEl.getAttribute('aria-label') : '';
                                let rating = 0;
                                if (ratingLabel) {
                                    const match = ratingLabel.match(/(\d+)/);
                                    if (match) rating = parseInt(match[1]);
                                }
                                
                                const timeEl = el.querySelector('span.rsqaWe, span.xRkPPb, span.PIyP6b');
                                const time = timeEl ? timeEl.textContent?.trim() : '';
                                
                                const textEl = el.querySelector('span.wiI7pd, div.MyEned');
                                const text = textEl ? textEl.textContent?.trim() : '';
                                
                                if (text || rating > 0) {
                                    reviews.push({ author, rating, time, text });
                                }
                            }
                            return reviews;
                        });

                        if (!reviewsClicked) {
                            console.log(`Reviews tab not clicked, extracted ${reviewsData.length} reviews from Overview`);
                        } else {
                            console.log(`Reviews tab clicked, extracted ${reviewsData.length} reviews`);
                        }
                    } catch (e) {
                        console.log('Error processing Reviews tab:', e);
                    }

                    // Combine Data
                    const details = {
                        ...overviewData,
                        ...aboutData,
                        reviews: reviewsData
                    };
                    
                    const url = page.url();
                    const coordsMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                    let lat = coordsMatch ? parseFloat(coordsMatch[1]) : null;
                    let lng = coordsMatch ? parseFloat(coordsMatch[2]) : null;

                    // Clean Symbols Helper
                    const removeSymbols = (str: string | null | undefined) => {
                        if (!str) return '';
                        // Remove Private Use Area and specific symbols
                        return str.replace(/[\uE000-\uF8FF]/g, '')
                                  .replace(/[]/g, '')
                                  .trim();
                    };

                    const CAT_TRANSLATION: Record<string, string> = {
                        'General Hospital': 'مستشفى عام',
                        'Private Hospital': 'مستشفى خاص',
                        'Specialized Hospital': 'مستشفى تخصصي',
                        'University Hospital': 'مستشفى جامعي',
                        'Military Hospital': 'مستشفى عسكري',
                        'Children\'s Hospital': 'مستشفى أطفال',
                        'Maternity Hospital': 'مستشفى نساء وتوليد',
                        'Mental Health Hospital': 'مستشفى صحة نفسية',
                        'Medical Center': 'مركز طبي',
                        'Clinic': 'عيادة'
                    };

                    const hospitalData = {
                        nameAr: removeSymbols(details.name || place.name),
                        address: details.address,
                        phone: details.phone,
                        website: details.website,
                        logo: details.logo,
                        ratingAvg: details.rating,
                        ratingCount: details.reviewsCount,
                        lat: lat,
                        lng: lng,
                        workingHours: JSON.stringify(details.workingHours),
                        hasEmergency: details.hasEmergency,
                        isVerified: true,
                        description: removeSymbols(details.description),
                        wheelchairAccessible: details.wheelchairAccessible,
                        category: CAT_TRANSLATION[details.category] || details.category,
                        typeId: findHospitalTypeId(details.category),
                        metadata: JSON.stringify({ reviews: details.reviews }),
                        services: (() => {
                            const s = details.services || [];
                            // Add Emergency if detected
                            if (details.hasEmergency) {
                                if (!s.includes('يتوفر قسم طوارئ')) s.push('يتوفر قسم طوارئ');
                                if (!s.includes('طوارئ 24 ساعة')) s.push('طوارئ 24 ساعة');
                                if (!s.includes('خدمة طوارئ')) s.push('خدمة طوارئ'); 
                            }
                            
                            // Add Wheelchair if detected
                            if (details.wheelchairAccessible) {
                                if (!s.includes('مدخل صالح للكراسي المتحركة')) s.push('مدخل صالح للكراسي المتحركة');
                            }

                            if (!s.includes('عربة إسعاف')) s.push('عربة إسعاف'); // Assume ambulance availability
                            
                            // Clean and deduplicate
                            return JSON.stringify(Array.from(new Set(s.map(removeSymbols).filter((x: string) => x.length > 2))));
                        })()
                    };

                    let hospitalId;

                    if (existing) {
                        hospitalId = existing.id;
                        await prisma.hospital.update({
                            where: { id: existing.id },
                            data: {
                                address: existing.address || hospitalData.address,
                                phone: existing.phone || hospitalData.phone,
                                website: existing.website || hospitalData.website,
                                logo: existing.logo || hospitalData.logo,
                                lat: existing.lat || hospitalData.lat,
                                lng: existing.lng || hospitalData.lng,
                                workingHours: Object.keys(details.workingHours).length > 0 ? hospitalData.workingHours : existing.workingHours,
                                hasEmergency: existing.hasEmergency || hospitalData.hasEmergency,
                                ratingAvg: hospitalData.ratingAvg > 0 ? hospitalData.ratingAvg : existing.ratingAvg,
                                ratingCount: hospitalData.ratingCount > 0 ? hospitalData.ratingCount : existing.ratingCount,
                                category: hospitalData.category || existing.category,
                                wheelchairAccessible: hospitalData.wheelchairAccessible || existing.wheelchairAccessible,
                                description: hospitalData.description || existing.description,
                                typeId: hospitalData.typeId || existing.typeId,
                                services: hospitalData.services,
                                metadata: hospitalData.metadata
                            }
                        });
                        console.log(`Updated: ${hospitalData.nameAr}`);
                    } else {
                        const slug = `hospital-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                        const newHospital = await prisma.hospital.create({
                            data: {
                                ...hospitalData,
                                slug: slug,
                                description: hospitalData.description || (place.rawText ? cleanDescriptionNode(place.rawText) : '')
                            }
                        });
                        hospitalId = newHospital.id;
                        console.log(`Created: ${hospitalData.nameAr}`);
                        hospitalsProcessed++;
                    }

                    // Save structured working hours
                    if (details.workingHours && Object.keys(details.workingHours).length > 0) {
                        // Map Arabic days to English keys if possible, or just store as is
                        // Our schema expects 'day' string.
                        // Common Arabic days: السبت, الأحد, الاثنين, الثلاثاء, الأربعاء, الخميس, الجمعة
                        
                        const dayMap: Record<string, string> = {
                            'السبت': 'Saturday',
                            'الأحد': 'Sunday',
                            'الاثنين': 'Monday',
                            'الإثنين': 'Monday',
                            'الثلاثاء': 'Tuesday',
                            'الأربعاء': 'Wednesday',
                            'الخميس': 'Thursday',
                            'الجمعة': 'Friday'
                        };

                        for (const [dayKey, timeStr] of Object.entries(details.workingHours)) {
                            if (dayKey === 'raw') continue; // Skip raw dump

                            const normalizedDay = dayMap[dayKey] || dayKey; // Use English if mapped, else original
                            let openTime = timeStr as string;
                            
                            // Clean up openTime (remove garbage icons like  and other non-standard chars)
                            // Remove Private Use Area characters (E000-F8FF) where icons usually live
                            // Also remove other common garbage but keep Arabic/English/Numbers/Punctuation
                            
                            // NOTE: We already cleaned text inside page.evaluate, but let's be double sure here.
                            // But DO NOT remove : or numbers or letters.
                            openTime = openTime.replace(/[\uE000-\uF8FF]/g, '');
                            openTime = openTime.replace(/[\uE14D\uE0C8]/g, ''); // Explicitly remove known bad chars
                            openTime = openTime.replace(/[]/g, ''); // Explicitly remove by char
                            openTime = openTime.trim();

                            const isClosed = openTime.includes('مغلق') || openTime.includes('Closed');
                            
                            // Check for 24h again at record level
                            if (openTime.includes('24 ساعة') || openTime.includes('٢٤ ساعة')) {
                                // update hospital emergency status if not already set
                                if (!details.hasEmergency) {
                                     await prisma.hospital.update({
                                         where: { id: hospitalId },
                                         data: { hasEmergency: true }
                                     });
                                }
                            }

                            await prisma.workingHour.upsert({
                                where: {
                                    hospitalId_day: {
                                        hospitalId: hospitalId,
                                        day: normalizedDay
                                    }
                                },
                                update: {
                                    openTime: openTime,
                                    isClosed: isClosed
                                },
                                create: {
                                    hospitalId: hospitalId,
                                    day: normalizedDay,
                                    openTime: openTime,
                                    isClosed: isClosed
                                }
                            });
                        }
                    }

                    // Save Reviews
                    if (details.reviews && details.reviews.length > 0) {
                        for (const review of details.reviews) {
                            try {
                                const existingReview = await prisma.review.findFirst({
                                    where: {
                                        hospitalId: hospitalId,
                                        author: review.author,
                                        text: review.text
                                    }
                                });

                                if (!existingReview) {
                                    await prisma.review.create({
                                        data: {
                                            hospitalId: hospitalId,
                                            author: review.author,
                                            rating: review.rating,
                                            text: review.text,
                                            time: review.time
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error(`Error saving review for ${hospitalData.nameAr}:`, e);
                            }
                        }
                        console.log(`Saved ${details.reviews.length} reviews for ${hospitalData.nameAr}`);
                    }
                    
                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

                } catch (e) {
                    console.error(`Error processing place ${place.name}:`, e);
                }
            }

        } catch (e) {
            console.error(`Error searching location ${location}:`, e);
        }
    }

    await browser.close();
    await prisma.$disconnect();
}

async function autoScroll(page: any) {
    await page.evaluate(async function() {
        const wrapper = document.querySelector('div[role="feed"]');
        if (!wrapper) return;

        await new Promise<void>((resolve, reject) => {
            var totalHeight = 0;
            var distance = 1000;
            var timer = setInterval(() => {
                var scrollHeight = wrapper.scrollHeight;
                wrapper.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    // Limit to ensure we don't get stuck forever
                    if (document.querySelectorAll('div[role="article"]').length > 100) { 
                         clearInterval(timer);
                         resolve();
                    }
                }
            }, 1000);
            
            setTimeout(() => {
                clearInterval(timer);
                resolve();
            }, 30000);
        });
    });
}

harvestGoogleMaps();
