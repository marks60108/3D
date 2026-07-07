import type { Template } from "./types";
import { num, bool } from "./types";

export const bracketTemplate: Template = {
  id: "bracket",
  name: "L型支架 Bracket",
  description: "L 型轉接支架,兩側各可挖 1~2 個鎖孔。",
  params: [
    { kind: "number", key: "armA", label: "水平臂長", min: 10, max: 200, step: 1, default: 50, unit: "mm" },
    { kind: "number", key: "armB", label: "垂直臂長", min: 10, max: 200, step: 1, default: 50, unit: "mm" },
    { kind: "number", key: "width", label: "寬度 (Y)", min: 5, max: 150, step: 1, default: 25, unit: "mm" },
    { kind: "number", key: "thickness", label: "厚度", min: 1.5, max: 15, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "holeDiameter", label: "鎖孔直徑", min: 1.5, max: 12, step: 0.1, default: 4.2, unit: "mm" },
    { kind: "number", key: "holeInset", label: "孔位距邊緣", min: 3, max: 40, step: 0.5, default: 8, unit: "mm" },
    { kind: "boolean", key: "twoHolesPerArm", label: "每臂 2 個孔", default: false },
  ],
  build: (values, M) => {
    const armA = num(values, "armA");
    const armB = num(values, "armB");
    const width = num(values, "width");
    const thickness = num(values, "thickness");
    const holeR = num(values, "holeDiameter") / 2;
    const inset = num(values, "holeInset");
    const twoHoles = bool(values, "twoHolesPerArm");

    const horizontalArm = M.Manifold.cube([armA, width, thickness], false);
    const verticalArm = M.Manifold.cube([thickness, width, armB], false);
    let bracket = M.Manifold.union(horizontalArm, verticalArm);

    const holeHeight = thickness + 4;
    const y = width / 2;

    const horizontalXs = twoHoles ? [inset, armA - inset] : [armA - inset];
    for (const x of horizontalXs) {
      const hole = M.Manifold.cylinder(holeHeight, holeR, holeR, 32, false).translate([
        x,
        y,
        -2,
      ]);
      bracket = bracket.subtract(hole);
    }

    const verticalZs = twoHoles ? [inset, armB - inset] : [armB - inset];
    for (const z of verticalZs) {
      const hole = M.Manifold.cylinder(holeHeight, holeR, holeR, 32, false)
        .rotate([0, 90, 0])
        .translate([2, y, z]);
      bracket = bracket.subtract(hole);
    }

    return bracket;
  },
};
