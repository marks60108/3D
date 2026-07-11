import type { Template } from "./types";
import { num } from "./types";
import { buildStrut } from "./geo";

export const fanMountReinforcedTemplate: Template = {
  id: "fan-mount-reinforced",
  name: "風扇架高支架(強化外框版) Fan Riser Mount + Perimeter",
  description:
    "跟「風扇架高支架」一樣的蜘蛛式結構(風扇鎖孔環透過連接臂延伸到外圍支撐腳,支架跨距可獨立放大),額外沿支撐腳外圍加一圈細框把 4 支腳彼此連起來,加強整體剛性、減少大跨距時搖晃,外框寬度可自行調整,幾乎不犧牲中間通風面積。",
  params: [
    { kind: "number", key: "fanSize", label: "風扇外框尺寸(正方形邊長)", min: 40, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "holeSpacing", label: "鎖孔中心間距(對邊)", min: 20, max: 240, step: 0.5, default: 105, unit: "mm" },
    { kind: "number", key: "holeDiameter", label: "鎖孔直徑", min: 2, max: 8, step: 0.1, default: 4.3, unit: "mm" },
    { kind: "number", key: "rimWidth", label: "風扇環邊寬度", min: 5, max: 30, step: 0.5, default: 14, unit: "mm" },
    { kind: "number", key: "mountWidth", label: "支架整體寬度 (X,跨支撐腳)", min: 40, max: 250, step: 1, default: 160, unit: "mm" },
    { kind: "number", key: "mountDepth", label: "支架整體深度 (Y,跨支撐腳)", min: 40, max: 250, step: 1, default: 160, unit: "mm" },
    { kind: "number", key: "strutWidth", label: "放射連接臂寬度", min: 4, max: 25, step: 0.5, default: 10, unit: "mm" },
    { kind: "number", key: "perimeterWidth", label: "外框寬度(強化用)", min: 3, max: 25, step: 0.5, default: 8, unit: "mm" },
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
    const perimeterWidth = num(values, "perimeterWidth");
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

    const legPositions: [number, number][] = [];

    for (const { sx, sy, offsetXKey, offsetYKey } of corners) {
      const baseX = sx > 0 ? legOffset : mountWidth - legOffset;
      const baseY = sy > 0 ? legOffset : mountDepth - legOffset;
      const cx = baseX + num(values, offsetXKey);
      const cy = baseY + num(values, offsetYKey);
      legPositions.push([cx, cy]);

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

    // Perimeter frame connecting the 4 legs in a loop: corner order is
    // (X-,Y-) -> (X+,Y-) -> (X+,Y+) -> (X-,Y+) -> back to (X-,Y-).
    const loopOrder = [0, 1, 3, 2];
    for (let i = 0; i < loopOrder.length; i++) {
      const [x1, y1] = legPositions[loopOrder[i]];
      const [x2, y2] = legPositions[loopOrder[(i + 1) % loopOrder.length]];
      const perimeterStrut = buildStrut(
        M,
        x1,
        y1,
        x2,
        y2,
        perimeterWidth,
        frameThickness,
        legHeight
      );
      mount = M.Manifold.union(mount, perimeterStrut);
    }

    return mount;
  },
};
