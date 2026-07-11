import type { CrossSection, Manifold, ManifoldToplevel } from "manifold-3d";

/* Shared geometry helpers used across templates. All 2D helpers return
 * CrossSections meant to be extruded so parts print flat without supports. */

/** A rectangular bar connecting (x1,y1) to (x2,y2) at zBase, lying flat.
 * Slightly overlong (+3mm) so unions always fuse at both ends. */
export function buildStrut(
  M: ManifoldToplevel,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  thickness: number,
  zBase: number
): Manifold {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy) + 3;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return M.Manifold.cube([length, width, thickness], true)
    .rotate([0, 0, angleDeg])
    .translate([midX, midY, zBase + thickness / 2]);
}

/** Rounded rectangle centered at (cx, cy). Radius auto-clamps to fit. */
export function rrect(
  M: ManifoldToplevel,
  w: number,
  h: number,
  r: number,
  cx = 0,
  cy = 0
): CrossSection {
  const rr = Math.min(r, w / 2 - 0.01, h / 2 - 0.01);
  const c = (x: number, y: number) => M.CrossSection.circle(rr, 24).translate(x, y);
  return M.CrossSection.hull([
    c(cx - w / 2 + rr, cy - h / 2 + rr),
    c(cx + w / 2 - rr, cy - h / 2 + rr),
    c(cx + w / 2 - rr, cy + h / 2 - rr),
    c(cx - w / 2 + rr, cy + h / 2 - rr),
  ]);
}

export function rect(
  M: ManifoldToplevel,
  w: number,
  h: number,
  cx = 0,
  cy = 0
): CrossSection {
  return M.CrossSection.square([w, h], true).translate(cx, cy);
}

export function ellipse(
  M: ManifoldToplevel,
  rx: number,
  ry: number,
  cx = 0,
  cy = 0
): CrossSection {
  return M.CrossSection.circle(1, 48).scale([rx, ry]).translate(cx, cy);
}

/** Rabbit ear: elongated tapered oval, base sitting at (cx, baseY), pointing +y. */
export function rabbitEar(
  M: ManifoldToplevel,
  earW: number,
  earH: number,
  cx: number,
  baseY: number
): CrossSection {
  const r1 = earW / 2;
  const r2 = Math.max(earW * 0.36, 1);
  return M.CrossSection.hull([
    M.CrossSection.circle(r1, 24).translate(cx, baseY + r1),
    M.CrossSection.circle(r2, 24).translate(cx, baseY + earH - r2),
  ]);
}

/** Rounded trapezoid (wider at bottom), base on y=0, centered on x=0. */
export function trap(
  M: ManifoldToplevel,
  bottomW: number,
  topW: number,
  h: number,
  r: number
): CrossSection {
  const c = (x: number, y: number) => M.CrossSection.circle(r, 24).translate(x, y);
  return M.CrossSection.hull([
    c(-(bottomW / 2 - r), r),
    c(bottomW / 2 - r, r),
    c(topW / 2 - r, h - r),
    c(-(topW / 2 - r), h - r),
  ]);
}

/** Shelf-pack parts left-to-right using their real bounding boxes, wrapping to
 * a new row past maxRowWidth so the plate fits the printer bed, then shift the
 * whole plate's min corner to the origin. */
export function layoutParts(
  M: ManifoldToplevel,
  parts: Manifold[],
  gap: number,
  maxRowWidth = 230
): Manifold {
  if (parts.length === 0) {
    throw new Error("至少要勾選一個分件");
  }
  let cursorX = 0;
  let cursorY = 0;
  let rowDepth = 0;
  const placed: Manifold[] = [];
  for (const part of parts) {
    const b = part.boundingBox();
    const w = b.max[0] - b.min[0];
    const d = b.max[1] - b.min[1];
    if (cursorX > 0 && cursorX + w > maxRowWidth) {
      cursorX = 0;
      cursorY += rowDepth + gap;
      rowDepth = 0;
    }
    placed.push(part.translate([cursorX - b.min[0], cursorY - b.min[1], -b.min[2]]));
    cursorX += w + gap;
    rowDepth = Math.max(rowDepth, d);
  }
  const all = placed.length === 1 ? placed[0] : M.Manifold.union(placed);
  const bb = all.boundingBox();
  return all.translate([-bb.min[0], -bb.min[1], -bb.min[2]]);
}
