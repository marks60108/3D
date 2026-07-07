import type { Template } from "./types";
import { num } from "./types";

export const dimmInstallerTemplate: Template = {
  id: "dimm-installer",
  name: "DIMM 記憶體安裝壓桿 RAM Install Bar",
  description:
    "只在模組兩端角落施力的壓桿,中間整段懸空避開晶片(RCD/資料緩衝晶片常見於模組中央,RDIMM/MRDIMM 尤其密集),雙手或手掌均勻下壓就能把兩端同時壓進插槽。預設長度對應 DDR5/DDR4 UDIMM 標準寬度 133.35mm。",
  params: [
    { kind: "number", key: "barLength", label: "壓桿總長(對齊模組頂邊)", min: 60, max: 150, step: 0.05, default: 127, unit: "mm" },
    { kind: "number", key: "endContactWidth", label: "兩端接觸墊寬度", min: 8, max: 40, step: 1, default: 20, unit: "mm" },
    { kind: "number", key: "contactDepth", label: "接觸面深度(前後方向)", min: 4, max: 15, step: 0.5, default: 8, unit: "mm" },
    { kind: "number", key: "contactHeight", label: "接觸墊厚度", min: 2, max: 8, step: 0.5, default: 4, unit: "mm" },
    { kind: "number", key: "centerClearance", label: "中央懸空淨高(避開晶片)", min: 2, max: 20, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "handleWidth", label: "握把厚度", min: 4, max: 20, step: 0.5, default: 10, unit: "mm" },
    { kind: "number", key: "handleHeight", label: "握把高度", min: 5, max: 40, step: 1, default: 18, unit: "mm" },
  ],
  build: (values, M) => {
    const barLength = num(values, "barLength");
    const endWidth = num(values, "endContactWidth");
    const contactDepth = num(values, "contactDepth");
    const contactHeight = num(values, "contactHeight");
    const centerClearance = num(values, "centerClearance");
    const handleWidth = num(values, "handleWidth");
    const handleHeight = num(values, "handleHeight");

    const bridgeBottomZ = contactHeight + centerClearance;
    const pillarHeight = bridgeBottomZ + handleHeight;
    const bridgeDepthOffset = (contactDepth - handleWidth) / 2;

    const leftPillar = M.Manifold.cube([endWidth, contactDepth, pillarHeight], false);
    const rightPillar = M.Manifold.cube([endWidth, contactDepth, pillarHeight], false).translate([
      barLength - endWidth,
      0,
      0,
    ]);
    const bridge = M.Manifold.cube([barLength, handleWidth, handleHeight], false).translate([
      0,
      bridgeDepthOffset,
      bridgeBottomZ,
    ]);

    return M.Manifold.union([leftPillar, rightPillar, bridge]);
  },
};
