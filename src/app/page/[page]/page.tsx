import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingView } from '@/components/ListingView';
import { listingMetadata } from '@/lib/metadata';
import { getPosts } from '@/lib/posts';

export const revalidate = 3600;

type Params = { params: Promise<{ page: string }> };

/** Only whole numbers ≥ 2 — page 1 lives at /blogs and must not be duplicated here. */
function parsePage(raw: string): number {
  if (!/^\d+$/.test(raw)) notFound();
  const n = Number(raw);
  if (n < 2) notFound();
  return n;
}

export async function generateStaticParams() {
  const { totalPages } = await getPosts({ page: 1 });
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await params;
  return listingMetadata(null, parsePage(page));
}

export default async function PaginatedIndex({ params }: Params) {
  const { page } = await params;
  return <ListingView categorySlug={null} page={parsePage(page)} />;
}
