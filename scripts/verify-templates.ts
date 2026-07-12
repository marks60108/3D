import Module from "manifold-3d";
import { templates, defaultValues } from "../src/templates/index.ts";
import type { ParamValues } from "../src/templates/types.ts";

const wasm = await Module();
wasm.setup();

let failures = 0;

function run(id: string, values: ParamValues) {
  const t = templates.find((x) => x.id === id)!;
  try {
    const m = t.build(values, wasm);
    const nTri = m.numTri();
    const nVert = m.numVert();
    const box = m.boundingBox();
    const status = m.status();
    const size = [
      box.max[0] - box.min[0],
      box.max[1] - box.min[1],
      box.max[2] - box.min[2],
    ];
    const ok = nTri > 0 && nVert > 0 && status === "NoError";
    if (!ok) failures++;
    console.log(
      `[${ok ? "OK" : "FAIL"}] ${id}: tri=${nTri} vert=${nVert} size=${size
        .map((x) => x.toFixed(1))
        .join("x")}mm status=${status}`
    );
  } catch (err) {
    failures++;
    console.log(`[FAIL] ${id}: threw ${(err as Error).message}`);
  }
}

for (const t of templates) {
  run(t.id, defaultValues(t.params));
}

function paramsFor(id: string) {
  return defaultValues(templates.find((t) => t.id === id)!.params);
}

console.log("--- variant checks ---");
run("container", { ...paramsFor("container"), hasLid: true });
run("bracket", { ...paramsFor("bracket"), twoHolesPerArm: true });
run("tube", { ...paramsFor("tube"), throughHole: false, innerDiameter: 15 });
run("tube", { ...paramsFor("tube"), innerDiameter: 0 });
run("hook", { ...paramsFor("hook"), twoHoles: false, tipAngle: 0 });
run("hook", { ...paramsFor("hook"), tipAngle: 120 });
run("fan-mount", { ...paramsFor("fan-mount"), leg1OffsetX: 20, leg1OffsetY: -15 });
run("charm-peg-panel", { ...paramsFor("charm-peg-panel"), enableConnectors: false });
run("device-tray", { ...paramsFor("device-tray"), liftHeight: 0 });
run("device-tray", { ...paramsFor("device-tray"), liftHeight: 40 });
run("doll-high-chair", { ...paramsFor("doll-high-chair"), incLegs: false, incTray: false });
run("doll-high-chair", { ...paramsFor("doll-high-chair"), assembled: true });
run("doll-swing", { ...paramsFor("doll-swing"), incArch: false, incFrames: false, incCaps: false });

console.log("--- extreme-value guards ---");
// inner >= outer must still leave a wall, not hollow the part out
run("tube", { ...paramsFor("tube"), outerDiameter: 10, innerDiameter: 20 });
// floor thicker than the box height must not invert the cavity
run("container", { ...paramsFor("container"), height: 5, floorThickness: 6, hasLid: true });
// funnel mouth wider than the body must keep slot walls
run("dimm-installer", { ...paramsFor("dimm-installer"), slotMouthFlare: 4, mainBodyWidth: 6 });
// T-slot must not break through the rail roof
run("fan-mount-frame", { ...paramsFor("fan-mount-frame"), railThickness: 6, slotNeckDepth: 4, slotHeadDepth: 10 });
// hole inset beyond the arm must stay inside the part
run("bracket", { ...paramsFor("bracket"), armA: 12, armB: 12, holeInset: 40 });
// a leg dragged inward on both axes must stay attached to the frame
run("device-riser", { ...paramsFor("device-riser"), leg1OffsetX: 50, leg1OffsetY: 50 });
// tiny chairs/swings must skip the decorative cutout, not shatter
run("doll-high-chair", { ...paramsFor("doll-high-chair"), seatDepth: 45, seatHeight: 30 });
run("doll-swing", { ...paramsFor("doll-swing"), frameBaseWidth: 40, frameHeight: 50 });

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll checks passed");
}
