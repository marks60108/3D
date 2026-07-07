import type { Template } from "./types";
import { num } from "./types";

export const dimmInstallerTemplate: Template = {
  id: "dimm-installer",
  name: "DIMM 記憶體安裝壓桿 RAM Install Bar",
  description:
    "兩端做成卡緣夾槽,直接夾住模組頂邊本身(寬度只比板厚多一點餘裕),只咬住邊緣線、不壓在板面上,避開邊緣附近的電阻/電容。中間整段懸空避開晶片(RCD/資料緩衝晶片常見於模組中央)。預設長度對應 DDR5/DDR4 UDIMM 標準寬度 133.35mm。",
  params: [
    { kind: "number", key: "barLength", label: "壓桿總長(對齊模組頂邊)", min: 60, max: 150, step: 0.05, default: 127, unit: "mm" },
    { kind: "number", key: "endContactWidth", label: "兩端夾槽寬度(沿長度方向)", min: 8, max: 40, step: 1, default: 20, unit: "mm" },
    { kind: "number", key: "pcbThickness", label: "PCB 厚度", min: 0.8, max: 3, step: 0.1, default: 1.2, unit: "mm" },
    { kind: "number", key: "slotClearance", label: "夾槽單邊餘裕", min: 0.1, max: 1, step: 0.05, default: 0.3, unit: "mm" },
    { kind: "number", key: "outerWallThickness", label: "夾爪壁厚", min: 1, max: 6, step: 0.5, default: 2, unit: "mm" },
    { kind: "number", key: "gripDepth", label: "夾爪包覆深度(從邊緣往下)", min: 1.5, max: 10, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "centerClearance", label: "中央懸空淨高(避開晶片)", min: 2, max: 20, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "handleWidth", label: "握把厚度", min: 4, max: 20, step: 0.5, default: 10, unit: "mm" },
    { kind: "number", key: "handleHeight", label: "握把高度", min: 5, max: 40, step: 1, default: 18, unit: "mm" },
  ],
  build: (values, M) => {
    const barLength = num(values, "barLength");
    const endWidth = num(values, "endContactWidth");
    const pcbThickness = num(values, "pcbThickness");
    const slotClearance = num(values, "slotClearance");
    const outerWallThickness = num(values, "outerWallThickness");
    const gripDepth = num(values, "gripDepth");
    const centerClearance = num(values, "centerClearance");
    const handleWidth = num(values, "handleWidth");
    const handleHeight = num(values, "handleHeight");

    const channelWidth = pcbThickness + 2 * slotClearance;
    const totalDepth = channelWidth + 2 * outerWallThickness;
    const bridgeBottomZ = gripDepth + centerClearance;
    const pillarHeight = bridgeBottomZ + handleHeight;
    const bridgeDepthOffset = (totalDepth - handleWidth) / 2;

    const buildPillar = (x: number) => {
      const block = M.Manifold.cube([endWidth, totalDepth, pillarHeight], false).translate([
        x,
        0,
        0,
      ]);
      const slot = M.Manifold.cube(
        [endWidth + 2, channelWidth, gripDepth + 1],
        false
      ).translate([x - 1, outerWallThickness, -1]);
      return block.subtract(slot);
    };

    const leftPillar = buildPillar(0);
    const rightPillar = buildPillar(barLength - endWidth);
    const bridge = M.Manifold.cube([barLength, handleWidth, handleHeight], false).translate([
      0,
      bridgeDepthOffset,
      bridgeBottomZ,
    ]);

    return M.Manifold.union([leftPillar, rightPillar, bridge]);
  },
};
