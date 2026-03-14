'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'emergency';

export default function EmergencyBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الطوارئ"
      description="إدارة بانر صفحة الطوارئ الطبية."
      defaultTitle="دليل الطوارئ الطبية"
      defaultSubtitle="استعد للطوارئ بأرقام مهمة وخدمات جاهزة"
      defaultOverlayColor="#7c2d12"
      defaultOverlayOpacity={70}
    />
  );
}
