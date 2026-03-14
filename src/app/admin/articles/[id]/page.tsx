import ArticleForm from '@/components/admin/articles/ArticleForm';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleForm mode="edit" articleId={id} />;
}
