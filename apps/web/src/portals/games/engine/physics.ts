/**
 * Simple 2D physics utilities for canvas-based games.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

/** Default gravity (pixels/s²) */
export const GRAVITY = 600;

/** Apply gravity to a particle's velocity */
export function applyGravity(p: Particle, dt: number, gravity = GRAVITY): void {
  p.vel.y += gravity * dt;
}

/** Move a particle by its velocity */
export function integrate(p: Particle, dt: number): void {
  p.pos.x += p.vel.x * dt;
  p.pos.y += p.vel.y * dt;
  p.rotation += p.rotationSpeed * dt;
}

/** Check if a point is inside a circle */
export function pointInCircle(point: Vec2, center: Vec2, radius: number): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return dx * dx + dy * dy <= radius * radius;
}

/** Check if two circles overlap */
export function circlesOverlap(
  a: Vec2,
  ra: number,
  b: Vec2,
  rb: number
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = dx * dx + dy * dy;
  const minDist = ra + rb;
  return dist <= minDist * minDist;
}

/** Check if a line segment intersects a circle (for swipe detection) */
export function lineIntersectsCircle(
  lineStart: Vec2,
  lineEnd: Vec2,
  center: Vec2,
  radius: number
): boolean {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const fx = lineStart.x - center.x;
  const fy = lineStart.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;

  let discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

/** Create a particle launched upward from the bottom (for onion blitz) */
export function createLaunchedParticle(
  screenWidth: number,
  screenHeight: number,
  radius: number
): Particle {
  const x = radius + Math.random() * (screenWidth - radius * 2);
  return {
    pos: { x, y: screenHeight + radius },
    vel: {
      x: (Math.random() - 0.5) * 200,
      y: -(400 + Math.random() * 200),
    },
    radius,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 6,
    active: true,
  };
}

/** Create a particle falling from the top (for gauntlet) */
export function createFallingParticle(
  lane: number,
  laneWidth: number,
  radius: number
): Particle {
  const x = laneWidth * lane + laneWidth / 2;
  return {
    pos: { x, y: -radius },
    vel: { x: 0, y: 0 }, // speed controlled by game logic
    radius,
    rotation: 0,
    rotationSpeed: 0,
    active: true,
  };
}

/** Lerp (linear interpolation) */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Distance between two points */
export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
