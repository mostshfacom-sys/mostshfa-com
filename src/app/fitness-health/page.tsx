import GuidePageContent from '@/components/guides/GuidePageClient';
import { GUIDES } from '@/config/guide-config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `${GUIDES['fitness-health'].title} | مستشفى.كوم`,
  description: GUIDES['fitness-health'].description,
};

export default function Page() {
  return <GuidePageContent slug="fitness-health" />;
}
