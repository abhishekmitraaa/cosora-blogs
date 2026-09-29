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

const textParser = unified().use(rehypeParse, { fragment: true });

type TextNode = { type: 'text'; value: string };
type ElementNode = { type: 'element'; tagName: string; children: HastNode[] };
type HastNode = TextNode | ElementNode | { type: string };

/** Elements whose content is never prose, so it never reaches a description or a count. */
const NON_PROSE = new Set(['script', 'style', 'template']);

/**
 * Plain text from inline HTML, for meta descriptions, structured data and word
 * counts.
 *
 * Parsed with the same HTML5 parser the renderer uses, so every entity decodes
 * the way it does on the page: &plusmn; is ±, &hellip; is …, &#8377; is ₹.
 * The previous version replaced six named entities with regexes, so anything
 * else leaked through literally (the GSM FAQ answer went into FAQPage JSON-LD as
 * "Around &plusmn;5 GSM"), and replacing &amp; before &lt; decoded "&amp;lt;"
 * twice, into "<".
 *
 * <br> becomes a space; every other tag contributes only its text.
 *
 * Mirrored in cosora-admin src/lib/blogInline.ts, which parses with the browser's
 * <template> element: parse5 parses a fragment in the same template context, so
 * the admin's SEO counters count exactly this string.
 */
export function inlineToText(html: string | null | undefined): string {
  if (!html) return '';
  let out = '';
  const walk = (nodes: HastNode[]) => {
    for (const n of nodes) {
      if (n.type === 'text') out += (n as TextNode).value;
      else if (n.type === 'element') {
        const el = n as ElementNode;
        if (el.tagName === 'br') out += ' ';
        else if (!NON_PROSE.has(el.tagName)) walk(el.children);
      }
    }
  };
  walk((textParser.parse(html) as unknown as { children: HastNode[] }).children);
  return out.replace(/\s+/g, ' ').trim();
}
