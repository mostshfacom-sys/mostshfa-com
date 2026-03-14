'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'privacy';

export default function PrivacyBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر سياسة الخصوصية"
      description="إدارة بانر صفحة سياسة الخصوصية."
      defaultTitle="سياسة الخصوصية"
      defaultSubtitle="نلتزم بحماية بياناتك وشفافية كيفية استخدامها لضمان تجربة آمنة وموثوقة على مستشفى.كوم."
      defaultOverlayColor="#334155"
      defaultOverlayOpacity={70}
    />
  );
}
