import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingView } from '@/components/ListingView';
import { listingMetadata } from '@/lib/metadata';
import { getCategories, getCategoryBySlug, getPosts } from '@/lib/posts';

export const revalidate = 3600;

type Params = { params: Promise<{ category: string; page: string }> };

function parsePage(raw: string): number {
  if (!/^\d+$/.test(raw)) notFound();
  const n = Number(raw);
  if (n < 2) notFound();
  return n;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  const out: { category: string; page: string }[] = [];
  for (const c of categories) {
    const { totalPages } = await getPosts({ page: 1, categoryId: c.id });
    for (let p = 2; p <= totalPages; p++) out.push({ category: c.slug, page: String(p) });
  }
  return out;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, page } = await params;
  const found = await getCategoryBySlug(category);
  if (!found) notFound();
  return listingMetadata(category, parsePage(page));
}

export default async function PaginatedCategory({ params }: Params) {
  const { category, page } = await params;
  return <ListingView categorySlug={category} page={parsePage(page)} />;
}
