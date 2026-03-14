'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import TipTapEditor from '@/components/admin/articles/TipTapEditor';

type Mode = 'create' | 'edit';

interface CategoryOption {
  id: number;
  nameAr: string;
}

interface ArticleDto {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image: string | null;
  author: string | null;
  tags: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  categoryId: number | null;
}

interface ArticleFormProps {
  mode: Mode;
  articleId?: string;
}

interface TocItem {
  id: string;
  level: 2 | 3;
  text: string;
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const extractToc = (html: string): TocItem[] => {
  if (typeof window === 'undefined') return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');

  const items: TocItem[] = [];
  doc.querySelectorAll('h2, h3').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const level = tag === 'h2' ? 2 : 3;
    const text = (el.textContent || '').trim();
    const id = (el.getAttribute('id') || '').trim();
    if (!text) return;
    items.push({ id, level, text });
  });

  return items;
};

const ensureHeadingIds = (html: string) => {
  if (typeof window === 'undefined') return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');

  const used = new Set<string>();
  doc.querySelectorAll('h2, h3').forEach((el) => {
    const text = (el.textContent || '').trim();
    if (!text) return;

    const existing = (el.getAttribute('id') || '').trim();
    if (existing) {
      used.add(existing);
      return;
    }

    let base = slugify(text);
    if (!base) base = `section-${Date.now()}`;

    let candidate = base;
    let i = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${i}`;
      i += 1;
    }

    used.add(candidate);
    el.setAttribute('id', candidate);
  });

  return doc.body.innerHTML;
};

export default function ArticleForm({ mode, articleId }: ArticleFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [imageOptions, setImageOptions] = useState<Array<{ name: string; url: string }>>([]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [content, setContent] = useState<string>('<p></p>');

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const toc = useMemo(() => extractToc(content), [content]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage(null);

      try {
        const [catsRes, imagesRes] = await Promise.all([
          fetch('/api/articles/categories'),
          fetch('/api/admin/article-images'),
        ]);

        if (catsRes.ok) {
          const data = await catsRes.json();
          setCategories((data.categories || []).map((c: any) => ({ id: c.id, nameAr: c.nameAr })));
        }

        if (imagesRes.ok) {
          const data = await imagesRes.json();
          setImageOptions(data.images || []);
        }

        if (mode === 'edit' && articleId) {
          const res = await fetch(`/api/admin/articles/${articleId}`);
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || 'فشل في تحميل المقال');
          }

          const a: ArticleDto = data.article;
          setTitle(a.title || '');
          setSlug(a.slug || '');
          setExcerpt(a.excerpt || '');
          setAuthor(a.author || '');
          setTags(a.tags || '');
          setImage(a.image || '');
          setCategoryId(a.categoryId ? String(a.categoryId) : '');
          setIsPublished(!!a.isPublished);
          setIsFeatured(!!a.isFeatured);
          setContent(a.content || '<p></p>');
        }
      } catch (error) {
        const text = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
        setMessage({ type: 'error', text });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [mode, articleId]);

  const autoSlug = () => {
    if (slug.trim()) return;
    const next = slugify(title);
    if (next) setSlug(next);
  };

  const runAi = async (mode: 'generate' | 'rewrite') => {
    setMessage(null);
    setAiBusy(true);
    try {
      const payload =
        mode === 'generate'
          ? { mode, prompt: aiPrompt }
          : { mode, text: content };

      const res = await fetch('/api/admin/ai/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'فشل تنفيذ طلب الذكاء الاصطناعي');
      }

      if (typeof data?.html !== 'string' || !data.html.trim()) {
        throw new Error('لم يتم استلام محتوى');
      }

      const normalized = ensureHeadingIds(data.html);
      setContent(normalized);
      setMessage({ type: 'success', text: 'تم توليد/تحديث المحتوى بنجاح' });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setMessage({ type: 'error', text });
    } finally {
      setAiBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim()) {
      setMessage({ type: 'error', text: 'عنوان المقال مطلوب' });
      return;
    }

    setSaving(true);

    try {
      const normalizedContent = ensureHeadingIds(content);
      if (normalizedContent !== content) {
        setContent(normalizedContent);
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || null,
        author: author.trim() || null,
        tags: tags.trim() || null,
        image: image.trim() || null,
        categoryId: categoryId ? Number(categoryId) : null,
        isPublished,
        isFeatured,
        content: normalizedContent,
      };

      const endpoint = mode === 'create' ? '/api/admin/articles' : `/api/admin/articles/${articleId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'حدث خطأ أثناء الحفظ');
      }

      setMessage({ type: 'success', text: 'تم حفظ المقال بنجاح' });

      if (mode === 'create') {
        router.push('/admin/articles');
        router.refresh();
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = mode === 'create' ? 'إضافة مقال جديد' : 'تعديل المقال';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">محرر متقدم + جدول محتويات + أدوات ذكاء اصطناعي (اختياري)</p>
        </div>
        <Link href="/admin/articles" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <span>العودة لقائمة المقالات</span>
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">بيانات المقال</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">العنوان</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={autoSlug}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="rtl"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Slug (اختياري)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
                placeholder="example-article"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">التصنيف</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">بدون تصنيف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">ملخص (Excerpt)</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">الكاتب</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">الوسوم (Tags)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="rtl"
                placeholder="صحة, دواء, نصائح"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">صورة المقال</label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    dir="ltr"
                    placeholder="/images/articles/your-image.jpg"
                  />

                  <div className="mt-3">
                    <select
                      value=""
                      onChange={(e) => {
                        const url = e.target.value;
                        if (url) setImage(url);
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">اختر صورة من الصور المحلية</option>
                      {imageOptions.map((img) => (
                        <option key={img.url} value={img.url}>
                          {img.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      هذه الصور يجب أن تكون داخل `public/images/articles` وتُرفع مع المشروع.
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg bg-gray-50 p-2 flex items-center justify-center min-h-28">
                  {image?.trim() ? (
                    <div className="relative w-full aspect-video rounded overflow-hidden bg-white">
                      <Image
                        src={image.trim()}
                        alt="preview"
                        fill
                        className="object-cover"
                        unoptimized={image.trim().endsWith('.svg')}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">لا توجد صورة</div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">منشور</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">مميز</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">محتوى المقال</h2>
              <TipTapEditor value={content} onChange={setContent} placeholder="ابدأ بكتابة المقال..." />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">ذكاء اصطناعي</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">وصف المقال للتوليد</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                    dir="rtl"
                    placeholder="مثال: اكتب مقال عن أعراض نقص فيتامين د وطرق العلاج..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => runAi('generate')}
                  disabled={aiBusy || !aiPrompt.trim()}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {aiBusy ? 'جاري التنفيذ...' : 'توليد مقال'}
                </button>
                <button
                  type="button"
                  onClick={() => runAi('rewrite')}
                  disabled={aiBusy || !content.trim()}
                  className="px-5 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {aiBusy ? 'جاري التنفيذ...' : 'إعادة صياغة المحتوى الحالي'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                سيتم إرجاع المحتوى بصيغة HTML مباشرة ليتوافق مع عرض المقال الحالي.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">جدول المحتويات (TOC)</h2>
              {toc.length === 0 ? (
                <p className="text-sm text-gray-500 mt-4">أضف عناوين H2/H3 ليظهر جدول المحتويات.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {toc.map((item, idx) => (
                    <li key={`${item.id}-${idx}`} className={item.level === 3 ? 'pr-4 text-gray-600' : 'text-gray-800'}>
                      {item.text}
                      {!item.id ? <span className="text-xs text-red-500 mr-2">(سيتم توليد id عند الحفظ)</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">إجراءات</h2>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>

                {mode === 'edit' && slug.trim() ? (
                  <Link
                    href={`/articles/${encodeURIComponent(slug.trim())}`}
                    target="_blank"
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-center"
                  >
                    عرض المقال
                  </Link>
                ) : null}

                <Link
                  href="/admin/articles"
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-center"
                >
                  إلغاء
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
