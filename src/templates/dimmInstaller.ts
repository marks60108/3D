import type { Template } from "./types";
import { num } from "./types";
import type { Manifold, ManifoldToplevel } from "manifold-3d";

/** Subtracts a right-triangle chamfer (leg length = size) from an edge
 * running along X, at the given Y/Z corner. */
function chamferEdgeAlongX(
  M: ManifoldToplevel,
  xMin: number,
  xMax: number,
  y: number,
  z: number,
  size: number
): Manifold {
  const s = size / Math.SQRT2;
  const length = xMax - xMin + 4;
  const midX = (xMin + xMax) / 2;
  return M.Manifold.cube([length, 2 * s, 2 * s], true)
    .rotate([45, 0, 0])
    .translate([midX, y, z]);
}

/** Subtracts a right-triangle chamfer (leg length = size) from an edge
 * running along Y, at the given X/Z corner. */
function chamferEdgeAlongY(
  M: ManifoldToplevel,
  yMin: number,
  yMax: number,
  x: number,
  z: number,
  size: number
): Manifold {
  const s = size / Math.SQRT2;
  const length = yMax - yMin + 4;
  const midY = (yMin + yMax) / 2;
  return M.Manifold.cube([2 * s, length, 2 * s], true)
    .rotate([0, 45, 0])
    .translate([x, midY, z]);
}

export const dimmInstallerTemplate: Template = {
  id: "dimm-installer",
  name: "DIMM 記憶體安裝壓桿 RAM Install Bar (JEDEC MO-329)",
  description:
    "針對 DDR5 RDIMM 8000 / MRDIMM 12800(JEDEC MO-329)高密度伺服器記憶體重新設計。只在最左右兩端各 10mm 的安全區(頂邊裸 PCB)接觸,中間 113.8mm 完全鏤空避開 PMIC/RCD/3DS 堆疊晶片,兩端底部另有下沉端蓋防止施力時左右滑動。握把頂部邊緣做斜切(45°)去銳邊,逼近圓角手感。",
  params: [
    { kind: "number", key: "mainBodyLength", label: "主體長度", min: 60, max: 200, step: 0.05, default: 142, unit: "mm" },
    { kind: "number", key: "mainBodyWidth", label: "主體寬度", min: 4, max: 20, step: 0.1, default: 10, unit: "mm" },
    { kind: "number", key: "mainBodyHeight", label: "主體高度", min: 4, max: 20, step: 0.1, default: 10, unit: "mm" },
    { kind: "number", key: "handleLength", label: "握把長度", min: 20, max: 150, step: 1, default: 90, unit: "mm" },
    { kind: "number", key: "handleWidth", label: "握把寬度", min: 6, max: 30, step: 0.5, default: 16, unit: "mm" },
    { kind: "number", key: "handleHeight", label: "握把高度", min: 5, max: 50, step: 0.5, default: 25, unit: "mm" },
    { kind: "number", key: "handleChamfer", label: "握把頂邊斜切量(逼近 R3 圓角)", min: 0, max: 8, step: 0.1, default: 3, unit: "mm" },
    { kind: "number", key: "innerPocketLength", label: "內側口袋總長(對齊 DIMM 長度+公差)", min: 40, max: 195, step: 0.05, default: 133.8, unit: "mm" },
    { kind: "number", key: "slotLength", label: "兩端夾持槽長度", min: 4, max: 30, step: 0.5, default: 10, unit: "mm" },
    { kind: "number", key: "slotWidth", label: "夾持槽寬度(PCB 厚度+公差)", min: 0.8, max: 4, step: 0.05, default: 1.5, unit: "mm" },
    { kind: "number", key: "slotDepth", label: "夾持槽深度", min: 1, max: 8, step: 0.1, default: 3, unit: "mm" },
    { kind: "number", key: "centerClearanceDepth", label: "中央鏤空深度(晶片安全淨空)", min: 2, max: 10, step: 0.1, default: 4, unit: "mm" },
    { kind: "number", key: "endCapDepth", label: "端蓋下沉深度(防滑)", min: 0, max: 15, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "endCapThickness", label: "端蓋厚度", min: 1, max: 8, step: 0.5, default: 3, unit: "mm" },
  ],
  build: (values, M) => {
    const mainBodyLength = num(values, "mainBodyLength");
    const mainBodyWidth = num(values, "mainBodyWidth");
    const mainBodyHeight = num(values, "mainBodyHeight");
    const handleLength = num(values, "handleLength");
    const handleWidth = num(values, "handleWidth");
    const handleHeight = num(values, "handleHeight");
    const handleChamfer = num(values, "handleChamfer");
    const innerPocketLength = num(values, "innerPocketLength");
    const slotLength = num(values, "slotLength");
    const slotWidth = num(values, "slotWidth");
    const slotDepth = num(values, "slotDepth");
    const centerClearanceDepth = num(values, "centerClearanceDepth");
    const endCapDepth = num(values, "endCapDepth");
    const endCapThickness = num(values, "endCapThickness");

    // --- Main body (pressing plane at Z=0, top at Z=mainBodyHeight) ---
    let body = M.Manifold.cube([mainBodyLength, mainBodyWidth, mainBodyHeight], false);

    // --- Handle, centered on top of the main body ---
    const handleX0 = (mainBodyLength - handleLength) / 2;
    const handleY0 = (mainBodyWidth - handleWidth) / 2;
    const handleZ0 = mainBodyHeight;
    const handleZTop = handleZ0 + handleHeight;
    let handle = M.Manifold.cube([handleLength, handleWidth, handleHeight], false).translate([
      handleX0,
      handleY0,
      handleZ0,
    ]);

    if (handleChamfer > 0) {
      const cutX1 = chamferEdgeAlongX(
        M,
        handleX0,
        handleX0 + handleLength,
        handleY0,
        handleZTop,
        handleChamfer
      );
      const cutX2 = chamferEdgeAlongX(
        M,
        handleX0,
        handleX0 + handleLength,
        handleY0 + handleWidth,
        handleZTop,
        handleChamfer
      );
      const cutY1 = chamferEdgeAlongY(
        M,
        handleY0,
        handleY0 + handleWidth,
        handleX0,
        handleZTop,
        handleChamfer
      );
      const cutY2 = chamferEdgeAlongY(
        M,
        handleY0,
        handleY0 + handleWidth,
        handleX0 + handleLength,
        handleZTop,
        handleChamfer
      );
      handle = handle.subtract(M.Manifold.union([cutX1, cutX2, cutY1, cutY2]));
    }

    body = M.Manifold.union(body, handle);

    // --- Pressing slots at the far left/right of the inner pocket ---
    const pocketMargin = (mainBodyLength - innerPocketLength) / 2;
    const pocketStart = pocketMargin;
    const pocketEnd = mainBodyLength - pocketMargin;
    const slotY0 = (mainBodyWidth - slotWidth) / 2;

    const leftSlot = M.Manifold.cube([slotLength, slotWidth, slotDepth + 1], false).translate([
      pocketStart,
      slotY0,
      -0.5,
    ]);
    const rightSlot = M.Manifold.cube([slotLength, slotWidth, slotDepth + 1], false).translate([
      pocketEnd - slotLength,
      slotY0,
      -0.5,
    ]);
    body = body.subtract(leftSlot).subtract(rightSlot);

    // --- Center clearance zone: fully open across the whole width ---
    const clearStart = pocketStart + slotLength;
    const clearEnd = pocketEnd - slotLength;
    const clearLength = clearEnd - clearStart;
    if (clearLength > 0) {
      const clearCut = M.Manifold.cube(
        [clearLength, mainBodyWidth + 2, centerClearanceDepth + 1],
        false
      ).translate([clearStart, -1, -0.5]);
      body = body.subtract(clearCut);
    }

    // --- Side end-caps: guard walls dropping below the pressing plane ---
    if (endCapDepth > 0) {
      const leftCap = M.Manifold.cube([endCapThickness, mainBodyWidth, endCapDepth], false).translate([
        pocketStart,
        0,
        -endCapDepth,
      ]);
      const rightCap = M.Manifold.cube([endCapThickness, mainBodyWidth, endCapDepth], false).translate([
        pocketEnd - endCapThickness,
        0,
        -endCapDepth,
      ]);
      body = M.Manifold.union([body, leftCap, rightCap]);
    }

    return body;
  },
};
