import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Drugs Lab | مستشفى.كوم',
  description: 'تم نقل النسخة الجديدة من دليل الأدوية إلى المسار الأساسي.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DrugsLabPage() {
  redirect('/drugs');
}
