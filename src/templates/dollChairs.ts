import type { Template, ParamValues } from "./types";
import { num, bool } from "./types";
import type { Manifold } from "manifold-3d";
import { rrect, rect, ellipse, rabbitEar, trap, layoutParts } from "./geo";

/* =====================================================================
 * 餐桌椅 Doll High Chair — 開放式椅殼,分件:椅殼(背板+座面)、四腳架、餐盤
 * =================================================================== */

/** A part built directly in its ASSEMBLED pose (asm), plus the extra rotation
 * that lays it flat for printing (printRot). */
interface ShellPart {
  asm: Manifold;
  printRot: [number, number, number];
}

export const dollHighChairTemplate: Template = {
  id: "doll-high-chair",
  name: "餐桌椅(兔耳開放椅殼・分件列印) Doll High Chair",
  description:
    "娃娃用餐椅,參考市售兔耳款重做成「開放式椅殼」:娃娃直接從上方放進去坐(座面開放、低側牆)。三件分色分件列印,靠真正的插孔+插銷組裝:①椅殼(背板+兔耳+橢圓握把孔+座面,底部有四個中空插孔)②外撇四腳架(頂面四支插銷插進椅殼插孔)③前餐盤(兩側環扣扣在椅殼插銷上,可拆好讓娃娃先坐)。預設尺寸給長10×寬8cm的娃娃(座內寬約84mm)。打開「組裝預覽」看組好的樣子,關掉則自動排成一盤、可一次印好(已控制在 256 床內)。",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    { kind: "number", key: "seatWidth", label: "座椅外寬", min: 60, max: 130, step: 1, default: 96, unit: "mm" },
    { kind: "number", key: "seatDepth", label: "座椅深度", min: 45, max: 110, step: 1, default: 76, unit: "mm" },
    { kind: "number", key: "seatHeight", label: "座面高度(腳長)", min: 30, max: 100, step: 1, default: 62, unit: "mm" },
    { kind: "number", key: "backHeight", label: "背板高度(座面以上)", min: 45, max: 120, step: 1, default: 90, unit: "mm" },
    { kind: "number", key: "panelT", label: "殼體厚度", min: 4, max: 9, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "clearance", label: "卡榫餘裕(單邊,印太緊調大)", min: 0.1, max: 0.6, step: 0.05, default: 0.3, unit: "mm" },
    { kind: "number", key: "earWidth", label: "兔耳寬度", min: 10, max: 34, step: 0.5, default: 22, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earHeight", label: "兔耳長度", min: 16, max: 70, step: 1, default: 46, unit: "mm", group: "耳朵造型" },
    { kind: "number", key: "earSpacing", label: "兔耳間距(中心距)", min: 14, max: 80, step: 1, default: 34, unit: "mm", group: "耳朵造型" },
    { kind: "boolean", key: "incShell", label: "含椅殼(背板+座面)", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incLegs", label: "含四腳架", default: true, group: "分件選擇" },
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
    const earW = num(values, "earWidth");
    const earH = num(values, "earHeight");
    const earSp = num(values, "earSpacing");
    const trayD = num(values, "trayDepth");
    const trayRimH = num(values, "trayRimHeight");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");

    const DEG = Math.PI / 180;
    const st = t;                              // seat slab thickness
    const wall = t;                            // side-wall thickness
    const sideWallH = Math.min(16, backH * 0.22);
    const backW = seatW;
    const seatBottomZ = seatH - st;

    // --- leg joint: hollow sockets under the seat + matching pegs (shared vars
    // so peg outer = socket bore - clearance and the parts always line up) ---
    const boreR = 4.0;
    const socketOuterR = boreR + 2.6;
    const socketLen = Math.max(6, Math.min(13, seatBottomZ * 0.32));
    const pegR = boreR - c;
    const pegInsert = Math.max(4, socketLen - 2);
    const socketBotZ = seatBottomZ - socketLen;
    const jointX = Math.max(14, seatW / 2 - 24);
    const jointY = Math.max(10, seatD / 2 - 22);

    // --- tray clip: pegs on the shell front sides + ring hooks on the tray ---
    const clipPegR = 4;
    const clipZ = seatH + Math.min(8, sideWallH * 0.5);
    const clipY = seatD / 2 - 8;

    const yokeT = 7;
    const yokeTopZ = socketBotZ;
    const yokeBotZ = yokeTopZ - yokeT;

    const parts: ShellPart[] = [];

    // ================= Shell: seat + low walls + back + ears + sockets =========
    if (bool(values, "incShell")) {
      let shell = M.Manifold.extrude(rrect(M, seatW, seatD, 20), st).translate([0, 0, seatBottomZ]);

      // low hip side walls (rear ~62%, front left open so the doll drops in)
      const wallLen = seatD * 0.62;
      for (const sx of [-1, 1]) {
        shell = M.Manifold.union(
          shell,
          M.Manifold.cube([wall, wallLen, sideWallH], true).translate([
            sx * (seatW / 2 - wall / 2),
            -seatD / 2 + wallLen / 2 + 2,
            seatH + sideWallH / 2,
          ])
        );
      }

      // back panel with oval handle hole + rabbit ears (front face = +Y)
      let backCS = rrect(M, backW, backH, 22, 0, backH / 2);
      backCS = M.CrossSection.union([
        backCS,
        rabbitEar(M, earW, earH, -earSp / 2, backH - 6),
        rabbitEar(M, earW, earH, earSp / 2, backH - 6),
      ]);
      backCS = backCS.subtract(ellipse(M, backW * 0.22, backH * 0.11, 0, backH * 0.2));
      const back = M.Manifold.extrude(backCS, t)
        .rotate([90, 0, 0]) // stand up: local +Y height -> +Z, thickness -> -Y
        .translate([0, -seatD / 2 + t / 2 + 2, seatH]);
      shell = M.Manifold.union(shell, back);

      // lumbar wedge welding the seat rear to the back
      shell = M.Manifold.union(
        shell,
        M.Manifold.cube([seatW - 2 * wall, 12, 12], true).translate([0, -seatD / 2 + 10, seatH + 5])
      );

      // four hollow leg sockets hanging under the seat
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const tube = M.Manifold.cylinder(socketLen, socketOuterR, socketOuterR, 32)
            .subtract(M.Manifold.cylinder(socketLen + 2, boreR, boreR, 32).translate([0, 0, -1]))
            .translate([sx * jointX, sy * jointY, socketBotZ]);
          shell = M.Manifold.union(shell, tube);
        }

      // two forward-pointing clip pegs the tray hooks slip onto
      for (const sx of [-1, 1]) {
        shell = M.Manifold.union(
          shell,
          M.Manifold.cylinder(9, clipPegR, clipPegR, 24)
            .rotate([-90, 0, 0]) // axis -> +Y (points forward)
            .translate([sx * (seatW / 2 - 4), clipY, clipZ])
        );
      }

      parts.push({ asm: shell, printRot: [-90, 0, 0] }); // lay on its back to print
    }

    // ================= Legs: yoke + up-pegs + four splayed legs ================
    if (bool(values, "incLegs")) {
      let legs = M.Manifold.extrude(rrect(M, seatW - 22, seatD - 22, 10), yokeT).translate([
        0, 0, yokeBotZ,
      ]);

      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          legs = M.Manifold.union(
            legs,
            M.Manifold.cylinder(pegInsert, pegR, pegR, 28).translate([sx * jointX, sy * jointY, yokeTopZ])
          );
        }

      const splay = 12; // degrees
      const lx = Math.max(16, seatW / 2 - 16);
      const ly = Math.max(16, seatD / 2 - 16);
      const legLen = yokeBotZ / Math.cos(splay * DEG);
      const outMove = Math.sin(splay * DEG) * legLen;
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const leg = M.Manifold.cylinder(legLen, 4.6, 6.2, 24)
            .translate([0, 0, -legLen]) // top at origin
            .rotate([-sy * splay, sx * splay, 0])
            .translate([sx * lx, sy * ly, yokeBotZ]);
          legs = M.Manifold.union(legs, leg);
          legs = M.Manifold.union(
            legs,
            M.Manifold.sphere(4.8, 16).translate([sx * (lx + outMove), sy * (ly + outMove), 1.2])
          );
        }

      parts.push({ asm: legs, printRot: [0, 0, 0] }); // print upright, feet on the bed
    }

    // ================= Tray: rimmed plate + side arms with ring hooks ==========
    if (bool(values, "incTray")) {
      const trayW = seatW + 2;
      let tray = M.Manifold.extrude(rrect(M, trayW, trayD, 16), t);
      if (trayRimH > 0) {
        const rim = rrect(M, trayW, trayD, 16).subtract(rrect(M, trayW - 12, trayD - 12, 11));
        tray = M.Manifold.union(tray, M.Manifold.extrude(rim, t + trayRimH));
      }
      // two arms reaching to the rear (-Y) ending in a ring hook whose hole faces
      // +Y so it slides onto a shell clip peg
      const armLen = Math.max(20, (trayD / 2) - clipY + (seatD / 2)); // reach to the pegs
      const armW = 10;
      for (const sx of [-1, 1]) {
        tray = M.Manifold.union(
          tray,
          M.Manifold.cube([armW, armLen, t], true).translate([
            sx * (trayW / 2 - armW / 2),
            -trayD / 2 - armLen / 2 + 3,
            t / 2,
          ])
        );
        const ring = M.Manifold.extrude(
          M.CrossSection.circle(clipPegR + 3, 28).subtract(M.CrossSection.circle(clipPegR + c, 24)),
          armW
        )
          .rotate([-90, 0, 0]) // ring hole axis -> +Y
          .translate([sx * (trayW / 2 - armW / 2), -trayD / 2 - armLen + 3 + armW / 2, t / 2]);
        tray = M.Manifold.union(tray, ring);
      }
      const trayY = seatD / 2 + trayD / 2 - 4;
      parts.push({ asm: tray.translate([0, trayY, clipZ - t / 2]), printRot: [0, 0, 0] });
    }

    if (parts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all =
        parts.length === 1 ? parts[0].asm : M.Manifold.union(parts.map((p) => p.asm));
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(
      M,
      parts.map((p) => p.asm.rotate(p.printRot)),
      gap
    );
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
