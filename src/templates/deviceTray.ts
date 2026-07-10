import type { Template } from "./types";
import { num } from "./types";
import type { Manifold } from "manifold-3d";

export const deviceTrayTemplate: Template = {
  id: "device-tray",
  name: "路由器散熱托盤(M60) Device Cooling Tray",
  description:
    "矮托盤式底座,散熱優先:底部是鏤空格柵(設備架在肋條上,底下留空氣層),四周矮圍邊把設備卡住不滑動,圍邊開通風槽讓側面進氣,中間完全開放。預設尺寸為 D-Link M60 (226.7 x 163.8mm),總高約 10mm。",
  params: [
    { kind: "number", key: "deviceWidth", label: "設備寬度 (X)", min: 40, max: 250, step: 0.5, default: 226.7, unit: "mm" },
    { kind: "number", key: "deviceDepth", label: "設備深度 (Y)", min: 40, max: 250, step: 0.5, default: 163.8, unit: "mm" },
    { kind: "number", key: "fitClearance", label: "放入間隙(每邊)", min: 0.2, max: 3, step: 0.05, default: 0.75, unit: "mm" },
    { kind: "number", key: "wallThickness", label: "圍邊厚度", min: 1.5, max: 6, step: 0.5, default: 2.5, unit: "mm" },
    { kind: "number", key: "totalHeight", label: "托盤總高", min: 5, max: 40, step: 1, default: 10, unit: "mm" },
    { kind: "number", key: "restHeight", label: "設備擱放高度(底下空氣層高)", min: 3, max: 30, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "ribThickness", label: "格柵肋條寬度", min: 1.5, max: 6, step: 0.5, default: 2.5, unit: "mm" },
    { kind: "number", key: "footHeight", label: "腳架高度(0=無腳貼桌;有腳散熱更好但更高)", min: 0, max: 60, step: 1, default: 12, unit: "mm" },
    { kind: "number", key: "footSize", label: "腳粗細(方形截面)", min: 6, max: 30, step: 1, default: 12, unit: "mm" },
    { kind: "number", key: "footInset", label: "腳距外緣內縮", min: 2, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
    { kind: "number", key: "extraFeetPerLongSide", label: "長邊額外加腳(每邊)", min: 0, max: 4, step: 1, default: 1, group: "進階" },
    { kind: "number", key: "ribsAlongDepth", label: "橫向肋條數(跨寬度)", min: 2, max: 12, step: 1, default: 4, group: "進階" },
    { kind: "number", key: "ribsAlongWidth", label: "縱向肋條數(跨深度)", min: 2, max: 16, step: 1, default: 5, group: "進階" },
    { kind: "number", key: "ventCount", label: "圍邊每側通風槽數量", min: 0, max: 12, step: 1, default: 4, group: "進階" },
    { kind: "number", key: "ventWidthRatio", label: "通風槽佔比(0~0.9)", min: 0.1, max: 0.9, step: 0.05, default: 0.55, group: "進階" },
  ],
  build: (values, M) => {
    const deviceWidth = num(values, "deviceWidth");
    const deviceDepth = num(values, "deviceDepth");
    const fitClearance = num(values, "fitClearance");
    const wallThickness = num(values, "wallThickness");
    const totalHeight = num(values, "totalHeight");
    const restHeightRaw = num(values, "restHeight");
    const ribThickness = num(values, "ribThickness");
    const footHeight = num(values, "footHeight");
    const footSize = num(values, "footSize");
    const footInset = num(values, "footInset");
    const extraFeetPerLongSide = Math.round(num(values, "extraFeetPerLongSide"));
    const ribsAlongDepth = Math.round(num(values, "ribsAlongDepth"));
    const ribsAlongWidth = Math.round(num(values, "ribsAlongWidth"));
    const ventCount = Math.round(num(values, "ventCount"));
    const ventWidthRatio = num(values, "ventWidthRatio");

    // Grille tops must sit below the rim so the rim forms a retaining lip.
    const restHeight = Math.min(restHeightRaw, totalHeight - 1);

    const innerW = deviceWidth + 2 * fitClearance;
    const innerD = deviceDepth + 2 * fitClearance;
    const outerW = innerW + 2 * wallThickness;
    const outerD = innerD + 2 * wallThickness;

    // Retaining rim (hollow box).
    const outer = M.Manifold.cube([outerW, outerD, totalHeight], false);
    const cavity = M.Manifold.cube([innerW, innerD, totalHeight + 2], false).translate([
      wallThickness,
      wallThickness,
      -1,
    ]);
    let tray = outer.subtract(cavity);

    // Grille floor: ribs standing from the base to restHeight, the device
    // rests on their tops. Two crossing sets for stiffness; gaps = airflow.
    const ribs: Manifold[] = [];
    for (let i = 0; i < ribsAlongDepth; i++) {
      const cy = wallThickness + ((i + 0.5) * innerD) / ribsAlongDepth;
      ribs.push(
        M.Manifold.cube([innerW, ribThickness, restHeight], false).translate([
          wallThickness,
          cy - ribThickness / 2,
          0,
        ])
      );
    }
    for (let i = 0; i < ribsAlongWidth; i++) {
      const cx = wallThickness + ((i + 0.5) * innerW) / ribsAlongWidth;
      ribs.push(
        M.Manifold.cube([ribThickness, innerD, restHeight], false).translate([
          cx - ribThickness / 2,
          wallThickness,
          0,
        ])
      );
    }
    tray = M.Manifold.union([tray, ...ribs]);

    // Side vent slots through the rim, within the under-device air gap.
    if (ventCount > 0 && ventWidthRatio > 0) {
      const ventZ0 = 1.5;
      const ventZ1 = Math.max(restHeight - 0.5, ventZ0 + 1);
      const ventHeight = ventZ1 - ventZ0;
      const cutDepth = wallThickness + 2;

      const makeVents = (span: number, along: "x" | "y") => {
        const cuts: Manifold[] = [];
        const pitch = span / ventCount;
        const ventLen = pitch * ventWidthRatio;
        for (let i = 0; i < ventCount; i++) {
          const center = (i + 0.5) * pitch;
          if (along === "x") {
            // vents on the front (-Y) and back (+Y) rim walls
            const front = M.Manifold.cube([ventLen, cutDepth, ventHeight], false).translate([
              wallThickness + center - ventLen / 2,
              -1,
              ventZ0,
            ]);
            const back = M.Manifold.cube([ventLen, cutDepth, ventHeight], false).translate([
              wallThickness + center - ventLen / 2,
              outerD - wallThickness - 1,
              ventZ0,
            ]);
            cuts.push(front, back);
          } else {
            // vents on the left (-X) and right (+X) rim walls
            const left = M.Manifold.cube([cutDepth, ventLen, ventHeight], false).translate([
              -1,
              wallThickness + center - ventLen / 2,
              ventZ0,
            ]);
            const right = M.Manifold.cube([cutDepth, ventLen, ventHeight], false).translate([
              outerW - wallThickness - 1,
              wallThickness + center - ventLen / 2,
              ventZ0,
            ]);
            cuts.push(left, right);
          }
        }
        return cuts;
      };

      const allVents = [...makeVents(innerW, "x"), ...makeVents(innerD, "y")];
      for (const v of allVents) tray = tray.subtract(v);
    }

    // Optional feet: lift the whole tray so air can also rise from beneath the
    // grille (better cooling), at the cost of extra height.
    if (footHeight > 0) {
      tray = tray.translate([0, 0, footHeight]);

      const feetY = [footInset + footSize / 2, outerD - footInset - footSize / 2];
      const nAlong = 2 + extraFeetPerLongSide;
      const xStart = footInset + footSize / 2;
      const xEnd = outerW - footInset - footSize / 2;
      const overlap = 0.6;
      const feet: Manifold[] = [];
      for (const fy of feetY) {
        for (let i = 0; i < nAlong; i++) {
          const fx = nAlong > 1 ? xStart + (i * (xEnd - xStart)) / (nAlong - 1) : (xStart + xEnd) / 2;
          feet.push(
            M.Manifold.cube([footSize, footSize, footHeight + overlap], false).translate([
              fx - footSize / 2,
              fy - footSize / 2,
              0,
            ])
          );
        }
      }
      tray = M.Manifold.union([tray, ...feet]);
    }

    return tray;
  },
};
