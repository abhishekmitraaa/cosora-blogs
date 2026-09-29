import type { Metadata } from 'next';
import { ListingView } from '@/components/ListingView';
import { listingMetadata } from '@/lib/metadata';
import { getCategories } from '@/lib/posts';

export const revalidate = 3600;

type Params = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  return listingMetadata(category, 1);
}

export default async function CategoryIndex({ params }: Params) {
  const { category } = await params;
  return <ListingView categorySlug={category} page={1} />;
}
