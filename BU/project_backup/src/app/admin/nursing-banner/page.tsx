'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'nursing';

export default function NursingBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر التمريض المنزلي"
      description="إدارة بانر صفحة التمريض المنزلي."
      defaultTitle="دليل التمريض المنزلي"
      defaultSubtitle="خدمات تمريضية احترافية تصل إلى منزلك"
      defaultOverlayColor="#065f46"
      defaultOverlayOpacity={70}
    />
  );
}
