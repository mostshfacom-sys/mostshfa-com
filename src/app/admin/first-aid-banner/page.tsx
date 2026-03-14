'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

export default function FirstAidBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey="first-aid"
      heading="إعدادات بانر الإسعافات الأولية"
      description="إدارة البانر الخاص بصفحة الإسعافات الأولية."
      defaultTitle="الإسعافات الأولية"
      defaultSubtitle="دليل شامل للتعامل مع الحالات الطارئة وإنقاذ الأرواح."
    />
  );
}
