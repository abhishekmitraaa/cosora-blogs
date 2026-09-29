import Link from 'next/link';
import type { Category } from '@/lib/posts';
import styles from './CategoryTabs.module.css';

/**
 * Filter tabs. Plain links to real routes, not client-side state — each filter is a
 * separate crawlable, cacheable URL with its own canonical.
 */
export function CategoryTabs({
  categories,
  active,
}: {
  categories: Category[];
  active: string | null;
}) {
  const tabs = [{ slug: null as string | null, name: 'All' }, ...categories];

  return (
    <div className={styles.bar}>
      <nav className={styles.inner} aria-label="Filter posts by category">
        {tabs.map((t) => {
          const isActive = t.slug === active;
          return (
            <Link
              key={t.slug ?? 'all'}
              href={t.slug ? `/category/${t.slug}` : '/'}
              className={isActive ? `${styles.tab} ${styles.active}` : styles.tab}
              aria-current={isActive ? 'page' : undefined}
            >
              {t.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
