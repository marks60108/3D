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
run("doll-high-chair", { ...paramsFor("doll-high-chair"), incBack: false, incSeat: false });
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

console.log("--- doll-high-chair assemblability (joint interference) ---");
{
  const chair = templates.find((x) => x.id === "doll-high-chair")!;
  const base = defaultValues(chair.params);
  const vol = (m: ReturnType<typeof chair.build>) => m.volume();
  const only = (f: ParamValues, extra: ParamValues = {}) =>
    chair.build(
      { ...base, incBack: false, incSeat: false, incLegs: false, incTray: false, ...f, ...extra, assembled: true },
      wasm
    );
  // slip-fit: Vol(A)+Vol(B) - Vol(A∪B) ~ 0 means the parts don't collide
  const pair = (label: string, a: ParamValues, b: ParamValues) => {
    const ov = vol(only(a)) + vol(only(b)) - vol(only({ ...a, ...b }));
    const ok = ov < 30; // real interference is hundreds of mm³; <30 is facet noise
    if (!ok) failures++;
    console.log(`[${ok ? "OK" : "FAIL"}] ${label}: overlap=${ov.toFixed(1)}mm³`);
  };
  pair("seat+legs", { incSeat: true }, { incLegs: true });
  pair("seat+back", { incSeat: true }, { incBack: true });
  pair("seat+tray", { incSeat: true }, { incTray: true });
  // engagement: an oversized tenon MUST interfere, proving the tenons really do
  // sit inside their mortises (a slip-fit alone could also mean "miss entirely")
  const tight = { clearance: -0.5 };
  const eng =
    vol(only({ incSeat: true }, tight)) +
    vol(only({ incLegs: true }, tight)) -
    vol(only({ incSeat: true, incLegs: true }, tight));
  const engOk = eng > 40;
  if (!engOk) failures++;
  console.log(`[${engOk ? "OK" : "FAIL"}] leg engagement @clr=-0.5: overlap=${eng.toFixed(1)}mm³ (must be >40)`);
}

console.log("--- spring-plush-ball assemblability (peg/socket interference) ---");
{
  const ball = templates.find((x) => x.id === "spring-plush-ball")!;
  const base = defaultValues(ball.params);
  const vol = (m: ReturnType<typeof ball.build>) => m.volume();
  const only = (f: ParamValues, extra: ParamValues = {}) =>
    ball.build({ ...base, incBall: false, incSpring: false, incHandle: false, ...f, ...extra, assembled: true }, wasm);
  const pair = (label: string, a: ParamValues, b: ParamValues) => {
    const ov = vol(only(a)) + vol(only(b)) - vol(only({ ...a, ...b }));
    const ok = ov < 40;
    if (!ok) failures++;
    console.log(`[${ok ? "OK" : "FAIL"}] ${label}: overlap=${ov.toFixed(1)}mm³`);
  };
  pair("ball+spring", { incBall: true }, { incSpring: true });
  pair("handle+spring", { incHandle: true }, { incSpring: true });
  const tight = { clearance: -0.6 };
  const eng =
    vol(only({ incBall: true }, tight)) +
    vol(only({ incSpring: true }, tight)) -
    vol(only({ incBall: true, incSpring: true }, tight));
  const engOk = eng > 30;
  if (!engOk) failures++;
  console.log(`[${engOk ? "OK" : "FAIL"}] ball peg engagement @clr=-0.6: overlap=${eng.toFixed(1)}mm³ (must be >30)`);
}

console.log("--- mini-bed assemblability (joint interference) ---");
{
  const bed = templates.find((x) => x.id === "mini-bed")!;
  const base = defaultValues(bed.params);
  const vol = (m: ReturnType<typeof bed.build>) => m.volume();
  const only = (f: ParamValues, extra: ParamValues = {}) =>
    bed.build(
      {
        ...base,
        incPlatform: false,
        incLegs: false,
        incHeadboard: false,
        incFootboard: false,
        ...f,
        ...extra,
        assembled: true,
      },
      wasm
    );
  const pair = (label: string, a: ParamValues, b: ParamValues) => {
    const ov = vol(only(a)) + vol(only(b)) - vol(only({ ...a, ...b }));
    const ok = ov < 30;
    if (!ok) failures++;
    console.log(`[${ok ? "OK" : "FAIL"}] ${label}: overlap=${ov.toFixed(1)}mm³`);
  };
  pair("platform+legs", { incPlatform: true }, { incLegs: true });
  pair("platform+headboard", { incPlatform: true }, { incHeadboard: true });
  pair("platform+footboard", { incPlatform: true }, { incFootboard: true });
  const tight = { clearance: -0.5 };
  const eng =
    vol(only({ incPlatform: true }, tight)) +
    vol(only({ incLegs: true }, tight)) -
    vol(only({ incPlatform: true, incLegs: true }, tight));
  const engOk = eng > 30;
  if (!engOk) failures++;
  console.log(`[${engOk ? "OK" : "FAIL"}] leg peg engagement @clr=-0.5: overlap=${eng.toFixed(1)}mm³ (must be >30)`);
}

console.log("--- mini-table assemblability (joint interference) ---");
{
  const table = templates.find((x) => x.id === "mini-table")!;
  const base = defaultValues(table.params);
  const vol = (m: ReturnType<typeof table.build>) => m.volume();
  const only = (f: ParamValues, extra: ParamValues = {}) =>
    table.build({ ...base, incTop: false, incLegs: false, ...f, ...extra, assembled: true }, wasm);
  const ov = vol(only({ incTop: true })) + vol(only({ incLegs: true })) - vol(only({ incTop: true, incLegs: true }));
  const ok = ov < 30;
  if (!ok) failures++;
  console.log(`[${ok ? "OK" : "FAIL"}] top+legs: overlap=${ov.toFixed(1)}mm³`);
  const tight = { clearance: -0.5 };
  const eng =
    vol(only({ incTop: true }, tight)) +
    vol(only({ incLegs: true }, tight)) -
    vol(only({ incTop: true, incLegs: true }, tight));
  const engOk = eng > 30;
  if (!engOk) failures++;
  console.log(`[${engOk ? "OK" : "FAIL"}] leg peg engagement @clr=-0.5: overlap=${eng.toFixed(1)}mm³ (must be >30)`);
}

console.log("--- mini-shelf assemblability (joint interference) ---");
{
  const shelf = templates.find((x) => x.id === "mini-shelf")!;
  const base = defaultValues(shelf.params);
  const vol = (m: ReturnType<typeof shelf.build>) => m.volume();
  const only = (f: ParamValues, extra: ParamValues = {}) =>
    shelf.build(
      { ...base, incBase: false, incSides: false, incTop: false, incBack: false, ...f, ...extra, assembled: true },
      wasm
    );
  const pair = (label: string, a: ParamValues, b: ParamValues) => {
    const ov = vol(only(a)) + vol(only(b)) - vol(only({ ...a, ...b }));
    const ok = ov < 30;
    if (!ok) failures++;
    console.log(`[${ok ? "OK" : "FAIL"}] ${label}: overlap=${ov.toFixed(1)}mm³`);
  };
  pair("base+sides", { incBase: true }, { incSides: true });
  pair("top+sides", { incTop: true }, { incSides: true });
  pair("base+back", { incBase: true }, { incBack: true });
  pair("base+top", { incBase: true }, { incTop: true }); // sit far apart in Z, sanity check
  const tight = { clearance: -0.5 };
  const eng =
    vol(only({ incBase: true }, tight)) +
    vol(only({ incSides: true }, tight)) -
    vol(only({ incBase: true, incSides: true }, tight));
  const engOk = eng > 30;
  if (!engOk) failures++;
  console.log(`[${engOk ? "OK" : "FAIL"}] side tenon engagement @clr=-0.5: overlap=${eng.toFixed(1)}mm³ (must be >30)`);
}

console.log("--- mini-chair assemblability (joint interference) ---");
{
  const chair = templates.find((x) => x.id === "mini-chair")!;
  const base = defaultValues(chair.params);
  const vol = (m: ReturnType<typeof chair.build>) => m.volume();
  const only = (f: ParamValues, extra: ParamValues = {}) =>
    chair.build({ ...base, incSeat: false, incLegs: false, incBack: false, ...f, ...extra, assembled: true }, wasm);
  const pair = (label: string, a: ParamValues, b: ParamValues) => {
    const ov = vol(only(a)) + vol(only(b)) - vol(only({ ...a, ...b }));
    const ok = ov < 30;
    if (!ok) failures++;
    console.log(`[${ok ? "OK" : "FAIL"}] ${label}: overlap=${ov.toFixed(1)}mm³`);
  };
  pair("seat+legs", { incSeat: true }, { incLegs: true });
  pair("seat+back", { incSeat: true }, { incBack: true });
  const tight = { clearance: -0.5 };
  const eng =
    vol(only({ incSeat: true }, tight)) +
    vol(only({ incLegs: true }, tight)) -
    vol(only({ incSeat: true, incLegs: true }, tight));
  const engOk = eng > 30;
  if (!engOk) failures++;
  console.log(`[${engOk ? "OK" : "FAIL"}] leg peg engagement @clr=-0.5: overlap=${eng.toFixed(1)}mm³ (must be >30)`);
  const backTight =
    vol(only({ incSeat: true }, tight)) +
    vol(only({ incBack: true }, tight)) -
    vol(only({ incSeat: true, incBack: true }, tight));
  const backEngOk = backTight > 30;
  if (!backEngOk) failures++;
  console.log(`[${backEngOk ? "OK" : "FAIL"}] back tenon engagement @clr=-0.5: overlap=${backTight.toFixed(1)}mm³ (must be >30)`);
}

console.log("--- mini-wardrobe assemblability (joint interference) ---");
{
  const ward = templates.find((x) => x.id === "mini-wardrobe")!;
  const base = defaultValues(ward.params);
  const vol = (m: ReturnType<typeof ward.build>) => m.volume();
  const only = (f: ParamValues, extra: ParamValues = {}) =>
    ward.build(
      { ...base, incBase: false, incSides: false, incTop: false, incBack: false, incRod: false, ...f, ...extra, assembled: true },
      wasm
    );
  const pair = (label: string, a: ParamValues, b: ParamValues) => {
    const ov = vol(only(a)) + vol(only(b)) - vol(only({ ...a, ...b }));
    const ok = ov < 30;
    if (!ok) failures++;
    console.log(`[${ok ? "OK" : "FAIL"}] ${label}: overlap=${ov.toFixed(1)}mm³`);
  };
  pair("base+sides", { incBase: true }, { incSides: true });
  pair("top+sides", { incTop: true }, { incSides: true });
  pair("base+back", { incBase: true }, { incBack: true });
  pair("sides+rod", { incSides: true }, { incRod: true });
  const tight = { clearance: -0.5 };
  const eng =
    vol(only({ incBase: true }, tight)) +
    vol(only({ incSides: true }, tight)) -
    vol(only({ incBase: true, incSides: true }, tight));
  const engOk = eng > 30;
  if (!engOk) failures++;
  console.log(`[${engOk ? "OK" : "FAIL"}] side tenon engagement @clr=-0.5: overlap=${eng.toFixed(1)}mm³ (must be >30)`);
  const rodEng =
    vol(only({ incSides: true }, tight)) +
    vol(only({ incRod: true }, tight)) -
    vol(only({ incSides: true, incRod: true }, tight));
  const rodEngOk = rodEng > 5;
  if (!rodEngOk) failures++;
  console.log(`[${rodEngOk ? "OK" : "FAIL"}] rod peg engagement @clr=-0.5: overlap=${rodEng.toFixed(1)}mm³ (must be >5)`);
}

console.log("--- mini-mirror assemblability (joint interference) ---");
{
  const mirror = templates.find((x) => x.id === "mini-mirror")!;
  const base = defaultValues(mirror.params);
  const vol = (m: ReturnType<typeof mirror.build>) => m.volume();
  const only = (f: ParamValues, extra: ParamValues = {}) =>
    mirror.build({ ...base, incFrame: false, incBase: false, ...f, ...extra, assembled: true }, wasm);
  const ov =
    vol(only({ incFrame: true })) + vol(only({ incBase: true })) - vol(only({ incFrame: true, incBase: true }));
  const ok = ov < 30;
  if (!ok) failures++;
  console.log(`[${ok ? "OK" : "FAIL"}] frame+base: overlap=${ov.toFixed(1)}mm³`);
  const tight = { clearance: -0.5 };
  const eng =
    vol(only({ incFrame: true }, tight)) +
    vol(only({ incBase: true }, tight)) -
    vol(only({ incFrame: true, incBase: true }, tight));
  const engOk = eng > 30;
  if (!engOk) failures++;
  console.log(`[${engOk ? "OK" : "FAIL"}] tenon engagement @clr=-0.5: overlap=${eng.toFixed(1)}mm³ (must be >30)`);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll checks passed");
}
