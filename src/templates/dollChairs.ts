import type { Template, ParamValues } from "./types";
import { num, bool } from "./types";
import type { Manifold } from "manifold-3d";
import { rrect, rect, ellipse, rabbitEar, trap, layoutParts } from "./geo";

/* =====================================================================
 * 餐桌椅 Doll High Chair — 分件:背板(兔耳)、座板、左右腳架、餐盤
 * =================================================================== */

/** A part in its flat (printable) pose plus the rotation+translation that
 * moves it into the assembled chair, so one geometry serves both the print
 * layout and the assembly preview. */
interface AssemblyPart {
  flat: Manifold;
  rot: [number, number, number];
  pos: [number, number, number];
}

export const dollHighChairTemplate: Template = {
  id: "doll-high-chair",
  name: "餐桌椅(兔耳娃娃椅・分件列印) Doll High Chair",
  description:
    "娃娃用餐椅,4 件平放列印(免支撐)可分色組裝:圓弧兔耳背板(橢圓握把孔)、座板、兩支外撇腳、附圍邊餐盤。全部靠榫頭插入座板的槽固定。打開「組裝預覽」可先看組好的樣子確認榫槽對得上,再切回列印排版下載。單印某件換色就把其他件取消勾選。",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "seatWidth", label: "座椅寬度", min: 35, max: 120, step: 1, default: 58, unit: "mm" },
    { kind: "number", key: "seatDepth", label: "座椅深度", min: 30, max: 100, step: 1, default: 48, unit: "mm" },
    { kind: "number", key: "seatHeight", label: "座面高度(腳長)", min: 20, max: 90, step: 1, default: 40, unit: "mm" },
    { kind: "number", key: "backHeight", label: "背板高度(座面以上)", min: 30, max: 100, step: 1, default: 58, unit: "mm" },
    { kind: "number", key: "panelT", label: "板件厚度", min: 2.5, max: 6, step: 0.5, default: 3, unit: "mm" },
    { kind: "number", key: "clearance", label: "卡榫餘裕(單邊,印太緊調大)", min: 0.1, max: 0.6, step: 0.05, default: 0.25, unit: "mm" },
    { kind: "number", key: "earWidth", label: "兔耳寬度", min: 6, max: 30, step: 0.5, default: 15, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earHeight", label: "兔耳長度", min: 10, max: 60, step: 1, default: 28, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earSpacing", label: "兔耳間距(中心距)", min: 10, max: 80, step: 1, default: 30, unit: "mm", group: "耳朵造型" },
    { kind: "boolean", key: "incBackrest", label: "含背板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSeat", label: "含座板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incLegs", label: "含左右腳 x2", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incTray", label: "含餐盤", default: true, group: "分件選擇" },
    { kind: "number", key: "trayDepth", label: "餐盤深度", min: 18, max: 70, step: 1, default: 34, unit: "mm", group: "進階" },
    { kind: "number", key: "trayRimHeight", label: "餐盤圍邊高度", min: 0, max: 8, step: 0.5, default: 3, unit: "mm", group: "進階" },
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
    const trayRimH = num(values, "trayRimHeight");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    // --- joint dimensions (shared between mating parts so they always agree) ---
    const backTabW = Math.min(12, seatW * 0.24);
    const backTabSp = seatW * 0.5;
    const backTabH = t + 4; // protrudes 4mm below the seat once seated
    const legInset = t / 2 + 6; // x of each leg's centre-plane, from seat edge
    const legTabLen = Math.min(seatD * 0.5, seatD - 8);
    const trayTabW = Math.min(11, seatW * 0.22);
    const trayTabSp = seatW * 0.5;
    const trayNotch = 7; // coplanar tongue depth into the seat front edge
    const trayW = seatW * 0.94;
    const rearSlotY = -(seatD / 2 - 7); // rear slot centre (backrest)

    const parts: AssemblyPart[] = [];

    // ---- Backrest: rounded shell + rabbit ears + oval handle hole ----
    if (bool(values, "incBackrest")) {
      let cs = rrect(M, seatW, backH, 12, 0, backH / 2);
      cs = M.CrossSection.union([
        cs,
        rabbitEar(M, earW, earH, -earSp / 2, backH - 7),
        rabbitEar(M, earW, earH, earSp / 2, backH - 7),
        rect(M, backTabW, backTabH, -backTabSp / 2, -backTabH / 2),
        rect(M, backTabW, backTabH, backTabSp / 2, -backTabH / 2),
      ]);
      cs = cs.subtract(ellipse(M, seatW * 0.24, backH * 0.11, 0, backH * 0.6));
      parts.push({
        flat: M.Manifold.extrude(cs, t),
        // stand up (local +Y -> world +Z), tabs drop through the seat rear slots
        rot: [90, 0, 0],
        pos: [0, rearSlotY + t / 2, seatH + t],
      });
    }

    // ---- Seat: hub plate carrying every slot ----
    if (bool(values, "incSeat")) {
      let cs = rrect(M, seatW, seatD, 9);
      // rear slots (backrest tabs, from above)
      cs = cs
        .subtract(rect(M, backTabW + 2 * c, t + 2 * c, -backTabSp / 2, rearSlotY))
        .subtract(rect(M, backTabW + 2 * c, t + 2 * c, backTabSp / 2, rearSlotY));
      // side slots (leg tabs, from below)
      cs = cs
        .subtract(rect(M, t + 2 * c, legTabLen + 2 * c, -(seatW / 2 - legInset), 0))
        .subtract(rect(M, t + 2 * c, legTabLen + 2 * c, seatW / 2 - legInset, 0));
      // front-edge notches (tray tongues, coplanar)
      cs = cs
        .subtract(rect(M, trayTabW + 2 * c, trayNotch * 2, -trayTabSp / 2, seatD / 2))
        .subtract(rect(M, trayTabW + 2 * c, trayNotch * 2, trayTabSp / 2, seatD / 2));
      parts.push({ flat: M.Manifold.extrude(cs, t), rot: [0, 0, 0], pos: [0, 0, seatH] });
    }

    // ---- Legs: two splayed side frames (built in a local depth×height plane) ----
    if (bool(values, "incLegs")) {
      const baseW = seatD + 6;
      const topW = Math.max(seatD - 12, legTabLen + 6);
      let cs = trap(M, baseW, topW, seatH, 6);
      // split the lower half into a front + back leg (inverted-V gap)
      const notchW = baseW * 0.42;
      const notchH = seatH * 0.62;
      cs = cs.subtract(rrect(M, notchW, notchH, Math.min(notchW, notchH) / 2 - 0.5, 0, notchH / 2 - 1));
      // top tab (into seat side slot), flush with seat top
      cs = M.CrossSection.union([cs, rect(M, legTabLen, t + 1, 0, seatH + (t + 1) / 2 - 0.5)]);
      const leg = M.Manifold.extrude(cs, t);
      // local X(depth)->world Y, local Y(height)->world Z, local Z(thick)->world X
      parts.push({ flat: leg, rot: [90, 0, 90], pos: [-(seatW / 2 - legInset) - t / 2, 0, 0] });
      parts.push({ flat: leg, rot: [90, 0, 90], pos: [seatW / 2 - legInset - t / 2, 0, 0] });
    }

    // ---- Tray: rimmed plate that tongues into the seat front edge, coplanar ----
    if (bool(values, "incTray")) {
      let plate = rrect(M, trayW, trayD, 10);
      plate = M.CrossSection.union([
        plate,
        rect(M, trayTabW, trayNotch + 2, -trayTabSp / 2, -(trayD / 2) - (trayNotch + 2) / 2 + 1),
        rect(M, trayTabW, trayNotch + 2, trayTabSp / 2, -(trayD / 2) - (trayNotch + 2) / 2 + 1),
      ]);
      let tray = M.Manifold.extrude(plate, t);
      if (trayRimH > 0) {
        const rim = rrect(M, trayW, trayD, 10).subtract(rrect(M, trayW - 9, trayD - 9, 6));
        tray = M.Manifold.union(tray, M.Manifold.extrude(rim, t + trayRimH));
      }
      parts.push({ flat: tray, rot: [0, 0, 0], pos: [0, seatD / 2 + trayD / 2, seatH] });
    }

    if (assembled) {
      const placed = parts.map((p) => p.flat.rotate(p.rot).translate(p.pos));
      const all = placed.length === 1 ? placed[0] : M.Manifold.union(placed);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, parts.map((p) => p.flat), gap);
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
