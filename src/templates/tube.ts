import type { Template } from "./types";
import { num, bool } from "./types";

export const tubeTemplate: Template = {
  id: "tube",
  name: "圓柱/套筒 Cylinder & Tube",
  description: "實心圓柱,或挖空成套筒(可選穿孔或盲孔)。",
  params: [
    { kind: "number", key: "outerDiameter", label: "外徑", min: 3, max: 200, step: 0.5, default: 30, unit: "mm" },
    { kind: "number", key: "innerDiameter", label: "內徑 (0=實心)", min: 0, max: 195, step: 0.5, default: 20, unit: "mm" },
    { kind: "number", key: "height", label: "高度", min: 2, max: 250, step: 1, default: 40, unit: "mm" },
    { kind: "boolean", key: "throughHole", label: "孔洞貫穿", default: true },
    { kind: "number", key: "holeDepth", label: "盲孔深度", min: 1, max: 200, step: 1, default: 20, unit: "mm" },
    { kind: "number", key: "segments", label: "圓周分段數(越高越圓滑)", min: 16, max: 128, step: 4, default: 64 },
  ],
  build: (values, M) => {
    const outerD = num(values, "outerDiameter");
    const innerD = num(values, "innerDiameter");
    const height = num(values, "height");
    const throughHole = bool(values, "throughHole");
    const holeDepth = num(values, "holeDepth");
    const segments = Math.round(num(values, "segments"));

    const outer = M.Manifold.cylinder(height, outerD / 2, outerD / 2, segments, false);
    if (innerD <= 0) return outer;

    const innerR = innerD / 2;
    if (throughHole) {
      const inner = M.Manifold.cylinder(height + 4, innerR, innerR, segments, false).translate([
        0,
        0,
        -2,
      ]);
      return outer.subtract(inner);
    }

    const depth = Math.min(holeDepth, height);
    const inner = M.Manifold.cylinder(depth + 2, innerR, innerR, segments, false).translate([
      0,
      0,
      height - depth,
    ]);
    return outer.subtract(inner);
  },
};
