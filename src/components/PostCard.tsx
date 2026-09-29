import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/lib/posts';
import { formatDate, imageUrl, isoDate, readTime } from '@/lib/format';
import styles from './PostCard.module.css';

/**
 * Standard grid card. The whole card is one link — a nested <a> per element would
 * give screen readers three links to the same place.
 */
export function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  // Cards prefer the dedicated thumbnail; hero art is often the wrong crop here.
  const img = imageUrl(post.thumbnail) ?? imageUrl(post.hero_image);
  const time = readTime(post.read_time);

  return (
    <article className={styles.card}>
      <Link href={`/${post.slug}`} className={styles.link}>
        <div className={styles.frame}>
          {img ? (
            <Image
              src={img}
              alt={post.thumbnail_alt ?? post.hero_image_alt ?? post.title}
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
              className={styles.image}
              priority={priority}
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.meta}>
            <span className={styles.category}>{post.category?.name ?? 'Journal'}</span>
            <span className={styles.rule} aria-hidden="true" />
            {time ? <span className={styles.readTime}>{time}</span> : null}
          </div>
          <h3 className={styles.title}>{post.title}</h3>
          {post.excerpt ? <p className={styles.excerpt}>{post.excerpt}</p> : null}
          <p className={styles.byline}>
            {post.author ? <span>{post.author}</span> : null}
            {post.author && post.published_at ? <span aria-hidden="true"> · </span> : null}
            {post.published_at ? (
              <time dateTime={isoDate(post.published_at)}>{formatDate(post.published_at)}</time>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
