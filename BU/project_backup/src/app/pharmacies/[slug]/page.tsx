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
  TruckIcon,
  UserPlusIcon,
  BeakerIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { fetchPharmacyBySlug } from '@/lib/api/pharmacies';
import { useFavorites } from '@/hooks/useFavorites';
import { SkeletonDetailHero } from '@/components/shared/SkeletonCard';
import { ShareMenu } from '@/components/shared/ShareMenu';
import { PharmacyLocationMap } from '@/components/pharmacies/PharmacyLocationMap';
import { EntityImage } from '@/components/ui/EntityImage';
import type { Pharmacy } from '@/types/pharmacy';
import { Header, Footer } from '@/components/shared';

export default function PharmacyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPharmacyBySlug(slug);
        if (data.success === false) throw new Error();
        setPharmacy(data);
      } catch (err) {
        setError('فشل تحميل بيانات الصيدلية');
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900"><Header /><SkeletonDetailHero /><Footer /></div>;
  if (error || !pharmacy) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-xl text-red-600 mb-4">{error || 'الصيدلية غير موجودة'}</p>
            <button onClick={() => router.push('/pharmacies')} className="px-6 py-2 bg-teal-600 text-white rounded-lg">العودة للدليل</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: '📋' },
    { id: 'contact', label: 'التواصل والموقع', icon: '📞' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[450px] bg-teal-900">
        <div className="absolute inset-0">
          <EntityImage
            src={pharmacy.image || pharmacy.logo}
            alt={pharmacy.nameAr}
            entityType="pharmacy"
            entityId={pharmacy.id}
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-900/60 to-transparent" />
        </div>

        <div className="relative h-full container mx-auto px-6 py-12 flex flex-col justify-end max-w-6xl">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                   <span className="px-3 py-1 bg-teal-500/20 backdrop-blur-md border border-teal-400/30 rounded-full text-teal-100 text-xs font-bold">صيدلية معتمدة</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-white mb-4">{pharmacy.nameAr}</h1>
                <div className="flex items-center gap-2 text-teal-100/90 text-lg">
                  <MapPinIcon className="w-6 h-6 text-teal-400" />
                  <span>{[pharmacy.governorate?.nameAr, pharmacy.city?.nameAr].filter(Boolean).join(' - ')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleFavorite(pharmacy.id)}
                  className={`p-4 rounded-2xl backdrop-blur-md shadow-xl transition-all ${isFavorite(pharmacy.id) ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'}`}
                >
                  {isFavorite(pharmacy.id) ? <HeartSolid className="w-6 h-6" /> : <HeartOutline className="w-6 h-6" />}
                </motion.button>
                <ShareMenu title={pharmacy.nameAr} url={typeof window !== 'undefined' ? window.location.href : ''} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap items-center gap-3">
              {pharmacy.is24h && <span className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><ClockIcon className="w-5 h-5" /> 24 ساعة</span>}
              {pharmacy.hasDeliveryService && <span className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><TruckIcon className="w-5 h-5" /> توصيل</span>}
              {pharmacy.hasNursingService && <span className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><BeakerIcon className="w-5 h-5" /> خدمات تمريضية</span>}
              {pharmacy.ratingAvg && pharmacy.ratingAvg > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                  <StarIcon className="w-5 h-5 text-amber-400" />
                  <span className="text-white font-bold text-lg">{Number(pharmacy.ratingAvg).toFixed(1)}</span>
                  <span className="text-white/60">({pharmacy.ratingCount})</span>
                </div>
              )}
            </motion.div>
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
                className={`flex items-center gap-2 px-2 py-5 font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id ? 'text-teal-600 border-teal-600' : 'text-neutral-500 border-transparent hover:text-teal-600'}`}
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
            {activeTab === 'overview' && <OverviewTab pharmacy={pharmacy} />}
            {activeTab === 'contact' && <ContactTab pharmacy={pharmacy} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}

function OverviewTab({ pharmacy }: { pharmacy: Pharmacy }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl"><BeakerIcon className="w-6 h-6 text-teal-600" /></div>
            عن الصيدلية
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-lg">
            تقدم {pharmacy.nameAr} خدمات طبية متميزة في {pharmacy.city?.nameAr || 'مصر'}. 
            {pharmacy.is24h ? ' الصيدلية تعمل على مدار الساعة لخدمة الحالات الطارئة.' : ' الصيدلية تلتزم بمواعيد العمل الرسمية.'}
            {pharmacy.hasDeliveryService && ' كما توفر الصيدلية خدمة توصيل الأدوية للمنازل لضمان راحتكم.'}
            {pharmacy.hasNursingService && ' تتوفر لدينا خدمات تمريضية تشمل قياس الضغط والسكر وإعطاء الحقن تحت إشراف متخصصين.'}
          </p>
        </div>

        {pharmacy.services && (
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><CheckBadgeIcon className="w-6 h-6 text-blue-600" /></div>
              الخدمات المتاحة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {JSON.parse(typeof pharmacy.services === 'string' ? pharmacy.services : '[]').map((s: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 font-bold text-neutral-700 dark:text-neutral-200">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h3 className="text-xl font-black mb-6">معلومات سريعة</h3>
          <div className="space-y-4">
            <InfoRow icon={<ClockIcon className="w-5 h-5" />} label="ساعات العمل" value={pharmacy.hours || (pharmacy.is24h ? '24 ساعة' : 'غير محدد')} />
            <InfoRow icon={<TruckIcon className="w-5 h-5" />} label="التوصيل" value={pharmacy.hasDeliveryService ? 'متاح' : 'غير متاح'} color={pharmacy.hasDeliveryService ? 'text-blue-600' : ''} />
            <InfoRow icon={<UserPlusIcon className="w-5 h-5" />} label="تمريض" value={pharmacy.hasNursingService ? 'متاح' : 'غير متاح'} color={pharmacy.hasNursingService ? 'text-purple-600' : ''} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactTab({ pharmacy }: { pharmacy: Pharmacy }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h2 className="text-2xl font-black mb-8">معلومات الاتصال</h2>
          <div className="grid gap-6">
            {pharmacy.hotline && <ContactCard icon={<PhoneIcon />} label="الخط الساخن" value={pharmacy.hotline} highlight />}
            {pharmacy.phone && <ContactCard icon={<PhoneIcon />} label="رقم الهاتف" value={pharmacy.phone} />}
            <ContactCard icon={<MapPinIcon />} label="العنوان" value={pharmacy.address || pharmacy.addressAr || 'غير متوفر'} />
            {pharmacy.website && <ContactCard icon={<GlobeAltIcon />} label="الموقع الإلكتروني" value={pharmacy.website} isLink />}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-800 rounded-3xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-700 h-[500px]">
        <PharmacyLocationMap pharmacy={pharmacy} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, color = '' }: any) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50">
      <div className="text-teal-500">{icon}</div>
      <div>
        <p className="text-xs text-neutral-500 font-bold">{label}</p>
        <p className={`text-sm font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, value, highlight = false, isLink = false }: any) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border ${highlight ? 'bg-teal-50 border-teal-100 dark:bg-teal-900/20 dark:border-teal-800' : 'bg-neutral-50 border-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-800'}`}>
      <div className={`${highlight ? 'text-teal-600' : 'text-neutral-400'} w-10 h-10 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-xl shadow-sm`}>{icon}</div>
      <div>
        <p className="text-xs text-neutral-500 font-bold mb-1">{label}</p>
        {isLink ? <a href={value} target="_blank" className="font-black text-teal-600 hover:underline">{value}</a> : <p className="font-black text-neutral-800 dark:text-white text-lg">{value}</p>}
      </div>
    </div>
  );
}
