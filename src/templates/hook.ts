import type { Template } from "./types";
import { num, bool } from "./types";

export const hookTemplate: Template = {
  id: "hook",
  name: "壁掛掛勾 Wall Hook",
  description: "背板含鎖孔 + 向外伸出、末端上翹的掛勾。",
  params: [
    { kind: "number", key: "backplateWidth", label: "背板寬度 (X)", min: 10, max: 100, step: 1, default: 30, unit: "mm" },
    { kind: "number", key: "backplateHeight", label: "背板高度 (Z)", min: 15, max: 150, step: 1, default: 50, unit: "mm" },
    { kind: "number", key: "backplateThickness", label: "背板厚度 (Y)", min: 2, max: 10, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "holeDiameter", label: "鎖孔直徑", min: 2, max: 8, step: 0.1, default: 4.2, unit: "mm" },
    { kind: "number", key: "holeInset", label: "鎖孔距上下邊緣", min: 4, max: 40, step: 0.5, default: 8, unit: "mm" },
    { kind: "boolean", key: "twoHoles", label: "上下各一個孔(共2個)", default: true },
    { kind: "number", key: "armRadius", label: "掛勾桿半徑", min: 2, max: 15, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "armLength", label: "水平伸出長度", min: 10, max: 100, step: 1, default: 35, unit: "mm" },
    { kind: "number", key: "armHeightRatio", label: "掛勾出發點高度比例(0=最底,1=最頂)", min: 0, max: 1, step: 0.05, default: 0.3 },
    { kind: "number", key: "tipAngle", label: "末端上翹角度(0=水平,90=垂直向上)", min: 0, max: 120, step: 5, default: 80, unit: "deg" },
    { kind: "number", key: "tipLength", label: "末端上翹長度", min: 5, max: 60, step: 1, default: 20, unit: "mm" },
  ],
  build: (values, M) => {
    const bpW = num(values, "backplateWidth");
    const bpH = num(values, "backplateHeight");
    const bpT = num(values, "backplateThickness");
    const holeR = num(values, "holeDiameter") / 2;
    const inset = num(values, "holeInset");
    const twoHoles = bool(values, "twoHoles");
    const armR = num(values, "armRadius");
    const armLength = num(values, "armLength");
    const heightRatio = num(values, "armHeightRatio");
    const tipAngle = num(values, "tipAngle");
    const tipLength = num(values, "tipLength");

    let hook = M.Manifold.cube([bpW, bpT, bpH], false);

    const holeHeight = bpT + 4;
    const zs = twoHoles ? [inset, bpH - inset] : [bpH - inset];
    for (const z of zs) {
      const hole = M.Manifold.cylinder(holeHeight, holeR, holeR, 32, false)
        .rotate([-90, 0, 0])
        .translate([bpW / 2, -2, z]);
      hook = hook.subtract(hole);
    }

    const armStartZ = Math.max(armR + 1, Math.min(bpH - armR - 1, bpH * heightRatio));
    const embed = 1;
    const armLen = armLength + embed;
    const arm = M.Manifold.cylinder(armLen, armR, armR, 32, false)
      .rotate([-90, 0, 0])
      .translate([bpW / 2, bpT - embed, armStartZ]);
    hook = M.Manifold.union(hook, arm);

    const tipRad = (tipAngle * Math.PI) / 180;
    const armEndY = bpT + armLength;
    const tip = M.Manifold.cylinder(tipLength, armR, armR, 32, false)
      .rotate([tipAngle - 90, 0, 0])
      .translate([bpW / 2, armEndY, armStartZ]);
    hook = M.Manifold.union(hook, tip);

    const tipEndY = armEndY + Math.cos(tipRad) * tipLength;
    const tipEndZ = armStartZ + Math.sin(tipRad) * tipLength;
    const bead = M.Manifold.sphere(armR * 1.15, 24).translate([bpW / 2, tipEndY, tipEndZ]);
    hook = M.Manifold.union(hook, bead);

    return hook;
  },
};
