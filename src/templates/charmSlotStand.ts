import type { Template } from "./types";
import { num } from "./types";

export const charmSlotStandTemplate: Template = {
  id: "charm-slot-stand",
  name: "[草稿B] 吊飾插槽站立架",
  description: "底座 + 直立背牆,牆上一排細槽,吊飾扁平身體插進去站立展示。",
  params: [
    { kind: "number", key: "baseWidth", label: "底座寬度 (X)", min: 60, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "baseDepth", label: "底座深度 (Y)", min: 20, max: 80, step: 1, default: 40, unit: "mm" },
    { kind: "number", key: "baseThickness", label: "底座厚度", min: 3, max: 10, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "wallHeight", label: "背牆高度", min: 15, max: 60, step: 1, default: 30, unit: "mm" },
    { kind: "number", key: "wallThickness", label: "背牆厚度", min: 5, max: 20, step: 0.5, default: 10, unit: "mm" },
    { kind: "number", key: "slotCount", label: "插槽數量", min: 1, max: 20, step: 1, default: 6 },
    { kind: "number", key: "slotWidth", label: "插槽寬度(吊飾厚度+餘裕)", min: 1.5, max: 6, step: 0.1, default: 3, unit: "mm" },
    { kind: "number", key: "slotDepth", label: "插槽深度", min: 5, max: 30, step: 1, default: 15, unit: "mm" },
    { kind: "number", key: "margin", label: "兩側留白", min: 5, max: 30, step: 1, default: 10, unit: "mm" },
  ],
  build: (values, M) => {
    const baseWidth = num(values, "baseWidth");
    const baseDepth = num(values, "baseDepth");
    const baseThickness = num(values, "baseThickness");
    const wallHeight = num(values, "wallHeight");
    const wallThickness = num(values, "wallThickness");
    const slotCount = Math.round(num(values, "slotCount"));
    const slotWidth = num(values, "slotWidth");
    const slotDepth = num(values, "slotDepth");
    const margin = num(values, "margin");

    const base = M.Manifold.cube([baseWidth, baseDepth, baseThickness], false);
    const wallY = baseDepth - wallThickness;
    const wall = M.Manifold.cube([baseWidth, wallThickness, wallHeight], false).translate([
      0,
      wallY,
      baseThickness,
    ]);
    let stand = M.Manifold.union(base, wall);

    const usableW = baseWidth - 2 * margin;
    const stepX = slotCount > 1 ? usableW / (slotCount - 1) : 0;
    const slotTopZ = baseThickness + wallHeight;

    for (let i = 0; i < slotCount; i++) {
      const cx = margin + i * stepX;
      const slot = M.Manifold.cube(
        [slotWidth, wallThickness + 4, slotDepth + 2],
        false
      ).translate([cx - slotWidth / 2, wallY - 2, slotTopZ - slotDepth]);
      stand = stand.subtract(slot);
    }

    return stand;
  },
};
