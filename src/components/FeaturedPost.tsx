import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/lib/posts';
import { formatDate, imageUrl, isoDate, readTime } from '@/lib/format';
import styles from './FeaturedPost.module.css';

/**
 * The headlined post (is_featured). Split layout, ~2x the visual weight of a grid
 * card — this is the "larger first card" the listing spec calls for.
 */
export function FeaturedPost({ post }: { post: Post }) {
  // Cards prefer the dedicated thumbnail; hero art is often the wrong crop here.
  const img = imageUrl(post.thumbnail) ?? imageUrl(post.hero_image);
  const time = readTime(post.read_time);

  return (
    <section className={styles.section} aria-labelledby="featured-heading">
      <p className={styles.kicker}>Featured story</p>
      <Link href={`/${post.slug}`} className={styles.link}>
        <div className={styles.frame}>
          {img ? (
            <Image
              src={img}
              alt={post.thumbnail_alt ?? post.hero_image_alt ?? post.title}
              fill
              sizes="(max-width: 1000px) 100vw, 55vw"
              className={styles.image}
              priority
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
          <span className={styles.watermark} aria-hidden="true">
            COSORA
          </span>
        </div>

        <div className={styles.body}>
          <span className={styles.category}>{post.category?.name ?? 'Journal'}</span>
          <h2 id="featured-heading" className={styles.title}>
            {post.title}
          </h2>
          {post.excerpt ? <p className={styles.excerpt}>{post.excerpt}</p> : null}
          <p className={styles.byline}>
            {post.author ? <span>{post.author}</span> : null}
            {post.author && post.published_at ? <span aria-hidden="true"> · </span> : null}
            {post.published_at ? (
              <time dateTime={isoDate(post.published_at)}>{formatDate(post.published_at)}</time>
            ) : null}
            {time ? <span aria-hidden="true"> · </span> : null}
            {time ? <span>{time}</span> : null}
          </p>
          <span className={styles.more}>
            Read the story <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </section>
  );
}
