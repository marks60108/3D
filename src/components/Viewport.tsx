import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";

const BUILD_VOLUME: [number, number, number] = [256, 256, 256];

function BuildVolumeBox({ fits }: { fits: boolean }) {
  const [x, y, z] = BUILD_VOLUME;
  return (
    <group position={[x / 2, y / 2, z / 2]}>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(x, y, z)]} />
        <lineBasicMaterial color={fits ? "#3fae5c" : "#d64545"} />
      </lineSegments>
    </group>
  );
}

interface ViewportProps {
  geometry: THREE.BufferGeometry | null;
  fits: boolean;
}

export function Viewport({ geometry, fits }: ViewportProps) {
  return (
    <Canvas
      camera={{ position: [480, 420, 380], fov: 45, up: [0, 0, 1], near: 1, far: 3000 }}
      style={{ background: "#1a1d21" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[200, 200, 400]} intensity={1.1} />
      <directionalLight position={[-200, -100, 200]} intensity={0.4} />

      <BuildVolumeBox fits={fits} />
      <Grid
        args={[256, 256]}
        rotation={[Math.PI / 2, 0, 0]}
        cellColor="#3a3f45"
        sectionColor="#565d66"
        fadeDistance={800}
        infiniteGrid={false}
      />
      {geometry && (
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#f0a63a" metalness={0.05} roughness={0.55} />
        </mesh>
      )}

      <OrbitControls target={[128, 128, 128]} makeDefault />
    </Canvas>
  );
}

export { BUILD_VOLUME };
