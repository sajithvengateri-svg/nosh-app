import type { HelpItem } from "./helpData";

interface ScoredItem {
  item: HelpItem;
  score: number;
}

/**
 * Search help articles and workflows by query.
 * Scores: title match (3) > tag match (2) > content match (1).
 */
export function searchHelp(query: string, items: HelpItem[]): HelpItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored: ScoredItem[] = [];

  for (const item of items) {
    let score = 0;

    // Title match (highest weight)
    if (item.title.toLowerCase().includes(q)) {
      score += 3;
    }

    // Tag match
    if (item.tags.some((t) => t.toLowerCase().includes(q))) {
      score += 2;
    }

    // Content match
    if (item.type === "article") {
      if (item.content.some((p) => p.toLowerCase().includes(q))) {
        score += 1;
      }
    } else {
      // Workflow — search step titles and descriptions
      if (item.description.toLowerCase().includes(q)) {
        score += 1;
      }
      if (item.steps.some((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))) {
        score += 1;
      }
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort by score descending, then alphabetically by title
  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  return scored.map((s) => s.item);
}

/**
 * Serialize top matching help items as plain text for LLM context injection (RAG-lite).
 * Called client-side before sending a chat message to the help-chat edge function.
 */
export function serializeHelpContext(
  query: string,
  items: HelpItem[],
  max = 5
): string {
  const results = searchHelp(query, items);
  if (results.length === 0) return "";

  return results
    .slice(0, max)
    .map((item) => {
      if (item.type === "article") {
        return `### ${item.title}\nCategory: ${item.category}\n${item.content.join("\n")}`;
      }
      return `### ${item.title} (Workflow)\n${item.description}\nSteps:\n${item.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join("\n")}`;
    })
    .join("\n\n---\n\n");
}
