'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'directories';

export default function DirectoriesBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر الأدلة الطبية"
      description="إدارة بانر صفحة الأدلة الطبية الشاملة."
      defaultTitle="الأدلة الطبية"
      defaultSubtitle="صفحة الأدلة الطبية الشاملة في مصر: دليل الطوارئ، المستشفيات، العيادات، الصيدليات، المعامل، التمريض المنزلي، والأدوية في مكان واحد."
      defaultOverlayColor="#0f172a"
      defaultOverlayOpacity={70}
    />
  );
}
