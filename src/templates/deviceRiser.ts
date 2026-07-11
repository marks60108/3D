import type { Template } from "./types";
import { num } from "./types";

export const deviceRiserTemplate: Template = {
  id: "device-riser",
  name: "路由器/網通設備托高架 Device Riser",
  description:
    "把方形/長方形設備(路由器、Mesh 節點、機上盒等)架高的開放式框架,中間鏤空不擋設備底部通風孔,四支支腳位置可個別微調以避開障礙物。設備直接放在框上,靠自身重量固定,不需要鎖孔。預設尺寸為 D-Link M60 (226.7 x 163.8mm)。",
  params: [
    { kind: "number", key: "deviceWidth", label: "設備寬度 (X)", min: 40, max: 250, step: 0.5, default: 226.7, unit: "mm" },
    { kind: "number", key: "deviceDepth", label: "設備深度 (Y)", min: 40, max: 250, step: 0.5, default: 163.8, unit: "mm" },
    { kind: "number", key: "rimWidth", label: "框邊寬度", min: 5, max: 40, step: 0.5, default: 15, unit: "mm" },
    { kind: "number", key: "frameThickness", label: "框厚度", min: 2, max: 10, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "legHeight", label: "架高高度", min: 5, max: 150, step: 1, default: 30, unit: "mm" },
    { kind: "number", key: "legSize", label: "支腳粗細(方形截面)", min: 4, max: 20, step: 0.5, default: 10, unit: "mm" },
    { kind: "number", key: "legInset", label: "支腳距框邊緣內縮", min: 1, max: 20, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "footSize", label: "腳墊尺寸", min: 8, max: 40, step: 1, default: 20, unit: "mm" },
    { kind: "number", key: "footThickness", label: "腳墊厚度", min: 1, max: 8, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "leg1OffsetX", label: "支腳1 X 微調(X-,Y-角)", min: -50, max: 50, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg1OffsetY", label: "支腳1 Y 微調(X-,Y-角)", min: -50, max: 50, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg2OffsetX", label: "支腳2 X 微調(X+,Y-角)", min: -50, max: 50, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg2OffsetY", label: "支腳2 Y 微調(X+,Y-角)", min: -50, max: 50, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg3OffsetX", label: "支腳3 X 微調(X-,Y+角)", min: -50, max: 50, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg3OffsetY", label: "支腳3 Y 微調(X-,Y+角)", min: -50, max: 50, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg4OffsetX", label: "支腳4 X 微調(X+,Y+角)", min: -50, max: 50, step: 0.5, default: 0, unit: "mm" },
    { kind: "number", key: "leg4OffsetY", label: "支腳4 Y 微調(X+,Y+角)", min: -50, max: 50, step: 0.5, default: 0, unit: "mm" },
  ],
  build: (values, M) => {
    const width = num(values, "deviceWidth");
    const depth = num(values, "deviceDepth");
    const rimWidth = num(values, "rimWidth");
    const frameThickness = num(values, "frameThickness");
    const legHeight = num(values, "legHeight");
    const legSize = num(values, "legSize");
    const legInset = num(values, "legInset");
    const footSize = num(values, "footSize");
    const footThickness = num(values, "footThickness");

    const legOverlap = 1;

    const outerFrame = M.Manifold.cube([width, depth, frameThickness], false).translate([
      0,
      0,
      legHeight,
    ]);
    const innerW = width - 2 * rimWidth;
    const innerD = depth - 2 * rimWidth;
    const cutout = M.Manifold.cube([innerW, innerD, frameThickness + 4], false).translate([
      rimWidth,
      rimWidth,
      legHeight - 2,
    ]);
    let frame = outerFrame.subtract(cutout);

    const legOffsetX = legSize / 2 + legInset;
    const legOffsetY = legSize / 2 + legInset;
    const corners = [
      { sx: 1, sy: 1, offsetXKey: "leg1OffsetX", offsetYKey: "leg1OffsetY" },
      { sx: -1, sy: 1, offsetXKey: "leg2OffsetX", offsetYKey: "leg2OffsetY" },
      { sx: 1, sy: -1, offsetXKey: "leg3OffsetX", offsetYKey: "leg3OffsetY" },
      { sx: -1, sy: -1, offsetXKey: "leg4OffsetX", offsetYKey: "leg4OffsetY" },
    ];

    let mount = frame;
    const legHalf = legSize / 2;
    // A leg touches the frame only under the rim ring. Moving a corner leg
    // inward on BOTH axes would detach it into a floating part, so if neither
    // axis still overlaps its rim band, pull the closer axis back into contact.
    const inRimBandX = (x: number) => x - legHalf < rimWidth - 1 || x + legHalf > width - rimWidth + 1;
    const inRimBandY = (y: number) => y - legHalf < rimWidth - 1 || y + legHalf > depth - rimWidth + 1;
    for (const { sx, sy, offsetXKey, offsetYKey } of corners) {
      const baseX = sx > 0 ? legOffsetX : width - legOffsetX;
      const baseY = sy > 0 ? legOffsetY : depth - legOffsetY;
      let cx = baseX + num(values, offsetXKey);
      let cy = baseY + num(values, offsetYKey);
      if (!inRimBandX(cx) && !inRimBandY(cy)) {
        const snapX = sx > 0 ? rimWidth - 1 + legHalf - 2 : width - rimWidth + 1 - legHalf + 2;
        const snapY = sy > 0 ? rimWidth - 1 + legHalf - 2 : depth - rimWidth + 1 - legHalf + 2;
        if (Math.abs(cx - snapX) <= Math.abs(cy - snapY)) cx = snapX;
        else cy = snapY;
      }

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
