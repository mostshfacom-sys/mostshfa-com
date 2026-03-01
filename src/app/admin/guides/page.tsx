'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';

// Mock data until API is ready
const MOCK_GUIDES = [
  { id: 1, title: 'دليل الصحة والجمال', slug: 'beauty-health', isActive: true },
  { id: 2, title: 'دليل الصحة النفسية', slug: 'mental-health', isActive: true },
  { id: 3, title: 'دليل الإسعافات الأولية', slug: 'first-aid', isActive: true },
  { id: 4, title: 'دليل الصحة الجنسية', slug: 'sexual-health', isActive: true },
  { id: 5, title: 'دليل اللياقة البدنية', slug: 'fitness-health', isActive: true },
];

export default function GuidesAdminPage() {
  const [guides, setGuides] = useState(MOCK_GUIDES);

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة الأدلة المتخصصة</h1>
          <p className="text-slate-600 dark:text-slate-400">التحكم في محتوى وإعدادات الأدلة (الجمال، النفسية، إلخ).</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <PlusIcon className="w-5 h-5" />
          <span>إضافة دليل جديد</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <Card key={guide.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{guide.title}</h3>
              <code className="text-xs text-slate-500 block mt-1">/{guide.slug}</code>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={guide.isActive ? 'success' : 'secondary'}>
                {guide.isActive ? 'نشط' : 'غير نشط'}
              </Badge>
              <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
