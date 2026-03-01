'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'doctors';

export default function DoctorsBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الأطباء"
      description="إدارة بانر صفحة الأطباء."
      defaultTitle="دليل الأطباء"
      defaultSubtitle="اختر طبيبك حسب التخصص والتقييمات والخبرة"
      defaultOverlayColor="#0e3a5f"
      defaultOverlayOpacity={70}
    />
  );
}
