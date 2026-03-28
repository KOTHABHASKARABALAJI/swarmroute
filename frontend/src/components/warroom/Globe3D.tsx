import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createArcPoints(start: THREE.Vector3, end: THREE.Vector3, segments: number, altitude: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(start, end, t);
    const elevation = 1 + altitude * Math.sin(Math.PI * t);
    point.normalize().multiplyScalar(1.01 * elevation);
    points.push(point);
  }
  return points;
}

const EarthMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.001;
  });
  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <meshStandardMaterial color="#0a1628" transparent opacity={0.9} wireframe={false} />
    </Sphere>
  );
};

const WireframeGlobe = () => (
  <Sphere args={[1.005, 32, 32]}>
    <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.06} />
  </Sphere>
);

const RouteArc = ({ sourceCoords, destCoords, progress }: { sourceCoords: [number, number]; destCoords: [number, number]; progress: number }) => {
  const vehicleRef = useRef<THREE.Mesh>(null);

  const { points, lineGeometry } = useMemo(() => {
    const start = latLngToVector3(sourceCoords[0], sourceCoords[1], 1.01);
    const end = latLngToVector3(destCoords[0], destCoords[1], 1.01);
    const pts = createArcPoints(start, end, 80, 0.15);
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    return { points: pts, lineGeometry: geom };
  }, [sourceCoords, destCoords]);

  useFrame(() => {
    if (vehicleRef.current && points.length > 0) {
      const idx = Math.min(Math.floor((progress / 100) * (points.length - 1)), points.length - 1);
      const pt = points[idx];
      vehicleRef.current.position.copy(pt);
    }
  });

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ color: '#00d4ff', transparent: true, opacity: 0.8 }), []);

  return (
    <group>
      <primitive object={new THREE.Line(lineGeometry, lineMaterial)} />
      {/* Vehicle dot */}
      <mesh ref={vehicleRef}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>
      {/* Source point */}
      <mesh position={latLngToVector3(sourceCoords[0], sourceCoords[1], 1.015)}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>
      {/* Dest point */}
      <mesh position={latLngToVector3(destCoords[0], destCoords[1], 1.015)}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
    </group>
  );
};

const AtmosphereGlow = () => (
  <Sphere args={[1.08, 64, 64]}>
    <meshBasicMaterial color="#00d4ff" transparent opacity={0.04} side={THREE.BackSide} />
  </Sphere>
);

interface Globe3DProps {
  sourceCoords: [number, number];
  destCoords: [number, number];
  progress: number;
}

export const Globe3D = ({ sourceCoords, destCoords, progress }: Globe3DProps) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        <pointLight position={[-5, -3, -5]} intensity={0.3} color="#00d4ff" />
        <EarthMesh />
        <WireframeGlobe />
        <AtmosphereGlow />
        <RouteArc sourceCoords={sourceCoords} destCoords={destCoords} progress={progress} />
        <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  );
};
