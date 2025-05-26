
'use client';
/*
// All content is commented out to prevent build errors if dependencies are missing.

import React, { useEffect, useState, useMemo } from 'react';
// import { Canvas } from '@react-three/fiber'; // Dependency removed
// import { OrbitControls, Grid as DreiGrid, Html, Cylinder, Cone } from '@react-three/drei'; // Dependency removed
// import { create, all, matrix as mathMatrix, multiply, column as mathColumn, type Matrix as MathJSMatrixType, norm } from 'mathjs';
// import * as THREE from 'three'; // Dependency removed

// const math = create(all);

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

const ArrowHelper: React.FC<ArrowHelperProps> = ({
  direction,
  origin = new THREE.Vector3(0, 0, 0),
  length,
  color,
  headLengthRatio = 0.2, 
  headWidthRatio = 0.08,  
}) => {
  if (length <= 0.001) return null;

  const normalizedDirection = direction.clone().normalize();
  const headLength = Math.max(0.1, length * headLengthRatio);
  const headWidth = Math.max(0.05, length * headWidthRatio * 2);
  const shaftLength = Math.max(0, length - headLength);
  const shaftRadius = headWidth * 0.2; 

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), 
    normalizedDirection
  );

  return (
    <group position={origin}>
      {shaftLength > 0.001 && (
        // @ts-ignore DREI components not available
        <mesh quaternion={quaternion} position={normalizedDirection.clone().multiplyScalar(shaftLength / 2)}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 8]} />
          <meshStandardMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
      // @ts-ignore DREI components not available
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
      // const mathUserMatrix = mathMatrix(matrix);

      const basis: { vector: [number, number, number], color: string, transformedColor: string, label: string }[] = [
        { vector: [1, 0, 0], color: "#FF6B6B", transformedColor: "#FFBABA", label: "i" },
        { vector: [0, 1, 0], color: "#69F0AE", transformedColor: "#B9F6CA", label: "j" },
        { vector: [0, 0, 1], color: "#74C0FC", transformedColor: "#BBDEFB", label: "k" },
      ];

      const newTransformedVectors = basis.map(b => {
        const originalVec = new THREE.Vector3(...b.vector);
        
        // Placeholder for actual transformation logic since mathjs might not be available
        // or matrix multiplication code is complex to include here without full dependencies
        const transformedVec = originalVec.clone(); // Default to original if transformation fails or is not implemented
        
        // Example of how transformation might look with mathjs if it were active:
        // const mathBasisVector = mathColumn(b.vector[0], b.vector[1], b.vector[2]);
        // const transformedMatrixResult = multiply(mathUserMatrix, mathBasisVector) as MathJSMatrixType;
        // const transformedArray = (transformedMatrixResult.valueOf() as number[][]).flat();
        // transformedVec.set(...transformedArray);


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
      
      // @ts-ignore THREE not fully available
      <primitive object={new THREE.AxesHelper(3)} /> 
      // @ts-ignore DREI components not available
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
            {originalLength > 0.001 && (
              <>
                <ArrowHelper direction={vecInfo.original} length={originalLength} color={vecInfo.color} />
                // @ts-ignore DREI components not available
                <Html 
                  position={vecInfo.original.clone().normalize().multiplyScalar(originalLength + labelOffset)}
                  center
                  distanceFactor={6}
                  occlude // @ts-ignore - occlude might not be available or correctly typed
                >
                  <div style={{ color: vecInfo.color, fontSize: '14px', userSelect: 'none', fontWeight: 'bold', textShadow: '0 0 2px black' }}>{vecInfo.label}</div>
                </Html>
              </>
            )}
            {transformedLength > 0.001 && (
              <>
                <ArrowHelper direction={vecInfo.transformed} length={transformedLength} color={vecInfo.transformedColor} />
                // @ts-ignore DREI components not available
                <Html 
                  position={vecInfo.transformed.clone().normalize().multiplyScalar(transformedLength + labelOffset)}
                  center
                  distanceFactor={6}
                  occlude // @ts-ignore
                >
                  <div style={{ color: vecInfo.transformedColor, fontSize: '14px', userSelect: 'none', fontWeight: 'bold', textShadow: '0 0 2px black' }}>{vecInfo.label + "'"}</div>
                </Html>
              </>
            )}
          </React.Fragment>
        );
      })}
      // @ts-ignore DREI components not available
      <OrbitControls makeDefault minDistance={1} maxDistance={20} />
    </>
  ), [transformedBasisVectors]);
  
  // return (
  //   <Canvas camera={{ position: [3.5, 3.5, 6], fov: 50 }} className="w-full h-full rounded-md">
  //     {sceneElements}
  //   </Canvas>
  // );
  return <div className="w-full h-full flex items-center justify-center text-muted-foreground">3D Canvas temporarily disabled.</div>;
}
*/
// Placeholder to prevent build errors when dependencies are not installed.
export default function LinearTransformationsCanvasView_Disabled() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground p-4">
      <p className="text-center">
        Linear Transformations Canvas View is temporarily disabled due to installation issues with graphics libraries.
      </p>
    </div>
  );
}
