// ── Rich Response Types ─────────────────────────────────────────
// Content types NOSH can respond with on the canvas.

export type ResponseType =
  | "pill"       // short text, tappable
  | "bubble"     // number badge
  | "card"       // rich card with text + optional image
  | "media"      // youtube thumbnail or image
  | "link"       // tappable URL with preview
  | "action";    // CTA button

export interface NoshResponse {
  id: string;
  type: ResponseType;
  content: string;
  subtitle?: string;
  icon?: string;             // Lucide icon name (e.g. "sparkles", "timer")
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  action?: string;           // action key (e.g. "open_nosh_run", "open_meal_plan")
  recipeId?: string;
  number?: number;           // for bubble type
  dismissAfter?: number;     // auto-dismiss ms (default 10000)
  timestamp: number;
}
