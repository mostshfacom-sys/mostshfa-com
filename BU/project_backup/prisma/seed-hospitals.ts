
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const governorates = [
  { nameAr: 'القاهرة', nameEn: 'Cairo', cities: ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'التجمع الخامس', 'وسط البلد', 'شبرا', 'الزيتون', 'حدائق القبة', 'عين شمس', 'المرج', 'حلوان', 'المقطم'] },
  { nameAr: 'الجيزة', nameEn: 'Giza', cities: ['الدقي', 'المهندسين', 'الهرم', 'العجوزة', 'إمبابة', 'فيصل', 'الشيخ زايد', '6 أكتوبر', 'المنيب', 'بوالق الدكرور'] },
  { nameAr: 'الإسكندرية', nameEn: 'Alexandria', cities: ['سموحة', 'ميامي', 'المنشية', 'العصافرة', 'المنتزه', 'سيدي بشر', 'فيكتوريا', 'الرمل', 'محرم بك', 'الإبراهيمية'] },
  { nameAr: 'الدقهلية', nameEn: 'Dakahlia', cities: ['المنصورة', 'طلخا', 'ميت غمر', 'السنبلاوين', 'دكرنس', 'شربين'] },
  { nameAr: 'الغربية', nameEn: 'Gharbia', cities: ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'السنطة'] },
  { nameAr: 'الشرقية', nameEn: 'Sharqia', cities: ['الزقازيق', 'منيا القمح', 'بلبيس', 'أبو حماد', 'فاقوس', 'العاشر من رمضان'] },
  { nameAr: 'المنوفية', nameEn: 'Monufia', cities: ['شبين الكوم', 'منوف', 'أشمون', 'قويسنا', 'الباجور'] },
  { nameAr: 'القليوبية', nameEn: 'Qalyubia', cities: ['بنها', 'قليوب', 'شبرا الخيمة', 'الخانكة', 'طوخ'] },
  { nameAr: 'البحيرة', nameEn: 'Beheira', cities: ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'أبو حمص'] },
  { nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', cities: ['كفر الشيخ', 'دسوق', 'فوه', 'سيدي سالم'] },
  { nameAr: 'دمياط', nameEn: 'Damietta', cities: ['دمياط', 'رأس البر', 'دمياط الجديدة'] },
  { nameAr: 'بورسعيد', nameEn: 'Port Said', cities: ['بورسعيد', 'بورفؤاد'] },
  { nameAr: 'الإسماعيلية', nameEn: 'Ismailia', cities: ['الإسماعيلية', 'التل الكبير'] },
  { nameAr: 'السويس', nameEn: 'Suez', cities: ['السويس'] },
  { nameAr: 'الفيوم', nameEn: 'Faiyum', cities: ['الفيوم', 'أبشواي'] },
  { nameAr: 'بني سويف', nameEn: 'Beni Suef', cities: ['بني سويف', 'الواسطى'] },
  { nameAr: 'المنيا', nameEn: 'Minya', cities: ['المنيا', 'ملوي', 'بني مزار'] },
  { nameAr: 'أسيوط', nameEn: 'Asyut', cities: ['أسيوط', 'منفلوط', 'ديروط'] },
  { nameAr: 'سوهاج', nameEn: 'Sohag', cities: ['سوهاج', 'جرجا', 'طهمطا'] },
  { nameAr: 'قنا', nameEn: 'Qena', cities: ['قنا', 'نجع حمادي', 'قوص'] },
  { nameAr: 'الأقصر', nameEn: 'Luxor', cities: ['الأقصر', 'إسنا', 'أرمنت'] },
  { nameAr: 'أسوان', nameEn: 'Aswan', cities: ['أسوان', 'كوم أمبو', 'إدفو'] },
];

const hospitalTypes = [
  { nameAr: 'مستشفى عام', nameEn: 'General Hospital', slug: 'general', icon: 'building-office-2' },
  { nameAr: 'مستشفى تخصصي', nameEn: 'Specialized Hospital', slug: 'specialized', icon: 'star' },
  { nameAr: 'مستشفى جامعي', nameEn: 'University Hospital', slug: 'university', icon: 'academic-cap' },
  { nameAr: 'مستشفى عسكري', nameEn: 'Military Hospital', slug: 'military', icon: 'shield-check' },
  { nameAr: 'مستشفى خاص', nameEn: 'Private Hospital', slug: 'private', icon: 'currency-dollar' },
  { nameAr: 'مركز طبي', nameEn: 'Medical Center', slug: 'center', icon: 'building-storefront' },
];

const hospitalsData = [
  // Cairo
  { nameAr: 'مستشفى السلام الدولي', nameEn: 'As-Salam International Hospital', type: 'private', gov: 'القاهرة', city: 'المعادي', phone: '19885' },
  { nameAr: 'مستشفى دار الفؤاد', nameEn: 'Dar Al Fouad Hospital', type: 'private', gov: 'القاهرة', city: 'مدينة نصر', phone: '16370' },
  { nameAr: 'مستشفى السعودي الألماني', nameEn: 'Saudi German Hospital', type: 'private', gov: 'القاهرة', city: 'مصر الجديدة', phone: '16259' },
  { nameAr: 'مستشفى القصر العيني', nameEn: 'Kasr Al Ainy Hospital', type: 'university', gov: 'القاهرة', city: 'وسط البلد', phone: '0223646394' },
  { nameAr: 'مستشفى عين شمس التخصصي', nameEn: 'Ain Shams Specialized Hospital', type: 'university', gov: 'القاهرة', city: 'عين شمس', phone: '0224024163' },
  { nameAr: 'مستشفى المقاولون العرب', nameEn: 'Arab Contractors Hospital', type: 'private', gov: 'القاهرة', city: 'مدينة نصر', phone: '0223426000' },
  { nameAr: 'مستشفى النزهة الدولي', nameEn: 'Nozha International Hospital', type: 'private', gov: 'القاهرة', city: 'مصر الجديدة', phone: '0226225555' },
  { nameAr: 'مستشفى كليوباترا', nameEn: 'Cleopatra Hospital', type: 'private', gov: 'القاهرة', city: 'مصر الجديدة', phone: '19662' },
  { nameAr: 'مستشفى القاهرة التخصصي', nameEn: 'Cairo Specialized Hospital', type: 'private', gov: 'القاهرة', city: 'مصر الجديدة', phone: '19662' },
  { nameAr: 'مستشفى الجلاء العسكري', nameEn: 'Al Galaa Military Hospital', type: 'military', gov: 'القاهرة', city: 'مصر الجديدة', phone: '0224177777' },
  { nameAr: 'مستشفى المعادي للقوات المسلحة', nameEn: 'Maadi Armed Forces Hospital', type: 'military', gov: 'القاهرة', city: 'المعادي', phone: '0225256222' },
  { nameAr: 'مستشفى الشرطة', nameEn: 'Police Hospital', type: 'military', gov: 'القاهرة', city: 'مدينة نصر', phone: '0222616181' },
  { nameAr: 'مستشفى الحسين الجامعي', nameEn: 'Al Hussein University Hospital', type: 'university', gov: 'القاهرة', city: 'وسط البلد', phone: '0225104676' },
  { nameAr: 'مستشفى سيد جلال', nameEn: 'Sayed Galal Hospital', type: 'university', gov: 'القاهرة', city: 'باب الشعرية', phone: '0225931166' }, // Approximate location
  { nameAr: 'مستشفى الدمرداش', nameEn: 'Demerdash Hospital', type: 'university', gov: 'القاهرة', city: 'العباسية', phone: '0224821896' }, // Need to ensure city exists or map to nearest
  { nameAr: 'مستشفى الزهراء الجامعي', nameEn: 'Al Zahraa University Hospital', type: 'university', gov: 'القاهرة', city: 'العباسية', phone: '0226835555' },
  { nameAr: 'مستشفى معهد ناصر', nameEn: 'Nasser Institute Hospital', type: 'specialized', gov: 'القاهرة', city: 'شبرا', phone: '0222039164' },
  { nameAr: 'مستشفى الساحل التعليمي', nameEn: 'El Sahel Teaching Hospital', type: 'general', gov: 'القاهرة', city: 'شبرا', phone: '0222022728' },
  { nameAr: 'مستشفى شبرا العام', nameEn: 'Shoubra General Hospital', type: 'general', gov: 'القاهرة', city: 'شبرا', phone: '0222350606' },
  { nameAr: 'مستشفى منشية البكري', nameEn: 'Manshiyat El Bakry Hospital', type: 'general', gov: 'القاهرة', city: 'مصر الجديدة', phone: '0222580303' },
  { nameAr: 'مستشفى هليوبوليس', nameEn: 'Heliopolis Hospital', type: 'general', gov: 'القاهرة', city: 'مصر الجديدة', phone: '0226344444' },
  { nameAr: 'مستشفى الزيتون التخصصي', nameEn: 'El Zaitoun Specialized Hospital', type: 'specialized', gov: 'القاهرة', city: 'الزيتون', phone: '0226333333' },
  { nameAr: 'مستشفى المطرية التعليمي', nameEn: 'El Matareya Teaching Hospital', type: 'general', gov: 'القاهرة', city: 'المطرية', phone: '0222501000' }, // Map to nearest city if Matareya not in list
  { nameAr: 'مستشفى أحمد ماهر التعليمي', nameEn: 'Ahmed Maher Teaching Hospital', type: 'general', gov: 'القاهرة', city: 'وسط البلد', phone: '0223916666' },
  { nameAr: 'مستشفى الجمهورية', nameEn: 'El Gomhoureya Hospital', type: 'general', gov: 'القاهرة', city: 'وسط البلد', phone: '0223907777' },
  { nameAr: 'مستشفى المنيرة العام', nameEn: 'El Mounira General Hospital', type: 'general', gov: 'القاهرة', city: 'السيدة زينب', phone: '0227944444' }, // Map to nearest
  { nameAr: 'مستشفى بولاق العام', nameEn: 'Bulaq General Hospital', type: 'general', gov: 'القاهرة', city: 'بولاق', phone: '0225766666' }, // Map to nearest
  { nameAr: 'مستشفى دار الشفاء', nameEn: 'Dar El Shefa Hospital', type: 'specialized', gov: 'القاهرة', city: 'العباسية', phone: '0224822222' },
  { nameAr: 'مستشفى الجوي التخصصي', nameEn: 'Air Force Specialized Hospital', type: 'military', gov: 'القاهرة', city: 'التجمع الخامس', phone: '15888' },
  { nameAr: 'مستشفى القاهرة الجديدة', nameEn: 'New Cairo Hospital', type: 'general', gov: 'القاهرة', city: 'التجمع الخامس', phone: '0226188888' },
  { nameAr: 'مستشفى البنك الأهلي', nameEn: 'National Bank Hospital', type: 'specialized', gov: 'القاهرة', city: 'المقطم', phone: '19662' }, // Managed by Cleopatra
  { nameAr: 'مستشفى المقطم للتأمين الصحي', nameEn: 'Mokattam Insurance Hospital', type: 'general', gov: 'القاهرة', city: 'المقطم', phone: '0225080000' },
  { nameAr: 'مستشفى حلوان العام', nameEn: 'Helwan General Hospital', type: 'general', gov: 'القاهرة', city: 'حلوان', phone: '0225566666' },
  { nameAr: 'مستشفى النصر للتأمين الصحي', nameEn: 'El Nasr Insurance Hospital', type: 'general', gov: 'القاهرة', city: 'حلوان', phone: '0225555555' },
  { nameAr: 'مستشفى 15 مايو النموذجي', nameEn: '15 May Model Hospital', type: 'general', gov: 'القاهرة', city: '15 مايو', phone: '0225500000' }, // Map to nearest

  // Giza
  { nameAr: 'مستشفى السلام الدولي', nameEn: 'As-Salam International Hospital', type: 'private', gov: 'الجيزة', city: 'الدقي', phone: '19885' }, // Branch
  { nameAr: 'مستشفى دار الفؤاد', nameEn: 'Dar Al Fouad Hospital', type: 'private', gov: 'الجيزة', city: '6 أكتوبر', phone: '16370' },
  { nameAr: 'مستشفى سعاد كفافي الجامعي', nameEn: 'Souad Kafafi University Hospital', type: 'university', gov: 'الجيزة', city: '6 أكتوبر', phone: '0238362470' },
  { nameAr: 'مستشفى جامعة 6 أكتوبر', nameEn: '6th of October University Hospital', type: 'university', gov: 'الجيزة', city: '6 أكتوبر', phone: '0238355275' },
  { nameAr: 'مستشفى الشيخ زايد التخصصي', nameEn: 'Sheikh Zayed Specialized Hospital', type: 'specialized', gov: 'الجيزة', city: 'الشيخ زايد', phone: '0238500921' },
  { nameAr: 'مستشفى بهية', nameEn: 'Baheya Hospital', type: 'specialized', gov: 'الجيزة', city: 'الهرم', phone: '16602' },
  { nameAr: 'مستشفى الهرم', nameEn: 'Al Haram Hospital', type: 'general', gov: 'الجيزة', city: 'الهرم', phone: '0235866666' },
  { nameAr: 'مستشفى العجوزة', nameEn: 'Agouza Hospital', type: 'general', gov: 'الجيزة', city: 'العجوزة', phone: '0233477777' },
  { nameAr: 'مستشفى إمبابة العام', nameEn: 'Imbaba General Hospital', type: 'general', gov: 'الجيزة', city: 'إمبابة', phone: '0233111111' },
  { nameAr: 'مستشفى الوراق المركزي', nameEn: 'Warraq Central Hospital', type: 'general', gov: 'الجيزة', city: 'الوراق', phone: '0235444444' }, // Map to nearest
  { nameAr: 'مستشفى بولاق الدكرور العام', nameEn: 'Bulaq El Dakrour General Hospital', type: 'general', gov: 'الجيزة', city: 'بولاق الدكرور', phone: '0233222222' },
  { nameAr: 'مستشفى أم المصريين العام', nameEn: 'Om El Masryeen General Hospital', type: 'general', gov: 'الجيزة', city: 'الجيزة', phone: '0235722222' }, // Map to Giza/Moneeb
  { nameAr: 'مستشفى الحوامدية العام', nameEn: 'Hawamdia General Hospital', type: 'general', gov: 'الجيزة', city: 'الحوامدية', phone: '0238133333' }, // Map to nearest
  { nameAr: 'مستشفى البدرشين المركزي', nameEn: 'Badrasheen Central Hospital', type: 'general', gov: 'الجيزة', city: 'البدرشين', phone: '0238022222' }, // Map to nearest
  { nameAr: 'مستشفى العياط المركزي', nameEn: 'Ayat Central Hospital', type: 'general', gov: 'الجيزة', city: 'العياط', phone: '0238600000' }, // Map to nearest
  { nameAr: 'مستشفى الصف المركزي', nameEn: 'Saff Central Hospital', type: 'general', gov: 'الجيزة', city: 'الصف', phone: '0238622222' }, // Map to nearest
  { nameAr: 'مستشفى أطفيح المركزي', nameEn: 'Atfih Central Hospital', type: 'general', gov: 'الجيزة', city: 'أطفيح', phone: '0238444444' }, // Map to nearest
  { nameAr: 'مستشفى الواحات البحرية المركزي', nameEn: 'Bahariya Oasis Central Hospital', type: 'general', gov: 'الجيزة', city: 'الواحات', phone: '0238477777' }, // Map to nearest
  { nameAr: 'مستشفى تبارك', nameEn: 'Tabarak Hospital', type: 'private', gov: 'الجيزة', city: 'فيصل', phone: '0235855555' },
  { nameAr: 'مستشفى الجابري', nameEn: 'El Gabry Hospital', type: 'private', gov: 'الجيزة', city: 'الهرم', phone: '0235844444' },
  { nameAr: 'مستشفى الفؤاد', nameEn: 'Al Fouad Hospital', type: 'private', gov: 'الجيزة', city: 'فيصل', phone: '0235833333' },
  { nameAr: 'مستشفى الشروق', nameEn: 'El Sherouk Hospital', type: 'private', gov: 'الجيزة', city: 'المهندسين', phone: '0233044444' },
  { nameAr: 'مستشفى السلام', nameEn: 'El Salam Hospital', type: 'private', gov: 'الجيزة', city: 'المهندسين', phone: '0233033333' },
  { nameAr: 'مستشفى الصفا', nameEn: 'El Safa Hospital', type: 'private', gov: 'الجيزة', city: 'المهندسين', phone: '0233366666' },

  // Alexandria
  { nameAr: 'مستشفى السلامة', nameEn: 'Al Salama Hospital', type: 'private', gov: 'الإسكندرية', city: 'الشلالات', phone: '034877777' }, // Map to nearest
  { nameAr: 'مستشفى لوران', nameEn: 'Loran Hospital', type: 'private', gov: 'الإسكندرية', city: 'لوران', phone: '035866666' }, // Map to nearest
  { nameAr: 'مستشفى الشروق', nameEn: 'El Sherouk Hospital', type: 'private', gov: 'الإسكندرية', city: 'جليم', phone: '035855555' }, // Map to nearest
  { nameAr: 'مستشفى الأندلسية', nameEn: 'Andalusia Hospital', type: 'private', gov: 'الإسكندرية', city: 'سموحة', phone: '034200000' },
  { nameAr: 'مستشفى مبرة العصافرة', nameEn: 'Mabarra Asafra Hospital', type: 'private', gov: 'الإسكندرية', city: 'العصافرة', phone: '035555555' },
  { nameAr: 'مستشفى القوات المسلحة', nameEn: 'Armed Forces Hospital', type: 'military', gov: 'الإسكندرية', city: 'مصطفى كامل', phone: '035466666' }, // Map to nearest
  { nameAr: 'مستشفى الشرطة', nameEn: 'Police Hospital', type: 'military', gov: 'الإسكندرية', city: 'سموحة', phone: '034255555' },
  { nameAr: 'مستشفى جامعة الإسكندرية الرئيسي', nameEn: 'Alexandria University Main Hospital', type: 'university', gov: 'الإسكندرية', city: 'الشاطبي', phone: '034866666' }, // Map to nearest
  { nameAr: 'مستشفى الحضرة الجامعي', nameEn: 'El Hadara University Hospital', type: 'university', gov: 'الإسكندرية', city: 'الحضرة', phone: '034244444' }, // Map to nearest
  { nameAr: 'مستشفى الشاطبي الجامعي', nameEn: 'El Shatby University Hospital', type: 'university', gov: 'الإسكندرية', city: 'الشاطبي', phone: '034855555' }, // Map to nearest
  { nameAr: 'مستشفى سموحة الجامعي', nameEn: 'Smouha University Hospital', type: 'university', gov: 'الإسكندرية', city: 'سموحة', phone: '034299999' },
  { nameAr: 'مستشفى المواساة الجامعي', nameEn: 'El Moassat University Hospital', type: 'university', gov: 'الإسكندرية', city: 'الحضرة', phone: '034233333' }, // Map to nearest
  { nameAr: 'مستشفى شرق المدينة', nameEn: 'East City Hospital', type: 'general', gov: 'الإسكندرية', city: 'ميامي', phone: '035544444' },
  { nameAr: 'مستشفى العامرية العام', nameEn: 'Amriya General Hospital', type: 'general', gov: 'الإسكندرية', city: 'العامرية', phone: '034488888' }, // Map to nearest
  { nameAr: 'مستشفى برج العرب العام', nameEn: 'Borg El Arab General Hospital', type: 'general', gov: 'الإسكندرية', city: 'برج العرب', phone: '034599999' }, // Map to nearest
  { nameAr: 'مستشفى رأس التين العام', nameEn: 'Ras El Tin General Hospital', type: 'general', gov: 'الإسكندرية', city: 'الجمرك', phone: '034800000' }, // Map to nearest
  { nameAr: 'مستشفى الجمهورية العام', nameEn: 'El Gomhoureya General Hospital', type: 'general', gov: 'الإسكندرية', city: 'كرموز', phone: '033900000' }, // Map to nearest
  { nameAr: 'مستشفى جمال عبد الناصر للتأمين الصحي', nameEn: 'Gamal Abdel Nasser Insurance Hospital', type: 'general', gov: 'الإسكندرية', city: 'الحضرة', phone: '034222222' }, // Map to nearest
  { nameAr: 'مستشفى كرموز للتأمين الصحي', nameEn: 'Karmouz Insurance Hospital', type: 'general', gov: 'الإسكندرية', city: 'كرموز', phone: '033911111' }, // Map to nearest
  { nameAr: 'مستشفى أبو قير العام', nameEn: 'Abu Qir General Hospital', type: 'general', gov: 'الإسكندرية', city: 'أبو قير', phone: '035622222' }, // Map to nearest

  // Dakahlia (Mansoura)
  { nameAr: 'مستشفى المنصورة الدولي', nameEn: 'Mansoura International Hospital', type: 'general', gov: 'الدقهلية', city: 'المنصورة', phone: '0502266666' },
  { nameAr: 'مستشفى جامعة المنصورة', nameEn: 'Mansoura University Hospital', type: 'university', gov: 'الدقهلية', city: 'المنصورة', phone: '0502244444' },
  { nameAr: 'مركز الكلى والمسالك البولية', nameEn: 'Urology and Nephrology Center', type: 'university', gov: 'الدقهلية', city: 'المنصورة', phone: '0502233333' },
  { nameAr: 'مستشفى الطوارئ', nameEn: 'Emergency Hospital', type: 'university', gov: 'الدقهلية', city: 'المنصورة', phone: '0502255555' },
  { nameAr: 'مستشفى الباطنة التخصصي', nameEn: 'Internal Medicine Specialized Hospital', type: 'university', gov: 'الدقهلية', city: 'المنصورة', phone: '0502277777' },
  { nameAr: 'مستشفى الأطفال الجامعي', nameEn: 'Children University Hospital', type: 'university', gov: 'الدقهلية', city: 'المنصورة', phone: '0502288888' },
  { nameAr: 'مستشفى الخير', nameEn: 'El Khair Hospital', type: 'private', gov: 'الدقهلية', city: 'المنصورة', phone: '0502300000' },
  { nameAr: 'مستشفى السلام', nameEn: 'El Salam Hospital', type: 'private', gov: 'الدقهلية', city: 'المنصورة', phone: '0502311111' },
  { nameAr: 'مستشفى النيل', nameEn: 'El Nile Hospital', type: 'private', gov: 'الدقهلية', city: 'المنصورة', phone: '0502322222' },
  { nameAr: 'مستشفى طلخا المركزي', nameEn: 'Talkha Central Hospital', type: 'general', gov: 'الدقهلية', city: 'طلخا', phone: '0502522222' },
  { nameAr: 'مستشفى شربين المركزي', nameEn: 'Sherbin Central Hospital', type: 'general', gov: 'الدقهلية', city: 'شربين', phone: '0502922222' },
  { nameAr: 'مستشفى دكرنس العام', nameEn: 'Dekernes General Hospital', type: 'general', gov: 'الدقهلية', city: 'دكرنس', phone: '0503477777' },
  { nameAr: 'مستشفى ميت غمر المركزي', nameEn: 'Mit Ghamr Central Hospital', type: 'general', gov: 'الدقهلية', city: 'ميت غمر', phone: '0504900000' },
  { nameAr: 'مستشفى السنبلاوين العام', nameEn: 'Sinbillawin General Hospital', type: 'general', gov: 'الدقهلية', city: 'السنبلاوين', phone: '0504688888' },

  // Gharbia (Tanta/Mahalla)
  { nameAr: 'مستشفى جامعة طنطا', nameEn: 'Tanta University Hospital', type: 'university', gov: 'الغربية', city: 'طنطا', phone: '0403333333' },
  { nameAr: 'مستشفى طنطا الدولي', nameEn: 'Tanta International Hospital', type: 'university', gov: 'الغربية', city: 'طنطا', phone: '0403400000' }, // Often called international but part of university or insurance
  { nameAr: 'مستشفى المنشاوي العام', nameEn: 'El Menshawy General Hospital', type: 'general', gov: 'الغربية', city: 'طنطا', phone: '0403344444' },
  { nameAr: 'مستشفى المبرة', nameEn: 'El Mabarra Hospital', type: 'general', gov: 'الغربية', city: 'طنطا', phone: '0403355555' }, // Insurance
  { nameAr: 'مستشفى الهلال الأحمر', nameEn: 'Red Crescent Hospital', type: 'private', gov: 'الغربية', city: 'طنطا', phone: '0403366666' },
  { nameAr: 'مستشفى السلام', nameEn: 'El Salam Hospital', type: 'private', gov: 'الغربية', city: 'طنطا', phone: '0403377777' },
  { nameAr: 'مستشفى الشروق', nameEn: 'El Sherouk Hospital', type: 'private', gov: 'الغربية', city: 'طنطا', phone: '0403388888' },
  { nameAr: 'مستشفى المحلة العام', nameEn: 'El Mahalla General Hospital', type: 'general', gov: 'الغربية', city: 'المحلة الكبرى', phone: '0402222222' },
  { nameAr: 'مستشفى المبرة بالمحلة', nameEn: 'El Mabarra Hospital Mahalla', type: 'general', gov: 'الغربية', city: 'المحلة الكبرى', phone: '0402233333' },
  { nameAr: 'مستشفى الصدر بالمحلة', nameEn: 'Chest Hospital Mahalla', type: 'specialized', gov: 'الغربية', city: 'المحلة الكبرى', phone: '0402244444' },
  { nameAr: 'مستشفى حميات المحلة', nameEn: 'Fever Hospital Mahalla', type: 'specialized', gov: 'الغربية', city: 'المحلة الكبرى', phone: '0402255555' },
  { nameAr: 'مستشفى كفر الزيات العام', nameEn: 'Kafr El Zayat General Hospital', type: 'general', gov: 'الغربية', city: 'كفر الزيات', phone: '0402544444' },
  { nameAr: 'مستشفى زفتى العام', nameEn: 'Zifta General Hospital', type: 'general', gov: 'الغربية', city: 'زفتى', phone: '0405700000' },
  { nameAr: 'مستشفى السنطة المركزي', nameEn: 'Santa Central Hospital', type: 'general', gov: 'الغربية', city: 'السنطة', phone: '0405477777' },

  // Sharqia
  { nameAr: 'مستشفى جامعة الزقازيق', nameEn: 'Zagazig University Hospital', type: 'university', gov: 'الشرقية', city: 'الزقازيق', phone: '0552300000' },
  { nameAr: 'مستشفى الزقازيق العام', nameEn: 'Zagazig General Hospital', type: 'general', gov: 'الشرقية', city: 'الزقازيق', phone: '0552311111' },
  { nameAr: 'مستشفى الأحرار التعليمي', nameEn: 'Al Ahrar Teaching Hospital', type: 'general', gov: 'الشرقية', city: 'الزقازيق', phone: '0552322222' },
  { nameAr: 'مستشفى التيسير', nameEn: 'El Taysir Hospital', type: 'private', gov: 'الشرقية', city: 'الزقازيق', phone: '0552333333' },
  { nameAr: 'مستشفى الفتح', nameEn: 'El Fatah Hospital', type: 'private', gov: 'الشرقية', city: 'الزقازيق', phone: '0552344444' },
  { nameAr: 'مستشفى العبور', nameEn: 'El Obour Hospital', type: 'private', gov: 'الشرقية', city: 'الزقازيق', phone: '0552355555' },
  { nameAr: 'مستشفى منيا القمح المركزي', nameEn: 'Minya El Qamh Central Hospital', type: 'general', gov: 'الشرقية', city: 'منيا القمح', phone: '0553666666' },
  { nameAr: 'مستشفى بلبيس المركزي', nameEn: 'Belbeis Central Hospital', type: 'general', gov: 'الشرقية', city: 'بلبيس', phone: '0552855555' },
  { nameAr: 'مستشفى فاقوس المركزي', nameEn: 'Faqous Central Hospital', type: 'general', gov: 'الشرقية', city: 'فاقوس', phone: '0553977777' },
  { nameAr: 'مستشفى أبو حماد المركزي', nameEn: 'Abu Hammad Central Hospital', type: 'general', gov: 'الشرقية', city: 'أبو حماد', phone: '0553400000' },
  { nameAr: 'مستشفى العاشر من رمضان', nameEn: '10th of Ramadan Hospital', type: 'general', gov: 'الشرقية', city: 'العاشر من رمضان', phone: '0554333333' },

  // Monufia
  { nameAr: 'مستشفى جامعة المنوفية', nameEn: 'Menoufia University Hospital', type: 'university', gov: 'المنوفية', city: 'شبين الكوم', phone: '0482222222' },
  { nameAr: 'مستشفى شبين الكوم التعليمي', nameEn: 'Shebin El Kom Teaching Hospital', type: 'general', gov: 'المنوفية', city: 'شبين الكوم', phone: '0482233333' },
  { nameAr: 'مستشفى الهلال', nameEn: 'El Helal Hospital', type: 'general', gov: 'المنوفية', city: 'شبين الكوم', phone: '0482244444' }, // Insurance
  { nameAr: 'مستشفى المواساة', nameEn: 'El Moassat Hospital', type: 'private', gov: 'المنوفية', city: 'شبين الكوم', phone: '0482255555' },
  { nameAr: 'مستشفى منوف العام', nameEn: 'Menouf General Hospital', type: 'general', gov: 'المنوفية', city: 'منوف', phone: '0483666666' },
  { nameAr: 'مستشفى أشمون العام', nameEn: 'Ashmoun General Hospital', type: 'general', gov: 'المنوفية', city: 'أشمون', phone: '0483444444' },
  { nameAr: 'مستشفى قويسنا المركزي', nameEn: 'Quweisna Central Hospital', type: 'general', gov: 'المنوفية', city: 'قويسنا', phone: '0482577777' },
  { nameAr: 'مستشفى الباجور العام', nameEn: 'Bagour General Hospital', type: 'general', gov: 'المنوفية', city: 'الباجور', phone: '0483888888' },

  // Qalyubia
  { nameAr: 'مستشفى جامعة بنها', nameEn: 'Benha University Hospital', type: 'university', gov: 'القليوبية', city: 'بنها', phone: '0133222222' },
  { nameAr: 'مستشفى بنها التعليمي', nameEn: 'Benha Teaching Hospital', type: 'general', gov: 'القليوبية', city: 'بنها', phone: '0133233333' },
  { nameAr: 'مستشفى التأمين الصحي ببنها', nameEn: 'Benha Insurance Hospital', type: 'general', gov: 'القليوبية', city: 'بنها', phone: '0133244444' },
  { nameAr: 'مستشفى الأطفال التخصصي', nameEn: 'Children Specialized Hospital', type: 'specialized', gov: 'القليوبية', city: 'بنها', phone: '0133255555' },
  { nameAr: 'مستشفى قليوب التخصصي', nameEn: 'Qalyub Specialized Hospital', type: 'specialized', gov: 'القليوبية', city: 'قليوب', phone: '0242111111' },
  { nameAr: 'مستشفى ناصر العام', nameEn: 'Nasser General Hospital', type: 'general', gov: 'القليوبية', city: 'شبرا الخيمة', phone: '0242222222' }, // Also known as Shubra El Kheima General
  { nameAr: 'مستشفى بهتيم', nameEn: 'Bahtim Hospital', type: 'general', gov: 'القليوبية', city: 'شبرا الخيمة', phone: '0242333333' }, // Insurance
  { nameAr: 'مستشفى الخانكة المركزي', nameEn: 'Khanka Central Hospital', type: 'general', gov: 'القليوبية', city: 'الخانكة', phone: '0244699999' },
  { nameAr: 'مستشفى طوخ المركزي', nameEn: 'Toukh Central Hospital', type: 'general', gov: 'القليوبية', city: 'طوخ', phone: '0132477777' },

  // Beheira
  { nameAr: 'مستشفى دمنهور التعليمي', nameEn: 'Damanhour Teaching Hospital', type: 'general', gov: 'البحيرة', city: 'دمنهور', phone: '0453333333' },
  { nameAr: 'مستشفى الصدر بدمنهور', nameEn: 'Chest Hospital Damanhour', type: 'specialized', gov: 'البحيرة', city: 'دمنهور', phone: '0453344444' },
  { nameAr: 'مستشفى كفر الدوار العام', nameEn: 'Kafr El Dawar General Hospital', type: 'general', gov: 'البحيرة', city: 'كفر الدوار', phone: '0452222222' },
  { nameAr: 'مستشفى إيتاي البارود العام', nameEn: 'Itay El Baroud General Hospital', type: 'general', gov: 'البحيرة', city: 'إيتاي البارود', phone: '0453444444' },
  { nameAr: 'مستشفى أبو حمص المركزي', nameEn: 'Abu Homos Central Hospital', type: 'general', gov: 'البحيرة', city: 'أبو حمص', phone: '0452555555' },

  // Kafr El Sheikh
  { nameAr: 'مستشفى جامعة كفر الشيخ', nameEn: 'Kafr El Sheikh University Hospital', type: 'university', gov: 'كفر الشيخ', city: 'كفر الشيخ', phone: '0473222222' },
  { nameAr: 'مستشفى كفر الشيخ العام', nameEn: 'Kafr El Sheikh General Hospital', type: 'general', gov: 'كفر الشيخ', city: 'كفر الشيخ', phone: '0473233333' },
  { nameAr: 'مستشفى العبور للتأمين الصحي', nameEn: 'El Obour Insurance Hospital', type: 'general', gov: 'كفر الشيخ', city: 'كفر الشيخ', phone: '0473244444' },
  { nameAr: 'مستشفى دسوق العام', nameEn: 'Desouk General Hospital', type: 'general', gov: 'كفر الشيخ', city: 'دسوق', phone: '0472566666' },
  { nameAr: 'مستشفى فوه المركزي', nameEn: 'Fouh Central Hospital', type: 'general', gov: 'كفر الشيخ', city: 'فوه', phone: '0472988888' },
  { nameAr: 'مستشفى سيدي سالم المركزي', nameEn: 'Sidi Salem Central Hospital', type: 'general', gov: 'كفر الشيخ', city: 'سيدي سالم', phone: '0472800000' },

  // Damietta
  { nameAr: 'مستشفى جامعة الأزهر بدمياط الجديدة', nameEn: 'Al Azhar University Hospital Damietta', type: 'university', gov: 'دمياط', city: 'دمياط الجديدة', phone: '0572400000' },
  { nameAr: 'مستشفى دمياط العام', nameEn: 'Damietta General Hospital', type: 'general', gov: 'دمياط', city: 'دمياط', phone: '0572222222' },
  { nameAr: 'مستشفى التخصصي بدمياط', nameEn: 'Damietta Specialized Hospital', type: 'specialized', gov: 'دمياط', city: 'دمياط', phone: '0572233333' },
  { nameAr: 'مستشفى رأس البر المركزي', nameEn: 'Ras El Bar Central Hospital', type: 'general', gov: 'دمياط', city: 'رأس البر', phone: '0572522222' },

  // Port Said
  { nameAr: 'مستشفى السلام بورسعيد', nameEn: 'El Salam Hospital Port Said', type: 'general', gov: 'بورسعيد', city: 'بورسعيد', phone: '0663222222' }, // UHIA
  { nameAr: 'مستشفى الزهور', nameEn: 'El Zohour Hospital', type: 'general', gov: 'بورسعيد', city: 'بورسعيد', phone: '0663666666' }, // UHIA
  { nameAr: 'مستشفى التضامن', nameEn: 'El Tadamon Hospital', type: 'general', gov: 'بورسعيد', city: 'بورسعيد', phone: '0663777777' }, // UHIA
  { nameAr: 'مستشفى النصر التخصصي للأطفال', nameEn: 'El Nasr Specialized Children Hospital', type: 'specialized', gov: 'بورسعيد', city: 'بورسعيد', phone: '0663333333' }, // UHIA
  { nameAr: 'مستشفى الرمد التخصصي', nameEn: 'Ophthalmic Specialized Hospital', type: 'specialized', gov: 'بورسعيد', city: 'بورسعيد', phone: '0663444444' }, // UHIA
  { nameAr: 'مستشفى بورفؤاد العام', nameEn: 'Port Fouad General Hospital', type: 'general', gov: 'بورسعيد', city: 'بورفؤاد', phone: '0663400000' },

  // Ismailia
  { nameAr: 'مستشفى جامعة قناة السويس', nameEn: 'Suez Canal University Hospital', type: 'university', gov: 'الإسماعيلية', city: 'الإسماعيلية', phone: '0643200000' },
  { nameAr: 'مجمع الإسماعيلية الطبي', nameEn: 'Ismailia Medical Complex', type: 'general', gov: 'الإسماعيلية', city: 'الإسماعيلية', phone: '0643333333' }, // UHIA
  { nameAr: 'مستشفى الطوارئ بأبو خليفة', nameEn: 'Abu Khalifa Emergency Hospital', type: 'specialized', gov: 'الإسماعيلية', city: 'الإسماعيلية', phone: '0643444444' }, // UHIA (approx city)
  { nameAr: 'مستشفى التل الكبير المركزي', nameEn: 'Tel El Kebir Central Hospital', type: 'general', gov: 'الإسماعيلية', city: 'التل الكبير', phone: '0643555555' },

  // Suez
  { nameAr: 'مستشفى السويس العام', nameEn: 'Suez General Hospital', type: 'general', gov: 'السويس', city: 'السويس', phone: '0623333333' },
  { nameAr: 'مستشفى التأمين الصحي بالسويس', nameEn: 'Suez Insurance Hospital', type: 'general', gov: 'السويس', city: 'السويس', phone: '0623444444' },

  // Faiyum
  { nameAr: 'مستشفى جامعة الفيوم', nameEn: 'Fayoum University Hospital', type: 'university', gov: 'الفيوم', city: 'الفيوم', phone: '0846333333' },
  { nameAr: 'مستشفى الفيوم العام', nameEn: 'Fayoum General Hospital', type: 'general', gov: 'الفيوم', city: 'الفيوم', phone: '0846344444' },
  { nameAr: 'مستشفى التأمين الصحي بالفيوم', nameEn: 'Fayoum Insurance Hospital', type: 'general', gov: 'الفيوم', city: 'الفيوم', phone: '0846355555' },
  { nameAr: 'مستشفى أبشواي المركزي', nameEn: 'Ibshaway Central Hospital', type: 'general', gov: 'الفيوم', city: 'أبشواي', phone: '0846700000' },

  // Beni Suef
  { nameAr: 'مستشفى جامعة بني سويف', nameEn: 'Beni Suef University Hospital', type: 'university', gov: 'بني سويف', city: 'بني سويف', phone: '0822333333' },
  { nameAr: 'مستشفى بني سويف التخصصي', nameEn: 'Beni Suef Specialized Hospital', type: 'specialized', gov: 'بني سويف', city: 'بني سويف', phone: '0822344444' },
  { nameAr: 'مستشفى الواسطى المركزي', nameEn: 'Wasta Central Hospital', type: 'general', gov: 'بني سويف', city: 'الواسطى', phone: '0822500000' },

  // Minya
  { nameAr: 'مستشفى جامعة المنيا', nameEn: 'Minya University Hospital', type: 'university', gov: 'المنيا', city: 'المنيا', phone: '0862333333' },
  { nameAr: 'مستشفى المنيا العام', nameEn: 'Minya General Hospital', type: 'general', gov: 'المنيا', city: 'المنيا', phone: '0862344444' },
  { nameAr: 'مستشفى التأمين الصحي بالمنيا', nameEn: 'Minya Insurance Hospital', type: 'general', gov: 'المنيا', city: 'المنيا', phone: '0862355555' },
  { nameAr: 'مستشفى ملوي التخصصي', nameEn: 'Mallawi Specialized Hospital', type: 'specialized', gov: 'المنيا', city: 'ملوي', phone: '0862600000' },
  { nameAr: 'مستشفى بني مزار العام', nameEn: 'Beni Mazar General Hospital', type: 'general', gov: 'المنيا', city: 'بني مزار', phone: '0863800000' },

  // Asyut
  { nameAr: 'مستشفى جامعة أسيوط', nameEn: 'Assiut University Hospital', type: 'university', gov: 'أسيوط', city: 'أسيوط', phone: '0882333333' },
  { nameAr: 'مستشفى أسيوط العام', nameEn: 'Assiut General Hospital', type: 'general', gov: 'أسيوط', city: 'أسيوط', phone: '0882344444' }, // Also known as El Shamla
  { nameAr: 'مستشفى الإيمان العام', nameEn: 'Al Iman General Hospital', type: 'general', gov: 'أسيوط', city: 'أسيوط', phone: '0882355555' },
  { nameAr: 'مستشفى منفلوط المركزي', nameEn: 'Manfalut Central Hospital', type: 'general', gov: 'أسيوط', city: 'منفلوط', phone: '0884700000' },
  { nameAr: 'مستشفى ديروط المركزي', nameEn: 'Dayrout Central Hospital', type: 'general', gov: 'أسيوط', city: 'ديروط', phone: '0884800000' },

  // Sohag
  { nameAr: 'مستشفى جامعة سوهاج', nameEn: 'Sohag University Hospital', type: 'university', gov: 'سوهاج', city: 'سوهاج', phone: '0932333333' },
  { nameAr: 'مستشفى سوهاج العام', nameEn: 'Sohag General Hospital', type: 'general', gov: 'سوهاج', city: 'سوهاج', phone: '0932344444' },
  { nameAr: 'مستشفى سوهاج التعليمي', nameEn: 'Sohag Teaching Hospital', type: 'general', gov: 'سوهاج', city: 'سوهاج', phone: '0932355555' },
  { nameAr: 'مستشفى جرجا العام', nameEn: 'Girga General Hospital', type: 'general', gov: 'سوهاج', city: 'جرجا', phone: '0934600000' },
  { nameAr: 'مستشفى طهطا العام', nameEn: 'Tahta General Hospital', type: 'general', gov: 'سوهاج', city: 'طهمطا', phone: '0934700000' },

  // Qena
  { nameAr: 'مستشفى جامعة جنوب الوادي', nameEn: 'South Valley University Hospital', type: 'university', gov: 'قنا', city: 'قنا', phone: '0965211111' },
  { nameAr: 'مستشفى قنا العام', nameEn: 'Qena General Hospital', type: 'general', gov: 'قنا', city: 'قنا', phone: '0965322222' },
  { nameAr: 'مستشفى نجع حمادي العام', nameEn: 'Nag Hammadi General Hospital', type: 'general', gov: 'قنا', city: 'نجع حمادي', phone: '0966580000' },
  { nameAr: 'مستشفى قوص المركزي', nameEn: 'Qus Central Hospital', type: 'general', gov: 'قنا', city: 'قوص', phone: '0966840000' },

  // Luxor
  { nameAr: 'مستشفى الكرنك الدولي', nameEn: 'Karnak International Hospital', type: 'specialized', gov: 'الأقصر', city: 'الأقصر', phone: '0952370000' }, // Formerly Luxor General
  { nameAr: 'مستشفى الأقصر الدولي', nameEn: 'Luxor International Hospital', type: 'specialized', gov: 'الأقصر', city: 'الأقصر', phone: '0952280000' },
  { nameAr: 'مستشفى إيزيس التخصصي', nameEn: 'Isis Specialized Hospital', type: 'specialized', gov: 'الأقصر', city: 'الأقصر', phone: '0952270000' }, // Maternity
  { nameAr: 'مستشفى طيبة التخصصي', nameEn: 'Thebes Specialized Hospital', type: 'specialized', gov: 'الأقصر', city: 'إسنا', phone: '0952500000' }, // Formerly Esna
  { nameAr: 'مستشفى حورس التخصصي', nameEn: 'Horus Specialized Hospital', type: 'specialized', gov: 'الأقصر', city: 'أرمنت', phone: '0952600000' }, // Formerly Armant

  // Aswan
  { nameAr: 'مستشفى أسوان الجامعي', nameEn: 'Aswan University Hospital', type: 'university', gov: 'أسوان', city: 'أسوان', phone: '0973480000' },
  { nameAr: 'مستشفى أسوان التخصصي', nameEn: 'Aswan Specialized Hospital', type: 'specialized', gov: 'أسوان', city: 'أسوان', phone: '0972300000' }, // Formerly General
  { nameAr: 'مستشفى كوم أمبو المركزي', nameEn: 'Kom Ombo Central Hospital', type: 'general', gov: 'أسوان', city: 'كوم أمبو', phone: '0973500000' },
  { nameAr: 'مستشفى إدفو العام', nameEn: 'Edfu General Hospital', type: 'general', gov: 'أسوان', city: 'إدفو', phone: '0973700000' },
  { nameAr: 'مركز مجدي يعقوب للقلب', nameEn: 'Magdi Yacoub Heart Foundation', type: 'specialized', gov: 'أسوان', city: 'أسوان', phone: '0972391111' },
];

async function main() {
  console.log('🌱 Starting Hospital Seeding...');

  // 0. Clear existing data
  console.log('🧹 Clearing existing hospital data...');
  await prisma.hospital.deleteMany({});
  // Optional: clear other tables if needed, but be careful with dependencies
  // await prisma.city.deleteMany({});
  // await prisma.governorate.deleteMany({});
  // await prisma.hospitalType.deleteMany({});
  console.log('✨ Existing data cleared.');

  // 1. Seed Governorates and Cities
  console.log('📍 Seeding Governorates and Cities...');
  for (const gov of governorates) {
    const governorate = await prisma.governorate.upsert({
      where: { nameAr: gov.nameAr },
      update: {},
      create: { nameAr: gov.nameAr, nameEn: gov.nameEn },
    });

    for (const cityName of gov.cities) {
      await prisma.city.upsert({
        where: {
          governorateId_nameAr: {
            governorateId: governorate.id,
            nameAr: cityName,
          },
        },
        update: {},
        create: {
          nameAr: cityName,
          nameEn: cityName, // Fallback English name to Arabic for now
          governorateId: governorate.id,
        },
      });
    }
  }

  // 2. Seed Hospital Types
  console.log('🏥 Seeding Hospital Types...');
  for (const type of hospitalTypes) {
    await prisma.hospitalType.upsert({
      where: { slug: type.slug },
      update: {},
      create: {
        nameAr: type.nameAr,
        nameEn: type.nameEn,
        slug: type.slug,
        icon: type.icon,
        isActive: true,
      },
    });
  }

  // 3. Seed Hospitals
  console.log('🚑 Seeding Hospitals...');
  for (const hospital of hospitalsData) {
    // Find relations
    const gov = await prisma.governorate.findUnique({ where: { nameAr: hospital.gov } });
    if (!gov) {
        console.warn(`Skipping ${hospital.nameAr}: Governorate ${hospital.gov} not found`);
        continue;
    }

    const city = await prisma.city.findFirst({
        where: {
            nameAr: hospital.city,
            governorateId: gov.id
        }
    });
    if (!city) {
        console.warn(`Skipping ${hospital.nameAr}: City ${hospital.city} not found in ${hospital.gov}`);
        continue;
    }

    const type = await prisma.hospitalType.findUnique({ where: { slug: hospital.type } });
    if (!type) {
        console.warn(`Skipping ${hospital.nameAr}: Type ${hospital.type} not found`);
        continue;
    }

    // Generate slug
    const slug = hospital.nameEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    await prisma.hospital.upsert({
        where: { slug },
        update: {
            nameAr: hospital.nameAr,
            nameEn: hospital.nameEn,
            governorate: { connect: { id: gov.id } },
            city: { connect: { id: city.id } },
            type: { connect: { id: type.id } },
            phone: hospital.phone,
            address: `${hospital.city}, ${hospital.gov}, مصر`,
            hasEmergency: true,
            ratingAvg: 4.5, // Default rating
            ratingCount: 10, // Default reviews
        },
        create: {
            nameAr: hospital.nameAr,
            nameEn: hospital.nameEn,
            slug,
            governorate: { connect: { id: gov.id } },
            city: { connect: { id: city.id } },
            type: { connect: { id: type.id } },
            phone: hospital.phone,
            address: `${hospital.city}, ${hospital.gov}, مصر`,
            hasEmergency: true,
            ratingAvg: 4.5, // Default rating
            ratingCount: 10, // Default reviews
        }
    });
  }

  console.log('✅ Hospital Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
