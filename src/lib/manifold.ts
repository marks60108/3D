import Module from "manifold-3d";
import wasmUrl from "manifold-3d/manifold.wasm?url";
import * as THREE from "three";
import type { Manifold, ManifoldToplevel } from "manifold-3d";

let modulePromise: Promise<ManifoldToplevel> | null = null;

export function getManifoldModule(): Promise<ManifoldToplevel> {
  if (!modulePromise) {
    modulePromise = Module({ locateFile: () => wasmUrl }).then((wasm) => {
      wasm.setup();
      return wasm;
    });
  }
  return modulePromise;
}

/** Convert a Manifold solid into a THREE.BufferGeometry (position + normal). */
export function manifoldToGeometry(manifold: Manifold): THREE.BufferGeometry {
  const mesh = manifold.getMesh();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(mesh.vertProperties, mesh.numProp)
  );
  geometry.setIndex(new THREE.BufferAttribute(mesh.triVerts, 1));
  geometry.computeVertexNormals();
  return geometry;
}

/** Axis-aligned bounding box [min, max] in mm of a Manifold. */
export function manifoldBounds(manifold: Manifold): {
  min: [number, number, number];
  max: [number, number, number];
} {
  const box = manifold.boundingBox();
  return { min: box.min, max: box.max };
}
