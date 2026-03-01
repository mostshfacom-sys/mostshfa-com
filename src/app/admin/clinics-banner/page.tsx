'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'clinics';

export default function ClinicsBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر العيادات"
      description="إدارة بانر صفحة العيادات الطبية."
      defaultTitle="دليل العيادات الطبية"
      defaultSubtitle="احجز أو استكشف أفضل العيادات المتخصصة بالقرب منك"
      defaultOverlayColor="#064e3b"
      defaultOverlayOpacity={70}
    />
  );
}
