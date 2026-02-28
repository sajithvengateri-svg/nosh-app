export interface FlavorCluster {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  icon: string;
  matchingTags: string[];
}

export const flavorClusters: Record<string, FlavorCluster> = {
  bold_structured: {
    id: 'bold_structured',
    name: 'Bold & Structured',
    tagline: 'You like wines that make a statement',
    description: 'Full-bodied reds with firm tannins, dark fruit, and oak complexity. You appreciate power balanced with finesse. Think Barossa Shiraz, Coonawarra Cabernet, aged Nebbiolo.',
    color: '#722F37',
    icon: '🔥',
    matchingTags: ['bold', 'tannic', 'oaky', 'dark_fruit', 'structured', 'concentrated'],
  },
  elegant_refined: {
    id: 'elegant_refined',
    name: 'Elegant & Refined',
    tagline: 'Subtlety over strength, always',
    description: 'Medium-bodied wines with nuance, complexity, and grace. You value texture and length over sheer power. Think Yarra Pinot Noir, fine Chardonnay, vintage sparkling.',
    color: '#1B4332',
    icon: '🌿',
    matchingTags: ['elegant', 'floral', 'structured', 'mineral', 'complex', 'toasty'],
  },
  fresh_vibrant: {
    id: 'fresh_vibrant',
    name: 'Fresh & Vibrant',
    tagline: 'Bright, crisp, and alive',
    description: 'Light-bodied, high-acid wines that refresh and invigorate. You love citrus, herbs, and minerality. Think Clare Riesling, Hunter Semillon, natural Grenache, Provence rosé.',
    color: '#C9A96E',
    icon: '⚡',
    matchingTags: ['crisp', 'fresh', 'citrus', 'herbal', 'light', 'natural', 'dry'],
  },
  rich_indulgent: {
    id: 'rich_indulgent',
    name: 'Rich & Indulgent',
    tagline: 'Life is too short for boring wine',
    description: 'Generous, hedonistic wines with ripe fruit, warmth, and texture. You like wines that envelop rather than challenge. Think McLaren Vale Shiraz, barrel-fermented Chardonnay, dessert wines.',
    color: '#8B4513',
    icon: '🍯',
    matchingTags: ['rich', 'jammy', 'creamy', 'sweet', 'concentrated', 'oaky', 'stone_fruit'],
  },
};

// Maps palate answers to a cluster
export function assignCluster(answers: Record<string, string>): string {
  const scores: Record<string, number> = {
    bold_structured: 0,
    elegant_refined: 0,
    fresh_vibrant: 0,
    rich_indulgent: 0,
  };

  // Coffee → tannin tolerance
  if (answers.coffee === 'black') { scores.bold_structured += 3; scores.elegant_refined += 1; }
  if (answers.coffee === 'milk') { scores.elegant_refined += 2; scores.rich_indulgent += 1; }
  if (answers.coffee === 'sweet') { scores.rich_indulgent += 3; }
  if (answers.coffee === 'tea') { scores.fresh_vibrant += 3; scores.elegant_refined += 1; }

  // Chocolate → acidity/sweetness balance
  if (answers.chocolate === 'dark') { scores.bold_structured += 2; scores.elegant_refined += 2; }
  if (answers.chocolate === 'milk') { scores.rich_indulgent += 2; scores.elegant_refined += 1; }
  if (answers.chocolate === 'white') { scores.fresh_vibrant += 1; scores.rich_indulgent += 2; }
  if (answers.chocolate === 'caramel') { scores.rich_indulgent += 3; }

  // Vibe → cellar style
  if (answers.vibe === 'steakhouse') { scores.bold_structured += 3; }
  if (answers.vibe === 'garden') { scores.fresh_vibrant += 2; scores.elegant_refined += 1; }
  if (answers.vibe === 'seafood') { scores.fresh_vibrant += 3; }
  if (answers.vibe === 'fireplace') { scores.rich_indulgent += 2; scores.elegant_refined += 1; }

  // Price → general style preference (subtle weighting)
  if (answers.price === 'everyday') { scores.fresh_vibrant += 1; }
  if (answers.price === 'premium') { scores.elegant_refined += 1; }
  if (answers.price === 'cellar') { scores.bold_structured += 1; scores.elegant_refined += 1; }
  if (answers.price === 'collector') { scores.bold_structured += 1; scores.elegant_refined += 1; }

  // Oak → barrel profile
  if (answers.oak === 'love') { scores.bold_structured += 2; scores.rich_indulgent += 1; }
  if (answers.oak === 'moderate') { scores.elegant_refined += 2; }
  if (answers.oak === 'minimal') { scores.fresh_vibrant += 2; }
  if (answers.oak === 'none') { scores.fresh_vibrant += 3; }

  // Return highest scoring cluster
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}
