import type { Template } from "./types";
import { num, bool } from "./types";

export const containerTemplate: Template = {
  id: "container",
  name: "收納盒 Container",
  description: "開口收納盒,可選擇是否附上壓入式蓋子。",
  params: [
    { kind: "number", key: "width", label: "外部寬度 (X)", min: 20, max: 250, step: 1, default: 80, unit: "mm" },
    { kind: "number", key: "depth", label: "外部深度 (Y)", min: 20, max: 250, step: 1, default: 60, unit: "mm" },
    { kind: "number", key: "height", label: "外部高度 (Z)", min: 5, max: 200, step: 1, default: 40, unit: "mm" },
    { kind: "number", key: "wallThickness", label: "壁厚", min: 0.8, max: 6, step: 0.1, default: 2, unit: "mm" },
    { kind: "number", key: "floorThickness", label: "底板厚度", min: 0.8, max: 6, step: 0.1, default: 2, unit: "mm" },
    { kind: "boolean", key: "hasLid", label: "附蓋子", default: false },
    { kind: "number", key: "lidClearance", label: "蓋子間隙 (每邊)", min: 0.1, max: 1, step: 0.05, default: 0.2, unit: "mm" },
    { kind: "number", key: "lidLipHeight", label: "蓋子卡榫高度", min: 1, max: 15, step: 0.5, default: 5, unit: "mm" },
  ],
  build: (values, M) => {
    const width = num(values, "width");
    const depth = num(values, "depth");
    const height = num(values, "height");
    const wall = num(values, "wallThickness");
    const floor = num(values, "floorThickness");
    const hasLid = bool(values, "hasLid");
    const clearance = num(values, "lidClearance");
    const lipHeight = num(values, "lidLipHeight");

    const outer = M.Manifold.cube([width, depth, height], false);
    const cavityW = Math.max(width - 2 * wall, 0.1);
    const cavityD = Math.max(depth - 2 * wall, 0.1);
    const cavityH = height - floor + 1;
    const cavity = M.Manifold.cube([cavityW, cavityD, cavityH], false).translate([
      wall,
      wall,
      floor,
    ]);
    const box = outer.subtract(cavity);

    if (!hasLid) return box;

    const flangeThickness = Math.max(wall, 1.6);
    const flange = M.Manifold.cube([width, depth, flangeThickness], false);

    const lipW = Math.max(cavityW - 2 * clearance, 0.1);
    const lipD = Math.max(cavityD - 2 * clearance, 0.1);
    const lip = M.Manifold.cube([lipW, lipD, lipHeight], false).translate([
      (width - lipW) / 2,
      (depth - lipD) / 2,
      -lipHeight,
    ]);

    const lid = M.Manifold.union(flange, lip).translate([width + 10, 0, lipHeight]);

    return M.Manifold.compose([box, lid]);
  },
};
