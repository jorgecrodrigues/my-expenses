export type SummaryBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const stripInline = (text: string) =>
  text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").trim();

/**
 * Splits the Markdown written by Gemini into headings, paragraphs and bullet
 * lists. Only that subset is supported; inline emphasis is dropped.
 */
export function parseSummary(markdown: string): SummaryBlock[] {
  const blocks: SummaryBlock[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^(?:[-*•]|\d+\.)\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];

    if (heading) {
      blocks.push({ type: "heading", text: stripInline(heading[1]) });
    } else if (bullet) {
      const item = stripInline(bullet[1]);
      if (last?.type === "list") {
        last.items.push(item);
      } else {
        blocks.push({ type: "list", items: [item] });
      }
    } else {
      blocks.push({ type: "paragraph", text: stripInline(line) });
    }
  }
  return blocks;
}
