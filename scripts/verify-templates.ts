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

console.log("--- variant checks ---");
run("container", { ...defaultValues(templates[0].params), hasLid: true });
run("bracket", { ...defaultValues(templates[1].params), twoHolesPerArm: true });
run("tube", { ...defaultValues(templates[2].params), throughHole: false, innerDiameter: 15 });
run("tube", { ...defaultValues(templates[2].params), innerDiameter: 0 });
run("hook", { ...defaultValues(templates[3].params), twoHoles: false, tipAngle: 0 });
run("hook", { ...defaultValues(templates[3].params), tipAngle: 120 });
run("fan-mount", { ...defaultValues(templates[4].params), leg1OffsetX: 20, leg1OffsetY: -15 });
run("charm-peg-panel", { ...defaultValues(templates[8].params), enableConnectors: false });

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll checks passed");
}
