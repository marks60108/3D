import type { Template, ParamValues } from "./types";
import { num, bool } from "./types";
import type { Manifold, ManifoldToplevel } from "manifold-3d";
import { layoutParts } from "./geo";

/* =====================================================================
 * 烏薩奇道具 Usagi props — 臉權杖 + 彈簧毛絨球(組裝件)
 * 圓球臉頭(小點眼 + 波浪鋸齒嘴)。參考原品絨毛玩具。
 * =================================================================== */

// a printed helical coil approximated by overlapping spheres along a helix
function coil(
  M: ManifoldToplevel,
  rc: number,
  wire: number,
  turns: number,
  z0: number,
  z1: number
): Manifold {
  const steps = Math.max(28, Math.round(turns * 30));
  const totalAng = turns * Math.PI * 2;
  const beads: Manifold[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (totalAng * i) / steps;
    const z = z0 + ((z1 - z0) * i) / steps;
    beads.push(M.Manifold.sphere(wire / 2, 12).translate([rc * Math.cos(a), rc * Math.sin(a), z]));
  }
  return M.Manifold.union(beads);
}

/** A support-free "spring look": a stack of cone frustums (rInner<->rOuter) with
 * steep flanks (≤ ~38° overhang), solid, so it prints upright without support. */
function ribbedSpindle(
  M: ManifoldToplevel,
  rI: number,
  rO: number,
  z0: number,
  z1: number
): Manifold {
  const foldH = (rO - rI) * 1.4; // steep flank -> printable overhang
  const n = Math.max(2, Math.round((z1 - z0) / foldH));
  const fh = (z1 - z0) / n;
  const segs: Manifold[] = [];
  for (let k = 0; k < n; k++) {
    const rB = k % 2 === 0 ? rI : rO;
    const rT = k % 2 === 0 ? rO : rI;
    segs.push(M.Manifold.cylinder(fh, rB, rT, 48).translate([0, 0, z0 + fh * k]));
  }
  return M.Manifold.union(segs);
}

/** Add the Usagi face (two dot eyes + wavy zigzag mouth) onto a flat front face
 * at y = faceY, centred at z = headCz. Returns the combined manifold. */
function addFace(
  M: ManifoldToplevel,
  base: Manifold,
  headR: number,
  faceY: number,
  headCz: number,
  eyeR: number,
  eyeSp: number,
  mouthW: number
): Manifold {
  let m = base;
  const eyeZ = headCz + headR * 0.26;
  for (const sx of [-1, 1]) {
    m = M.Manifold.union(
      m,
      M.Manifold.sphere(eyeR, 32).scale([1, 0.7, 1]).translate([sx * eyeSp / 2, faceY, eyeZ])
    );
  }
  const mouthZ = headCz - headR * 0.1;
  const amp = mouthW * 0.13;
  const folds = 4;
  const pts: [number, number][] = [];
  for (let i = 0; i <= folds; i++) {
    pts.push([-mouthW / 2 + (mouthW * i) / folds, i % 2 === 0 ? amp : -amp]);
  }
  const stroke = 1.1;
  const proud = 0.9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const angDeg = (Math.atan2(-(z2 - z1), x2 - x1) * 180) / Math.PI;
    m = M.Manifold.union(
      m,
      M.Manifold.cube([len, proud + 1, stroke], true)
        .rotate([0, angDeg, 0])
        .translate([(x1 + x2) / 2, faceY + (proud + 1) / 2 - 1, mouthZ + (z1 + z2) / 2])
    );
  }
  for (const [px, pz] of pts) {
    m = M.Manifold.union(
      m,
      M.Manifold.sphere(stroke * 0.6, 20).scale([1, 0.7, 1]).translate([px, faceY, mouthZ + pz])
    );
  }
  return m;
}

/** A ball head with a shallow flat front face (keeps it looking round). */
function ballHead(M: ManifoldToplevel, headR: number, headCz: number): { head: Manifold; faceY: number } {
  const faceY = headR * 0.8;
  const head = M.Manifold.sphere(headR, 96)
    .translate([0, 0, headCz])
    .subtract(
      M.Manifold.cube([headR * 3, headR * 3, headR * 3], true).translate([0, faceY + headR * 1.5, headCz])
    );
  return { head, faceY };
}

/* ---------------------------------------------------------------------
 * 烏薩奇臉權杖 — 小型娃娃道具 (~9cm), 一體/彈簧樣式可選
 * ------------------------------------------------------------------- */
export const usagiMaceTemplate: Template = {
  id: "usagi-mace",
  name: "烏薩奇臉權杖(娃娃道具) Usagi Face Mace",
  description:
    "吉伊卡哇烏薩奇的長柄武器:圓球白臉頭(兩個小點眼 + 波浪鋸齒嘴)—一段彈簧—細長握柄。預設 ~9cm 給娃娃拿。『彈簧樣式』可選:①硬螺旋(一體成型、耐用、不會彈)②留孔塞真彈簧(頭與柄分開、各留 φ5.6 孔,你塞一根真彈簧,頭會晃、最像原品)③可動 PLA 螺旋(直接印會微彈、較細脆)。臉建議朝上平躺印最清晰。想要 40mm 大球 + 120mm 長柄的完整組裝版,請改用『彈簧毛絨球(組裝件)』。",
  category: "storage-display",
  params: [
    {
      kind: "select",
      key: "springStyle",
      label: "彈簧樣式",
      options: [
        { label: "① 免支撐螺紋柱(實心・免支撐・耐用)", value: 3 },
        { label: "② 硬螺旋(一體成型・需支撐)", value: 0 },
        { label: "③ 留孔塞真彈簧(頭柄分開・最像原品)", value: 1 },
        { label: "④ 可動 PLA 螺旋(會微彈・需支撐/TPU)", value: 2 },
      ],
      default: 3,
    },
    { kind: "number", key: "headDia", label: "球頭直徑", min: 14, max: 44, step: 1, default: 24, unit: "mm" },
    { kind: "number", key: "handleLen", label: "握柄長度", min: 20, max: 100, step: 1, default: 46, unit: "mm" },
    { kind: "number", key: "handleDia", label: "握柄粗細", min: 4, max: 12, step: 0.5, default: 6, unit: "mm" },
    { kind: "number", key: "springLen", label: "彈簧段長度", min: 6, max: 34, step: 1, default: 15, unit: "mm" },
    { kind: "number", key: "eyeR", label: "眼睛大小", min: 0.8, max: 3, step: 0.1, default: 1.5, unit: "mm", group: "臉部微調" },
    { kind: "number", key: "eyeSpacing", label: "眼距(中心)", min: 3, max: 16, step: 0.5, default: 7, unit: "mm", group: "臉部微調" },
    { kind: "number", key: "mouthWidth", label: "嘴巴寬度", min: 5, max: 26, step: 0.5, default: 13, unit: "mm", group: "臉部微調" },
    { kind: "boolean", key: "keychainLoop", label: "頂端鑰匙圈吊孔", default: false, group: "選項" },
  ],
  build: (values: ParamValues, M) => {
    const style = num(values, "springStyle");
    const headR = num(values, "headDia") / 2;
    const handleLen = num(values, "handleLen");
    const r = num(values, "handleDia") / 2;
    const springLen = num(values, "springLen");
    const eyeR = num(values, "eyeR");
    const eyeSp = num(values, "eyeSpacing");
    const mouthW = num(values, "mouthWidth");
    const loop = bool(values, "keychainLoop");

    const handleTopZ = handleLen;
    const headBottomZ = handleTopZ + springLen;
    const headCz = headBottomZ + headR;
    const sockR = 2.8;
    const sockDepth = Math.min(7, springLen * 0.5 + 3);

    let m: Manifold = M.Manifold.cylinder(handleLen, r * 0.9, r, 48);
    m = M.Manifold.union(m, M.Manifold.sphere(r * 1.15, 32).scale([1, 1, 0.7]));
    for (const f of [0.14, 0.24]) {
      m = M.Manifold.union(m, M.Manifold.cylinder(1.6, r + 0.8, r + 0.8, 40).translate([0, 0, handleLen * f]));
    }

    if (style === 1) {
      m = m.subtract(
        M.Manifold.cylinder(sockDepth + 0.1, sockR, sockR, 24).translate([0, 0, handleTopZ - sockDepth])
      );
    } else {
      const rc = r + 1.2;
      m = M.Manifold.union(m, M.Manifold.cylinder(2, rc + 1, rc + 1, 40).translate([0, 0, handleTopZ - 1]));
      if (style === 3) {
        m = M.Manifold.union(m, ribbedSpindle(M, r * 0.85, rc, handleTopZ, headBottomZ));
      } else {
        const wire = style === 2 ? 1.4 : 1.9;
        const turns = style === 2 ? Math.max(4, springLen / 2.4) : Math.max(3, springLen / 3.4);
        m = M.Manifold.union(m, coil(M, rc, wire, turns, handleTopZ, headBottomZ));
      }
      m = M.Manifold.union(m, M.Manifold.cylinder(2.4, rc + 1, rc + 1, 40).translate([0, 0, headBottomZ - 1.4]));
    }

    let { head, faceY } = ballHead(M, headR, headCz);
    if (style === 1) {
      head = head.subtract(
        M.Manifold.cylinder(sockDepth + 0.1, sockR, sockR, 24).translate([0, 0, headBottomZ - 0.1])
      );
    }
    m = M.Manifold.union(m, head);
    m = addFace(M, m, headR, faceY, headCz, eyeR, eyeSp, mouthW);

    if (loop) {
      const ring = M.Manifold.cylinder(3, 5, 5, 40)
        .subtract(M.Manifold.cylinder(5, 2.4, 2.4, 32).translate([0, 0, -1]))
        .rotate([90, 0, 0])
        .translate([0, 0, headCz + headR + 2]);
      m = M.Manifold.union(m, ring);
    }

    const b = m.boundingBox();
    return m.translate([0, 0, -b.min[2]]);
  },
};

/* ---------------------------------------------------------------------
 * 彈簧毛絨球(組裝件) — 依組裝設計圖: 40mm 球 + 120mm 柄, 模組化榫接
 * 三件: ①臉球(底部插銷) ②彈簧(兩端插孔) ③握柄(頂部插銷)
 * ------------------------------------------------------------------- */
export const springPlushBallTemplate: Template = {
  id: "spring-plush-ball",
  name: "彈簧毛絨球(組裝件) Spring Plush Ball",
  description:
    "依組裝設計圖做的模組化三件:①臉球(圓球+波浪笑臉,底部插銷)②彈簧段(兩端插孔,建議 TPU 軟料印才會彈,PLA 則當硬連接)③握柄(頂部插銷)。插銷+插孔對插即可組裝、分色分印。預設 40mm 球 + 120mm 柄(總長 ~19cm)。打開「組裝預覽」看組好的樣子,關掉排成一盤列印。註:40mm 圓球下半是懸空,球件建議開樹狀支撐或把球對半分印再黏。",
  category: "storage-display",
  params: [
    { kind: "boolean", key: "assembled", label: "組裝預覽(關=列印排版)", default: false },
    {
      kind: "select",
      key: "springForm",
      label: "彈簧形式",
      options: [
        { label: "免支撐螺紋柱(實心・耐用)", value: 0 },
        { label: "開放螺旋(需支撐 / TPU 才會彈)", value: 1 },
      ],
      default: 0,
    },
    { kind: "boolean", key: "ballSplit", label: "球對半分印(完全免支撐)", default: false },
    { kind: "number", key: "ballDia", label: "球頭直徑", min: 20, max: 60, step: 1, default: 40, unit: "mm" },
    { kind: "number", key: "handleLen", label: "握柄長度", min: 40, max: 160, step: 1, default: 120, unit: "mm" },
    { kind: "number", key: "handleDia", label: "握柄粗細", min: 6, max: 18, step: 0.5, default: 11, unit: "mm" },
    { kind: "number", key: "springLen", label: "彈簧段長度", min: 16, max: 70, step: 1, default: 40, unit: "mm" },
    { kind: "number", key: "coilWire", label: "彈簧線徑", min: 1.2, max: 4, step: 0.1, default: 2.2, unit: "mm" },
    { kind: "number", key: "clearance", label: "榫接餘裕(單邊)", min: 0.1, max: 0.6, step: 0.05, default: 0.2, unit: "mm" },
    { kind: "boolean", key: "incBall", label: "含臉球", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incSpring", label: "含彈簧段", default: true, group: "分件選擇" },
    { kind: "boolean", key: "incHandle", label: "含握柄", default: true, group: "分件選擇" },
    { kind: "number", key: "eyeR", label: "眼睛大小", min: 1, max: 5, step: 0.1, default: 2.4, unit: "mm", group: "臉部微調" },
    { kind: "number", key: "eyeSpacing", label: "眼距(中心)", min: 5, max: 26, step: 0.5, default: 12, unit: "mm", group: "臉部微調" },
    { kind: "number", key: "mouthWidth", label: "嘴巴寬度", min: 8, max: 40, step: 0.5, default: 22, unit: "mm", group: "臉部微調" },
    { kind: "number", key: "layoutGap", label: "分件排版間距", min: 3, max: 30, step: 1, default: 10, unit: "mm", group: "進階" },
  ],
  build: (values: ParamValues, M) => {
    const ballR = num(values, "ballDia") / 2;
    const handleLen = num(values, "handleLen");
    const hr = num(values, "handleDia") / 2;
    const springLen = num(values, "springLen");
    const wire = num(values, "coilWire");
    const c = num(values, "clearance");
    const eyeR = num(values, "eyeR");
    const eyeSp = num(values, "eyeSpacing");
    const mouthW = num(values, "mouthWidth");
    const gap = num(values, "layoutGap");
    const assembled = bool(values, "assembled");
    const springForm = num(values, "springForm");
    const ballSplit = bool(values, "ballSplit");

    // shared joint: peg on ball + handle, socket at both ends of the spring
    const pegR = 3;
    const pegLen = 13;
    const sockR = pegR + c;
    const sockOuterR = pegR + 3;

    // assembled Z stack: handle 0..H, peg up; spring sockets/coil; ball on top.
    // Each socket tube is (pegLen+1) tall; the ball rests on the top socket with
    // only its peg reaching down inside, so the sphere never hits the tube.
    const handleTopZ = handleLen;
    const botSockZ = handleTopZ; // bottom socket start (receives handle peg)
    const coilBotZ = botSockZ + pegLen + 2;
    const coilTopZ = coilBotZ + springLen;
    const topSockZ = coilTopZ; // top socket start (receives ball peg)
    const ballBottomZ = topSockZ + pegLen + 1; // sphere bottom sits on the socket top
    const ballCz = ballBottomZ + ballR;

    // parts in assembled pose + the extra rotation that lays them flat to print
    const parts: { asm: Manifold; printRot: [number, number, number] }[] = [];

    // ---- Handle: tapered rod + top peg ----
    if (bool(values, "incHandle")) {
      let h = M.Manifold.cylinder(handleLen, hr, hr * 0.85, 48);
      h = M.Manifold.union(h, M.Manifold.sphere(hr, 32).scale([1, 1, 0.6]));
      h = M.Manifold.union(h, M.Manifold.cylinder(pegLen + 2, pegR, pegR, 32).translate([0, 0, handleTopZ - 2]));
      parts.push({ asm: h, printRot: [0, 90, 0] }); // lie down to print
    }

    // ---- Spring: coil + a socket tube at each end ----
    if (bool(values, "incSpring")) {
      const sockTube = (z0: number) =>
        M.Manifold.cylinder(pegLen + 1, sockOuterR, sockOuterR, 40)
          .subtract(M.Manifold.cylinder(pegLen + 2, sockR, sockR, 32).translate([0, 0, -1]))
          .translate([0, 0, z0]);
      let s = sockTube(botSockZ); // bottom socket (receives handle peg)
      const middle =
        springForm === 0
          ? ribbedSpindle(M, sockOuterR - 2, sockOuterR, coilBotZ, coilTopZ)
          : coil(M, sockOuterR - wire / 2, wire, Math.max(5, springLen / 3.5), coilBotZ, coilTopZ);
      s = M.Manifold.union(s, middle);
      s = M.Manifold.union(s, sockTube(topSockZ)); // top socket (receives ball peg)
      parts.push({ asm: s, printRot: [0, 0, 0] }); // print standing (coil axis up)
    }

    // ---- Ball: face sphere + downward peg ----
    if (bool(values, "incBall")) {
      const { head, faceY } = ballHead(M, ballR, ballCz);
      let ball = M.Manifold.union(
        head,
        // peg down into the top socket, extending 3mm up into the sphere to fuse
        M.Manifold.cylinder(pegLen + 3, pegR, pegR, 32).translate([0, 0, ballBottomZ - pegLen])
      );
      ball = addFace(M, ball, ballR, faceY, ballCz, eyeR, eyeSp, mouthW);
      if (ballSplit) {
        // cut front/back at y=0 so the seam runs around the sides, not the face
        const big = M.Manifold.cube([ballR * 4, ballR * 4, ballR * 4], true);
        const front = ball.subtract(big.translate([0, -ballR * 2, 0])); // keep y >= 0 (the face)
        const back = ball.subtract(big.translate([0, ballR * 2, 0])); // keep y <= 0
        parts.push({ asm: front, printRot: [90, 0, 0] }); // cut-down, face up
        parts.push({ asm: back, printRot: [-90, 0, 0] }); // cut-down, dome up
      } else {
        // whole ball: print flat-face-down (a small base; the lower dome may want
        // light support — turn on 球對半分印 for a fully support-free print)
        parts.push({ asm: ball, printRot: [-90, 0, 0] });
      }
    }

    if (parts.length === 0) throw new Error("至少要勾選一個分件");

    if (assembled) {
      const all = parts.length === 1 ? parts[0].asm : M.Manifold.union(parts.map((p) => p.asm));
      const b = all.boundingBox();
      return all.translate([-b.min[0], -b.min[1], -b.min[2]]);
    }
    return layoutParts(M, parts.map((p) => p.asm.rotate(p.printRot)), gap);
  },
};
