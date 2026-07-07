import type { Template } from "./types";
import { num } from "./types";
import type { Manifold, ManifoldToplevel } from "manifold-3d";

function buildLeg(
  M: ManifoldToplevel,
  legHeight: number,
  legSize: number,
  footSize: number,
  footThickness: number,
  tabLength: number,
  neckWidth: number,
  neckDepth: number,
  headWidth: number,
  headDepth: number
): Manifold {
  const shaftLength = Math.max(legHeight - footThickness, 0.1);
  const leg = M.Manifold.cube([legSize, legSize, shaftLength], false).translate([
    -legSize / 2,
    -legSize / 2,
    footThickness,
  ]);
  const foot = M.Manifold.cube([footSize, footSize, footThickness], false).translate([
    -footSize / 2,
    -footSize / 2,
    0,
  ]);

  const topZ = footThickness + shaftLength;
  const neck = M.Manifold.cube([tabLength, neckWidth, neckDepth], true).translate([
    0,
    0,
    topZ + neckDepth / 2,
  ]);
  const head = M.Manifold.cube([tabLength, headWidth, headDepth], true).translate([
    0,
    0,
    topZ + neckDepth + headDepth / 2,
  ]);

  return M.Manifold.union([leg, foot, neck, head]);
}

export const fanMountLegTemplate: Template = {
  id: "fan-mount-leg",
  name: "風扇支架腳(T型卡榫,一次排版列印) Fan Mount Legs (batch, standalone)",
  description:
    "一次排版列印多支腳(方柱+底部腳墊,頂端 T 型卡榫),可以設定兩種不同高度、各自幾支——例如兩側踩桌面的腳跟中間踩在 CPU 散熱片上的腳高度不同,一次印好不用分開匯出。配合「風扇支架骨架」外框滑槽使用,從滑槽任一端滑入、滑到比對好的位置卡住即可,不需要膠。",
  params: [
    { kind: "number", key: "height1", label: "第一組腳高度", min: 5, max: 200, step: 1, default: 50, unit: "mm" },
    { kind: "number", key: "count1", label: "第一組腳數量", min: 0, max: 12, step: 1, default: 2 },
    { kind: "number", key: "height2", label: "第二組腳高度", min: 5, max: 200, step: 1, default: 20, unit: "mm" },
    { kind: "number", key: "count2", label: "第二組腳數量", min: 0, max: 12, step: 1, default: 2 },
    { kind: "number", key: "spacing", label: "排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm" },
    { kind: "number", key: "legSize", label: "腳粗細(方形截面)", min: 4, max: 20, step: 0.5, default: 8, unit: "mm" },
    { kind: "number", key: "footSize", label: "腳墊尺寸", min: 8, max: 40, step: 1, default: 16, unit: "mm" },
    { kind: "number", key: "footThickness", label: "腳墊厚度", min: 1, max: 8, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "tabLength", label: "卡榫長度(沿滑槽方向)", min: 8, max: 40, step: 1, default: 18, unit: "mm" },
    { kind: "number", key: "tabClearance", label: "卡榫單邊餘裕", min: 0.05, max: 0.6, step: 0.05, default: 0.25, unit: "mm" },
    { kind: "number", key: "slotNeckWidth", label: "對應滑槽頸寬", min: 2, max: 10, step: 0.2, default: 4, unit: "mm" },
    { kind: "number", key: "slotNeckDepth", label: "對應滑槽頸深", min: 1, max: 6, step: 0.2, default: 2, unit: "mm" },
    { kind: "number", key: "slotHeadWidth", label: "對應滑槽頭寬", min: 4, max: 20, step: 0.2, default: 8, unit: "mm" },
    { kind: "number", key: "slotHeadDepth", label: "對應滑槽頭深", min: 2, max: 10, step: 0.2, default: 5, unit: "mm" },
  ],
  build: (values, M) => {
    const height1 = num(values, "height1");
    const count1 = Math.round(num(values, "count1"));
    const height2 = num(values, "height2");
    const count2 = Math.round(num(values, "count2"));
    const spacing = num(values, "spacing");
    const legSize = num(values, "legSize");
    const footSize = num(values, "footSize");
    const footThickness = num(values, "footThickness");
    const tabLength = num(values, "tabLength");
    const clearance = num(values, "tabClearance");
    const neckWidth = num(values, "slotNeckWidth") - 2 * clearance;
    const neckDepth = num(values, "slotNeckDepth");
    const headWidth = num(values, "slotHeadWidth") - 2 * clearance;
    const headDepth = num(values, "slotHeadDepth") - clearance;

    const heights: number[] = [
      ...Array(count1).fill(height1),
      ...Array(count2).fill(height2),
    ];

    if (heights.length === 0) {
      throw new Error("至少需要一支腳(第一組或第二組數量需大於 0)");
    }

    const pitch = Math.max(footSize, tabLength) + spacing;
    const totalWidth = (heights.length - 1) * pitch;
    let legs: Manifold | null = null;

    heights.forEach((h, i) => {
      const leg = buildLeg(
        M,
        h,
        legSize,
        footSize,
        footThickness,
        tabLength,
        neckWidth,
        neckDepth,
        headWidth,
        headDepth
      ).translate([i * pitch - totalWidth / 2, 0, 0]);
      legs = legs ? M.Manifold.union(legs, leg) : leg;
    });

    return legs!;
  },
};
