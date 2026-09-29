import styles from './ShareLinks.module.css';

/**
 * Share links are plain anchors to each network's share endpoint — no SDK, no
 * client component, nothing added to the JS bundle. The shared URL is always the
 * canonical cosora.in one, never the deployment host.
 */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const targets = [
    {
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      path: 'M14 8.5h2.5V5.5H14c-2 0-3.5 1.5-3.5 3.5v2H8.5v3h2v6h3v-6H16l.5-3h-3v-1.5c0-.6.4-1 1-1z',
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      path: 'M6.5 9.5h3v10h-3v-10zM8 4.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM11.5 9.5h2.9v1.4h.05c.4-.75 1.4-1.55 2.85-1.55 3.05 0 3.6 2 3.6 4.6v5.55h-3V14.6c0-1.15-.02-2.6-1.6-2.6-1.6 0-1.85 1.25-1.85 2.55v4.95h-2.95v-10z',
    },
    {
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      path: 'M17.5 4.75h2.7l-5.9 6.74 6.94 9.17h-5.43l-4.25-5.56-4.87 5.56H3.98l6.31-7.21L3.63 4.75h5.57l3.84 5.08 4.46-5.08zm-.95 14.3h1.5L8.02 6.28H6.4l10.15 12.77z',
    },
  ];

  return (
    <div className={styles.row}>
      <span className={styles.srOnly}>Share this article</span>
      {targets.map((s) => (
        <a
          key={s.label}
          className={styles.button}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path d={s.path} fill="currentColor" />
          </svg>
        </a>
      ))}
    </div>
  );
}
