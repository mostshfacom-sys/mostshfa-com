'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

export default function BeautyHealthBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey="beauty-health"
      heading="إعدادات بانر الصحة والجمال"
      description="إدارة البانر الخاص بصفحة الصحة والجمال."
      defaultTitle="الصحة والجمال"
      defaultSubtitle="نصائح وإرشادات للعناية بالصحة والجمال الطبيعي."
    />
  );
}
