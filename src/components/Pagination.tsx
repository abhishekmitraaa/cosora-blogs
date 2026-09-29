import Link from 'next/link';
import styles from './Pagination.module.css';

/**
 * Numbered pagination over real routes (/page/2, /category/x/page/2).
 *
 * Chosen over infinite scroll: every post stays reachable without JavaScript, each
 * page gets its own canonical, and the whole listing is statically generated.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (n: number) => (n === 1 ? basePath || '/' : `${basePath}/page/${n}`);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className={styles.nav} aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={styles.arrow} rel="prev">
          ← Previous
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          ← Previous
        </span>
      )}

      <ol className={styles.list}>
        {pages.map((n) => (
          <li key={n}>
            {n === page ? (
              <span className={`${styles.page} ${styles.current}`} aria-current="page">
                {n}
              </span>
            ) : (
              <Link href={hrefFor(n)} className={styles.page}>
                <span className={styles.srOnly}>Page </span>
                {n}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={styles.arrow} rel="next">
          Next →
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          Next →
        </span>
      )}
    </nav>
  );
}
