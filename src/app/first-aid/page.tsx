import GuidePageContent from '@/components/guides/GuidePageClient';
import { GUIDES } from '@/config/guide-config';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${GUIDES['first-aid'].title} | مستشفى.كوم`,
  description: GUIDES['first-aid'].description,
};

export default function Page() {
  return <GuidePageContent slug="first-aid" />;
}
