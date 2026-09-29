import Image from 'next/image';
import { imageUrl } from './format';
import { inlineToText, sanitizeInline } from './inlineHtml';

/**
 * Block-structured article bodies, authored in Cosora-Admin.
 *
 * The renderer is deliberately TOTAL: an unknown block type, or a block missing
 * a field, renders nothing rather than throwing. A throw here would happen
 * during static generation and fail the whole deploy, not one page. The database
 * CHECK (public.blog_blocks_valid) is the real guard; this is the second one.
 */

export type Block =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'rich_text'; html: string }
  | { type: 'list'; style?: 'bullet' | 'number'; items: string[] }
  | { type: 'image'; path: string; alt: string; caption?: string | null }
  | { type: 'table'; caption?: string | null; columns: string[]; rows: string[][] }
  | { type: 'faq'; items: { q: string; a: string }[] }
  | { type: 'quote'; text: string; attribution?: string | null }
  | { type: 'cta'; heading?: string | null; body?: string | null; label: string; href: string }
  | { type: 'divider' };

export type TocEntry = { id: string; label: string; depth: 2 | 3 };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Heading ids, deduplicated so two identically named sections still anchor. */
function headingIds(blocks: Block[]): Map<number, string> {
  const ids = new Map<number, string>();
  const seen = new Map<string, number>();
  blocks.forEach((b, i) => {
    if (b.type !== 'heading') return;
    const base = slugify(b.text) || `section-${i + 1}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    ids.set(i, n === 0 ? base : `${base}-${n + 1}`);
  });
  return ids;
}

export function blocksToc(blocks: Block[] | null): TocEntry[] {
  if (!blocks?.length) return [];
  const ids = headingIds(blocks);
  const out: TocEntry[] = [];
  blocks.forEach((b, i) => {
    if (b.type !== 'heading') return;
    const id = ids.get(i);
    if (id) out.push({ id, label: b.text, depth: b.level === 3 ? 3 : 2 });
  });
  return out;
}

/** Plain text of every block, for meta descriptions, word counts and JSON-LD. */
export function blocksToText(blocks: Block[] | null): string {
  if (!blocks?.length) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'heading':
        parts.push(b.text);
        break;
      case 'rich_text':
        parts.push(inlineToText(b.html));
        break;
      case 'list':
        parts.push(...(b.items ?? []).map(inlineToText));
        break;
      case 'table':
        parts.push(...(b.rows ?? []).flat().map(inlineToText));
        break;
      case 'faq':
        for (const it of b.items ?? []) parts.push(it.q, inlineToText(it.a));
        break;
      case 'quote':
        parts.push(b.text);
        break;
      case 'image':
        if (b.caption) parts.push(b.caption);
        break;
      default:
        break;
    }
  }
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export function blocksWordCount(blocks: Block[] | null): number {
  const t = blocksToText(blocks);
  return t ? t.split(/\s+/).length : 0;
}

/** The single FAQ block's items, for FAQPage structured data. */
export function blocksFaq(blocks: Block[] | null): { q: string; a: string }[] {
  const faq = blocks?.find((b) => b.type === 'faq');
  return faq && faq.type === 'faq' ? (faq.items ?? []).filter((i) => i?.q && i?.a) : [];
}

/** Absolute URLs of in-body images, appended to BlogPosting.image. */
export function blocksImages(blocks: Block[] | null): string[] {
  if (!blocks?.length) return [];
  return blocks
    .filter((b): b is Extract<Block, { type: 'image' }> => b.type === 'image')
    .map((b) => imageUrl(b.path))
    .filter((u): u is string => Boolean(u));
}

function Inline({ html }: { html: string }) {
  // Sanitised against the inline allowlist in lib/inlineHtml.ts, on the server.
  return <span dangerouslySetInnerHTML={{ __html: sanitizeInline(html) }} />;
}

export function renderBlocks(blocks: Block[] | null, styles: Record<string, string>) {
  if (!blocks?.length) return null;
  const ids = headingIds(blocks);

  return blocks.map((b, i) => {
    const key = `${b.type}-${i}`;
    switch (b.type) {
      case 'heading': {
        const id = ids.get(i);
        return b.level === 3 ? (
          <h3 key={key} id={id}>
            {b.text}
          </h3>
        ) : (
          <h2 key={key} id={id}>
            {b.text}
          </h2>
        );
      }

      case 'rich_text':
        return (
          <p key={key} dangerouslySetInnerHTML={{ __html: sanitizeInline(b.html) }} />
        );

      case 'list': {
        const items = b.items ?? [];
        if (!items.length) return null;
        const li = items.map((it, j) => (
          <li key={j}>
            <Inline html={it} />
          </li>
        ));
        return b.style === 'number' ? <ol key={key}>{li}</ol> : <ul key={key}>{li}</ul>;
      }

      case 'image': {
        const src = imageUrl(b.path);
        if (!src || !b.alt) return null;
        return (
          <figure key={key} className={styles.blockFigure}>
            <div className={styles.blockImageFrame}>
              <Image src={src} alt={b.alt} fill sizes="(max-width: 720px) 100vw, 680px" />
            </div>
            {b.caption ? <figcaption>{b.caption}</figcaption> : null}
          </figure>
        );
      }

      case 'table': {
        const cols = b.columns ?? [];
        const rows = b.rows ?? [];
        if (!cols.length) return null;
        return (
          <table key={key}>
            {b.caption ? <caption>{b.caption}</caption> : null}
            <thead>
              <tr>
                {cols.map((c, j) => (
                  <th key={j} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j}>
                  {r.map((cell, k) => (
                    <td key={k}>
                      <Inline html={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case 'faq': {
        const items = (b.items ?? []).filter((it) => it?.q && it?.a);
        if (!items.length) return null;
        // <details> rather than a JS accordion: native, accessible, and the
        // answer text is in the DOM whether or not it is open, so it is fully
        // crawlable.
        return (
          <div key={key} className={styles.faq}>
            {items.map((it, j) => (
              <details key={j}>
                <summary>{it.q}</summary>
                <div dangerouslySetInnerHTML={{ __html: sanitizeInline(it.a) }} />
              </details>
            ))}
          </div>
        );
      }

      case 'quote':
        return (
          <figure key={key} className={styles.pullQuote}>
            <blockquote>{b.text}</blockquote>
            {b.attribution ? <figcaption>{b.attribution}</figcaption> : null}
          </figure>
        );

      case 'cta':
        if (!b.label || !b.href) return null;
        return (
          <aside key={key} className={styles.blockCta}>
            <div>
              {b.heading ? <p className={styles.blockCtaHeading}>{b.heading}</p> : null}
              {b.body ? <p className={styles.blockCtaBody}>{b.body}</p> : null}
            </div>
            <a href={b.href} className={styles.blockCtaButton}>
              {b.label}
            </a>
          </aside>
        );

      case 'divider':
        return <hr key={key} />;

      default:
        return null;
    }
  });
}
