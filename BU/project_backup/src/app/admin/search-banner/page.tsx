'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'search';

export default function SearchBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر البحث"
      description="إدارة بانر صفحة البحث العامة."
      defaultTitle="البحث"
      defaultSubtitle="ابحث في دليل الخدمات الطبية الشامل"
      defaultOverlayColor="#0f172a"
      defaultOverlayOpacity={70}
    />
  );
}
