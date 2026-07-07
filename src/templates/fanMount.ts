import type { Template } from "./types";
import { num } from "./types";
import type { Manifold, ManifoldToplevel } from "manifold-3d";

function buildStrut(
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

export const fanMountTemplate: Template = {
  id: "fan-mount",
  name: "風扇架高支架 Fan Riser Mount",
  description:
    "中間是跟風扇尺寸吻合的鎖孔環(風扇鎖在這裡),透過 4 條連接臂延伸到外圍的支撐腳,支撐腳跨距(支架整體長寬)可以獨立放大,不受風扇尺寸限制。中間與臂之間全部鏤空不擋風。",
  params: [
    { kind: "number", key: "fanSize", label: "風扇外框尺寸(正方形邊長)", min: 40, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "holeSpacing", label: "鎖孔中心間距(對邊)", min: 20, max: 240, step: 0.5, default: 105, unit: "mm" },
    { kind: "number", key: "holeDiameter", label: "鎖孔直徑", min: 2, max: 8, step: 0.1, default: 4.3, unit: "mm" },
    { kind: "number", key: "rimWidth", label: "風扇環邊寬度", min: 5, max: 30, step: 0.5, default: 14, unit: "mm" },
    { kind: "number", key: "mountWidth", label: "支架整體寬度 (X,跨支撐腳)", min: 40, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "mountDepth", label: "支架整體深度 (Y,跨支撐腳)", min: 40, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "strutWidth", label: "連接臂寬度", min: 4, max: 25, step: 0.5, default: 10, unit: "mm" },
    { kind: "number", key: "frameThickness", label: "框/臂厚度", min: 2, max: 10, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "legHeight", label: "架高高度", min: 5, max: 150, step: 1, default: 30, unit: "mm" },
    { kind: "number", key: "legSize", label: "支腳粗細(方形截面)", min: 4, max: 20, step: 0.5, default: 8, unit: "mm" },
    { kind: "number", key: "legInset", label: "支腳距支架邊緣內縮", min: 1, max: 20, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "footSize", label: "腳墊尺寸", min: 8, max: 40, step: 1, default: 16, unit: "mm" },
    { kind: "number", key: "footThickness", label: "腳墊厚度", min: 1, max: 8, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "leg1OffsetX", label: "支腳1 X 微調(X-,Y-角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg1OffsetY", label: "支腳1 Y 微調(X-,Y-角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg2OffsetX", label: "支腳2 X 微調(X+,Y-角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg2OffsetY", label: "支腳2 Y 微調(X+,Y-角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg3OffsetX", label: "支腳3 X 微調(X-,Y+角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg3OffsetY", label: "支腳3 Y 微調(X-,Y+角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg4OffsetX", label: "支腳4 X 微調(X+,Y+角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg4OffsetY", label: "支腳4 Y 微調(X+,Y+角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
  ],
  build: (values, M) => {
    const fanSize = num(values, "fanSize");
    const holeSpacing = num(values, "holeSpacing");
    const holeR = num(values, "holeDiameter") / 2;
    const rimWidth = num(values, "rimWidth");
    const mountWidth = num(values, "mountWidth");
    const mountDepth = num(values, "mountDepth");
    const strutWidth = num(values, "strutWidth");
    const frameThickness = num(values, "frameThickness");
    const legHeight = num(values, "legHeight");
    const legSize = num(values, "legSize");
    const legInset = num(values, "legInset");
    const footSize = num(values, "footSize");
    const footThickness = num(values, "footThickness");

    const mountCenterX = mountWidth / 2;
    const mountCenterY = mountDepth / 2;
    const legOverlap = 1;

    const ringOuter = M.Manifold.cube([fanSize, fanSize, frameThickness], true).translate([
      mountCenterX,
      mountCenterY,
      legHeight,
    ]);
    const innerOpening = fanSize - 2 * rimWidth;
    const cutout = M.Manifold.cube(
      [innerOpening, innerOpening, frameThickness + 4],
      true
    ).translate([mountCenterX, mountCenterY, legHeight - 2]);
    let mount = ringOuter.subtract(cutout);

    const holeHeight = frameThickness + 4;
    const holeOffsets = [-holeSpacing / 2, holeSpacing / 2];
    for (const dx of holeOffsets) {
      for (const dy of holeOffsets) {
        const hole = M.Manifold.cylinder(holeHeight, holeR, holeR, 32, false).translate([
          mountCenterX + dx,
          mountCenterY + dy,
          legHeight - 2,
        ]);
        mount = mount.subtract(hole);
      }
    }

    const legOffset = legSize / 2 + legInset;
    const ringHalf = fanSize / 2;
    const corners = [
      { sx: 1, sy: 1, offsetXKey: "leg1OffsetX", offsetYKey: "leg1OffsetY" },
      { sx: -1, sy: 1, offsetXKey: "leg2OffsetX", offsetYKey: "leg2OffsetY" },
      { sx: 1, sy: -1, offsetXKey: "leg3OffsetX", offsetYKey: "leg3OffsetY" },
      { sx: -1, sy: -1, offsetXKey: "leg4OffsetX", offsetYKey: "leg4OffsetY" },
    ];

    for (const { sx, sy, offsetXKey, offsetYKey } of corners) {
      const baseX = sx > 0 ? legOffset : mountWidth - legOffset;
      const baseY = sy > 0 ? legOffset : mountDepth - legOffset;
      const cx = baseX + num(values, offsetXKey);
      const cy = baseY + num(values, offsetYKey);

      const ringCornerX = mountCenterX - sx * ringHalf;
      const ringCornerY = mountCenterY - sy * ringHalf;
      const strut = buildStrut(
        M,
        ringCornerX,
        ringCornerY,
        cx,
        cy,
        strutWidth,
        frameThickness,
        legHeight
      );

      const leg = M.Manifold.cube([legSize, legSize, legHeight + legOverlap], false).translate([
        cx - legSize / 2,
        cy - legSize / 2,
        0,
      ]);
      const foot = M.Manifold.cube([footSize, footSize, footThickness], false).translate([
        cx - footSize / 2,
        cy - footSize / 2,
        0,
      ]);
      mount = M.Manifold.union([mount, strut, leg, foot]);
    }

    return mount;
  },
};
