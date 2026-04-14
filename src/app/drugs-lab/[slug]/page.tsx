import { redirect } from 'next/navigation';

export default async function DrugsLabDrugRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/drugs/${encodeURIComponent(slug)}`);
}
