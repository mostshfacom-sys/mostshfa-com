'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'tools';

export default function ToolsBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الأدوات الطبية"
      description="إدارة بانر صفحة الأدوات الطبية الذكية."
      defaultTitle="الأدوات الطبية الذكية"
      defaultSubtitle="مجموعة أدوات صحية ذكية للحساب والمتابعة اليومية بأسلوب مبسط وآمن."
      defaultOverlayColor="#4c1d95"
      defaultOverlayOpacity={70}
    />
  );
}
