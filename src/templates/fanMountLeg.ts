import type { Template } from "./types";
import { num } from "./types";

export const fanMountLegTemplate: Template = {
  id: "fan-mount-leg",
  name: "風扇支架腳(T型卡榫,單獨列印) Fan Mount Leg (standalone)",
  description:
    "獨立的一支腳(方柱+底部腳墊),頂端做了 T 型卡榫,配合「風扇支架骨架」外框上的滑槽使用:從滑槽任一端滑入,滑到你在硬體上比對好的位置後卡住即可,不需要膠。這支腳需要幾支就印幾支,位置、支數、對不對稱都你自己決定。",
  params: [
    { kind: "number", key: "legHeight", label: "腳高度(桌面到骨架滑槽底部的距離)", min: 5, max: 200, step: 1, default: 40, unit: "mm" },
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
    const legHeight = num(values, "legHeight");
    const legSize = num(values, "legSize");
    const footSize = num(values, "footSize");
    const footThickness = num(values, "footThickness");
    const tabLength = num(values, "tabLength");
    const clearance = num(values, "tabClearance");
    const neckWidth = num(values, "slotNeckWidth") - 2 * clearance;
    const neckDepth = num(values, "slotNeckDepth");
    const headWidth = num(values, "slotHeadWidth") - 2 * clearance;
    const headDepth = num(values, "slotHeadDepth") - clearance;

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
  },
};
