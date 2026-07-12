import type { Template, ParamValues } from "./types";
import { num, bool } from "./types";
import type { Manifold } from "manifold-3d";
import { rrect, rect, ellipse, rabbitEar, trap, layoutParts } from "./geo";

/* =====================================================================
 * 餐桌椅 Doll High Chair — 開放式椅殼,分件:椅殼(背板+座面)、四腳架、餐盤
 * =================================================================== */

export const dollHighChairTemplate: Template = {
  id: "doll-high-chair",
  name: "餐桌椅(兔耳開放椅殼・分件列印) Doll High Chair",
  description:
    "娃娃用餐椅,參考市售兔耳款做成「開放式椅殼」:娃娃直接從上方放進去坐。為了『免支撐一次印好』全部拆成平放/直立的分件:①背板(兔耳+橢圓握把孔,底部榫頭)平躺印②座面(含低側牆,後方榫槽、四個插腳孔、前緣餐盤插銷)平放印③四支獨立圓錐插腳,各自直立印、外撇角度靠腳身彎折(免斜孔)④前餐盤(兩側環扣扣上座面插銷,可拆好讓娃娃先坐)。組裝:背板榫頭插入座面後槽→四支腳插入座面四孔→餐盤環扣套上。預設給長10×寬8cm的娃娃(座內寬約84mm)。打開「組裝預覽」看組好樣子,關掉則自動排成一盤(控制在 P2S 256 床內)。",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "seatWidth", label: "座椅外寬", min: 60, max: 130, step: 1, default: 96, unit: "mm" },
    { kind: "number", key: "seatDepth", label: "座椅深度", min: 45, max: 110, step: 1, default: 76, unit: "mm" },
    { kind: "number", key: "seatHeight", label: "座面高度(腳長)", min: 30, max: 100, step: 1, default: 62, unit: "mm" },
    { kind: "number", key: "backHeight", label: "背板高度(座面以上)", min: 45, max: 120, step: 1, default: 90, unit: "mm" },
    { kind: "number", key: "panelT", label: "板件厚度", min: 4, max: 9, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "clearance", label: "卡榫餘裕(單邊,緊配 0.1;太緊插不進就調大)", min: 0.05, max: 0.6, step: 0.05, default: 0.1, unit: "mm" },
    { kind: "number", key: "legSplay", label: "椅腳外撇角度", min: 0, max: 24, step: 1, default: 14, unit: "°" },
    { kind: "number", key: "earWidth", label: "兔耳寬度", min: 10, max: 34, step: 0.5, default: 22, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earHeight", label: "兔耳長度", min: 16, max: 70, step: 1, default: 46, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earSpacing", label: "兔耳間距(中心距)", min: 14, max: 80, step: 1, default: 34, unit: "mm", group: "耳朵造型" },
    { kind: "boolean", key: "incBack", label: "含背板(兔耳)", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSeat", label: "含座面", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incLegs", label: "含四支椅腳", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incTray", label: "含餐盤", default: true, group: "分件選擇" },
    { kind: "number", key: "trayDepth", label: "餐盤深度", min: 30, max: 80, step: 1, default: 52, unit: "mm", group: "進階" },
    { kind: "number", key: "trayRimHeight", label: "餐盤圍邊高度", min: 0, max: 8, step: 0.5, default: 5, unit: "mm", group: "進階" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 8, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const seatW = num(values, "seatWidth");
    const seatD = num(values, "seatDepth");
    const seatH = num(values, "seatHeight");
    const backH = num(values, "backHeight");
    const t = num(values, "panelT");
    const c = num(values, "clearance");
    const legSplayDeg = num(values, "legSplay");
    const earW = num(values, "earWidth");
    const earH = num(values, "earHeight");
    const earSp = num(values, "earSpacing");
    const trayD = num(values, "trayDepth");
    const trayRimH = num(values, "trayRimHeight");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    const DEG = Math.PI / 180;
    const st = t; // seat slab thickness
    const wall = t; // side-wall thickness
    const sideWallH = Math.min(16, backH * 0.22);
    const backW = seatW;
    const seatBottomZ = seatH - st;

    // --- leg joint: a KEYED racetrack mortise-tenon. The flat-sided tenon can't
    // rotate (splay stays put, seats square) and a chamfered lead-in mouth lets
    // it self-centre and click home flush. Tenon is vertical, so holes print
    // clean; the splay lives in each leg's bent shaft. ---
    const legTenL = Math.min(11, seatW * 0.12); // radial length of the tenon
    const legTenW = 5.2; // tangential width
    const legTenRad = legTenW / 2;
    const legTenInsert = st + 1;
    const jointX = Math.max(14, seatW / 2 - 20);
    const jointY = Math.max(12, seatD / 2 - 18);
    const cornerAng = (sx: number, sy: number) => (Math.atan2(sy * jointY, sx * jointX) * 180) / Math.PI;

    // --- back tenon into a rear slot in the seat ---
    const tenonW = Math.min(seatW * 0.5, seatW - 22);
    const tenonH = st + 6; // through the pan + 6mm
    const slotY = -(seatD / 2 - 9);

    // --- tray clip: two vertical posts on the seat front + rings under the tray
    // that drop straight down over them (lift the tray off to seat the doll) ---
    const postR = 3.5;
    const postX = seatW / 2 - 8;
    const postY = seatD / 2 - 8;
    const trayLift = 12; // tray plate rides this high above the seat
    const postH = trayLift - 0.5; // stop just below the plate so it can't poke through
    const ringH = 9;

    const asmParts: Manifold[] = [];
    const printParts: Manifold[] = [];
    const add = (asm: Manifold, print: Manifold) => {
      asmParts.push(asm);
      printParts.push(print);
    };

    // ===================== Back: flat panel + ears + bottom tenon ==============
    if (bool(values, "incBack")) {
      let backCS = rrect(M, backW, backH, 22, 0, backH / 2);
      backCS = M.CrossSection.union([
        backCS,
        rabbitEar(M, earW, earH, -earSp / 2, backH - 6),
        rabbitEar(M, earW, earH, earSp / 2, backH - 6),
        rect(M, tenonW, tenonH, 0, -tenonH / 2), // downward tenon (in-plane)
      ]);
      backCS = backCS.subtract(ellipse(M, backW * 0.22, backH * 0.11, 0, backH * 0.2));
      // raised inner-ear relief proud of the front face (the z=0 side -> +Y once
      // stood up), for the pink-inner-ear look; welds into the panel
      const innerEarCS = M.CrossSection.union([
        rabbitEar(M, earW * 0.5, earH * 0.6, -earSp / 2, backH - 6 + earH * 0.16),
        rabbitEar(M, earW * 0.5, earH * 0.6, earSp / 2, backH - 6 + earH * 0.16),
      ]);
      const relief = M.Manifold.extrude(innerEarCS, 1.6).translate([0, 0, -1.1]);
      const flat = M.Manifold.union(M.Manifold.extrude(backCS, t), relief);
      // assembled: stand vertical at the rear, tenon dropping into the seat slot
      const asm = flat
        .rotate([90, 0, 0]) // +Y height -> +Z, thickness -> -Y, tenon -> below
        .translate([0, slotY + t / 2, seatH]);
      add(asm, flat); // print lying on its back (support-free)
    }

    // ===================== Seat: pan + low walls + holes/slots =================
    if (bool(values, "incSeat")) {
      let panCS = rrect(M, seatW, seatD, 20);
      // four keyed racetrack mortises (oriented radially toward each corner)
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const mortise = rrect(M, legTenL + 2 * c, legTenW + 2 * c, legTenRad + c)
            .rotate(cornerAng(sx, sy))
            .translate(sx * jointX, sy * jointY);
          panCS = panCS.subtract(mortise);
        }
      // rear slot for the back tenon
      panCS = panCS.subtract(rect(M, tenonW + 2 * c, t + 2 * c, 0, slotY));
      let seat = M.Manifold.extrude(panCS, st).translate([0, 0, seatBottomZ]);

      // gently dished sitting surface so the doll nestles (never break the floor)
      const dishDepth = Math.min(3, st * 0.5);
      seat = seat.subtract(M.Manifold.sphere(120, 64).translate([0, 2, seatH + 120 - dishDepth]));

      // chamfered lead-in mouths on each mortise (self-centring, seats flush)
      const csinkD = Math.min(2, st * 0.4);
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const csink = M.Manifold.extrude(
            rrect(M, legTenL + 2 * c + 1.6, legTenW + 2 * c + 1.6, legTenRad + c + 0.8)
              .rotate(cornerAng(sx, sy))
              .translate(sx * jointX, sy * jointY),
            csinkD + 0.1
          ).translate([0, 0, seatH - csinkD]);
          seat = seat.subtract(csink);
        }

      // low hip side walls (mid-seat, kept clear of the back panel at the rear)
      const wallLen = seatD * 0.5;
      for (const sx of [-1, 1]) {
        seat = M.Manifold.union(
          seat,
          M.Manifold.cube([wall, wallLen, sideWallH], true).translate([
            sx * (seatW / 2 - wall / 2),
            -2,
            seatH + sideWallH / 2,
          ])
        );
      }
      // two vertical tray posts near the front corners
      for (const sx of [-1, 1]) {
        seat = M.Manifold.union(
          seat,
          M.Manifold.cylinder(postH, postR, postR, 24).translate([sx * postX, postY, seatH])
        );
      }
      add(seat, seat); // prints as-is: pan down, walls up (support-free)
    }

    // ===================== Legs: four independent bent peg-legs ================
    if (bool(values, "incLegs")) {
      const lean = legSplayDeg * DEG;
      const shaftH = seatBottomZ / Math.max(Math.cos(lean), 0.5);
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          // local frame: vertical KEYED tenon up from origin (long axis +X, radial);
          // tapered shaft down & out +X so the foot splays toward the corner
          const tenon = M.Manifold.extrude(rrect(M, legTenL, legTenW, legTenRad), legTenInsert);
          const shaft = M.Manifold.cylinder(shaftH, 5.4, 4.0, 32)
            .translate([0, 0, -shaftH]) // top at origin
            .rotate([0, -legSplayDeg, 0]); // lean so the foot swings +X
          const footX = shaftH * Math.sin(lean);
          const foot = M.Manifold.sphere(4.4, 20).translate([footX, 0, -shaftH * Math.cos(lean)]);
          const legLocal = M.Manifold.union([tenon, shaft, foot]);

          // assembled: aim the +X lean + tenon toward this corner, into the mortise
          const cornerDeg = cornerAng(sx, sy);
          const asm = legLocal
            .rotate([0, 0, cornerDeg])
            .translate([sx * jointX, sy * jointY, seatBottomZ]);
          // print: rotate the shaft back to vertical so it stands on its foot
          const print = legLocal.rotate([0, legSplayDeg, 0]);
          add(asm, print);
        }
    }

    // ===================== Tray: rimmed plate + two drop-over rings ============
    if (bool(values, "incTray")) {
      const trayW = seatW + 2;
      let tray = M.Manifold.extrude(rrect(M, trayW, trayD, 16), t);
      if (trayRimH > 0) {
        const rim = rrect(M, trayW, trayD, 16).subtract(rrect(M, trayW - 12, trayD - 12, 11));
        tray = M.Manifold.union(tray, M.Manifold.extrude(rim, t + trayRimH));
      }
      // rings hang below the plate's rear corners and drop over the seat posts
      const ringInY = -trayD / 2 + 9;
      for (const sx of [-1, 1]) {
        const ring = M.Manifold.extrude(
          M.CrossSection.circle(postR + 2.6, 32).subtract(M.CrossSection.circle(postR + c, 28)),
          ringH
        ).translate([sx * postX, ringInY, -ringH]);
        tray = M.Manifold.union(tray, ring);
      }
      // assembled: rear-corner rings sit at the posts, plate rides trayLift high
      const trayY = postY - ringInY;
      // print flipped so the plate lies flat and the rings point up (no overhang)
      add(tray.translate([0, trayY, seatH + trayLift]), tray.rotate([180, 0, 0]));
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
