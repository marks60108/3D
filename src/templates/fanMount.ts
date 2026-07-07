import type { Template } from "./types";
import { num } from "./types";

export const fanMountTemplate: Template = {
  id: "fan-mount",
  name: "風扇架高支架 Fan Riser Mount",
  description: "把方形風扇架高、中間鏤空往下吹的支架,四角有鎖孔可鎖住風扇。",
  params: [
    { kind: "number", key: "fanSize", label: "風扇外框尺寸(正方形邊長)", min: 40, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "holeSpacing", label: "鎖孔中心間距(對邊)", min: 20, max: 240, step: 0.5, default: 105, unit: "mm" },
    { kind: "number", key: "holeDiameter", label: "鎖孔直徑", min: 2, max: 8, step: 0.1, default: 4.3, unit: "mm" },
    { kind: "number", key: "rimWidth", label: "框邊寬度", min: 5, max: 30, step: 0.5, default: 14, unit: "mm" },
    { kind: "number", key: "frameThickness", label: "框厚度", min: 2, max: 10, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "legHeight", label: "架高高度", min: 5, max: 150, step: 1, default: 30, unit: "mm" },
    { kind: "number", key: "legSize", label: "支腳粗細(方形截面)", min: 4, max: 20, step: 0.5, default: 8, unit: "mm" },
    { kind: "number", key: "legInset", label: "支腳距框邊緣內縮", min: 1, max: 20, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "footSize", label: "腳墊尺寸", min: 8, max: 40, step: 1, default: 16, unit: "mm" },
    { kind: "number", key: "footThickness", label: "腳墊厚度", min: 1, max: 8, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "leg1OffsetX", label: "支腳1 X 微調(X-,Y-角)", min: -40, max: 40, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg1OffsetY", label: "支腳1 Y 微調(X-,Y-角)", min: -40, max: 40, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg2OffsetX", label: "支腳2 X 微調(X+,Y-角)", min: -40, max: 40, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg2OffsetY", label: "支腳2 Y 微調(X+,Y-角)", min: -40, max: 40, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg3OffsetX", label: "支腳3 X 微調(X-,Y+角)", min: -40, max: 40, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg3OffsetY", label: "支腳3 Y 微調(X-,Y+角)", min: -40, max: 40, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg4OffsetX", label: "支腳4 X 微調(X+,Y+角)", min: -40, max: 40, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg4OffsetY", label: "支腳4 Y 微調(X+,Y+角)", min: -40, max: 40, step: 0.5, default: 0, unit: "mm" },
  ],
  build: (values, M) => {
    const fanSize = num(values, "fanSize");
    const holeSpacing = num(values, "holeSpacing");
    const holeR = num(values, "holeDiameter") / 2;
    const rimWidth = num(values, "rimWidth");
    const frameThickness = num(values, "frameThickness");
    const legHeight = num(values, "legHeight");
    const legSize = num(values, "legSize");
    const legInset = num(values, "legInset");
    const footSize = num(values, "footSize");
    const footThickness = num(values, "footThickness");

    const center = fanSize / 2;
    const legOverlap = 1;

    const outerFrame = M.Manifold.cube([fanSize, fanSize, frameThickness], false).translate([
      0,
      0,
      legHeight,
    ]);
    const innerOpening = fanSize - 2 * rimWidth;
    const cutout = M.Manifold.cube(
      [innerOpening, innerOpening, frameThickness + 4],
      false
    ).translate([rimWidth, rimWidth, legHeight - 2]);
    let frame = outerFrame.subtract(cutout);

    const holeHeight = frameThickness + 4;
    const holeOffsets = [-holeSpacing / 2, holeSpacing / 2];
    for (const dx of holeOffsets) {
      for (const dy of holeOffsets) {
        const hole = M.Manifold.cylinder(holeHeight, holeR, holeR, 32, false).translate([
          center + dx,
          center + dy,
          legHeight - 2,
        ]);
        frame = frame.subtract(hole);
      }
    }

    const legOffset = legSize / 2 + legInset;
    const corners = [
      { sx: 1, sy: 1, offsetXKey: "leg1OffsetX", offsetYKey: "leg1OffsetY" },
      { sx: -1, sy: 1, offsetXKey: "leg2OffsetX", offsetYKey: "leg2OffsetY" },
      { sx: 1, sy: -1, offsetXKey: "leg3OffsetX", offsetYKey: "leg3OffsetY" },
      { sx: -1, sy: -1, offsetXKey: "leg4OffsetX", offsetYKey: "leg4OffsetY" },
    ];

    let mount = frame;
    for (const { sx, sy, offsetXKey, offsetYKey } of corners) {
      const baseX = sx > 0 ? legOffset : fanSize - legOffset;
      const baseY = sy > 0 ? legOffset : fanSize - legOffset;
      const cx = baseX + num(values, offsetXKey);
      const cy = baseY + num(values, offsetYKey);

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
      mount = M.Manifold.union([mount, leg, foot]);
    }

    return mount;
  },
};
