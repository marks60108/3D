import type { Template } from "./types";
import { num, bool } from "./types";

export const charmPegPanelTemplate: Template = {
  id: "charm-peg-panel",
  name: "吊飾排勾展示板(可組合) Charm Display Panel",
  description:
    "背板 + 一排排小掛勾,鑰匙圈掛上去展示。右邊/上邊有卡榫凸點,左邊/下邊有對應凹槽,同一個檔案印多片就能左右上下拼接成一大片牆面,收藏變多直接再印一片接上去。",
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
    { kind: "boolean", key: "enableConnectors", label: "啟用拼接卡榫", default: true },
    { kind: "number", key: "tabsPerEdge", label: "每邊卡榫數量", min: 1, max: 4, step: 1, default: 2 },
    { kind: "number", key: "tabWidth", label: "卡榫寬度", min: 6, max: 30, step: 1, default: 14, unit: "mm" },
    { kind: "number", key: "tabDepth", label: "卡榫凸出深度", min: 2, max: 8, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "tabClearance", label: "凹槽餘裕(單邊)", min: 0.1, max: 0.8, step: 0.05, default: 0.3, unit: "mm" },
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

    let panel = M.Manifold.cube([panelWidth, panelHeight, panelThickness], false);

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
        panel = M.Manifold.union([panel, shaft, tip]);
      }
    }

    if (!bool(values, "enableConnectors")) return panel;

    const tabsPerEdge = Math.round(num(values, "tabsPerEdge"));
    const tabWidth = num(values, "tabWidth");
    const tabDepth = num(values, "tabDepth");
    const clearance = num(values, "tabClearance");
    const slotWidth = tabWidth + 2 * clearance;
    const slotDepth = tabDepth + clearance;

    const edgePositions = (span: number) => {
      const usable = span - 2 * margin;
      const step = tabsPerEdge > 1 ? usable / (tabsPerEdge - 1) : 0;
      const positions: number[] = [];
      // Keep whole tabs/slots on the edge — a tab wider than the margin would
      // otherwise hang past the panel corner.
      const lo = slotWidth / 2 + 1;
      const hi = span - slotWidth / 2 - 1;
      for (let i = 0; i < tabsPerEdge; i++) {
        positions.push(Math.max(lo, Math.min(margin + i * step, hi)));
      }
      return positions;
    };

    // Tabs (male) on the +X and +Y edges.
    for (const cy of edgePositions(panelHeight)) {
      const tab = M.Manifold.cube([tabDepth, tabWidth, panelThickness], false).translate([
        panelWidth,
        cy - tabWidth / 2,
        0,
      ]);
      panel = M.Manifold.union(panel, tab);
    }
    for (const cx of edgePositions(panelWidth)) {
      const tab = M.Manifold.cube([tabWidth, tabDepth, panelThickness], false).translate([
        cx - tabWidth / 2,
        panelHeight,
        0,
      ]);
      panel = M.Manifold.union(panel, tab);
    }

    // Matching slots (female) on the -X and -Y edges.
    for (const cy of edgePositions(panelHeight)) {
      const slot = M.Manifold.cube(
        [slotDepth + 1, slotWidth, panelThickness + 2],
        false
      ).translate([-1, cy - slotWidth / 2, -1]);
      panel = panel.subtract(slot);
    }
    for (const cx of edgePositions(panelWidth)) {
      const slot = M.Manifold.cube(
        [slotWidth, slotDepth + 1, panelThickness + 2],
        false
      ).translate([cx - slotWidth / 2, -1, -1]);
      panel = panel.subtract(slot);
    }

    return panel;
  },
};
