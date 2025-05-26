
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid as DreiGrid, Html, Cylinder, Cone } from '@react-three/drei';
import { create, all, matrix as mathMatrix, multiply, column as mathColumn, type Matrix as MathJSMatrixType } from 'mathjs';
import * as THREE from 'three';

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
  headLength?: number;
  headWidth?: number;
}

const ArrowHelper: React.FC<ArrowHelperProps> = ({
  direction,
  origin = new THREE.Vector3(0, 0, 0),
  length,
  color,
  headLength = 0.2,
  headWidth = 0.1,
}) => {
  if (length === 0) return null; // Don't render zero-length arrows

  const endPoint = new THREE.Vector3().copy(direction).normalize().multiplyScalar(length).add(origin);
  
  const orientation = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  orientation.lookAt(origin, endPoint, up);

  // Correct the orientation for cylinder (aligns along Y by default)
  // We need to rotate it to point from origin to endPoint
  const shaftVec = new THREE.Vector3().subVectors(endPoint, origin);
  const shaftQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), shaftVec.clone().normalize());

  return (
    <group>
      {/* Shaft */}
      <mesh position={origin.clone().add(shaftVec.clone().multiplyScalar(0.5))} quaternion={shaftQuaternion}>
        <cylinderGeometry args={[headWidth * 0.2, headWidth * 0.2, length - headLength, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={endPoint.clone().sub(shaftVec.clone().normalize().multiplyScalar(headLength / 2))} quaternion={shaftQuaternion}>
        <coneGeometry args={[headWidth, headLength, 8]} />
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
      const mathUserMatrix: MathJSMatrixType = mathMatrix(matrix);

      if (math.size(mathUserMatrix).length !== 2 || math.size(mathUserMatrix).toArray().length !== 3 || (math.size(mathUserMatrix).toArray()[0] as number[]).length !== 3) {
        showError("Matrix must be 3x3 for 3D visualization.");
        setTransformedBasisVectors([]);
        return;
      }

      const basis: { vector: number[], color: string, transformedColor: string, label: string }[] = [
        { vector: [1, 0, 0], color: "#FF0000", transformedColor: "#FFAAAA", label: "i" }, // Red
        { vector: [0, 1, 0], color: "#00FF00", transformedColor: "#AAFFAA", label: "j" }, // Green
        { vector: [0, 0, 1], color: "#0000FF", transformedColor: "#AAAAFF", label: "k" },  // Blue
      ];

      const newTransformedVectors = basis.map(b => {
        const mathBasisVector = mathColumn(b.vector as unknown as number[]);
        const transformedMatrix = multiply(mathUserMatrix, mathBasisVector) as MathJSMatrixType;
        
        const originalVec = new THREE.Vector3(...b.vector);
        const transformedArray = (transformedMatrix.toArray() as number[][]).flat();
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
      showError(null); // Clear any previous error
    } catch (e) {
      console.error("Error transforming vectors:", e);
      showError("Error applying transformation. Check matrix values.");
      setTransformedBasisVectors([]);
    }
  }, [matrix, showError]);

  const sceneElements = useMemo(() => (
    <>
      <ambientLight intensity={1.2 * Math.PI} />
      <pointLight position={[10, 10, 10]} decay={0} intensity={Math.PI} color="#FFFFFF" />
      <directionalLight position={[-5, 5, 5]} intensity={1.5} color="#FFFFFF" />
      <primitive object={new THREE.AxesHelper(3)} />
      <DreiGrid 
        infiniteGrid 
        followCamera={false} 
        fadeDistance={50} 
        fadeStrength={5} 
        cellSize={1} 
        sectionSize={5} 
        sectionColor={"hsl(var(--muted-foreground))"} 
        cellColor={"hsl(var(--border))"} 
      />
      
      {transformedBasisVectors.map((vecInfo) => {
          const originalLength = vecInfo.original.length();
          const transformedLength = vecInfo.transformed.length();
          return (
              <React.Fragment key={vecInfo.label}>
                  {/* Original Vector */}
                  {originalLength > 0.001 && (
                    <>
                      <ArrowHelper direction={vecInfo.original} length={originalLength} color={vecInfo.color} headLength={0.2 * originalLength} headWidth={0.1 * originalLength} />
                      <Html position={vecInfo.original.clone().multiplyScalar(1.1)}>
                          <div style={{ color: vecInfo.color, fontSize: '12px', userSelect: 'none', fontWeight: 'bold' }}>{vecInfo.label}</div>
                      </Html>
                    </>
                  )}

                  {/* Transformed Vector */}
                  {transformedLength > 0.001 && (
                    <>
                      <ArrowHelper direction={vecInfo.transformed} length={transformedLength} color={vecInfo.transformedColor} headLength={0.2 * transformedLength} headWidth={0.1 * transformedLength}/>
                       <Html position={vecInfo.transformed.clone().multiplyScalar(1.1)}>
                          <div style={{ color: vecInfo.transformedColor, fontSize: '12px', userSelect: 'none', fontWeight: 'bold' }}>{vecInfo.label + "'"}</div>
                      </Html>
                    </>
                  )}
              </React.Fragment>
          );
      })}
      <OrbitControls />
    </>
  ), [transformedBasisVectors]);

  return (
    <Canvas camera={{ position: [3, 3, 5], fov: 50 }} className="w-full h-full rounded-md">
      {sceneElements}
    </Canvas>
  );
}
