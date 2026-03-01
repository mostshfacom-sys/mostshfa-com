'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'home';

export default function HomeBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الصفحة الرئيسية"
      description="إدارة بانر الصفحة الرئيسية والخدمات الطبية."
      defaultTitle="مستشفى دوت كوم"
      defaultSubtitle="الدليل الاول لجميع الخدمات الطبية في مصر والوطن العربي"
      defaultOverlayColor="#0f172a"
      defaultOverlayOpacity={70}
    />
  );
}
