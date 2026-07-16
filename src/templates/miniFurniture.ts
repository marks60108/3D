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
