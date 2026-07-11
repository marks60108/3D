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
run("doll-high-chair", { ...paramsFor("doll-high-chair"), incBackrest: false, incSeat: false, incSides: false });
run("doll-swing", { ...paramsFor("doll-swing"), incArch: false, incFrames: false, incCaps: false });

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll checks passed");
}
