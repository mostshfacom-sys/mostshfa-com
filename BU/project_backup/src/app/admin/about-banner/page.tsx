'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'about';

export default function AboutBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر من نحن"
      description="إدارة بانر صفحة من نحن."
      defaultTitle="من نحن"
      defaultSubtitle="تعرف على رؤية مستشفى.كوم وكيف نعيد تعريف تجربة البحث عن الخدمات والمقالات الطبية في مصر."
      defaultOverlayColor="#1e3a8a"
      defaultOverlayOpacity={70}
    />
  );
}
