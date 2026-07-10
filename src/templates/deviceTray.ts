import type { Template } from "./types";
import { num } from "./types";
import type { Manifold } from "manifold-3d";

export const deviceTrayTemplate: Template = {
  id: "device-tray",
  name: "路由器散熱托盤(M60) Device Cooling Tray",
  description:
    "托盤式底座,散熱優先且免支撐:底部是鏤空格柵(設備架在肋條上),圍邊與格柵直接落到桌面、側邊開大通風窗,設備被墊高、空氣從側面進來往上流。因為整個結構都是垂直的牆,沒有懸空面,列印不需要支撐。預設尺寸為 D-Link M60 (226.7 x 163.8mm)。「架高高度」設 0 就是貼桌矮托盤。",
  params: [
    { kind: "number", key: "deviceWidth", label: "設備寬度 (X)", min: 40, max: 250, step: 0.5, default: 226.7, unit: "mm" },
    { kind: "number", key: "deviceDepth", label: "設備深度 (Y)", min: 40, max: 250, step: 0.5, default: 163.8, unit: "mm" },
    { kind: "number", key: "fitClearance", label: "放入間隙(每邊)", min: 0.2, max: 3, step: 0.05, default: 0.75, unit: "mm" },
    { kind: "number", key: "wallThickness", label: "圍邊厚度", min: 1.5, max: 6, step: 0.5, default: 2.5, unit: "mm" },
    { kind: "number", key: "bodyHeight", label: "托盤本體高度(圍邊,含卡榫唇)", min: 5, max: 40, step: 1, default: 10, unit: "mm" },
    { kind: "number", key: "restHeight", label: "設備擱放高度(本體內空氣層)", min: 3, max: 30, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "liftHeight", label: "架高高度(0=貼桌;越高散熱越好,免支撐)", min: 0, max: 80, step: 1, default: 12, unit: "mm" },
    { kind: "number", key: "ribThickness", label: "格柵肋條寬度", min: 1.5, max: 6, step: 0.5, default: 2.5, unit: "mm" },
    { kind: "number", key: "ribsAlongDepth", label: "橫向肋條數(跨寬度)", min: 2, max: 12, step: 1, default: 4, group: "進階" },
    { kind: "number", key: "ribsAlongWidth", label: "縱向肋條數(跨深度)", min: 2, max: 16, step: 1, default: 5, group: "進階" },
    { kind: "number", key: "ventCount", label: "圍邊每側通風窗數量", min: 0, max: 12, step: 1, default: 4, group: "進階" },
    { kind: "number", key: "ventWidthRatio", label: "通風窗佔比(0~0.9)", min: 0.1, max: 0.9, step: 0.05, default: 0.6, group: "進階" },
  ],
  build: (values, M) => {
    const deviceWidth = num(values, "deviceWidth");
    const deviceDepth = num(values, "deviceDepth");
    const fitClearance = num(values, "fitClearance");
    const wallThickness = num(values, "wallThickness");
    const bodyHeight = num(values, "bodyHeight");
    const restHeightRaw = num(values, "restHeight");
    const liftHeight = num(values, "liftHeight");
    const ribThickness = num(values, "ribThickness");
    const ribsAlongDepth = Math.round(num(values, "ribsAlongDepth"));
    const ribsAlongWidth = Math.round(num(values, "ribsAlongWidth"));
    const ventCount = Math.round(num(values, "ventCount"));
    const ventWidthRatio = num(values, "ventWidthRatio");

    // The device rests on the grille tops; the rim rises above that to form a
    // retaining lip. Everything grows from the floor (z=0) so there are no
    // floating undersides — the whole part prints without supports.
    const restTop = Math.min(restHeightRaw, bodyHeight - 1) + liftHeight;
    const rimTop = bodyHeight + liftHeight;

    const innerW = deviceWidth + 2 * fitClearance;
    const innerD = deviceDepth + 2 * fitClearance;
    const outerW = innerW + 2 * wallThickness;
    const outerD = innerD + 2 * wallThickness;

    // Retaining rim (hollow box, full height to the floor).
    const outer = M.Manifold.cube([outerW, outerD, rimTop], false);
    const cavity = M.Manifold.cube([innerW, innerD, rimTop + 2], false).translate([
      wallThickness,
      wallThickness,
      -1,
    ]);
    let tray = outer.subtract(cavity);

    // Grille ribs: vertical walls from the floor up to restTop. The device sits
    // on their top edges; the gaps between them carry airflow up.
    const ribs: Manifold[] = [];
    for (let i = 0; i < ribsAlongDepth; i++) {
      const cy = wallThickness + ((i + 0.5) * innerD) / ribsAlongDepth;
      ribs.push(
        M.Manifold.cube([innerW, ribThickness, restTop], false).translate([
          wallThickness,
          cy - ribThickness / 2,
          0,
        ])
      );
    }
    for (let i = 0; i < ribsAlongWidth; i++) {
      const cx = wallThickness + ((i + 0.5) * innerW) / ribsAlongWidth;
      ribs.push(
        M.Manifold.cube([ribThickness, innerD, restTop], false).translate([
          cx - ribThickness / 2,
          wallThickness,
          0,
        ])
      );
    }
    tray = M.Manifold.union([tray, ...ribs]);

    // Side vent windows through the rim, spanning the skirt below the device.
    // The window tops are short bridges (window width), which FDM prints
    // support-free.
    if (ventCount > 0 && ventWidthRatio > 0) {
      const ventZ0 = 1.5;
      const ventZ1 = Math.max(restTop - 0.5, ventZ0 + 1);
      const ventHeight = ventZ1 - ventZ0;
      const cutDepth = wallThickness + 2;

      const makeVents = (span: number, along: "x" | "y") => {
        const cuts: Manifold[] = [];
        const pitch = span / ventCount;
        const ventLen = pitch * ventWidthRatio;
        for (let i = 0; i < ventCount; i++) {
          const center = (i + 0.5) * pitch;
          if (along === "x") {
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

    return tray;
  },
};
