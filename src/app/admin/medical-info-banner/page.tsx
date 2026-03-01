'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'medical-info';

export default function MedicalInfoBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر المعلومات الطبية"
      description="إدارة بانر صفحة المعلومات الطبية."
      defaultTitle="المعلومات الطبية"
      defaultSubtitle="مكتبة معرفية عربية تجمع المقالات والإرشادات والأدلة الطبية في مكان واحد."
      defaultOverlayColor="#0f172a"
      defaultOverlayOpacity={70}
    />
  );
}
