'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'contact';

export default function ContactBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر اتصل بنا"
      description="إدارة بانر صفحة التواصل والدعم."
      defaultTitle="اتصل بنا"
      defaultSubtitle="تواصل مع فريق مستشفى.كوم للاستفسارات والشراكات والدعم الفني على مدار الساعة."
      defaultOverlayColor="#0f766e"
      defaultOverlayOpacity={70}
    />
  );
}
