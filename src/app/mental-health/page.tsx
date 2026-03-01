import GuidePageContent from '@/components/guides/GuidePageClient';
import { GUIDES } from '@/config/guide-config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `${GUIDES['mental-health'].title} | مستشفى.كوم`,
  description: GUIDES['mental-health'].description,
};

export default function Page() {
  return <GuidePageContent slug="mental-health" />;
}
