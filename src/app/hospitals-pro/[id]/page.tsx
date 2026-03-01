'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  ClockIcon,
  HeartIcon as HeartSolid,
  BuildingOffice2Icon,
  StarIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { fetchHospitalById } from '@/lib/api/hospitals';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { SkeletonDetailHero } from '@/components/shared/SkeletonCard';
import { ShareMenu } from '@/components/shared/ShareMenu';
import { HospitalLocationMap } from '@/components/hospitals-pro/HospitalLocationMap';
import { EntityImage } from '@/components/ui/EntityImage';
import type { Hospital } from '@/types/hospital';

export default function HospitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : (params.id as string)) : '';

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToRecent } = useRecentlyViewed();

  // Fetch hospital data
  useEffect(() => {
    const loadHospital = async () => {
      try {
        setLoading(true);
        const data = await fetchHospitalById(Number(id));
        setHospital(data);

        // Add to recently viewed
        addToRecent(data);
      } catch (err) {
        console.error('Error loading hospital:', err);
        setError('فشل تحميل بيانات المستشفى');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadHospital();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <SkeletonDetailHero />
        <div className="container mx-auto px-6 py-12 max-w-[1920px]">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center p-8">
          <p className="text-xl text-red-600 dark:text-red-400 mb-4">{error || 'المستشفى غير موجود'}</p>
          <button
            onClick={() => router.push('/hospitals-pro')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  const rating = typeof hospital.rating_avg === 'number'
    ? hospital.rating_avg
    : parseFloat(String(hospital.rating_avg || 0));

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: '📋' },
    { id: 'hours', label: 'ساعات العمل', icon: '🕒' },
    { id: 'specialties', label: 'التخصصات', icon: '⚕️' },
    { id: 'services', label: 'الخدمات', icon: '🏥' },
    { id: 'branches', label: 'الفروع', icon: '🌐' },
    { id: 'reviews', label: 'التقييمات', icon: '⭐' },
    { id: 'contact', label: 'التواصل', icon: '📞' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <section className="relative h-[500px] bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600">
        {/* Background Image */}
        <div className="absolute inset-0">
          <EntityImage
            src={hospital.logo_url}
            alt={hospital.name_ar}
            entityType="hospital"
            entityId={hospital.id}
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full container mx-auto px-6 py-8 flex flex-col justify-between max-w-[1920px]">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push('/hospitals-pro')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-colors w-fit"
          >
            <ArrowRightIcon className="w-5 h-5" />
            <span>العودة</span>
          </motion.button>

          {/* Hospital Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <h1 className="text-5xl font-bold text-white mb-4">
                  {hospital.name_ar}
                </h1>

                {/* Category / Type */}
                {(hospital.hospital_type_name_ar || hospital.category) && (
                  <div className="flex items-center gap-2 text-white/90 text-lg mb-3">
                    <BuildingOffice2Icon className="w-6 h-6" />
                    <span>{hospital.hospital_type_name_ar || hospital.category}</span>
                  </div>
                )}

                {(hospital.governorate_name || hospital.city_name) && (
                  <div className="flex items-center gap-2 text-white/90 text-lg">
                    <MapPinIcon className="w-6 h-6" />
                    <span>
                      {[hospital.governorate_name, hospital.city_name].filter(Boolean).join(' - ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {/* Favorite */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => toggleFavorite(hospital.id)}
                  className={`p-4 rounded-full backdrop-blur-md shadow-lg transition-all ${
                    isFavorite(hospital.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {isFavorite(hospital.id) ? (
                    <HeartSolid className="w-6 h-6" />
                  ) : (
                    <HeartOutline className="w-6 h-6" />
                  )}
                </motion.button>

                {/* Share */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <ShareMenu
                    title={hospital.name_ar}
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Badges & Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-3"
            >
              {hospital.is_featured && (
                <span className="px-4 py-2 bg-amber-500 text-white rounded-full font-bold shadow-lg">
                  ⭐ مميز
                </span>
              )}

              {hospital.is_open && (
                <span className="px-4 py-2 bg-emerald-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  مفتوح الآن
                </span>
              )}

              {hospital.has_emergency && (
                <span className="px-4 py-2 bg-red-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2">
                  <HeartSolid className="w-5 h-5" />
                  طوارئ 24 ساعة
                </span>
              )}

              {rating > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full">
                  <StarIcon className="w-5 h-5 text-amber-400" />
                  <span className="text-white font-bold text-lg">{rating.toFixed(1)}</span>
                  <span className="text-white/80">({hospital.rating_count})</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-md">
        <div className="container mx-auto px-6 max-w-[1920px]">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-12 max-w-[1920px]">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <OverviewTab hospital={hospital} />}
          {activeTab === 'hours' && <WorkingHoursTab hospital={hospital} />}
          {activeTab === 'specialties' && <SpecialtiesTab hospital={hospital} />}
          {activeTab === 'services' && <ServicesTab hospital={hospital} />}
          {activeTab === 'branches' && <BranchesTab hospital={hospital} />}
          {activeTab === 'reviews' && <ReviewsTab hospital={hospital} />}
          {activeTab === 'contact' && <ContactTab hospital={hospital} />}
        </motion.div>
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ hospital }: { hospital: Hospital }) {
  const addressParts = [hospital.address, hospital.city_name, hospital.governorate_name].filter(Boolean);
  const addressValue = addressParts.length > 0 ? addressParts.join(' - ') : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-md">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">عن المستشفى</h2>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {hospital.description || 'لا يوجد وصف متاح حالياً.'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">معلومات سريعة</h3>
          <div className="space-y-4">
            {hospital.category && (
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-teal-600 mt-1" />
                <div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">التصنيف</p>
                  <p className="text-neutral-700 dark:text-neutral-200">
                    {hospital.category}
                  </p>
                </div>
              </div>
            )}
            
            {hospital.wheelchairAccessible && (
              <div className="flex items-start gap-3">
                <CheckBadgeIcon className="w-5 h-5 text-teal-600 mt-1" />
                <div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">إمكانية الوصول</p>
                  <p className="text-neutral-700 dark:text-neutral-200">
                    مدخل مناسب للكراسي المتحركة
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPinIcon className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">العنوان</p>
                <p className="text-neutral-700 dark:text-neutral-200">
                  {addressValue || 'غير متوفر'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PhoneIcon className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">الهاتف</p>
                {hospital.phone ? (
                  <a href={`tel:${hospital.phone}`} className="text-neutral-700 dark:text-neutral-200 hover:text-teal-600">
                    {hospital.phone}
                  </a>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400">غير متوفر</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PhoneIcon className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">واتساب</p>
                {hospital.whatsapp ? (
                  <a
                    href={`https://wa.me/${hospital.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 dark:text-neutral-200 hover:text-teal-600"
                  >
                    {hospital.whatsapp}
                  </a>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400">غير متوفر</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GlobeAltIcon className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">الموقع الإلكتروني</p>
                {hospital.website ? (
                  <a
                    href={hospital.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 dark:text-neutral-200 hover:text-teal-600 break-all"
                  >
                    {(() => {
                      try {
                        const u = new URL(hospital.website);
                        return u.hostname.replace(/^www\./, '');
                      } catch {
                        return hospital.website.length > 60 ? hospital.website.slice(0, 57) + '...' : hospital.website;
                      }
                    })()}
                  </a>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400">غير متوفر</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GlobeAltIcon className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">فيسبوك</p>
                {hospital.facebook ? (
                  <a
                    href={hospital.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 dark:text-neutral-200 hover:text-teal-600"
                  >
                    صفحة المستشفى
                  </a>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400">غير متوفر</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkingHoursTab({ hospital }: { hospital: Hospital }) {
  const daysOrder = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayTranslations: Record<string, string> = {
    'Saturday': 'السبت',
    'Sunday': 'الأحد',
    'Monday': 'الاثنين',
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة'
  };

  const workingHours = hospital.working_hours || [];
  
  if (workingHours.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-md text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          لا توجد معلومات عن ساعات العمل
        </p>
      </div>
    );
  }

  const sortedHours = [...workingHours].sort((a, b) => {
    let indexA = daysOrder.indexOf(a.day);
    let indexB = daysOrder.indexOf(b.day);

    // Fallback if day is in Arabic or not in list
    if (indexA === -1) {
       // Try finding key by value if it's Arabic
       const key = Object.keys(dayTranslations).find(k => dayTranslations[k] === a.day);
       if (key) indexA = daysOrder.indexOf(key);
    }
    if (indexB === -1) {
       const key = Object.keys(dayTranslations).find(k => dayTranslations[k] === b.day);
       if (key) indexB = daysOrder.indexOf(key);
    }

    return indexA - indexB;
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-3">
          <ClockIcon className="w-8 h-8 text-teal-600" />
          ساعات العمل
        </h2>
        
        {hospital.has_emergency && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
            <HeartSolid className="w-6 h-6 flex-shrink-0" />
            <span className="font-bold">يتوفر قسم طوارئ يعمل على مدار 24 ساعة</span>
          </div>
        )}

        <div className="space-y-4">
          {sortedHours.map((hours) => (
            <div 
              key={hours.id || hours.day} 
              className={`flex justify-between items-center p-4 rounded-lg border ${
                hours.isClosed 
                  ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700' 
                  : 'bg-white dark:bg-neutral-800 border-teal-100 dark:border-teal-900/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200 w-32">
                  {dayTranslations[hours.day] || hours.day}
                </span>
              </div>
              
              <div className={`text-lg font-medium ${
                hours.isClosed 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-teal-700 dark:text-teal-300'
              }`}>
                {hours.isClosed ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    مغلق
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {hours.openTime} {hours.closeTime ? `- ${hours.closeTime}` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecialtiesTab({ hospital }: { hospital: Hospital }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {hospital.specialties && hospital.specialties.length > 0 ? (
        hospital.specialties.map((specialty) => (
          <div key={specialty.id} className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{specialty.name_ar}</h3>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-12 text-neutral-500">
          لا توجد تخصصات متاحة
        </div>
      )}
    </div>
  );
}

function ServicesTab({ hospital }: { hospital: Hospital }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {hospital.services && hospital.services.length > 0 ? (
        hospital.services.map((service) => (
          <div key={service.id} className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{service.name_ar}</h3>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-12 text-neutral-500">
          لا توجد خدمات متاحة
        </div>
      )}
    </div>
  );
}

function BranchesTab({ hospital }: { hospital: Hospital }) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-md text-center">
      <p className="text-neutral-600 dark:text-neutral-400">
        {hospital.branches_count > 0 ? `${hospital.branches_count} فرع متاح` : 'لا توجد فروع متاحة'}
      </p>
    </div>
  );
}

function ReviewsTab({ hospital }: { hospital: Hospital }) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-md text-center">
      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
        عدد التقييمات: {hospital.rating_count}
      </p>
      <p className="text-neutral-500 dark:text-neutral-500">
        قريباً: نظام التقييمات التفاعلي
      </p>
    </div>
  );
}

function ContactTab({ hospital }: { hospital: Hospital }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-md space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">معلومات التواصل</h2>

        {hospital.phone && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">الهاتف</h3>
            <a href={`tel:${hospital.phone}`} className="text-lg text-teal-600 hover:text-teal-700">
              {hospital.phone}
            </a>
          </div>
        )}

        {hospital.website && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">الموقع الإلكتروني</h3>
            <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-lg text-teal-600 hover:text-teal-700">
              {hospital.website}
            </a>
          </div>
        )}

        {hospital.whatsapp && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">واتساب</h3>
            <a
              href={`https://wa.me/${hospital.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg text-teal-600 hover:text-teal-700"
            >
              {hospital.whatsapp}
            </a>
          </div>
        )}

        {hospital.facebook && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">فيسبوك</h3>
            <a href={hospital.facebook} target="_blank" rel="noopener noreferrer" className="text-lg text-teal-600 hover:text-teal-700">
              صفحة المستشفى
            </a>
          </div>
        )}

        {hospital.address && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">العنوان</h3>
            <p className="text-lg text-neutral-700 dark:text-neutral-300">
              {hospital.address}
            </p>
          </div>
        )}
      </div>

      <HospitalLocationMap hospital={hospital} />
    </div>
  );
}
