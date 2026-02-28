import type { TableShape, TableZone } from "@/lib/shared/types/res.types";

export interface FloorTemplateTable {
  name: string;
  shape: TableShape;
  zone: TableZone;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  min_capacity: number;
  max_capacity: number;
  rotation: number;
}

export interface FloorTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  canvasWidth: number;
  canvasHeight: number;
  tables: FloorTemplateTable[];
}

// ---------------------------------------------------------------------------
// 1. Fine Dining (800x600)
//    8 round 4-tops in 2 rows of 4, bar counter at the top
// ---------------------------------------------------------------------------
const fineDining: FloorTemplate = {
  id: "fine-dining",
  name: "Fine Dining",
  description:
    "Elegant layout with evenly spaced round tables and a bar counter. Ideal for upscale restaurants.",
  thumbnail: "\uD83C\uDF7D\uFE0F",
  canvasWidth: 800,
  canvasHeight: 600,
  tables: [
    // Bar counter across the top
    {
      name: "Bar 1",
      shape: "BAR",
      zone: "BAR",
      x_position: 300,
      y_position: 40,
      width: 200,
      height: 50,
      min_capacity: 4,
      max_capacity: 8,
      rotation: 0,
    },

    // Row 1 — 4 round tables (y ~200)
    {
      name: "T1",
      shape: "ROUND",
      zone: "INDOOR",
      x_position: 100,
      y_position: 200,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "T2",
      shape: "ROUND",
      zone: "INDOOR",
      x_position: 280,
      y_position: 200,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "T3",
      shape: "ROUND",
      zone: "INDOOR",
      x_position: 460,
      y_position: 200,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "T4",
      shape: "ROUND",
      zone: "INDOOR",
      x_position: 640,
      y_position: 200,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },

    // Row 2 — 4 round tables (y ~400)
    {
      name: "T5",
      shape: "ROUND",
      zone: "INDOOR",
      x_position: 100,
      y_position: 400,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "T6",
      shape: "ROUND",
      zone: "INDOOR",
      x_position: 280,
      y_position: 400,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "T7",
      shape: "ROUND",
      zone: "INDOOR",
      x_position: 460,
      y_position: 400,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "T8",
      shape: "ROUND",
      zone: "INDOOR",
      x_position: 640,
      y_position: 400,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Casual Bistro (900x600)
//    6 square 2-tops along walls, 4 rectangle 4-tops in center, bar at entrance
// ---------------------------------------------------------------------------
const casualBistro: FloorTemplate = {
  id: "casual-bistro",
  name: "Casual Bistro",
  description:
    "Relaxed bistro with wall-side 2-tops, central 4-tops, and a welcoming bar counter at the entrance.",
  thumbnail: "\u2615",
  canvasWidth: 900,
  canvasHeight: 600,
  tables: [
    // Bar counter at the entrance (bottom)
    {
      name: "Bar 1",
      shape: "BAR",
      zone: "BAR",
      x_position: 350,
      y_position: 530,
      width: 200,
      height: 50,
      min_capacity: 4,
      max_capacity: 6,
      rotation: 0,
    },

    // Left-wall square 2-tops
    {
      name: "W1",
      shape: "SQUARE",
      zone: "INDOOR",
      x_position: 40,
      y_position: 80,
      width: 50,
      height: 50,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },
    {
      name: "W2",
      shape: "SQUARE",
      zone: "INDOOR",
      x_position: 40,
      y_position: 220,
      width: 50,
      height: 50,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },
    {
      name: "W3",
      shape: "SQUARE",
      zone: "INDOOR",
      x_position: 40,
      y_position: 360,
      width: 50,
      height: 50,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },

    // Right-wall square 2-tops
    {
      name: "W4",
      shape: "SQUARE",
      zone: "INDOOR",
      x_position: 810,
      y_position: 80,
      width: 50,
      height: 50,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },
    {
      name: "W5",
      shape: "SQUARE",
      zone: "INDOOR",
      x_position: 810,
      y_position: 220,
      width: 50,
      height: 50,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },
    {
      name: "W6",
      shape: "SQUARE",
      zone: "INDOOR",
      x_position: 810,
      y_position: 360,
      width: 50,
      height: 50,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },

    // Center rectangle 4-tops (2x2 grid)
    {
      name: "C1",
      shape: "RECTANGLE",
      zone: "INDOOR",
      x_position: 260,
      y_position: 120,
      width: 120,
      height: 70,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "C2",
      shape: "RECTANGLE",
      zone: "INDOOR",
      x_position: 520,
      y_position: 120,
      width: 120,
      height: 70,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "C3",
      shape: "RECTANGLE",
      zone: "INDOOR",
      x_position: 260,
      y_position: 320,
      width: 120,
      height: 70,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "C4",
      shape: "RECTANGLE",
      zone: "INDOOR",
      x_position: 520,
      y_position: 320,
      width: 120,
      height: 70,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. Banquet Hall (1000x700)
//    4 large banquet 10-tops in 2 rows of 2, stage area at the top
// ---------------------------------------------------------------------------
const banquetHall: FloorTemplate = {
  id: "banquet-hall",
  name: "Banquet Hall",
  description:
    "Grand banquet layout with large communal tables and a stage area. Perfect for events and celebrations.",
  thumbnail: "\uD83C\uDF89",
  canvasWidth: 1000,
  canvasHeight: 700,
  tables: [
    // Stage area at the top (uses RECTANGLE as a structural element)
    {
      name: "Stage",
      shape: "RECTANGLE",
      zone: "INDOOR",
      x_position: 300,
      y_position: 30,
      width: 400,
      height: 80,
      min_capacity: 0,
      max_capacity: 0,
      rotation: 0,
    },

    // Row 1 — 2 banquet tables (y ~280)
    {
      name: "B1",
      shape: "BANQUET",
      zone: "INDOOR",
      x_position: 150,
      y_position: 250,
      width: 200,
      height: 80,
      min_capacity: 8,
      max_capacity: 10,
      rotation: 0,
    },
    {
      name: "B2",
      shape: "BANQUET",
      zone: "INDOOR",
      x_position: 650,
      y_position: 250,
      width: 200,
      height: 80,
      min_capacity: 8,
      max_capacity: 10,
      rotation: 0,
    },

    // Row 2 — 2 banquet tables (y ~500)
    {
      name: "B3",
      shape: "BANQUET",
      zone: "INDOOR",
      x_position: 150,
      y_position: 480,
      width: 200,
      height: 80,
      min_capacity: 8,
      max_capacity: 10,
      rotation: 0,
    },
    {
      name: "B4",
      shape: "BANQUET",
      zone: "INDOOR",
      x_position: 650,
      y_position: 480,
      width: 200,
      height: 80,
      min_capacity: 8,
      max_capacity: 10,
      rotation: 0,
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. Open Air (800x600)
//    10 round tables in a scattered organic layout, mix of 2 and 4 tops
// ---------------------------------------------------------------------------
const openAir: FloorTemplate = {
  id: "open-air",
  name: "Open Air",
  description:
    "Organic outdoor layout with scattered round tables of varying sizes. Great for patios and terraces.",
  thumbnail: "\uD83C\uDF3F",
  canvasWidth: 800,
  canvasHeight: 600,
  tables: [
    // Scattered 4-tops
    {
      name: "P1",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 80,
      y_position: 90,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "P2",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 320,
      y_position: 60,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "P3",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 600,
      y_position: 110,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "P4",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 200,
      y_position: 270,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
    {
      name: "P5",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 500,
      y_position: 300,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },

    // Scattered 2-tops (smaller feel but same round dimensions)
    {
      name: "P6",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 700,
      y_position: 310,
      width: 60,
      height: 60,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },
    {
      name: "P7",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 60,
      y_position: 420,
      width: 60,
      height: 60,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },
    {
      name: "P8",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 370,
      y_position: 460,
      width: 60,
      height: 60,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },
    {
      name: "P9",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 580,
      y_position: 490,
      width: 60,
      height: 60,
      min_capacity: 1,
      max_capacity: 2,
      rotation: 0,
    },
    {
      name: "P10",
      shape: "ROUND",
      zone: "OUTDOOR",
      x_position: 160,
      y_position: 530,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
  ],
};

// ---------------------------------------------------------------------------
// 5. Private Dining (600x500)
//    1 large rectangle 12-top center, 2 small round 4-tops on sides
// ---------------------------------------------------------------------------
const privateDining: FloorTemplate = {
  id: "private-dining",
  name: "Private Dining",
  description:
    "Intimate private room with a large central table and two smaller side tables for exclusive gatherings.",
  thumbnail: "\uD83D\uDD10",
  canvasWidth: 600,
  canvasHeight: 500,
  tables: [
    // Large center rectangle 12-top
    {
      name: "Main",
      shape: "RECTANGLE",
      zone: "PRIVATE",
      x_position: 190,
      y_position: 180,
      width: 220,
      height: 120,
      min_capacity: 8,
      max_capacity: 12,
      rotation: 0,
    },

    // Left side round 4-top
    {
      name: "Side L",
      shape: "ROUND",
      zone: "PRIVATE",
      x_position: 60,
      y_position: 210,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },

    // Right side round 4-top
    {
      name: "Side R",
      shape: "ROUND",
      zone: "PRIVATE",
      x_position: 480,
      y_position: 210,
      width: 60,
      height: 60,
      min_capacity: 2,
      max_capacity: 4,
      rotation: 0,
    },
  ],
};

// ---------------------------------------------------------------------------
// Exported collection
// ---------------------------------------------------------------------------
export const FLOOR_TEMPLATES: FloorTemplate[] = [
  fineDining,
  casualBistro,
  banquetHall,
  openAir,
  privateDining,
];
