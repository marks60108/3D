import type { Template } from "./types";
import { num } from "./types";

export const charmPegPanelTemplate: Template = {
  id: "charm-peg-panel",
  name: "[草稿A] 吊飾排勾板",
  description: "背板 + 一排排小掛勾,鑰匙圈掛上去展示。可壁掛或站立。",
  params: [
    { kind: "number", key: "panelWidth", label: "板寬 (X)", min: 60, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "panelHeight", label: "板高 (Y)", min: 60, max: 250, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "panelThickness", label: "背板厚度", min: 2, max: 6, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "cols", label: "掛勾欄數", min: 1, max: 10, step: 1, default: 4 },
    { kind: "number", key: "rows", label: "掛勾列數", min: 1, max: 10, step: 1, default: 4 },
    { kind: "number", key: "margin", label: "邊界留白", min: 5, max: 40, step: 1, default: 15, unit: "mm" },
    { kind: "number", key: "pegLength", label: "掛勾長度", min: 6, max: 20, step: 0.5, default: 12, unit: "mm" },
    { kind: "number", key: "pegDiameter", label: "掛勾桿徑", min: 2, max: 5, step: 0.2, default: 3, unit: "mm" },
    { kind: "number", key: "pegTipDiameter", label: "掛勾頭徑(防滑脫)", min: 3, max: 8, step: 0.2, default: 5.5, unit: "mm" },
  ],
  build: (values, M) => {
    const panelWidth = num(values, "panelWidth");
    const panelHeight = num(values, "panelHeight");
    const panelThickness = num(values, "panelThickness");
    const cols = Math.round(num(values, "cols"));
    const rows = Math.round(num(values, "rows"));
    const margin = num(values, "margin");
    const pegLength = num(values, "pegLength");
    const pegR = num(values, "pegDiameter") / 2;
    const tipR = num(values, "pegTipDiameter") / 2;

    let mount = M.Manifold.cube([panelWidth, panelHeight, panelThickness], false);

    const usableW = panelWidth - 2 * margin;
    const usableH = panelHeight - 2 * margin;
    const stepX = cols > 1 ? usableW / (cols - 1) : 0;
    const stepY = rows > 1 ? usableH / (rows - 1) : 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = margin + c * stepX;
        const cy = margin + r * stepY;
        const shaft = M.Manifold.cylinder(pegLength, pegR, pegR, 20, false).translate([
          cx,
          cy,
          panelThickness,
        ]);
        const tip = M.Manifold.sphere(tipR, 20).translate([cx, cy, panelThickness + pegLength]);
        mount = M.Manifold.union([mount, shaft, tip]);
      }
    }

    return mount;
  },
};
