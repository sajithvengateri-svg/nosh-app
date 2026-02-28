export interface PalateOption {
  label: string;
  description: string;
  value: string;
  icon: string;
}

export interface PalateQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: PalateOption[];
  mapsTo: string;
}

export const palateQuestions: PalateQuestion[] = [
  {
    id: 'coffee',
    question: 'How do you take your coffee?',
    subtitle: 'This tells us about your tannin tolerance',
    mapsTo: 'tanninTolerance',
    options: [
      { label: 'Black espresso', description: 'Strong, no sugar, no milk', value: 'black', icon: '☕' },
      { label: 'Flat white', description: 'Smooth with a little milk', value: 'milk', icon: '🥛' },
      { label: 'Mocha or flavoured', description: 'Sweet, chocolatey, indulgent', value: 'sweet', icon: '🍫' },
      { label: 'I prefer tea', description: 'Gentle, aromatic, delicate', value: 'tea', icon: '🍵' },
    ],
  },
  {
    id: 'chocolate',
    question: 'Pick your ideal chocolate.',
    subtitle: 'This reveals your sweetness and acidity balance',
    mapsTo: 'acidityBalance',
    options: [
      { label: '85% dark', description: 'Bitter, intense, complex', value: 'dark', icon: '🍫' },
      { label: 'Milk chocolate', description: 'Smooth, creamy, comforting', value: 'milk', icon: '🤎' },
      { label: 'White chocolate', description: 'Sweet, buttery, mellow', value: 'white', icon: '🤍' },
      { label: 'Salted caramel', description: 'Sweet and savoury, balanced', value: 'caramel', icon: '🧂' },
    ],
  },
  {
    id: 'vibe',
    question: 'Describe your ideal evening.',
    subtitle: 'This shapes your cellar recommendations',
    mapsTo: 'cellarVibe',
    options: [
      { label: 'Steakhouse with a bold red', description: 'Classic, powerful, no compromise', value: 'steakhouse', icon: '🥩' },
      { label: 'Garden party with bubbles', description: 'Light, social, celebratory', value: 'garden', icon: '🥂' },
      { label: 'Seafood by the water', description: 'Fresh, crisp, relaxed', value: 'seafood', icon: '🦐' },
      { label: 'Cozy fireplace evening', description: 'Warm, indulgent, lingering', value: 'fireplace', icon: '🔥' },
    ],
  },
  {
    id: 'price',
    question: 'Your typical bottle spend?',
    subtitle: 'No judgement — we just want to match you right',
    mapsTo: 'priceRange',
    options: [
      { label: '$20–40', description: 'Everyday drinking', value: 'everyday', icon: '🍷' },
      { label: '$40–80', description: 'Premium picks', value: 'premium', icon: '✨' },
      { label: '$80–150', description: 'Cellar worthy', value: 'cellar', icon: '🏆' },
      { label: '$150+', description: 'Collector grade', value: 'collector', icon: '💎' },
    ],
  },
  {
    id: 'oak',
    question: 'How do you feel about oak?',
    subtitle: 'The vanilla, toast, and spice in wine comes from barrel aging',
    mapsTo: 'oakPreference',
    options: [
      { label: 'Love it', description: 'Vanilla, toast, warm spice — bring it on', value: 'love', icon: '🪵' },
      { label: 'Some is nice', description: 'A touch of complexity, not overpowering', value: 'moderate', icon: '⚖️' },
      { label: 'Prefer minimal', description: 'Keep it clean and fruit-forward', value: 'minimal', icon: '🍇' },
      { label: 'No oak at all', description: 'Pure, unoaked, crisp', value: 'none', icon: '💧' },
    ],
  },
];
