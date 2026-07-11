import type { Template, ParamValues } from "./types";
import { num, bool } from "./types";
import type { Manifold } from "manifold-3d";
import { rrect, rect, ellipse, rabbitEar, trap, layoutParts } from "./geo";

/* =====================================================================
 * 餐桌椅 Doll High Chair — 分件:背板(兔耳)、座板、左右腳架、餐盤
 * =================================================================== */

export const dollHighChairTemplate: Template = {
  id: "doll-high-chair",
  name: "餐桌椅(兔耳娃娃椅・分件列印) Doll High Chair",
  description:
    "娃娃用餐椅,分 5 件平放列印(全部免支撐),可分色印再組裝:背板(兔耳+橢圓孔)、座板、左右腳架、附圍邊餐盤。卡榫組裝:座板側榫插入腳架槽,背板下榫插入座板後槽,餐盤後臂插入背板孔。想單印某一件換色,把其他件的勾選取消即可。",
  params: [
    { kind: "number", key: "seatWidth", label: "座椅寬度", min: 30, max: 120, step: 1, default: 55, unit: "mm" },
    { kind: "number", key: "seatDepth", label: "座椅深度", min: 25, max: 100, step: 1, default: 45, unit: "mm" },
    { kind: "number", key: "seatHeight", label: "座面高度", min: 20, max: 90, step: 1, default: 42, unit: "mm" },
    { kind: "number", key: "backHeight", label: "背板高度(座面以上)", min: 25, max: 100, step: 1, default: 55, unit: "mm" },
    { kind: "number", key: "panelT", label: "板件厚度", min: 2, max: 6, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "clearance", label: "卡榫餘裕(單邊)", min: 0.1, max: 0.6, step: 0.05, default: 0.25, unit: "mm" },
    { kind: "number", key: "earWidth", label: "兔耳寬度", min: 6, max: 30, step: 0.5, default: 13, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earHeight", label: "兔耳長度", min: 10, max: 60, step: 1, default: 26, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earSpacing", label: "兔耳間距(中心距)", min: 10, max: 80, step: 1, default: 26, unit: "mm", group: "耳朵造型" },
    { kind: "boolean", key: "incBackrest", label: "含背板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSeat", label: "含座板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSides", label: "含左右腳架", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incTray", label: "含餐盤", default: true, group: "分件選擇" },
    { kind: "number", key: "trayDepth", label: "餐盤深度", min: 15, max: 60, step: 1, default: 28, unit: "mm", group: "進階" },
    { kind: "number", key: "trayLift", label: "餐盤高度(座面以上)", min: 8, max: 60, step: 1, default: 22, unit: "mm", group: "進階" },
    { kind: "number", key: "trayRimHeight", label: "餐盤圍邊高度", min: 0, max: 8, step: 0.5, default: 2.5, unit: "mm", group: "進階" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const seatW = num(values, "seatWidth");
    const seatD = num(values, "seatDepth");
    const seatH = num(values, "seatHeight");
    const backH = num(values, "backHeight");
    const t = num(values, "panelT");
    const c = num(values, "clearance");
    const earW = num(values, "earWidth");
    const earH = num(values, "earHeight");
    const earSp = num(values, "earSpacing");
    const trayD = num(values, "trayDepth");
    const trayLift = num(values, "trayLift");
    const trayRimH = num(values, "trayRimHeight");
    const gap = num(values, "layoutGap");

    const tabW = 12; // backrest bottom tabs & seat rear slots
    const tabSp = seatW * 0.5;
    const traySp = seatW * 0.6; // tray arm spacing
    const sideTabD = 14; // seat side tabs (along depth)
    const sideBaseW = seatD + 14;
    const trayW = seatW + 14;
    const armLen = seatD * 0.75;

    const parts: Manifold[] = [];

    if (bool(values, "incBackrest")) {
      let cs = rrect(M, seatW, backH, 10, 0, backH / 2);
      cs = M.CrossSection.union([
        cs,
        rabbitEar(M, earW, earH, -earSp / 2, backH - 6),
        rabbitEar(M, earW, earH, earSp / 2, backH - 6),
        // bottom tabs (insert down into seat rear slots)
        rect(M, tabW, t + 1.2, -tabSp / 2, -(t + 1.2) / 2),
        rect(M, tabW, t + 1.2, tabSp / 2, -(t + 1.2) / 2),
      ]);
      cs = cs
        .subtract(ellipse(M, seatW * 0.24, backH * 0.12, 0, backH - 20))
        // tray arm through-holes
        .subtract(rect(M, tabW + 2 * c, t + 2 * c, -traySp / 2, trayLift))
        .subtract(rect(M, tabW + 2 * c, t + 2 * c, traySp / 2, trayLift));
      parts.push(M.Manifold.extrude(cs, t));
    }

    if (bool(values, "incSeat")) {
      let cs = rrect(M, seatW, seatD, 8);
      cs = M.CrossSection.union([
        cs,
        // side tabs into the leg frames
        rect(M, t + 1.2, sideTabD, -(seatW / 2 + (t + 1.2) / 2), 0),
        rect(M, t + 1.2, sideTabD, seatW / 2 + (t + 1.2) / 2, 0),
      ]);
      cs = cs
        .subtract(rect(M, tabW + 2 * c, t + 2 * c, -tabSp / 2, seatD / 2 - 4))
        .subtract(rect(M, tabW + 2 * c, t + 2 * c, tabSp / 2, seatD / 2 - 4));
      parts.push(M.Manifold.extrude(cs, t));
    }

    if (bool(values, "incSides")) {
      let cs = trap(M, sideBaseW, seatD, seatH, 7);
      // lightweight interior cutout — only when the frame is big enough for
      // the cutout to leave sound borders (skip on tiny chairs)
      if (sideBaseW >= 40 && seatD >= 32 && seatH >= 32) {
        cs = cs.subtract(
          M.CrossSection.hull([
            M.CrossSection.circle(5, 24).translate(-(sideBaseW / 2 - 13), 13),
            M.CrossSection.circle(5, 24).translate(sideBaseW / 2 - 13, 13),
            M.CrossSection.circle(5, 24).translate(seatD / 2 - 13, seatH - 13),
            M.CrossSection.circle(5, 24).translate(-(seatD / 2 - 13), seatH - 13),
          ])
        );
      }
      // seat tab slot near the top edge
      cs = cs.subtract(rect(M, sideTabD + 2 * c, t + 2 * c, 0, seatH - 4.6));
      const side = M.Manifold.extrude(cs, t);
      parts.push(side);
      parts.push(side);
    }

    if (bool(values, "incTray")) {
      let plate = rrect(M, trayW, trayD, 9);
      plate = M.CrossSection.union([
        plate,
        // rear arms ending in tabs that pass through the backrest holes
        rect(M, tabW, armLen + 2, -traySp / 2, trayD / 2 + armLen / 2),
        rect(M, tabW, armLen + 2, traySp / 2, trayD / 2 + armLen / 2),
      ]);
      let tray = M.Manifold.extrude(plate, t);
      if (trayRimH > 0) {
        const rim = rrect(M, trayW, trayD, 9).subtract(rrect(M, trayW - 8, trayD - 8, 6));
        tray = M.Manifold.union(tray, M.Manifold.extrude(rim, t + trayRimH));
      }
      parts.push(tray);
    }

    return layoutParts(M, parts, gap);
  },
};

/* =====================================================================
 * 搖椅 Doll Swing — 分件:頂樑(兔耳+插銷)、左右搖腳、吊桿、座板、固定扣
 * =================================================================== */

export const dollSwingTemplate: Template = {
  id: "doll-swing",
  name: "搖椅(兔耳娃娃鞦韆・分件列印) Doll Swing",
  description:
    "娃娃盪鞦韆搖椅,分件平放列印(全部免支撐),可分色:兔耳頂樑(面上有兩支圓插銷)、左右弧形搖腳(底部圓弧可前後搖)、兩支吊桿、座板、兩個固定扣環。組裝:頂樑兩端榫插入搖腳頂孔;吊桿上端圓孔套進頂樑插銷(可微幅擺動),套上固定扣;吊桿下端榫插入座板槽。",
  params: [
    { kind: "number", key: "frameHeight", label: "搖腳高度", min: 50, max: 160, step: 1, default: 92, unit: "mm" },
    { kind: "number", key: "frameBaseWidth", label: "搖腳底寬", min: 40, max: 120, step: 1, default: 72, unit: "mm" },
    { kind: "number", key: "archSpan", label: "頂樑跨距(兩搖腳間)", min: 50, max: 180, step: 1, default: 92, unit: "mm" },
    { kind: "number", key: "seatWidth", label: "座板寬度", min: 30, max: 100, step: 1, default: 55, unit: "mm" },
    { kind: "number", key: "seatDepth", label: "座板深度", min: 25, max: 80, step: 1, default: 40, unit: "mm" },
    { kind: "number", key: "strapLength", label: "吊桿長度", min: 25, max: 100, step: 1, default: 52, unit: "mm" },
    { kind: "number", key: "panelT", label: "板件厚度", min: 2, max: 6, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "clearance", label: "卡榫餘裕(單邊)", min: 0.1, max: 0.6, step: 0.05, default: 0.25, unit: "mm" },
    { kind: "number", key: "earWidth", label: "兔耳寬度", min: 6, max: 30, step: 0.5, default: 12, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earHeight", label: "兔耳長度", min: 10, max: 50, step: 1, default: 22, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earSpacing", label: "兔耳間距(中心距)", min: 10, max: 60, step: 1, default: 22, unit: "mm", group: "耳朵造型" },
    { kind: "boolean", key: "incArch", label: "含頂樑", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incFrames", label: "含左右搖腳", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incStraps", label: "含吊桿 x2", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSeat", label: "含座板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incCaps", label: "含固定扣 x2", default: true, group: "分件選擇" },
    { kind: "number", key: "rockerRadius", label: "搖腳底弧半徑(越小搖越大)", min: 60, max: 400, step: 5, default: 130, unit: "mm", group: "進階" },
    { kind: "number", key: "pegRadius", label: "插銷半徑", min: 1.5, max: 4, step: 0.1, default: 2.4, unit: "mm", group: "進階" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const frameH = num(values, "frameHeight");
    const frameBaseW = num(values, "frameBaseWidth");
    const archSpan = num(values, "archSpan");
    const seatW = num(values, "seatWidth");
    const seatD = num(values, "seatDepth");
    const strapLen = num(values, "strapLength");
    const t = num(values, "panelT");
    const c = num(values, "clearance");
    const earW = num(values, "earWidth");
    const earH = num(values, "earHeight");
    const earSp = num(values, "earSpacing");
    const rockerR = num(values, "rockerRadius");
    const pegR = num(values, "pegRadius");
    const gap = num(values, "layoutGap");

    const frameTopW = 26;
    const archH = 16;
    const archTabH = 10;
    const strapW = 10;
    const strapTabW = 8;
    const strapSp = Math.min(seatW - 15, archSpan - 20); // hanger spacing

    const parts: Manifold[] = [];

    if (bool(values, "incArch")) {
      let cs = rrect(M, archSpan, archH, 6, 0, archH / 2);
      cs = M.CrossSection.union([
        cs,
        rabbitEar(M, earW, earH, -earSp / 2, archH - 3),
        rabbitEar(M, earW, earH, earSp / 2, archH - 3),
        // end tabs into the rocker frames
        rect(M, t + 1.6, archTabH, -(archSpan / 2 + (t + 1.6) / 2), archH / 2),
        rect(M, t + 1.6, archTabH, archSpan / 2 + (t + 1.6) / 2, archH / 2),
      ]);
      let arch = M.Manifold.extrude(cs, t);
      // face pegs the straps pivot on (short posts, print fine pointing up)
      for (const sx of [-strapSp / 2, strapSp / 2]) {
        arch = M.Manifold.union(
          arch,
          M.Manifold.cylinder(t + 2.2, pegR, pegR, 24).translate([sx, archH / 2, t])
        );
      }
      parts.push(arch);
    }

    if (bool(values, "incFrames")) {
      let cs = trap(M, frameBaseW, frameTopW, frameH, 8);
      // convex rocker bottom: intersect with a big circle resting on y=0
      cs = M.CrossSection.intersection(
        cs,
        M.CrossSection.circle(rockerR, 96).translate(0, rockerR)
      );
      // lightweight interior cutout — only when the frame is big enough for
      // the cutout to leave sound borders (skip on tiny swings)
      if (frameBaseW >= 44 && frameH >= 55) {
        cs = cs.subtract(
          M.CrossSection.hull([
            M.CrossSection.circle(5, 24).translate(-(frameBaseW / 2 - 11), 13),
            M.CrossSection.circle(5, 24).translate(frameBaseW / 2 - 11, 13),
            M.CrossSection.circle(5, 24).translate(frameTopW / 2 - 9, frameH - 24),
            M.CrossSection.circle(5, 24).translate(-(frameTopW / 2 - 9), frameH - 24),
          ])
        );
      }
      // through-hole for the arch end tab
      cs = cs.subtract(rect(M, t + 2 * c, archTabH + 2 * c, 0, frameH - 10));
      const frame = M.Manifold.extrude(cs, t);
      parts.push(frame);
      parts.push(frame);
    }

    if (bool(values, "incStraps")) {
      const headR = strapW * 0.75;
      let cs = M.CrossSection.union([
        rect(M, strapW, strapLen, 0, strapLen / 2),
        M.CrossSection.circle(headR, 32).translate(0, strapLen),
        rect(M, strapTabW, t + 1.4, 0, -(t + 1.4) / 2),
      ]);
      cs = cs.subtract(M.CrossSection.circle(pegR + 0.35, 24).translate(0, strapLen));
      const strap = M.Manifold.extrude(cs, t);
      parts.push(strap);
      parts.push(strap);
    }

    if (bool(values, "incSeat")) {
      let cs = rrect(M, seatW, seatD, 8);
      cs = cs
        .subtract(rect(M, strapTabW + 2 * c, t + 2 * c, -strapSp / 2, 0))
        .subtract(rect(M, strapTabW + 2 * c, t + 2 * c, strapSp / 2, 0));
      parts.push(M.Manifold.extrude(cs, t));
    }

    if (bool(values, "incCaps")) {
      const cap = M.Manifold.extrude(
        M.CrossSection.circle(5.5, 32).subtract(M.CrossSection.circle(pegR + 0.05, 24)),
        2
      );
      parts.push(cap);
      parts.push(cap);
    }

    return layoutParts(M, parts, gap);
  },
};
