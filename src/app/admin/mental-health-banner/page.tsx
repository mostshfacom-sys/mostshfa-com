'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

export default function MentalHealthBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey="mental-health"
      heading="إعدادات بانر الصحة النفسية"
      description="إدارة البانر الخاص بصفحة الصحة النفسية."
      defaultTitle="الصحة النفسية"
      defaultSubtitle="دليلك للتوازن النفسي والهدوء الداخلي وحياة أفضل."
    />
  );
}
