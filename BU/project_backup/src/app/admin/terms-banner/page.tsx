'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'terms';

export default function TermsBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الشروط والأحكام"
      description="إدارة بانر صفحة الشروط والأحكام."
      defaultTitle="الشروط والأحكام"
      defaultSubtitle="تساعد هذه الشروط على حماية حقوق المستخدمين وضمان تقديم خدمات طبية رقمية موثوقة."
      defaultOverlayColor="#6b21a8"
      defaultOverlayOpacity={70}
    />
  );
}
