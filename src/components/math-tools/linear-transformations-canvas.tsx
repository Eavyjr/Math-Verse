'use client';

import React from 'react'; // Import React if using JSX directly
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Props expected by the importing page
interface LinearTransformationsCanvasViewProps {
  matrix: number[][]; // Will be unused by this simple sample
  showError: (message: string | null) => void; // Will be unused by this simple sample
}

export default function LinearTransformationsCanvasView({ matrix, showError }: LinearTransformationsCanvasViewProps) {
  // matrix and showError are unused in this simple sample, but kept for signature compatibility
  return (
    <Canvas camera={{ position: [2, 2, 2] }} className="w-full h-full rounded-md bg-background">
      <ambientLight />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
}
