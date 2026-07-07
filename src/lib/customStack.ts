import type { Manifold, ManifoldToplevel } from "manifold-3d";

export type StackShape = "box" | "cylinder";
export type StackOp = "union" | "subtract";

export interface StackItem {
  id: string;
  shape: StackShape;
  op: StackOp;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  diameter: number;
  height: number;
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
}

let counter = 0;
export function newStackItem(shape: StackShape, op: StackOp = "union"): StackItem {
  counter += 1;
  return {
    id: `item-${counter}`,
    shape,
    op,
    sizeX: 30,
    sizeY: 30,
    sizeZ: 30,
    diameter: 20,
    height: 30,
    posX: 0,
    posY: 0,
    posZ: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
  };
}

function buildItemManifold(item: StackItem, M: ManifoldToplevel): Manifold {
  const base =
    item.shape === "box"
      ? M.Manifold.cube([item.sizeX, item.sizeY, item.sizeZ], true)
      : M.Manifold.cylinder(item.height, item.diameter / 2, item.diameter / 2, 48, true);

  return base
    .rotate([item.rotX, item.rotY, item.rotZ])
    .translate([item.posX, item.posY, item.posZ]);
}

/** Combine a list of primitives in order: first item is the base, each
 * subsequent item is unioned or subtracted according to its op. */
export function buildCustomStack(
  items: StackItem[],
  M: ManifoldToplevel
): Manifold | null {
  if (items.length === 0) return null;

  let result = buildItemManifold(items[0], M);
  for (let i = 1; i < items.length; i++) {
    const shape = buildItemManifold(items[i], M);
    result = items[i].op === "subtract" ? result.subtract(shape) : M.Manifold.union(result, shape);
  }
  return result;
}
