'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'drugs';

export default function DrugsBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الأدوية"
      description="إدارة بانر صفحة الأدوية."
      defaultTitle="دليل الأدوية"
      defaultSubtitle="معلومات موثوقة عن الأدوية والبدائل والجرعات"
      defaultOverlayColor="#0c4a6e"
      defaultOverlayOpacity={70}
    />
  );
}
