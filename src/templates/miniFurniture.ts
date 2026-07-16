import type { Template, ParamValues } from "./types";
import { num, bool } from "./types";
import type { Manifold } from "manifold-3d";
import { rrect, rect, layoutParts } from "./geo";

/* =====================================================================
 * 原創迷你家具系列 Original Mini Furniture — 北歐簡約風,無角色/無IP,
 * 適合商業販售。第一款:床(平台+側邊圍板+床頭/床尾板,方形鍵榫組裝)。
 * =================================================================== */

export const miniBedTemplate: Template = {
  id: "mini-bed",
  name: "迷你床(原創北歐簡約風) Mini Doll Bed",
  description:
    "原創設計的娃娃迷你床,無角色/無版權疑慮,可商用販售。北歐簡約風:床頭板/床尾板頂端圓角、三個圓孔裝飾;床墊平台兩側有微凸圍邊;四支簡約錐形腳,方形鍵榫插進平台底部插孔(方形防轉,不會裝歪)。可選床尾板(較矮)。預設給 10cm 高娃娃躺(床內長 ~140mm)。打開「組裝預覽」看組好樣子,關掉排成一盤列印,全部平放/直立、免支撐。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "bedLen", label: "床鋪長度", min: 80, max: 220, step: 1, default: 140, unit: "mm" },
    { kind: "number", key: "bedWid", label: "床鋪寬度", min: 50, max: 140, step: 1, default: 90, unit: "mm" },
    { kind: "number", key: "legH", label: "床腳高度", min: 10, max: 50, step: 1, default: 22, unit: "mm" },
    { kind: "number", key: "headboardH", label: "床頭板高度(床面以上)", min: 20, max: 90, step: 1, default: 46, unit: "mm" },
    { kind: "number", key: "footboardH", label: "床尾板高度(床面以上)", min: 10, max: 60, step: 1, default: 24, unit: "mm" },
    { kind: "number", key: "panelT", label: "板件厚度", min: 4, max: 9, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "clearance", label: "鍵榫餘裕(單邊,緊配0.1;太緊插不進就調大)", min: 0.05, max: 0.4, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "boolean", key: "incPlatform", label: "含床墊平台", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incLegs", label: "含四支床腳", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incHeadboard", label: "含床頭板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incFootboard", label: "含床尾板", default: true, group: "分件選擇" },
    { kind: "number", key: "cutoutR", label: "裝飾圓孔大小", min: 3, max: 14, step: 0.5, default: 7, unit: "mm", group: "裝飾" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const bedLen = num(values, "bedLen");
    const bedWid = num(values, "bedWid");
    const legH = num(values, "legH");
    const headboardH = num(values, "headboardH");
    const footboardH = num(values, "footboardH");
    const t = num(values, "panelT");
    const c = num(values, "clearance");
    const cutoutR = num(values, "cutoutR");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    const platformBotZ = legH;
    const platformTopZ = legH + t;

    // --- leg joint: keyed SQUARE peg into a matching socket, so legs never
    // rotate askew (same anti-rotation principle as the doll chair's tenon) ---
    const pegSide = Math.min(8, Math.min(bedLen, bedWid) * 0.05 + 4);
    const pegInsert = Math.max(3, t - 1.5); // blind hole — never breaks through the top
    const jointX = Math.max(10, bedWid / 2 - 12);
    const jointY = Math.max(12, bedLen / 2 - 16);

    // --- headboard/footboard: flat panel with an integral bottom tenon that
    // drops into a slot cut through the platform ---
    const tenonW = Math.min(bedWid * 0.5, bedWid - 16);
    const tenonH = t + 4;
    const headSlotY = bedLen / 2 - 6;
    const footSlotY = -(bedLen / 2 - 6);

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    // ===================== Platform: mattress slab with raised side rails ====
    if (bool(values, "incPlatform")) {
      let plate = M.Manifold.extrude(rrect(M, bedWid, bedLen, 12), t).translate([0, 0, platformBotZ]);

      // raised side rails on the two long edges only (keeps head/foot ends
      // clear so the headboard/footboard slots cut cleanly through)
      // stop the rails well clear of the head/foot panel zones (each panel
      // occupies a Y-band of width t centered on its slot) so they can never
      // collide, regardless of how the length/panel params are tuned
      const railHalfLen = Math.max(
        6,
        Math.min(headSlotY, -footSlotY) - t / 2 - 4
      );
      const railW = 5;
      for (const sx of [-1, 1]) {
        plate = M.Manifold.union(
          plate,
          M.Manifold.cube([railW, railHalfLen * 2, 4], true).translate([
            sx * (bedWid / 2 - railW / 2 - 1),
            0,
            platformTopZ + 2,
          ])
        );
      }

      // four leg sockets (square, keyed) on the underside
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const sock = M.Manifold.extrude(rect(M, pegSide + 2 * c, pegSide + 2 * c), pegInsert + 0.2).translate([
            sx * jointX,
            sy * jointY,
            platformBotZ - 0.1,
          ]);
          plate = plate.subtract(sock);
        }

      // head/foot slots for the panel tenons (through-cuts) — cut unconditionally
      // whenever the platform exists, regardless of the board's own toggle, so
      // the platform's own geometry never depends on which OTHER parts are
      // selected (matches the doll-chair mortise convention)
      {
        plate = plate.subtract(
          M.Manifold.extrude(rect(M, tenonW + 2 * c, t + 2 * c), t + 1)
            .translate([0, headSlotY, platformBotZ - 0.5])
        );
      }
      {
        plate = plate.subtract(
          M.Manifold.extrude(rect(M, tenonW + 2 * c, t + 2 * c), t + 1)
            .translate([0, footSlotY, platformBotZ - 0.5])
        );
      }

      add(plate, plate); // prints as-is: flat, rails up, no overhang
    }

    // ===================== Legs: 4 independent tapered legs + square peg =====
    if (bool(values, "incLegs")) {
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const body = M.Manifold.cylinder(legH, 4.2, 3.2, 32);
          const peg = M.Manifold.extrude(rect(M, pegSide, pegSide), pegInsert).translate([0, 0, legH]);
          const leg = M.Manifold.union(body, peg).translate([sx * jointX, sy * jointY, 0]);
          add(leg, leg); // already stands on its own base — prints as-is
        }
    }

    // ===================== Headboard =====================
    if (bool(values, "incHeadboard")) {
      const bodyR = Math.min(headboardH * 0.4, bedWid * 0.42);
      let cs = rrect(M, bedWid * 0.94, headboardH, bodyR, 0, headboardH / 2);
      cs = M.CrossSection.union([cs, rect(M, tenonW, tenonH, 0, -tenonH / 2)]);
      const holeSp = bedWid * 0.94 * 0.28;
      for (const hx of [-holeSp, 0, holeSp]) {
        cs = cs.subtract(M.CrossSection.circle(cutoutR, 32).translate(hx, headboardH * 0.68));
      }
      const flat = M.Manifold.extrude(cs, t);
      const asm = flat.rotate([90, 0, 0]).translate([0, headSlotY + t / 2, platformTopZ]);
      add(asm, flat);
    }

    // ===================== Footboard (same technique, shorter) =====================
    if (bool(values, "incFootboard")) {
      const bodyR = Math.min(footboardH * 0.4, bedWid * 0.42);
      let cs = rrect(M, bedWid * 0.94, footboardH, bodyR, 0, footboardH / 2);
      cs = M.CrossSection.union([cs, rect(M, tenonW, tenonH, 0, -tenonH / 2)]);
      const holeSp = bedWid * 0.94 * 0.28;
      for (const hx of [-holeSp, 0, holeSp]) {
        cs = cs.subtract(M.CrossSection.circle(cutoutR * 0.7, 32).translate(hx, footboardH * 0.6));
      }
      const flat = M.Manifold.extrude(cs, t);
      // same placement formula as the headboard — the post-rotation thickness
      // band is [-t,0] regardless of which end it's for, so it must be
      // centred on the slot the same way: translateY - t/2 = slotY
      const asm = flat.rotate([90, 0, 0]).translate([0, footSlotY + t / 2, platformTopZ]);
      add(asm, flat);
    }

    if (asmParts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = asmParts.length === 1 ? asmParts[0] : M.Manifold.union(asmParts);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, printParts, gap);
  },
};

/* =====================================================================
 * 迷你桌 Mini Doll Table — 沿用床的方形鍵榫腳,換成桌面。
 * =================================================================== */

export const miniTableTemplate: Template = {
  id: "mini-table",
  name: "迷你桌(原創北歐簡約風) Mini Doll Table",
  description:
    "原創設計的娃娃迷你桌,無角色/無版權疑慮,可商用販售。圓角桌面 + 四支簡約錐形腳,方形鍵榫插進桌面底部插孔(方形防轉,不會裝歪),跟迷你床同一套接合語言,適合湊成一組販售。打開「組裝預覽」看組好樣子,關掉排成一盤列印,全部平放/直立、免支撐。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "topLen", label: "桌面長度", min: 40, max: 160, step: 1, default: 90, unit: "mm" },
    { kind: "number", key: "topWid", label: "桌面寬度", min: 30, max: 120, step: 1, default: 60, unit: "mm" },
    { kind: "number", key: "legH", label: "桌腳高度", min: 15, max: 70, step: 1, default: 38, unit: "mm" },
    { kind: "number", key: "topT", label: "桌面厚度", min: 4, max: 9, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "clearance", label: "鍵榫餘裕(單邊,緊配0.1;太緊插不進就調大)", min: 0.05, max: 0.4, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "boolean", key: "incTop", label: "含桌面", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incLegs", label: "含四支桌腳", default: true, group: "分件選擇" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const topLen = num(values, "topLen");
    const topWid = num(values, "topWid");
    const legH = num(values, "legH");
    const t = num(values, "topT");
    const c = num(values, "clearance");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    const topBotZ = legH;

    const pegSide = Math.min(8, Math.min(topLen, topWid) * 0.08 + 4);
    const pegInsert = Math.max(3, t - 1.5);
    const jointX = Math.max(8, topWid / 2 - 10);
    const jointY = Math.max(8, topLen / 2 - 10);

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    if (bool(values, "incTop")) {
      let top = M.Manifold.extrude(rrect(M, topWid, topLen, 10), t).translate([0, 0, topBotZ]);
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const sock = M.Manifold.extrude(rect(M, pegSide + 2 * c, pegSide + 2 * c), pegInsert + 0.2).translate([
            sx * jointX,
            sy * jointY,
            topBotZ - 0.1,
          ]);
          top = top.subtract(sock);
        }
      add(top, top);
    }

    if (bool(values, "incLegs")) {
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const body = M.Manifold.cylinder(legH, 3.6, 2.8, 32);
          const peg = M.Manifold.extrude(rect(M, pegSide, pegSide), pegInsert).translate([0, 0, legH]);
          const leg = M.Manifold.union(body, peg).translate([sx * jointX, sy * jointY, 0]);
          add(leg, leg);
        }
    }

    if (asmParts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = asmParts.length === 1 ? asmParts[0] : M.Manifold.union(asmParts);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, printParts, gap);
  },
};

/* =====================================================================
 * 原創迷你椅 Mini Doll Chair — 座面 + 靠背 + 四支錐形腳,跟床/桌/櫃同一套
 * 鍵榫語言(不含耳朵/角色元素),補齊「房間四件組」。
 * =================================================================== */

export const miniChairTemplate: Template = {
  id: "mini-chair",
  name: "迷你椅(原創北歐簡約風) Mini Doll Chair",
  description:
    "原創設計的娃娃迷你椅,無角色/無版權疑慮,可商用販售。圓角座面 + 三孔裝飾靠背(榫頭插進座面後緣的槽)+ 四支簡約錐形腳(方形鍵榫插進座面底部插孔),跟迷你床/桌/收納櫃同一套接合語言與裝飾語彙,適合湊成房間四件組販售。打開「組裝預覽」看組好樣子,關掉排成一盤列印,全部平放/直立、免支撐。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "seatW", label: "座面寬度", min: 40, max: 110, step: 1, default: 70, unit: "mm" },
    { kind: "number", key: "seatD", label: "座面深度", min: 40, max: 100, step: 1, default: 62, unit: "mm" },
    { kind: "number", key: "legH", label: "椅腳高度", min: 15, max: 60, step: 1, default: 34, unit: "mm" },
    { kind: "number", key: "backH", label: "靠背高度(座面以上)", min: 20, max: 90, step: 1, default: 50, unit: "mm" },
    { kind: "number", key: "panelT", label: "板件厚度", min: 4, max: 9, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "clearance", label: "鍵榫餘裕(單邊,緊配0.1;太緊插不進就調大)", min: 0.05, max: 0.4, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "boolean", key: "incSeat", label: "含座面", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incLegs", label: "含四支椅腳", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incBack", label: "含靠背", default: true, group: "分件選擇" },
    { kind: "number", key: "cutoutR", label: "靠背裝飾圓孔大小", min: 2, max: 12, step: 0.5, default: 6, unit: "mm", group: "裝飾" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const seatW = num(values, "seatW");
    const seatD = num(values, "seatD");
    const legH = num(values, "legH");
    const backH = num(values, "backH");
    const t = num(values, "panelT");
    const c = num(values, "clearance");
    const cutoutR = num(values, "cutoutR");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    const seatBotZ = legH;
    const seatTopZ = legH + t;

    // leg joint: same keyed square peg system as mini-bed/mini-table
    const pegSide = Math.min(8, Math.min(seatW, seatD) * 0.08 + 4);
    const pegInsert = Math.max(3, t - 1.5);
    const jointX = Math.max(8, seatW / 2 - 10);
    // extra margin (vs. the table's -10) keeps the rear leg sockets well clear
    // of the backrest tenon slot band near the rear edge — same principle
    // proven in doll-high-chair's seat/back layout
    const jointY = Math.max(12, seatD / 2 - 18);

    // backrest tenon slot: a through-cut near the rear edge, same convention
    // as the bed's headboard-into-platform joint
    const tenonW = Math.min(seatW * 0.6, seatW - 14);
    const tenonH = t + 4;
    const backSlotY = seatD / 2 - 6;

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    // ===================== Seat =====================
    if (bool(values, "incSeat")) {
      let seat = M.Manifold.extrude(rrect(M, seatW, seatD, 10), t).translate([0, 0, seatBotZ]);
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const sock = M.Manifold.extrude(rect(M, pegSide + 2 * c, pegSide + 2 * c), pegInsert + 0.2).translate([
            sx * jointX,
            sy * jointY,
            seatBotZ - 0.1,
          ]);
          seat = seat.subtract(sock);
        }
      // backrest slot — cut unconditionally whenever the seat exists (not
      // gated on incBack), matching the mini-bed/mini-shelf convention so the
      // joint-interference audit always compares identical seat geometry
      seat = seat.subtract(
        M.Manifold.extrude(rect(M, tenonW + 2 * c, t + 2 * c), t + 1).translate([0, backSlotY, seatBotZ - 0.5])
      );
      add(seat, seat);
    }

    // ===================== Legs: 4 independent tapered legs + square peg ====
    if (bool(values, "incLegs")) {
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const body = M.Manifold.cylinder(legH, 3.8, 3.0, 32);
          const peg = M.Manifold.extrude(rect(M, pegSide, pegSide), pegInsert).translate([0, 0, legH]);
          const leg = M.Manifold.union(body, peg).translate([sx * jointX, sy * jointY, 0]);
          add(leg, leg);
        }
    }

    // ===================== Backrest =====================
    if (bool(values, "incBack")) {
      const bodyR = Math.min(backH * 0.4, seatW * 0.42);
      let cs = rrect(M, seatW * 0.94, backH, bodyR, 0, backH / 2);
      cs = M.CrossSection.union([cs, rect(M, tenonW, tenonH, 0, -tenonH / 2)]);
      const holeSp = seatW * 0.94 * 0.26;
      for (const hx of [-holeSp, 0, holeSp]) {
        cs = cs.subtract(M.CrossSection.circle(cutoutR, 28).translate(hx, backH * 0.68));
      }
      const flat = M.Manifold.extrude(cs, t);
      // same rotate-then-translate formula as the bed's headboard/footboard:
      // the post-rotation thickness band is always [-t,0], so translateY is
      // always slotY + t/2 regardless of which edge it's for
      const asm = flat.rotate([90, 0, 0]).translate([0, backSlotY + t / 2, seatTopZ]);
      add(asm, flat);
    }

    if (asmParts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = asmParts.length === 1 ? asmParts[0] : M.Manifold.union(asmParts);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, printParts, gap);
  },
};

/* =====================================================================
 * 迷你收納櫃 Mini Doll Shelf — 開放式層架(無門片,結構最穩妥):
 * 底板 + 左右側板 + 頂板 + 背板,榫接組裝。
 * =================================================================== */

export const miniShelfTemplate: Template = {
  id: "mini-shelf",
  name: "迷你收納櫃(原創北歐簡約風) Mini Doll Shelf",
  description:
    "原創設計的娃娃迷你開放式收納櫃,無角色/無版權疑慮,可商用販售。底板+左右側板+頂板+背板,五件全部榫接組裝(側板上下各一長榫,插進底板/頂板的長槽);背板頂端圓角+三個圓孔裝飾,跟床頭板同一套語言。開放式層架設計(無鉸鏈門片,結構最穩固、免支撐)。打開「組裝預覽」看組好樣子,關掉排成一盤列印。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "shelfW", label: "櫃體寬度", min: 40, max: 140, step: 1, default: 70, unit: "mm" },
    { kind: "number", key: "shelfD", label: "櫃體深度", min: 25, max: 90, step: 1, default: 42, unit: "mm" },
    { kind: "number", key: "shelfH", label: "櫃體總高度", min: 40, max: 180, step: 1, default: 95, unit: "mm" },
    { kind: "number", key: "wallT", label: "板件厚度", min: 3, max: 8, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "clearance", label: "鍵榫餘裕(單邊,緊配0.1;太緊插不進就調大)", min: 0.05, max: 0.4, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "boolean", key: "incBase", label: "含底板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSides", label: "含左右側板 x2", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incTop", label: "含頂板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incBack", label: "含背板", default: true, group: "分件選擇" },
    { kind: "number", key: "cutoutR", label: "背板裝飾圓孔大小", min: 2, max: 10, step: 0.5, default: 5, unit: "mm", group: "裝飾" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const shelfW = num(values, "shelfW");
    const shelfD = num(values, "shelfD");
    const shelfH = num(values, "shelfH");
    const wallT = num(values, "wallT");
    const c = num(values, "clearance");
    const cutoutR = num(values, "cutoutR");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    const baseTopZ = wallT;
    const wallBodyH = Math.max(20, shelfH - 2 * wallT);
    const wallTopZ = baseTopZ + wallBodyH; // where the top panel sits
    const tenonReach = Math.max(2.5, wallT - 1.5); // blind depth into base/top

    // side-wall tenon: a long ridge along most of the depth, not a small post —
    // far more resistant to twisting than a single square peg on a tall panel
    const tenonLen = Math.max(10, shelfD * 0.55);

    // back-panel tenon into the base (same convention as the bed headboard)
    const backTenonW = Math.min(shelfW * 0.6, shelfW - 12);
    const backTenonH = wallT + 3;
    const backSlotY = shelfD / 2 - 5;

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    // shared helper: cut the two side-wall tenon sockets (+ optionally the
    // back-panel slot) into a flat base/top-shaped slab. Unconditional on
    // which OTHER parts are selected (only depends on this slab existing) —
    // see mini-bed's design notes on why coupling slot-cutting to the mating
    // part's own toggle breaks the joint-interference audit.
    // `tenonZMin`/`tenonZMax` are the mating tenon's exact world-Z range; the
    // socket is cut with a symmetric 0.3mm margin on both ends so it works
    // identically regardless of which face (top or bottom) it opens from.
    const margin = 0.3;
    const cutSideSockets = (slab: Manifold, tenonZMin: number, tenonZMax: number): Manifold => {
      let s = slab;
      const h = tenonZMax - tenonZMin + 2 * margin;
      for (const sx of [-1, 1]) {
        const sock = M.Manifold.extrude(rect(M, wallT + 2 * c, tenonLen + 2 * c), h).translate([
          sx * (shelfW / 2 - wallT / 2),
          0,
          tenonZMin - margin,
        ]);
        s = s.subtract(sock);
      }
      return s;
    };
    const cutBackSocket = (slab: Manifold, tenonZMin: number, tenonZMax: number): Manifold => {
      const h = tenonZMax - tenonZMin + 2 * margin;
      const sock = M.Manifold.extrude(rect(M, backTenonW + 2 * c, wallT + 2 * c), h).translate([
        0,
        backSlotY,
        tenonZMin - margin,
      ]);
      return slab.subtract(sock);
    };

    // ===================== Base =====================
    if (bool(values, "incBase")) {
      let base = M.Manifold.extrude(rrect(M, shelfW, shelfD, 8), wallT);
      // bottom tenon world-Z range (see side-wall construction below): [wallT-tenonReach, wallT]
      base = cutSideSockets(base, baseTopZ - tenonReach, baseTopZ);
      // back panel's tenon world-Z range: [baseTopZ-backTenonH, baseTopZ]
      base = cutBackSocket(base, baseTopZ - backTenonH, baseTopZ);
      add(base, base);
    }

    // ===================== Top =====================
    if (bool(values, "incTop")) {
      let top = M.Manifold.extrude(rrect(M, shelfW, shelfD, 8), wallT).translate([0, 0, wallTopZ]);
      // top tenon world-Z range: [wallTopZ, wallTopZ+tenonReach]
      top = cutSideSockets(top, wallTopZ, wallTopZ + tenonReach);
      add(top, top);
    }

    // ===================== Side walls x2 =====================
    if (bool(values, "incSides")) {
      for (const sx of [-1, 1]) {
        // local frame: X = depth-extent (becomes world Y), Y = height (becomes
        // world Z), Z = thickness (becomes world X) — verified via
        // rotate([90,0,0]).rotate([0,0,90]) => (new_x,new_y,new_z) = (old_z,old_x,old_y)
        let cs = rrect(M, shelfD - 4, wallBodyH, 6, 0, wallBodyH / 2);
        cs = M.CrossSection.union([
          cs,
          rect(M, tenonLen, tenonReach, 0, -tenonReach / 2), // bottom tenon
          rect(M, tenonLen, tenonReach, 0, wallBodyH + tenonReach / 2), // top tenon
        ]);
        const flat = M.Manifold.extrude(cs, wallT).translate([0, 0, -wallT / 2]); // centre thickness on 0
        const asm = flat
          .rotate([90, 0, 0])
          .rotate([0, 0, 90])
          .translate([sx * (shelfW / 2 - wallT / 2), 0, baseTopZ]);
        add(asm, flat);
      }
    }

    // ===================== Back panel =====================
    if (bool(values, "incBack")) {
      const backH = wallBodyH;
      const bodyR = Math.min(backH * 0.35, shelfW * 0.4);
      let cs = rrect(M, shelfW - 4, backH, bodyR, 0, backH / 2);
      cs = M.CrossSection.union([cs, rect(M, backTenonW, backTenonH, 0, -backTenonH / 2)]);
      const holeSp = (shelfW - 4) * 0.26;
      for (const hx of [-holeSp, 0, holeSp]) {
        cs = cs.subtract(M.CrossSection.circle(cutoutR, 28).translate(hx, backH * 0.72));
      }
      const flat = M.Manifold.extrude(cs, wallT);
      const asm = flat.rotate([90, 0, 0]).translate([0, backSlotY + wallT / 2, baseTopZ]);
      add(asm, flat);
    }

    if (asmParts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = asmParts.length === 1 ? asmParts[0] : M.Manifold.union(asmParts);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, printParts, gap);
  },
};

/* =====================================================================
 * 迷你衣櫃 Mini Doll Wardrobe — mini-shelf 櫃體(底/側/頂/背)放大加高,
 * 加一支掛衣圓桿(兩端插進側板)。跟收納櫃一樣是開放式(無門片):摩擦卡榫
 * 門片需要的「恰到好處的過盈量」得靠實機列印試裝校正,無法只靠幾何布林
 * 驗證掛保證,所以先不做——之後真的要做門片,建議先印一版側板實測抓
 * 出你這台印表機實際可靠的過盈公差,再回頭加。
 * =================================================================== */

export const miniWardrobeTemplate: Template = {
  id: "mini-wardrobe",
  name: "迷你衣櫃(原創北歐簡約風) Mini Doll Wardrobe",
  description:
    "原創設計的娃娃迷你衣櫃,無角色/無版權疑慮,可商用販售。跟迷你收納櫃同一套榫接櫃體(底板+左右側板+頂板+背板),加高加一支掛衣圓桿(兩端插進側板);開放式無門片設計(結構最穩固、跟收納櫃同一套邏輯)。打開「組裝預覽」看組好樣子,關掉排成一盤列印,全部平放/直立、免支撐。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "wardW", label: "櫃體寬度", min: 60, max: 160, step: 1, default: 100, unit: "mm" },
    { kind: "number", key: "wardD", label: "櫃體深度", min: 30, max: 90, step: 1, default: 46, unit: "mm" },
    { kind: "number", key: "wardH", label: "櫃體總高度", min: 60, max: 220, step: 1, default: 130, unit: "mm" },
    { kind: "number", key: "wallT", label: "板件厚度", min: 3, max: 8, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "rodDrop", label: "掛桿距頂板深度", min: 10, max: 40, step: 1, default: 18, unit: "mm" },
    { kind: "number", key: "clearance", label: "鍵榫餘裕(單邊,緊配0.1;太緊插不進就調大)", min: 0.05, max: 0.4, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "boolean", key: "incBase", label: "含底板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSides", label: "含左右側板 x2", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incTop", label: "含頂板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incBack", label: "含背板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incRod", label: "含掛衣桿", default: true, group: "分件選擇" },
    { kind: "number", key: "cutoutR", label: "背板裝飾圓孔大小", min: 2, max: 10, step: 0.5, default: 5, unit: "mm", group: "裝飾" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const wardW = num(values, "wardW");
    const wardD = num(values, "wardD");
    const wardH = num(values, "wardH");
    const wallT = num(values, "wallT");
    const rodDrop = num(values, "rodDrop");
    const c = num(values, "clearance");
    const cutoutR = num(values, "cutoutR");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    const baseTopZ = wallT;
    const wallBodyH = Math.max(30, wardH - 2 * wallT);
    const wallTopZ = baseTopZ + wallBodyH;
    const tenonReach = Math.max(2.5, wallT - 1.5);
    const tenonLen = Math.max(10, wardD * 0.5);

    const backTenonW = Math.min(wardW * 0.6, wardW - 12);
    const backTenonH = wallT + 3;
    const backSlotY = wardD / 2 - 5;

    // hanging rod: round dowel spanning the two side walls near the top.
    // A rod doesn't need anti-rotation the way a leg/tenon does, so a plain
    // round peg-into-round-hole is the right joint here (unlike the keyed
    // square pegs used everywhere else in this furniture line).
    const rodR = 2.2;
    const rodPegR = 1.8;
    const rodPegDepth = Math.max(2.5, wallT - 1.5);
    const rodZ = wallTopZ - rodDrop;
    const rodSpan = wardW - 2 * wallT;

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    const margin = 0.3;
    const cutSideSockets = (slab: Manifold, tenonZMin: number, tenonZMax: number): Manifold => {
      let s = slab;
      const h = tenonZMax - tenonZMin + 2 * margin;
      for (const sx of [-1, 1]) {
        const sock = M.Manifold.extrude(rect(M, wallT + 2 * c, tenonLen + 2 * c), h).translate([
          sx * (wardW / 2 - wallT / 2),
          0,
          tenonZMin - margin,
        ]);
        s = s.subtract(sock);
      }
      return s;
    };
    const cutBackSocket = (slab: Manifold, tenonZMin: number, tenonZMax: number): Manifold => {
      const h = tenonZMax - tenonZMin + 2 * margin;
      const sock = M.Manifold.extrude(rect(M, backTenonW + 2 * c, wallT + 2 * c), h).translate([
        0,
        backSlotY,
        tenonZMin - margin,
      ]);
      return slab.subtract(sock);
    };

    // ===================== Base =====================
    if (bool(values, "incBase")) {
      let base = M.Manifold.extrude(rrect(M, wardW, wardD, 8), wallT);
      base = cutSideSockets(base, baseTopZ - tenonReach, baseTopZ);
      base = cutBackSocket(base, baseTopZ - backTenonH, baseTopZ);
      add(base, base);
    }

    // ===================== Top =====================
    if (bool(values, "incTop")) {
      let top = M.Manifold.extrude(rrect(M, wardW, wardD, 8), wallT).translate([0, 0, wallTopZ]);
      top = cutSideSockets(top, wallTopZ, wallTopZ + tenonReach);
      add(top, top);
    }

    // ===================== Side walls x2 (+ rod socket) =====================
    if (bool(values, "incSides")) {
      for (const sx of [-1, 1]) {
        // local frame (pre-rotation): X = depth-extent, Y = height, Z =
        // thickness (centred on 0 by the -wallT/2 shift below) — same
        // convention as mini-shelf's side walls, composed via
        // rotate([90,0,0]).rotate([0,0,90]) => world (x,y,z) = local (z,x,y)
        let cs = rrect(M, wardD - 4, wallBodyH, 6, 0, wallBodyH / 2);
        cs = M.CrossSection.union([
          cs,
          rect(M, tenonLen, tenonReach, 0, -tenonReach / 2),
          rect(M, tenonLen, tenonReach, 0, wallBodyH + tenonReach / 2),
        ]);
        let flat = M.Manifold.extrude(cs, wallT).translate([0, 0, -wallT / 2]);

        // rod socket: a blind hole drilled straight along local Z (the
        // panel's own thickness axis — a bare, un-rotated cylinder already
        // points this way, no extra rotation needed). Depth-centred (local
        // X=0) and at the rod's world height (local Y = rodZ - baseTopZ).
        // Inner face is local Z=-wallT/2 for the +X wall and Z=+wallT/2 for
        // the -X wall (derived from the same composed-rotation world_x
        // formula used for the leg/tenon sockets above), so the hole must
        // start from whichever face faces inward and bore toward the outer
        // face without breaking through it.
        const rodLocalY = rodZ - baseTopZ;
        const zStart = sx > 0 ? -wallT / 2 - 0.3 : wallT / 2 - rodPegDepth;
        flat = flat.subtract(
          M.Manifold.cylinder(rodPegDepth + 0.3, rodPegR + c, rodPegR + c, 24).translate([0, rodLocalY, zStart])
        );

        const asm = flat
          .rotate([90, 0, 0])
          .rotate([0, 0, 90])
          .translate([sx * (wardW / 2 - wallT / 2), 0, baseTopZ]);
        add(asm, flat);
      }
    }

    // ===================== Back panel =====================
    if (bool(values, "incBack")) {
      const backH = wallBodyH;
      const bodyR = Math.min(backH * 0.35, wardW * 0.4);
      let cs = rrect(M, wardW - 4, backH, bodyR, 0, backH / 2);
      cs = M.CrossSection.union([cs, rect(M, backTenonW, backTenonH, 0, -backTenonH / 2)]);
      const holeSp = (wardW - 4) * 0.26;
      for (const hx of [-holeSp, 0, holeSp]) {
        cs = cs.subtract(M.CrossSection.circle(cutoutR, 28).translate(hx, backH * 0.72));
      }
      const flat = M.Manifold.extrude(cs, wallT);
      const asm = flat.rotate([90, 0, 0]).translate([0, backSlotY + wallT / 2, baseTopZ]);
      add(asm, flat);
    }

    // ===================== Hanging rod =====================
    if (bool(values, "incRod")) {
      // build along local Z first (Manifold's natural cylinder axis), centred,
      // then reuse the SAME verified composed rotation as the side walls
      // (rotate([90,0,0]).rotate([0,0,90]) => world (x,y,z) = local (z,x,y))
      // so a Z-spanning cylinder becomes an X-spanning rod — this avoids
      // introducing any new, unverified rotation axis.
      const body = M.Manifold.cylinder(rodSpan, rodR, rodR, 24).translate([0, 0, -rodSpan / 2]);
      const pegNeg = M.Manifold.cylinder(rodPegDepth, rodPegR, rodPegR, 24).translate([
        0,
        0,
        -rodSpan / 2 - rodPegDepth,
      ]);
      const pegPos = M.Manifold.cylinder(rodPegDepth, rodPegR, rodPegR, 24).translate([0, 0, rodSpan / 2]);
      const rod = M.Manifold.union([body, pegNeg, pegPos]);
      const asm = rod.rotate([90, 0, 0]).rotate([0, 0, 90]).translate([0, 0, rodZ]);
      // prints lying flat on its own cylindrical side — stable, no supports needed
      add(asm, rod);
    }

    if (asmParts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = asmParts.length === 1 ? asmParts[0] : M.Manifold.union(asmParts);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, printParts, gap);
  },
};

/* =====================================================================
 * 迷你穿衣鏡框 Mini Doll Mirror Frame — 圓角外框(挖窗)+插榫底座,跟床頭
 * 板插進平台槽的接法完全同一套公式(旋轉後厚度帶固定是[-t,0])。「鏡面」
 * 本身不列印(FDM 印不出鏡面),窗口是空的,使用者自己貼一張亮面卡片或
 * 反光貼紙上去——這是配件應用步驟,不是這個零件本身的組裝方式,底座
 * 插榫依然全部免膠。
 * =================================================================== */

export const miniMirrorTemplate: Template = {
  id: "mini-mirror",
  name: "迷你穿衣鏡框(原創北歐簡約風) Mini Doll Mirror Frame",
  description:
    "原創設計的娃娃迷你穿衣鏡框,無角色/無版權疑慮,可商用販售。圓角外框中間挖一個窗(FDM 印不出鏡面,窗口本身是空的,使用者自己貼亮面卡片或反光貼紙當鏡面),底部方形鍵榫插進底座槽(免膠),跟迷你床頭板同一套接合語言。打開「組裝預覽」看組好樣子,關掉排成一盤列印,全部平放、免支撐。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "frameW", label: "外框寬度", min: 30, max: 90, step: 1, default: 52, unit: "mm" },
    { kind: "number", key: "frameH", label: "外框高度", min: 40, max: 120, step: 1, default: 72, unit: "mm" },
    { kind: "number", key: "frameT", label: "外框厚度", min: 3, max: 8, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "border", label: "窗框邊寬", min: 4, max: 16, step: 0.5, default: 7, unit: "mm" },
    { kind: "number", key: "baseW", label: "底座寬度", min: 24, max: 70, step: 1, default: 40, unit: "mm" },
    { kind: "number", key: "baseD", label: "底座深度", min: 18, max: 45, step: 1, default: 26, unit: "mm" },
    { kind: "number", key: "baseT", label: "底座厚度", min: 3, max: 8, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "clearance", label: "鍵榫餘裕(單邊,緊配0.1;太緊插不進就調大)", min: 0.05, max: 0.4, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "boolean", key: "incFrame", label: "含鏡框", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incBase", label: "含底座", default: true, group: "分件選擇" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const frameW = num(values, "frameW");
    const frameH = num(values, "frameH");
    const frameT = num(values, "frameT");
    const border = num(values, "border");
    const baseW = num(values, "baseW");
    const baseD = num(values, "baseD");
    const baseT = num(values, "baseT");
    const c = num(values, "clearance");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    // frame bottom tenon into the base slot — identical convention to the
    // bed's headboard-into-platform joint: the post-rotation thickness band
    // is always [-t,0] regardless of which part it is, so translateY is
    // always slotY + t/2
    const tenonW = Math.min(frameW * 0.5, frameW - 14);
    const tenonH = frameT + 4;
    const slotY = baseD / 2 - 5;

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    // ===================== Frame =====================
    if (bool(values, "incFrame")) {
      const bodyR = Math.min(frameW * 0.22, frameH * 0.14);
      let cs = rrect(M, frameW, frameH, bodyR, 0, frameH / 2);
      cs = M.CrossSection.union([cs, rect(M, tenonW, tenonH, 0, -tenonH / 2)]);
      const winW = Math.max(6, frameW - 2 * border);
      const winH = Math.max(8, frameH - 2 * border - 4);
      const winR = Math.min(bodyR * 0.7, winW * 0.2, winH * 0.2);
      cs = cs.subtract(rrect(M, winW, winH, winR, 0, frameH / 2 + 2));
      const flat = M.Manifold.extrude(cs, frameT);
      const asm = flat.rotate([90, 0, 0]).translate([0, slotY + frameT / 2, baseT]);
      add(asm, flat);
    }

    // ===================== Base =====================
    if (bool(values, "incBase")) {
      let base = M.Manifold.extrude(rrect(M, baseW, baseD, 6), baseT);
      base = base.subtract(
        M.Manifold.extrude(rect(M, tenonW + 2 * c, frameT + 2 * c), baseT + 1).translate([0, slotY, -0.5])
      );
      add(base, base);
    }

    if (asmParts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = asmParts.length === 1 ? asmParts[0] : M.Manifold.union(asmParts);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, printParts, gap);
  },
};

/* =====================================================================
 * 迷你邊桌(三層階梯架) Mini Doll Side Table — mini-shelf 的側板卡榫模組
 * 延伸成三層(底/中/頂),四面開放無背板,像縮小版的階梯書架邊桌。
 * =================================================================== */

export const miniLadderTemplate: Template = {
  id: "mini-ladder",
  name: "迷你邊桌(原創北歐簡約風) Mini Doll Side Table",
  description:
    "原創設計的娃娃迷你邊桌,無角色/無版權疑慮,可商用販售。跟迷你收納櫃同一套側板卡榫模組,延伸成三層階梯架(底層+中層+頂層,兩側板各三道長榫),四面開放無背板,適合放小道具或當床邊桌。打開「組裝預覽」看組好樣子,關掉排成一盤列印,全部平放/直立、免支撐。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "ldrW", label: "架體寬度", min: 40, max: 130, step: 1, default: 60, unit: "mm" },
    { kind: "number", key: "ldrD", label: "架體深度", min: 25, max: 80, step: 1, default: 38, unit: "mm" },
    { kind: "number", key: "ldrH", label: "架體總高度", min: 50, max: 160, step: 1, default: 78, unit: "mm" },
    { kind: "number", key: "midFrac", label: "中層高度位置(0=底 1=頂)", min: 0.3, max: 0.7, step: 0.05, default: 0.5 },
    { kind: "number", key: "wallT", label: "板件厚度", min: 3, max: 8, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "clearance", label: "鍵榫餘裕(單邊,緊配0.1;太緊插不進就調大)", min: 0.05, max: 0.4, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "boolean", key: "incBase", label: "含底層", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incMid", label: "含中層", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incTop", label: "含頂層", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSides", label: "含左右側板 x2", default: true, group: "分件選擇" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const ldrW = num(values, "ldrW");
    const ldrD = num(values, "ldrD");
    const ldrH = num(values, "ldrH");
    const midFrac = num(values, "midFrac");
    const wallT = num(values, "wallT");
    const c = num(values, "clearance");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    const baseTopZ = wallT;
    const topZ = Math.max(baseTopZ + 20, ldrH - wallT);
    const midZ = baseTopZ + (topZ - baseTopZ) * midFrac;
    const tenonReach = Math.max(2.5, wallT - 1.5);
    const tenonLen = Math.max(10, ldrD * 0.55);

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    const margin = 0.3;
    // one shared shelf slab builder: rrect plate at a given world-Z, with
    // side-tenon sockets cut for its OWN slab thickness range — same
    // unconditional-on-mating-part convention used throughout this file.
    // `sockLen` is the socket's world-Y (depth) extent: base/top only meet a
    // narrow protruding TAB at the wall's end (tenonLen wide), but the middle
    // shelf meets the wall's full continuous cross-section (ldrD-4 wide) —
    // passing the wrong (narrower) width there left the wall's front/back
    // edges colliding with solid shelf material outside the socket, caught
    // by the joint-interference audit as a 539mm³ overlap.
    const cutSideSockets = (slab: Manifold, tenonZMin: number, tenonZMax: number, sockLen: number): Manifold => {
      let s = slab;
      const h = tenonZMax - tenonZMin + 2 * margin;
      for (const sx of [-1, 1]) {
        const sock = M.Manifold.extrude(rect(M, wallT + 2 * c, sockLen + 2 * c), h).translate([
          sx * (ldrW / 2 - wallT / 2),
          0,
          tenonZMin - margin,
        ]);
        s = s.subtract(sock);
      }
      return s;
    };

    // ===================== Base =====================
    if (bool(values, "incBase")) {
      let base = M.Manifold.extrude(rrect(M, ldrW, ldrD, 8), wallT);
      base = cutSideSockets(base, baseTopZ - tenonReach, baseTopZ, tenonLen);
      add(base, base);
    }

    // ===================== Middle shelf =====================
    if (bool(values, "incMid")) {
      let mid = M.Manifold.extrude(rrect(M, ldrW, ldrD, 8), wallT).translate([0, 0, midZ - wallT / 2]);
      mid = cutSideSockets(mid, midZ - wallT / 2, midZ + wallT / 2, ldrD - 4);
      add(mid, mid);
    }

    // ===================== Top =====================
    if (bool(values, "incTop")) {
      let top = M.Manifold.extrude(rrect(M, ldrW, ldrD, 8), wallT).translate([0, 0, topZ]);
      top = cutSideSockets(top, topZ, topZ + tenonReach, tenonLen);
      add(top, top);
    }

    // ===================== Side walls x2 (three tenons: base/mid/top) =====
    if (bool(values, "incSides")) {
      for (const sx of [-1, 1]) {
        // local frame identical to mini-shelf's side walls: X = depth, Y =
        // height, Z = thickness (centred on 0) — composed via
        // rotate([90,0,0]).rotate([0,0,90]) => world (x,y,z) = local (z,x,y)
        // the wall body already spans continuously from base to top, so the
        // middle shelf doesn't need its own protruding tenon tab — its socket
        // (cut below) engages the wall's own continuous cross-section directly,
        // a plain housing/dado joint. Only the base/top ends need tabs, since
        // those are where the wall body itself terminates.
        let cs = rrect(M, ldrD - 4, topZ - baseTopZ, 5, 0, (topZ - baseTopZ) / 2 + baseTopZ);
        cs = M.CrossSection.union([
          cs,
          rect(M, tenonLen, tenonReach, 0, baseTopZ - tenonReach / 2),
          rect(M, tenonLen, tenonReach, 0, topZ + tenonReach / 2),
        ]);
        const flat = M.Manifold.extrude(cs, wallT).translate([0, 0, -wallT / 2]);
        const asm = flat.rotate([90, 0, 0]).rotate([0, 0, 90]).translate([sx * (ldrW / 2 - wallT / 2), 0, 0]);
        add(asm, flat);
      }
    }

    if (asmParts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = asmParts.length === 1 ? asmParts[0] : M.Manifold.union(asmParts);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, printParts, gap);
  },
};

/* =====================================================================
 * 迷你壁掛層板 Mini Wall Shelf — 沿用 hook 模板的壁掛鎖孔背板,加兩支水平
 * 方形鍵榫插銷;層板背緣對應兩個插孔,從上掛下去卡上插銷。這是給「牆面
 * 場景」用的迷你展示層板(鎖真實牆壁),不是娃娃屋內部家具。
 * =================================================================== */

export const miniWallShelfTemplate: Template = {
  id: "mini-wall-shelf",
  name: "迷你壁掛層板(原創北歐簡約風) Mini Wall Shelf",
  description:
    "原創設計的迷你壁掛展示層板,無角色/無版權疑慮,可商用販售。背板含兩個鎖孔(鎖真實牆壁用,跟壁掛掛勾模板同一套規格)+ 兩支水平方形鍵榫插銷;層板背緣對應兩個插孔,從上掛下去卡上插銷,前緣有微凸圍邊防止小物滑落。適合放小公仔、多肉盆栽等輕量小物。打開「組裝預覽」看組好樣子,關掉排成一盤列印,全部平放、免支撐。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "backW", label: "背板寬度", min: 40, max: 120, step: 1, default: 70, unit: "mm" },
    { kind: "number", key: "backH", label: "背板高度", min: 20, max: 60, step: 1, default: 32, unit: "mm" },
    { kind: "number", key: "backT", label: "背板厚度", min: 3, max: 8, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "shelfDepth", label: "層板深度", min: 25, max: 80, step: 1, default: 45, unit: "mm" },
    { kind: "number", key: "shelfT", label: "層板厚度", min: 3, max: 8, step: 0.5, default: 5, unit: "mm" },
    { kind: "number", key: "holeDiameter", label: "壁掛鎖孔直徑", min: 2, max: 8, step: 0.1, default: 4.2, unit: "mm" },
    { kind: "number", key: "clearance", label: "鍵榫餘裕(單邊,緊配0.1;太緊插不進就調大)", min: 0.05, max: 0.4, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "boolean", key: "incBackplate", label: "含壁掛背板", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incShelf", label: "含層板", default: true, group: "分件選擇" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const backW = num(values, "backW");
    const backH = num(values, "backH");
    const backT = num(values, "backT");
    const shelfDepth = num(values, "shelfDepth");
    const shelfT = num(values, "shelfT");
    const holeR = num(values, "holeDiameter") / 2;
    const c = num(values, "clearance");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    // two keyed pegs project forward off the backplate; the shelf's back
    // edge carries matching blind sockets and simply hangs on them (a
    // clearance-fit bracket joint, same square-keyed-peg family used for
    // every leg/tenon in this line — no friction fit, fully audit-verifiable)
    // capped by shelfT-1.5 so the socket cut into the shelf stays a
    // contained blind pocket instead of breaching clean through its top and
    // bottom face (the peg is a cantilever bracket, not a through-tenon)
    const pegSide = Math.max(2.5, Math.min(shelfT - 1.5, backW * 0.06 + 3.5));
    const pegLen = Math.max(4, backT - 1);
    const pegSpacing = backW * 0.28;
    const pegZ = backH * 0.62;

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    // ===================== Wall backplate =====================
    if (bool(values, "incBackplate")) {
      // local (pre-rotation) frame — same convention as every headboard/
      // back-panel in this file: X=width, Y=height (0..backH via the
      // cy=backH/2 shift), Z=thickness (0..backT). Screw holes are cut as
      // 2D circles in the cross-section (a clean through-hole along Z needs
      // no separate 3D cylinder subtraction this way).
      let cs = rrect(M, backW, backH, 6, 0, backH / 2);
      for (const hx of [-pegSpacing, pegSpacing]) {
        cs = cs.subtract(M.CrossSection.circle(holeR, 24).translate(hx, backH * 0.82));
      }
      let flat = M.Manifold.extrude(cs, backT);

      // two outward-projecting keyed pegs — "outward" in this local frame
      // is plain +Z (the extrusion's own natural direction), so no extra
      // rotation is needed for the pegs themselves, only for the final
      // stand-up rotation applied to the whole panel below
      for (const px of [-pegSpacing, pegSpacing]) {
        const peg = M.Manifold.extrude(rect(M, pegSide, pegSide), pegLen).translate([px, pegZ, backT - 0.5]);
        flat = M.Manifold.union(flat, peg);
      }

      // stand it upright with the same rotate([90,0,0]) used for every
      // headboard/back-panel in this file: height maps straight to world Z,
      // thickness maps to world Y with "outward" ending up NEGATIVE — the
      // shelf below is placed to match this same negative-Y convention
      const asm = flat.rotate([90, 0, 0]);
      add(asm, flat);
    }

    // ===================== Shelf =====================
    if (bool(values, "incShelf")) {
      let shelf = M.Manifold.extrude(rrect(M, backW * 0.92, shelfDepth, 8), shelfT);

      // low front rail so small props don't roll off the outer edge — the
      // "outer" (away from wall) side is NEGATIVE local Y here, to match
      // the backplate's own negative-Y "outward" convention after its
      // rotation above; the socket-bearing "back" (near-wall) edge is
      // therefore the POSITIVE Y side
      const railW = 4;
      shelf = M.Manifold.union(
        shelf,
        M.Manifold.cube([backW * 0.92 - 6, railW, 3], true).translate([
          0,
          -(shelfDepth / 2 - railW / 2 - 1),
          shelfT + 1.5,
        ])
      );

      // blind sockets at the back (+Y) edge, matching the backplate's pegs.
      // The cutter is Z-extruded (its own natural axis) then rotated -90°
      // about X so it projects along Y instead — needed here because,
      // unlike the backplate, the shelf itself is never rotated, so "into
      // the shelf from its back edge" is the shelf's own Y axis, not Z.
      for (const px of [-pegSpacing, pegSpacing]) {
        const sock = M.Manifold.extrude(rect(M, pegSide + 2 * c, pegSide + 2 * c), pegLen + 0.3)
          .rotate([-90, 0, 0])
          .translate([px, shelfDepth / 2 - pegLen - 0.1, shelfT / 2]);
        shelf = shelf.subtract(sock);
      }

      const asm = shelf.translate([0, -backT - shelfDepth / 2, pegZ - shelfT / 2]);
      add(asm, shelf);
    }

    if (asmParts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = asmParts.length === 1 ? asmParts[0] : M.Manifold.union(asmParts);
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, printParts, gap);
  },
};
