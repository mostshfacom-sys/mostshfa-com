'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

export default function SexualHealthBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey="sexual-health"
      heading="إعدادات بانر الصحة الجنسية"
      description="إدارة البانر الخاص بصفحة الصحة الجنسية."
      defaultTitle="الصحة الجنسية"
      defaultSubtitle="معلومات طبية موثوقة وشاملة حول الصحة الجنسية والإنجابية."
    />
  );
}
