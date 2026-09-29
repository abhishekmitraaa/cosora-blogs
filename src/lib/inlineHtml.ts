import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeSanitize, { type Options as SanitizeOptions } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

/**
 * Sanitiser for the inline HTML the admin editor produces inside a block.
 *
 * Built from an empty schema on purpose, NOT from rehype-sanitize's
 * `defaultSchema`. The default is tuned for whole documents and permits far more
 * than an inline run should ever contain; starting from it and subtracting fails
 * open, which is the wrong direction for a surface that renders on the cosora.in
 * origin.
 *
 * Block structure comes from the block array, never from markup, so there is
 * deliberately no <p>, no heading and no list tag here.
 */
const INLINE_SCHEMA: SanitizeOptions = {
  tagNames: ['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'sup', 'sub', 'span'],
  attributes: {
    a: [['href'], ['rel'], ['target']],
    // The tuple form permits the attribute only when its value is one of the
    // listed tokens, which is what keeps "font size" to named steps instead of
    // letting an editor paste arbitrary styling into the page.
    span: [['className', 'blog-lead', 'blog-small']],
  },
  protocols: { href: ['http', 'https', 'mailto'] },
  strip: ['script', 'style'],
  clobber: [],
};

const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeSanitize, INLINE_SCHEMA)
  .use(rehypeStringify);

/**
 * Runs on the server at build/ISR time only. Returns HTML safe to hand to
 * dangerouslySetInnerHTML.
 */
export function sanitizeInline(html: string | null | undefined): string {
  if (!html) return '';
  return String(processor.processSync(html));
}

/** Plain text from inline HTML, for meta descriptions and word counts. */
export function inlineToText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
