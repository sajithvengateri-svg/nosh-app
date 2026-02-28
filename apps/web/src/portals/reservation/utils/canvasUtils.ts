// Snap-to-grid utilities
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPosition(x: number, y: number, gridSize: number): { x: number; y: number } {
  return { x: snapToGrid(x, gridSize), y: snapToGrid(y, gridSize) };
}

// Export floor plan as PNG
export async function exportAsPNG(svgElement: SVGSVGElement, filename = 'floor-plan.png'): Promise<void> {
  // Clone SVG to avoid modifying the original
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Get viewBox dimensions
  const viewBox = svgElement.viewBox.baseVal;
  const width = viewBox.width || 1200;
  const height = viewBox.height || 800;

  // Set explicit dimensions on clone
  clone.setAttribute('width', String(width * 2));
  clone.setAttribute('height', String(height * 2));

  // Resolve all class-based styles to inline styles
  // (SVG export won't have access to Tailwind CSS)
  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f8fafc'; // Light background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Failed to create PNG')); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        resolve();
      }, 'image/png');

      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Smart guide detection - finds alignment lines between dragged item and other items
export interface SmartGuide {
  type: 'h' | 'v'; // horizontal or vertical line
  position: number;
}

interface ItemBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function detectSmartGuides(
  draggedItem: ItemBounds,
  otherItems: ItemBounds[],
  tolerance: number = 3
): SmartGuide[] {
  const guides: SmartGuide[] = [];
  const dragCenterX = draggedItem.x + draggedItem.width / 2;
  const dragCenterY = draggedItem.y + draggedItem.height / 2;
  const dragRight = draggedItem.x + draggedItem.width;
  const dragBottom = draggedItem.y + draggedItem.height;

  for (const item of otherItems) {
    if (item.id === draggedItem.id) continue;
    const centerX = item.x + item.width / 2;
    const centerY = item.y + item.height / 2;
    const right = item.x + item.width;
    const bottom = item.y + item.height;

    // Vertical guides (x alignment)
    if (Math.abs(draggedItem.x - item.x) <= tolerance) guides.push({ type: 'v', position: item.x });
    if (Math.abs(dragCenterX - centerX) <= tolerance) guides.push({ type: 'v', position: centerX });
    if (Math.abs(dragRight - right) <= tolerance) guides.push({ type: 'v', position: right });
    if (Math.abs(draggedItem.x - right) <= tolerance) guides.push({ type: 'v', position: right });
    if (Math.abs(dragRight - item.x) <= tolerance) guides.push({ type: 'v', position: item.x });

    // Horizontal guides (y alignment)
    if (Math.abs(draggedItem.y - item.y) <= tolerance) guides.push({ type: 'h', position: item.y });
    if (Math.abs(dragCenterY - centerY) <= tolerance) guides.push({ type: 'h', position: centerY });
    if (Math.abs(dragBottom - bottom) <= tolerance) guides.push({ type: 'h', position: bottom });
    if (Math.abs(draggedItem.y - bottom) <= tolerance) guides.push({ type: 'h', position: bottom });
    if (Math.abs(dragBottom - item.y) <= tolerance) guides.push({ type: 'h', position: item.y });
  }

  // Deduplicate by position (within tolerance)
  const unique: SmartGuide[] = [];
  for (const g of guides) {
    if (!unique.some(u => u.type === g.type && Math.abs(u.position - g.position) < tolerance)) {
      unique.push(g);
    }
  }
  return unique;
}

// Alignment utilities for multi-select
export function alignItems(
  items: ItemBounds[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (items.length === 0) return result;

  switch (alignment) {
    case 'left': {
      const minX = Math.min(...items.map(i => i.x));
      items.forEach(i => result.set(i.id, { x: minX, y: i.y }));
      break;
    }
    case 'center': {
      const centers = items.map(i => i.x + i.width / 2);
      const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
      items.forEach(i => result.set(i.id, { x: avgCenter - i.width / 2, y: i.y }));
      break;
    }
    case 'right': {
      const maxRight = Math.max(...items.map(i => i.x + i.width));
      items.forEach(i => result.set(i.id, { x: maxRight - i.width, y: i.y }));
      break;
    }
    case 'top': {
      const minY = Math.min(...items.map(i => i.y));
      items.forEach(i => result.set(i.id, { x: i.x, y: minY }));
      break;
    }
    case 'middle': {
      const middles = items.map(i => i.y + i.height / 2);
      const avgMiddle = middles.reduce((a, b) => a + b, 0) / middles.length;
      items.forEach(i => result.set(i.id, { x: i.x, y: avgMiddle - i.height / 2 }));
      break;
    }
    case 'bottom': {
      const maxBottom = Math.max(...items.map(i => i.y + i.height));
      items.forEach(i => result.set(i.id, { x: i.x, y: maxBottom - i.height }));
      break;
    }
  }
  return result;
}

export function distributeItems(
  items: ItemBounds[],
  direction: 'horizontal' | 'vertical'
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (items.length <= 2) {
    items.forEach(i => result.set(i.id, { x: i.x, y: i.y }));
    return result;
  }

  const sorted = [...items].sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (direction === 'horizontal') {
    const totalSpace = (last.x + last.width) - first.x;
    const totalItemWidth = sorted.reduce((sum, i) => sum + i.width, 0);
    const gap = (totalSpace - totalItemWidth) / (sorted.length - 1);
    let currentX = first.x;
    sorted.forEach(i => {
      result.set(i.id, { x: Math.round(currentX), y: i.y });
      currentX += i.width + gap;
    });
  } else {
    const totalSpace = (last.y + last.height) - first.y;
    const totalItemHeight = sorted.reduce((sum, i) => sum + i.height, 0);
    const gap = (totalSpace - totalItemHeight) / (sorted.length - 1);
    let currentY = first.y;
    sorted.forEach(i => {
      result.set(i.id, { x: i.x, y: Math.round(currentY) });
      currentY += i.height + gap;
    });
  }
  return result;
}
