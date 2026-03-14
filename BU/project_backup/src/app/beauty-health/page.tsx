import GuidePageContent from '@/components/guides/GuidePageClient';
import { GUIDES } from '@/config/guide-config';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${GUIDES['beauty-health'].title} | مستشفى.كوم`,
  description: GUIDES['beauty-health'].description,
};

export default function Page() {
  return <GuidePageContent slug="beauty-health" />;
}
