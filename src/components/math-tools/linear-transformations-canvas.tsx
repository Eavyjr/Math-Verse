
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid as DreiGrid, Html, Cylinder, Cone } from '@react-three/drei';
import { create, all, matrix as mathMatrix, multiply, column as mathColumn, type Matrix as MathJSMatrixType, norm } from 'mathjs';
import * as THREE from 'three'; // Import THREE for Vector3

const math = create(all);

interface TransformedVectorInfo {
  original: THREE.Vector3;
  transformed: THREE.Vector3;
  color: string;
  transformedColor: string;
  label: string;
}

interface ArrowHelperProps {
  direction: THREE.Vector3;
  origin?: THREE.Vector3;
  length: number;
  color: string;
  headLengthRatio?: number;
  headWidthRatio?: number;
}

// Custom Arrow Helper Component using Cylinder and Cone
const ArrowHelper: React.FC<ArrowHelperProps> = ({
  direction,
  origin = new THREE.Vector3(0, 0, 0),
  length,
  color,
  headLengthRatio = 0.2, 
  headWidthRatio = 0.08,  
}) => {
  if (length <= 0.001) return null; // Don't render if length is negligible

  const normalizedDirection = direction.clone().normalize();
  const headLength = Math.max(0.1, length * headLengthRatio);
  const headWidth = Math.max(0.05, length * headWidthRatio * 2); // diameter
  const shaftLength = Math.max(0, length - headLength);
  const shaftRadius = headWidth * 0.2; // Make shaft thinner relative to head

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // Cylinder's default alignment is along Y
    normalizedDirection
  );

  return (
    <group position={origin}>
      {shaftLength > 0.001 && (
        <mesh quaternion={quaternion} position={normalizedDirection.clone().multiplyScalar(shaftLength / 2)}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 8]} />
          <meshStandardMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
      <mesh quaternion={quaternion} position={normalizedDirection.clone().multiplyScalar(shaftLength + headLength / 2)}>
        <coneGeometry args={[headWidth / 2, headLength, 16]} /> 
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};


interface LinearTransformationsCanvasViewProps {
  matrix: number[][];
  showError: (message: string | null) => void;
}

export default function LinearTransformationsCanvasView({ matrix, showError }: LinearTransformationsCanvasViewProps) {
  const [transformedBasisVectors, setTransformedBasisVectors] = useState<TransformedVectorInfo[]>([]);

  useEffect(() => {
    try {
      if (!matrix || matrix.length !== 3 || !matrix.every(row => row.length === 3 && row.every(cell => typeof cell === 'number'))) {
        showError("Invalid matrix: Must be a 3x3 matrix of numbers.");
        setTransformedBasisVectors([]);
        return;
      }
      const mathUserMatrix = mathMatrix(matrix);

      const basis: { vector: [number, number, number], color: string, transformedColor: string, label: string }[] = [
        { vector: [1, 0, 0], color: "#FF6B6B", transformedColor: "#FFBABA", label: "i" }, // Brighter red
        { vector: [0, 1, 0], color: "#69F0AE", transformedColor: "#B9F6CA", label: "j" }, // Brighter green
        { vector: [0, 0, 1], color: "#74C0FC", transformedColor: "#BBDEFB", label: "k" }, // Brighter blue
      ];

      const newTransformedVectors = basis.map(b => {
        const mathBasisVector = mathColumn(b.vector[0], b.vector[1], b.vector[2]);
        const transformedMatrixResult = multiply(mathUserMatrix, mathBasisVector) as MathJSMatrixType;

        const originalVec = new THREE.Vector3(...b.vector);
        const transformedArray = (transformedMatrixResult.valueOf() as number[][]).flat(); // Use valueOf()
        const transformedVec = new THREE.Vector3(...transformedArray);

        return {
          original: originalVec,
          transformed: transformedVec,
          color: b.color,
          transformedColor: b.transformedColor,
          label: b.label,
        };
      });
      setTransformedBasisVectors(newTransformedVectors);
      showError(null);
    } catch (e) {
      console.error("Error transforming vectors:", e);
      if (e instanceof Error) {
        showError(`Error applying transformation: ${e.message}`);
      } else {
        showError("An unknown error occurred during transformation.");
      }
      setTransformedBasisVectors([]);
    }
  }, [matrix, showError]);

  const sceneElements = useMemo(() => (
    <>
      <ambientLight intensity={Math.PI * 0.8} />
      <directionalLight position={[8, 10, 5]} intensity={Math.PI * 1.5} color="#FFFFFF" castShadow />
      <pointLight position={[-8, -5, -10]} intensity={Math.PI * 0.5} color="#FFFFDD" />
      
      <primitive object={new THREE.AxesHelper(3)} />
      <DreiGrid
        infiniteGrid
        cellSize={0.5}
        sectionSize={2.5}
        sectionColor={"hsl(var(--muted-foreground))"}
        cellColor={"hsl(var(--border))"}
        fadeDistance={25}
        fadeStrength={3}
      />

      {transformedBasisVectors.map((vecInfo) => {
        const originalLength = vecInfo.original.length();
        const transformedLength = vecInfo.transformed.length();
        const labelOffset = 0.15;

        return (
          <React.Fragment key={vecInfo.label}>
            {/* Original Vector */}
            {originalLength > 0.001 && (
              <>
                <ArrowHelper direction={vecInfo.original} length={originalLength} color={vecInfo.color} />
                <Html 
                  position={vecInfo.original.clone().normalize().multiplyScalar(originalLength + labelOffset)}
                  center
                  distanceFactor={6}
                  occlude
                >
                  <div style={{ color: vecInfo.color, fontSize: '14px', userSelect: 'none', fontWeight: 'bold', textShadow: '0 0 2px black' }}>{vecInfo.label}</div>
                </Html>
              </>
            )}

            {/* Transformed Vector */}
            {transformedLength > 0.001 && (
              <>
                <ArrowHelper direction={vecInfo.transformed} length={transformedLength} color={vecInfo.transformedColor} />
                <Html 
                  position={vecInfo.transformed.clone().normalize().multiplyScalar(transformedLength + labelOffset)}
                  center
                  distanceFactor={6}
                  occlude
                >
                  <div style={{ color: vecInfo.transformedColor, fontSize: '14px', userSelect: 'none', fontWeight: 'bold', textShadow: '0 0 2px black' }}>{vecInfo.label + "'"}</div>
                </Html>
              </>
            )}
          </React.Fragment>
        );
      })}
      <OrbitControls makeDefault minDistance={1} maxDistance={20} />
    </>
  ), [transformedBasisVectors]);

  return (
    <Canvas camera={{ position: [3.5, 3.5, 6], fov: 50 }} className="w-full h-full rounded-md">
      {sceneElements}
    </Canvas>
  );
}
