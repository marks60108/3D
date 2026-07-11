import type { Template } from "./types";
import { num } from "./types";
import type { Manifold, ManifoldToplevel } from "manifold-3d";
import { buildStrut } from "./geo";

function buildTSlotCut(
  M: ManifoldToplevel,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  neckWidth: number,
  neckDepth: number,
  headWidth: number,
  headDepth: number,
  zBase: number
): Manifold {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy) + 6;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const neck = M.Manifold.cube([length, neckWidth, neckDepth], true).translate([
    0,
    0,
    zBase + neckDepth / 2,
  ]);
  const head = M.Manifold.cube([length, headWidth, headDepth], true).translate([
    0,
    0,
    zBase + neckDepth + headDepth / 2,
  ]);

  return M.Manifold.union(neck, head)
    .rotate([0, 0, angleDeg])
    .translate([midX, midY, 0]);
}

export const fanMountFrameTemplate: Template = {
  id: "fan-mount-frame",
  name: "風扇支架骨架(T型滑槽,配合可拆式腳使用) Fan Mount Frame Only",
  description:
    "跟「風扇架高支架」一樣的風扇環+放射連接臂+外框結構,但底部不含固定腳。外框整圈內側做了一條 T 型滑槽(窄頸+寬頭),配合「風扇支架腳(單獨列印)」的卡榫從滑槽任一端滑入,可沿滑槽自由調整位置後卡住,不需要膠也不受固定孔位限制,擺在你的硬體上試好位置再滑到定位即可。",
  params: [
    { kind: "number", key: "fanSize", label: "風扇外框尺寸(正方形邊長)", min: 40, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "holeSpacing", label: "鎖孔中心間距(對邊)", min: 20, max: 240, step: 0.5, default: 105, unit: "mm" },
    { kind: "number", key: "holeDiameter", label: "鎖孔直徑", min: 2, max: 8, step: 0.1, default: 4.3, unit: "mm" },
    { kind: "number", key: "rimWidth", label: "風扇環邊寬度", min: 5, max: 30, step: 0.5, default: 14, unit: "mm" },
    { kind: "number", key: "mountWidth", label: "骨架整體寬度 (X)", min: 40, max: 250, step: 1, default: 130, unit: "mm" },
    { kind: "number", key: "mountDepth", label: "骨架整體深度 (Y)", min: 40, max: 250, step: 1, default: 65, unit: "mm" },
    { kind: "number", key: "strutWidth", label: "放射連接臂寬度", min: 4, max: 25, step: 0.5, default: 10, unit: "mm" },
    { kind: "number", key: "perimeterWidth", label: "外框寬度", min: 6, max: 30, step: 0.5, default: 12, unit: "mm" },
    { kind: "number", key: "frameThickness", label: "風扇環/連接臂厚度", min: 2, max: 10, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "cornerInset", label: "四角端點距骨架邊緣內縮", min: 1, max: 30, step: 0.5, default: 8, unit: "mm" },
    { kind: "number", key: "railThickness", label: "外框滑槽軌道厚度", min: 5, max: 16, step: 0.5, default: 9, unit: "mm" },
    { kind: "number", key: "slotNeckWidth", label: "滑槽頸寬(開口)", min: 2, max: 10, step: 0.2, default: 4, unit: "mm" },
    { kind: "number", key: "slotNeckDepth", label: "滑槽頸深", min: 1, max: 6, step: 0.2, default: 2, unit: "mm" },
    { kind: "number", key: "slotHeadWidth", label: "滑槽頭寬(內部卡住)", min: 4, max: 20, step: 0.2, default: 8, unit: "mm" },
    { kind: "number", key: "slotHeadDepth", label: "滑槽頭深", min: 2, max: 10, step: 0.2, default: 5, unit: "mm" },
    { kind: "number", key: "corner1OffsetX", label: "端點1 X 微調(X-,Y-角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "corner1OffsetY", label: "端點1 Y 微調(X-,Y-角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "corner2OffsetX", label: "端點2 X 微調(X+,Y-角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "corner2OffsetY", label: "端點2 Y 微調(X+,Y-角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "corner3OffsetX", label: "端點3 X 微調(X-,Y+角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "corner3OffsetY", label: "端點3 Y 微調(X-,Y+角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "corner4OffsetX", label: "端點4 X 微調(X+,Y+角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "corner4OffsetY", label: "端點4 Y 微調(X+,Y+角)", min: -60, max: 60, step: 0.5, default: 0, unit: "mm" },
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
    const cornerInset = num(values, "cornerInset");
    const railThickness = num(values, "railThickness");
    const slotNeckWidth = num(values, "slotNeckWidth");
    const slotNeckDepth = Math.min(num(values, "slotNeckDepth"), railThickness - 2.5);
    // The slot head must leave >=1.2mm of rail roof above it, or the T-slot
    // breaks through the top and the legs fall out.
    const slotHeadDepth = Math.min(
      num(values, "slotHeadDepth"),
      railThickness - slotNeckDepth - 1.2
    );
    const slotHeadWidth = Math.min(num(values, "slotHeadWidth"), perimeterWidth - 2);

    const mountCenterX = mountWidth / 2;
    const mountCenterY = mountDepth / 2;
    const zBase = 0;

    const ringOuter = M.Manifold.cube([fanSize, fanSize, frameThickness], true).translate([
      mountCenterX,
      mountCenterY,
      zBase,
    ]);
    const innerOpening = fanSize - 2 * rimWidth;
    const cutout = M.Manifold.cube(
      [innerOpening, innerOpening, frameThickness + 4],
      true
    ).translate([mountCenterX, mountCenterY, zBase - 2]);
    let frame = ringOuter.subtract(cutout);

    const holeHeight = frameThickness + 4;
    const holeOffsets = [-holeSpacing / 2, holeSpacing / 2];
    for (const dx of holeOffsets) {
      for (const dy of holeOffsets) {
        const hole = M.Manifold.cylinder(holeHeight, holeR, holeR, 32, false).translate([
          mountCenterX + dx,
          mountCenterY + dy,
          zBase - 2,
        ]);
        frame = frame.subtract(hole);
      }
    }

    const ringHalf = fanSize / 2;
    const corners = [
      { sx: 1, sy: 1, offsetXKey: "corner1OffsetX", offsetYKey: "corner1OffsetY" },
      { sx: -1, sy: 1, offsetXKey: "corner2OffsetX", offsetYKey: "corner2OffsetY" },
      { sx: 1, sy: -1, offsetXKey: "corner3OffsetX", offsetYKey: "corner3OffsetY" },
      { sx: -1, sy: -1, offsetXKey: "corner4OffsetX", offsetYKey: "corner4OffsetY" },
    ];

    const cornerPositions: [number, number][] = [];

    for (const { sx, sy, offsetXKey, offsetYKey } of corners) {
      const baseX = sx > 0 ? cornerInset : mountWidth - cornerInset;
      const baseY = sy > 0 ? cornerInset : mountDepth - cornerInset;
      const cx = baseX + num(values, offsetXKey);
      const cy = baseY + num(values, offsetYKey);
      cornerPositions.push([cx, cy]);

      const ringCornerX = mountCenterX - sx * ringHalf;
      const ringCornerY = mountCenterY - sy * ringHalf;
      const strut = buildStrut(M, ringCornerX, ringCornerY, cx, cy, strutWidth, frameThickness, zBase);
      frame = M.Manifold.union(frame, strut);
    }

    // Perimeter connecting the 4 corner points in a loop: (X-,Y-) -> (X+,Y-)
    // -> (X+,Y+) -> (X-,Y+) -> back to (X-,Y-). Built taller (railThickness)
    // than the ring/struts so there's room to cut the T-slot into it.
    const loopOrder = [0, 1, 3, 2];
    for (let i = 0; i < loopOrder.length; i++) {
      const [x1, y1] = cornerPositions[loopOrder[i]];
      const [x2, y2] = cornerPositions[loopOrder[(i + 1) % loopOrder.length]];
      const perimeterStrut = buildStrut(M, x1, y1, x2, y2, perimeterWidth, railThickness, zBase);
      frame = M.Manifold.union(frame, perimeterStrut);
    }
    for (let i = 0; i < loopOrder.length; i++) {
      const [x1, y1] = cornerPositions[loopOrder[i]];
      const [x2, y2] = cornerPositions[loopOrder[(i + 1) % loopOrder.length]];
      const slot = buildTSlotCut(
        M,
        x1,
        y1,
        x2,
        y2,
        slotNeckWidth,
        slotNeckDepth,
        slotHeadWidth,
        slotHeadDepth,
        zBase
      );
      frame = frame.subtract(slot);
    }

    return frame;
  },
};
