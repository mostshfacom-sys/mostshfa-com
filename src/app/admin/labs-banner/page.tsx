'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'labs';

export default function LabsBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر المعامل"
      description="إدارة بانر صفحة المعامل الطبية."
      defaultTitle="دليل المعامل الطبية"
      defaultSubtitle="نتائج دقيقة وخدمات سحب منزلي من معامل موثوقة"
      defaultOverlayColor="#312e81"
      defaultOverlayOpacity={70}
    />
  );
}
