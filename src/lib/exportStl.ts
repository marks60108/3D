import * as THREE from "three";
import { STLExporter } from "three-stdlib";

export function downloadStl(geometry: THREE.BufferGeometry, filename: string) {
  const mesh = new THREE.Mesh(geometry);
  const exporter = new STLExporter();
  const result = exporter.parse(mesh, { binary: true }) as DataView;
  const blob = new Blob([result.buffer as ArrayBuffer], {
    type: "application/sla",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".stl") ? filename : `${filename}.stl`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
