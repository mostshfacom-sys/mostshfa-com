'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

export default function FitnessHealthBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey="fitness-health"
      heading="إعدادات بانر اللياقة البدنية"
      description="إدارة البانر الخاص بصفحة اللياقة البدنية."
      defaultTitle="اللياقة البدنية"
      defaultSubtitle="خطوات عملية لتحسين لياقتك البدنية ونشاطك اليومي."
    />
  );
}
