/**
 * Builds a wa.me deep link that opens a chat with the given number,
 * optionally pre-filling a message.
 *
 * `rawNumber` is expected in (or close to) E.164 format, e.g. "+1 555 123 4567".
 * wa.me only needs the digits — this strips everything else.
 */
export function buildWhatsAppLink(rawNumber: string, message?: string): string {
  const digits = rawNumber.replace(/[^0-9]/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
