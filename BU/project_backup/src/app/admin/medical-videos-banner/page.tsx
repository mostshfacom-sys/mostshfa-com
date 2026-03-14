'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'medical-videos';

export default function MedicalVideosBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الفيديوهات الطبية"
      description="إدارة بانر صفحة الفيديوهات الطبية."
      defaultTitle="الفيديوهات الطبية"
      defaultSubtitle="فيديوهات طبية قصيرة ومفيدة تساعدك على الفهم السريع والمتابعة اليومية."
      defaultOverlayColor="#0f172a"
      defaultOverlayOpacity={70}
    />
  );
}
