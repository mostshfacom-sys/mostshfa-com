'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'pharmacies';

export default function PharmaciesBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الصيدليات"
      description="إدارة بانر صفحة الصيدليات."
      defaultTitle="دليل الصيدليات"
      defaultSubtitle="صيدليات قريبة، توصيل سريع، وخدمة 24 ساعة"
      defaultOverlayColor="#7f1d1d"
      defaultOverlayOpacity={70}
    />
  );
}
