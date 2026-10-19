/**
 * Structured data. Serialised with <, >, & and the two JavaScript line separators
 * (U+2028, U+2029) written as JSON unicode escapes, so a title containing
 * "</script>" cannot break out of the script element. The escapes are JSON, so the
 * parsed data is unchanged.
 *
 * The old replace(/</g, ...) put back a one-backslash escape, which JavaScript reads
 * as "<" itself: a no-op that let a post title run as script (2026-10-20 audit).
 */
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const UNSAFE = new RegExp(`[<>&${LS}${PS}]`, 'g');

const escapeChar = (c: string): string => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0');

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(UNSAFE, escapeChar);
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
