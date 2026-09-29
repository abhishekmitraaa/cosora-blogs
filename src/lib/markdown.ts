import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

export type TocEntry = { id: string; label: string; depth: 2 | 3 };

/**
 * blog_posts.body is Markdown (CommonMark + GFM tables).
 *
 * This whole pipeline runs on the server at build/ISR time, so no Markdown parser
 * reaches the client bundle and the browser is handed finished HTML. Output is
 * sanitized even though authoring is admin-only — an XSS in a post body would run
 * on the cosora.in origin.
 */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // rehype-slug writes heading ids; the TOC links to them.
    h2: [...(defaultSchema.attributes?.h2 ?? []), 'id'],
    h3: [...(defaultSchema.attributes?.h3 ?? []), 'id'],
    h4: [...(defaultSchema.attributes?.h4 ?? []), 'id'],
  },
};

/** Collect h2/h3 into a table of contents, matching the ids rehype-slug assigned. */
function collectToc(out: TocEntry[]) {
  return () => (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return;
      const id = typeof node.properties?.id === 'string' ? node.properties.id : '';
      if (!id) return;
      let label = '';
      visit(node, 'text', (t: { value: string }) => {
        label += t.value;
      });
      label = label.trim();
      if (label) out.push({ id, label, depth: node.tagName === 'h2' ? 2 : 3 });
    });
  };
}

export async function renderMarkdown(
  md: string | null,
): Promise<{ html: string; toc: TocEntry[] }> {
  if (!md || !md.trim()) return { html: '', toc: [] };

  const toc: TocEntry[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    // Article bodies start at h2: the post title is the page's only h1.
    .use(remarkRehype)
    .use(rehypeSlug)
    // collectToc must run AFTER sanitize: rehype-sanitize rewrites heading ids with
    // its clobberPrefix, so reading them earlier yields anchors that do not exist
    // in the rendered HTML.
    .use(rehypeSanitize, schema)
    .use(collectToc(toc))
    .use(rehypeStringify)
    .process(md);

  return { html: String(file), toc };
}

/** Plain text from Markdown, for meta descriptions when excerpt is empty. */
export function stripMarkdown(md: string | null, max = 300): string {
  if (!md) return '';
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>#|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
