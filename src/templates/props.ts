import type { Template, ParamValues } from "./types";
import { num, bool } from "./types";
import type { Manifold } from "manifold-3d";

/* =====================================================================
 * 烏薩奇臉權杖 Usagi Face Mace — 娃娃手持道具
 * 長柄 + 頂端白臉頭(圓眼 + 閃電嘴),參考吉伊卡哇烏薩奇武器。
 * =================================================================== */

export const usagiMaceTemplate: Template = {
  id: "usagi-mace",
  name: "烏薩奇臉權杖(娃娃道具) Usagi Face Mace",
  description:
    "吉伊卡哇烏薩奇手上的長柄武器:握柄頂端一顆白臉頭(兩顆圓眼 + 閃電鋸齒嘴)。預設 ~7cm 給 10cm 娃娃拿。臉做成平面正臉、五官微凸,建議『臉朝上平躺列印』最清晰、免支撐;想分色的話直立印、在脖子高度換料(下柄深色、上頭白色)。可選握把防滑環與頂端鑰匙圈吊孔。",
  category: "storage-display",
  params: [
    { kind: "number", key: "handleLen", label: "握柄長度", min: 20, max: 90, step: 1, default: 44, unit: "mm" },
    { kind: "number", key: "handleDia", label: "握柄粗細", min: 4, max: 14, step: 0.5, default: 6.5, unit: "mm" },
    { kind: "number", key: "headH", label: "臉頭高度", min: 14, max: 50, step: 1, default: 27, unit: "mm" },
    { kind: "number", key: "headW", label: "臉頭寬度", min: 12, max: 40, step: 1, default: 22, unit: "mm" },
    { kind: "number", key: "eyeR", label: "眼睛大小", min: 1, max: 4, step: 0.1, default: 2.3, unit: "mm", group: "臉部微調" },
    { kind: "number", key: "eyeSpacing", label: "眼距(中心)", min: 4, max: 20, step: 0.5, default: 9, unit: "mm", group: "臉部微調" },
    { kind: "number", key: "mouthWidth", label: "嘴巴寬度", min: 5, max: 24, step: 0.5, default: 12, unit: "mm", group: "臉部微調" },
    { kind: "boolean", key: "gripRings", label: "握把防滑環", default: true, group: "選項" },
    { kind: "boolean", key: "keychainLoop", label: "頂端鑰匙圈吊孔", default: false, group: "選項" },
  ],
  build: (values: ParamValues, M) => {
    const handleLen = num(values, "handleLen");
    const dia = num(values, "handleDia");
    const headH = num(values, "headH");
    const headW = num(values, "headW");
    const eyeR = num(values, "eyeR");
    const eyeSp = num(values, "eyeSpacing");
    const mouthW = num(values, "mouthWidth");
    const gripRings = bool(values, "gripRings");
    const loop = bool(values, "keychainLoop");

    const r = dia / 2;
    let m: Manifold;

    // ---- handle (slightly tapered, thicker at the top) ----
    m = M.Manifold.cylinder(handleLen, r * 0.88, r, 48);

    // pommel (rounded butt end)
    m = M.Manifold.union(m, M.Manifold.sphere(r * 1.15, 32).scale([1, 1, 0.7]));

    // grip rings (three thin bands on the lower half)
    if (gripRings) {
      for (const f of [0.16, 0.26, 0.36]) {
        m = M.Manifold.union(
          m,
          M.Manifold.cylinder(1.6, r + 0.9, r + 0.9, 40).translate([0, 0, handleLen * f])
        );
      }
    }

    // neck taper into the head
    const headCz = handleLen + headH / 2 - 3;
    m = M.Manifold.union(
      m,
      M.Manifold.cylinder(6, r, headW * 0.34, 48).translate([0, 0, handleLen - 1])
    );

    // ---- head: egg with a flat front face (the "face" plane at y = faceY) ----
    const ax = headW / 2;
    const ay = headW / 2;
    const az = headH / 2;
    let head = M.Manifold.sphere(1, 96).scale([ax, ay, az]).translate([0, 0, headCz]);
    const faceY = ay * 0.45; // cut the front to a flat oval face
    head = head.subtract(
      M.Manifold.cube([headW * 3, headW * 3, headH * 3], true).translate([0, faceY + headW * 1.5, headCz])
    );
    m = M.Manifold.union(m, head);

    // ---- face features, raised proud of the flat face (+Y) ----
    // eyes: two round domes
    const eyeZ = headCz + headH * 0.1;
    for (const sx of [-1, 1]) {
      m = M.Manifold.union(
        m,
        M.Manifold.sphere(eyeR, 40).scale([1, 0.72, 1]).translate([sx * eyeSp / 2, faceY, eyeZ])
      );
    }
    // mouth: a clean raised lightning zigzag (rounded joints, well below the eyes)
    const mouthZ = headCz - headH * 0.15;
    const amp = mouthW * 0.16;
    const pts: [number, number][] = [
      [-mouthW / 2, amp],
      [-mouthW / 6, -amp],
      [mouthW / 6, amp],
      [mouthW / 2, -amp],
    ];
    const stroke = 1.3;
    const proud = 1.0;
    const seg3d = (a: [number, number], b: [number, number]) => {
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      const angDeg = (Math.atan2(-dz, dx) * 180) / Math.PI;
      return M.Manifold.cube([len, proud + 1, stroke], true)
        .rotate([0, angDeg, 0])
        .translate([(a[0] + b[0]) / 2, faceY + (proud + 1) / 2 - 1, mouthZ + (a[1] + b[1]) / 2]);
    };
    for (let i = 0; i < pts.length - 1; i++) m = M.Manifold.union(m, seg3d(pts[i], pts[i + 1]));
    // round each joint so the zigzag reads clean, not as overlapping blocks
    for (const [px, pz] of pts) {
      m = M.Manifold.union(
        m,
        M.Manifold.sphere(stroke * 0.62, 24).scale([1, 0.7, 1]).translate([px, faceY, mouthZ + pz])
      );
    }

    // ---- optional keychain loop at the very top ----
    if (loop) {
      const topZ = headCz + az + 2;
      const ring = M.Manifold.cylinder(3, 5, 5, 40)
        .subtract(M.Manifold.cylinder(5, 2.4, 2.4, 32).translate([0, 0, -1]))
        .rotate([90, 0, 0])
        .translate([0, 0, topZ]);
      m = M.Manifold.union(m, ring);
    }

    // rest on z=0
    const b = m.boundingBox();
    return m.translate([0, 0, -b.min[2]]);
  },
};
