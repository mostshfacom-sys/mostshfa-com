'use client';

import BannerAdminPage from '@/components/admin/BannerAdminPage';

const PAGE_BANNER_KEY = 'articles-categories';

export default function ArticlesCategoriesBannerAdmin() {
  return (
    <BannerAdminPage
      pageKey={PAGE_BANNER_KEY}
      heading="إعدادات بانر تصنيفات المقالات"
      description="إدارة بانر صفحة تصنيفات المقالات الطبية."
      defaultTitle="تصنيفات المقالات الطبية"
      defaultSubtitle="استكشف مكتبة متنامية من المقالات الطبية المصنفة بعناية لتجد الإجابة الصحيحة بسرعة."
      defaultOverlayColor="#9f1239"
      defaultOverlayOpacity={70}
    />
  );
}
