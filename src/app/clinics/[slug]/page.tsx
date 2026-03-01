
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  ClockIcon,
  HeartIcon as HeartSolid,
  StarIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';
import { 
  HeartIcon as HeartOutline,
  CameraIcon,
  CreditCardIcon,
  GlobeAsiaAustraliaIcon
} from '@heroicons/react/24/outline';
import { 
  FaInstagram, 
  FaTwitter, 
  FaLinkedin, 
  FaFacebook,
  FaWhatsapp,
  FaWifi,
  FaParking
} from 'react-icons/fa';
import { fetchClinicBySlug } from '@/lib/api/clinics';
import { useClinicFavorites } from '@/hooks/useClinicFavorites';
import { SkeletonDetailHero } from '@/components/shared/SkeletonCard';
import { ShareMenu } from '@/components/shared/ShareMenu';
import { ClinicLocationMap } from '@/components/clinics/ClinicLocationMap';
import { EntityImage } from '@/components/ui/EntityImage';
import type { Clinic } from '@/types/clinic';
import { Header, Footer } from '@/components/shared';

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const { isFavorite, toggleFavorite } = useClinicFavorites();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchClinicBySlug(slug);
        if (!data) throw new Error();
        setClinic(data);
      } catch (err) {
        setError('فشل تحميل بيانات العيادة');
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900"><Header /><SkeletonDetailHero /><Footer /></div>;
  if (error || !clinic) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-xl text-red-600 mb-4">{error || 'العيادة غير موجودة'}</p>
            <button onClick={() => router.push('/clinics')} className="px-6 py-2 bg-teal-600 text-white rounded-lg">العودة للدليل</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: <CheckBadgeIcon className="w-5 h-5" /> },
    { id: 'contact', label: 'التواصل والموقع', icon: <PhoneIcon className="w-5 h-5" /> },
    { id: 'gallery', label: 'معرض الصور', icon: <CameraIcon className="w-5 h-5" /> },
  ];

  const rating = typeof clinic.ratingAvg === 'number' 
    ? clinic.ratingAvg 
    : parseFloat(String(clinic.ratingAvg || 0));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[500px] bg-teal-900">
        <div className="absolute inset-0">
          <EntityImage
            src={clinic.image || clinic.logo}
            alt={clinic.nameAr}
            entityType="clinic"
            entityId={clinic.id}
            fill
            className="object-cover opacity-40 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-900/60 to-transparent" />
        </div>

        <div className="relative h-full container mx-auto px-6 py-8 flex flex-col justify-between max-w-6xl">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push('/clinics')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-colors w-fit z-50 mb-4"
          >
            <ArrowRightIcon className="w-5 h-5" />
            <span>العودة للدليل</span>
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                   <span className="px-3 py-1 bg-teal-500/30 backdrop-blur-md border border-teal-400/30 rounded-full text-teal-50 text-xs font-bold flex items-center gap-1.5">
                     <ShieldCheckIcon className="w-3.5 h-3.5" />
                     عيادة معتمدة
                   </span>
                   {clinic.isFeatured && (
                     <span className="px-3 py-1 bg-amber-500/30 backdrop-blur-md border border-amber-400/30 rounded-full text-amber-50 text-xs font-bold flex items-center gap-1.5">
                       <SparklesIcon className="w-3.5 h-3.5" />
                       مميزة
                     </span>
                   )}
                </div>
                <h1 className="text-4xl lg:text-7xl font-black text-white mb-4 tracking-tight leading-tight">{clinic.nameAr}</h1>
                <div className="flex items-center gap-2 text-teal-50/90 text-xl font-medium">
                  <MapPinIcon className="w-6 h-6 text-teal-400" />
                  <span>{[clinic.governorate?.nameAr, clinic.city?.nameAr].filter(Boolean).join(' - ')}</span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap items-center gap-4">
                {clinic.isOpen ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/20">
                    <ClockIcon className="w-5 h-5" /> مفتوح الآن
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-neutral-600 text-white rounded-2xl font-black shadow-lg shadow-neutral-600/20 ring-4 ring-neutral-600/20">
                    <ClockIcon className="w-5 h-5" /> مغلق حالياً
                  </div>
                )}
                
                {rating > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
                    <StarIcon className="w-6 h-6 text-amber-400" />
                    <span className="text-white font-black text-2xl">{rating.toFixed(1)}</span>
                    <span className="text-white/70 font-bold">({clinic.ratingCount})</span>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="flex flex-col gap-4 items-end">
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleFavorite(clinic.id)}
                  className={`p-4 rounded-2xl backdrop-blur-md shadow-xl transition-all border ${isFavorite(clinic.id) ? 'bg-red-500 border-red-400 text-white' : 'bg-white/10 text-white hover:bg-white/20 border-white/20'}`}
                >
                  {isFavorite(clinic.id) ? <HeartSolid className="w-6 h-6" /> : <HeartOutline className="w-6 h-6" />}
                </motion.button>
                <ShareMenu title={clinic.nameAr} url={typeof window !== 'undefined' ? window.location.href : ''} />
              </div>
              
              {clinic.phone && (
                <motion.a
                  href={`tel:${clinic.phone}`}
                  whileHover={{ scale: 1.05, x: -5 }}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-teal-900 rounded-2xl font-black text-xl shadow-2xl hover:bg-teal-50 transition-colors"
                >
                  <PhoneIcon className="w-6 h-6" />
                  احجز الآن
                </motion.a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-2 py-5 font-bold transition-all whitespace-nowrap border-b-4 ${activeTab === tab.id ? 'text-teal-600 border-teal-600' : 'text-neutral-500 border-transparent hover:text-teal-600'}`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === 'overview' && <OverviewTab clinic={clinic} />}
            {activeTab === 'contact' && <ContactTab clinic={clinic} />}
            {activeTab === 'gallery' && <GalleryTab clinic={clinic} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}

function OverviewTab({ clinic }: { clinic: Clinic }) {
  const specialties = clinic.specialties || [];
  const services = clinic.services ? (typeof clinic.services === 'string' ? JSON.parse(clinic.services) : clinic.services) : [];
  const insurance = clinic.insuranceCompanies ? (typeof clinic.insuranceCompanies === 'string' ? JSON.parse(clinic.insuranceCompanies) : clinic.insuranceCompanies) : [];
  const amenities = clinic.amenities ? (typeof clinic.amenities === 'string' ? JSON.parse(clinic.amenities) : clinic.amenities) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-2xl"><InformationCircleIcon className="w-6 h-6 text-teal-600" /></div>
            عن العيادة
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-lg whitespace-pre-line">
            {clinic.descriptionAr || `تقدم ${clinic.nameAr} خدمات طبية متميزة في ${clinic.city?.nameAr || 'مصر'}. العيادة مجهزة بأحدث التقنيات لضمان أفضل رعاية صحية للمرضى.`}
          </p>
          
          {clinic.videoUrl && (
            <div className="mt-8 aspect-video rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-neutral-700">
               <iframe 
                className="w-full h-full"
                src={clinic.videoUrl.replace('watch?v=', 'embed/')} 
                title="Clinic Video"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {specialties.length > 0 && (
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-2xl"><UserGroupIcon className="w-6 h-6 text-purple-600" /></div>
              التخصصات الطبية
            </h2>
            <div className="flex flex-wrap gap-3">
              {specialties.map((spec) => (
                <div key={spec.id} className="flex items-center gap-2.5 px-5 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-2xl font-black border-2 border-purple-100/50 dark:border-purple-800/50 transition-all hover:scale-105">
                  <CheckBadgeIcon className="w-5 h-5 text-purple-500" />
                  {spec.nameAr}
                </div>
              ))}
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl"><BeakerIcon className="w-6 h-6 text-blue-600" /></div>
              الخدمات المتاحة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((s: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-5 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 font-black text-neutral-700 dark:text-neutral-200 transition-all hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md">
                  <div className="w-3 h-3 rounded-full bg-teal-500 shadow-sm shadow-teal-500/50" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {insurance.length > 0 && (
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl"><ShieldCheckIcon className="w-6 h-6 text-emerald-600" /></div>
              شركات التأمين المقبولة
            </h2>
            <div className="flex flex-wrap gap-4">
              {insurance.map((company: string, i: number) => (
                <div key={i} className="flex items-center gap-2.5 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-2xl font-black border-2 border-emerald-100/50 dark:border-emerald-800/50">
                   <CreditCardIcon className="w-5 h-5 text-emerald-500" />
                   {company}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-lg border border-neutral-100 dark:border-neutral-700 sticky top-28">
          <h3 className="text-xl font-black mb-8 border-b pb-4 border-neutral-100 dark:border-neutral-700 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-amber-500" />
            تفاصيل الحجز
          </h3>
          <div className="space-y-5">
            <InfoRow icon={<CurrencyDollarIcon className="w-6 h-6" />} label="سعر الكشف" value={clinic.consultationFee ? `${clinic.consultationFee} جنيه` : 'غير محدد'} color="text-teal-600" />
            <InfoRow icon={<ClockIcon className="w-6 h-6" />} label="مدة الانتظار" value={clinic.waitingTime || 'غير محدد'} />
            <InfoRow icon={<CalendarDaysIcon className="w-6 h-6" />} label="مواعيد العمل" value={parseWorkingHours(clinic.workingHours)} />
            <InfoRow icon={<MapPinIcon className="w-6 h-6" />} label="المنطقة" value={clinic.city?.nameAr || 'غير محدد'} />
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-700">
             <h4 className="text-sm font-black mb-4 text-neutral-400 uppercase tracking-widest">المرافق المتاحة</h4>
             <div className="grid grid-cols-2 gap-4">
                <AmenityItem icon={<FaWifi />} label="واي فاي" active={clinic.wifiAvailable} />
                <AmenityItem icon={<FaParking />} label="جراج" active={clinic.parkingAvailable} />
                {amenities.map((a: string, i: number) => (
                  <AmenityItem key={i} label={a} active={true} />
                ))}
             </div>
          </div>

          <div className="mt-8">
            <button className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-teal-600/20 transition-all active:scale-95">
              طلب حجز موعد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryTab({ clinic }: { clinic: Clinic }) {
  const gallery = clinic.gallery ? (typeof clinic.gallery === 'string' ? JSON.parse(clinic.gallery) : clinic.gallery) : [];
  
  if (gallery.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-800 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-700">
        <CameraIcon className="w-16 h-16 text-neutral-300 mb-4" />
        <p className="text-xl font-bold text-neutral-500">لا توجد صور متوفرة لهذه العيادة</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gallery.map((img: string, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="relative aspect-video rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
        >
          <img src={img} alt={`${clinic.nameAr} gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      ))}
    </div>
  );
}

function ContactTab({ clinic }: { clinic: Clinic }) {
  const socialLinks = [
    { id: 'facebook', icon: <FaFacebook />, value: clinic.facebook, color: 'hover:bg-blue-600' },
    { id: 'instagram', icon: <FaInstagram />, value: clinic.instagram, color: 'hover:bg-pink-600' },
    { id: 'twitter', icon: <FaTwitter />, value: clinic.twitter, color: 'hover:bg-sky-500' },
    { id: 'linkedin', icon: <FaLinkedin />, value: clinic.linkedin, color: 'hover:bg-blue-700' },
    { id: 'whatsapp', icon: <FaWhatsapp />, value: clinic.whatsapp, color: 'hover:bg-green-600', isWa: true },
  ].filter(link => link.value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
             <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-2xl"><GlobeAsiaAustraliaIcon className="w-6 h-6 text-teal-600" /></div>
             قنوات التواصل
          </h2>
          <div className="grid gap-6">
            {clinic.phone && <ContactCard icon={<PhoneIcon />} label="رقم الهاتف" value={clinic.phone} highlight />}
            {clinic.emergencyPhone && <ContactCard icon={<PhoneIcon />} label="رقم الطوارئ" value={clinic.emergencyPhone} highlight color="text-red-600" />}
            <ContactCard icon={<MapPinIcon />} label="العنوان" value={clinic.addressAr || 'غير متوفر'} />
            {clinic.website && <ContactCard icon={<GlobeAltIcon />} label="الموقع الإلكتروني" value={clinic.website} isLink href={clinic.website} />}
          </div>

          {socialLinks.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-black text-neutral-400 mb-6 uppercase tracking-widest">تواصل عبر السوشيال ميديا</h3>
              <div className="flex flex-wrap gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.isWa ? `https://wa.me/${link.value}` : (link.value as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-2xl transition-all hover:text-white ${link.color} hover:scale-110 shadow-sm`}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-4 shadow-xl border-4 border-white dark:border-neutral-700 h-[500px] relative overflow-hidden group">
          <ClinicLocationMap clinic={clinic} />
          <div className="absolute top-8 right-8 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 z-[10] max-w-[250px]">
             <p className="text-xs font-bold text-teal-600 mb-1">الموقع الدقيق</p>
             <p className="text-sm font-black text-neutral-800 dark:text-white leading-tight">{clinic.addressAr}</p>
          </div>
        </div>
        <button 
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`, '_blank')}
          className="w-full py-5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl hover:bg-neutral-800 transition-all"
        >
          <MapPinIcon className="w-6 h-6" />
          الاتجاهات عبر خرائط جوجل
        </button>
      </div>
    </div>
  );
}

function AmenityItem({ icon, label, active }: any) {
  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-2xl border ${active ? 'bg-teal-50/50 border-teal-100 text-teal-700 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-300' : 'bg-neutral-50 border-neutral-100 text-neutral-400 dark:bg-neutral-900/50 dark:border-neutral-800 opacity-50'}`}>
      <span className="text-lg">{icon || <CheckBadgeIcon className="w-5 h-5" />}</span>
      <span className="text-xs font-black">{label}</span>
    </div>
  );
}

function InfoRow({ icon, label, value, color = 'text-neutral-800 dark:text-white' }: any) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100/50 dark:border-neutral-800/50">
      <div className="text-teal-500 bg-white dark:bg-neutral-800 p-2.5 rounded-xl shadow-sm">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-base font-black leading-tight ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, value, highlight = false, isLink = false, href, color = 'text-neutral-800 dark:text-white' }: any) {
  return (
    <div className={`flex items-center gap-5 p-6 rounded-3xl border transition-all ${highlight ? 'bg-teal-50 border-teal-100 dark:bg-teal-900/10 dark:border-teal-800 shadow-md' : 'bg-neutral-50 border-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-800'}`}>
      <div className={`${highlight ? 'text-teal-600 bg-white dark:bg-neutral-800' : 'text-neutral-400 bg-white dark:bg-neutral-800'} w-14 h-14 flex items-center justify-center rounded-2xl shadow-sm text-2xl transition-transform hover:scale-110`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 font-black mb-1.5 uppercase tracking-widest">{label}</p>
        {isLink ? (
          <a href={href || value} target="_blank" rel="noopener noreferrer" className="font-black text-teal-600 hover:text-teal-700 text-lg lg:text-xl truncate block">{value}</a>
        ) : (
          <p className={`font-black text-lg lg:text-xl leading-tight truncate ${color}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

function parseWorkingHours(workingHours: any): string {
  if (!workingHours) return 'غير محدد';
  try {
    const parsed = typeof workingHours === 'string' ? JSON.parse(workingHours) : workingHours;
    let note = parsed.note || parsed.Daily || '';
    
    // Clean strange characters like 
    const clean = (text: string) => text?.replace(/[\ue0b0-\ue0bf\u]/g, '').trim() || '';
    note = clean(note);

    // Check if the note is just "See details" or similar placeholders from scrapers
    if (note && (note.includes('انظر') || note.includes('التفاصيل') || note.includes('See more'))) {
      return 'اتصل للتحقق من المواعيد';
    }
    
    if (note) return note;
    
    // Check for day-by-day schedule
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const arDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    
    let schedule = [];
    for (let i = 0; i < days.length; i++) {
      if (parsed[days[i]]) {
        schedule.push(`${arDays[i]}: ${clean(parsed[days[i]])}`);
      }
    }
    
    if (schedule.length > 0) return schedule.join(' | ');
    
    return 'متاح طوال الأسبوع';
  } catch (e) {
    const str = String(workingHours).replace(/[\ue0b0-\ue0bf\u]/g, '').trim();
    if (str.includes('انظر') || str.includes('التفاصيل')) return 'اتصل للتحقق من المواعيد';
    return str;
  }
}

