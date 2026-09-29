import type { Metadata } from 'next';
import { ListingView } from '@/components/ListingView';
import { listingMetadata } from '@/lib/metadata';

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return listingMetadata(null, 1);
}

export default function BlogIndex() {
  return <ListingView categorySlug={null} page={1} />;
}
