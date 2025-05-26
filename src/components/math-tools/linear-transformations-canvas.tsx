
// 'use client';

// import React, { useEffect, useState, useMemo } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, Grid as DreiGrid, Html, Cylinder, Cone } from '@react-three/drei';
// import { create, all, matrix as mathMatrix, multiply, column as mathColumn, type Matrix as MathJSMatrixType, type MathJsStatic, norm } from 'mathjs';
// import * as THREE from 'three'; // Import THREE for Vector3

// const math: MathJsStatic = create(all);

// interface TransformedVectorInfo {
//   original: THREE.Vector3;
//   transformed: THREE.Vector3;
//   color: string;
//   transformedColor: string;
//   label: string;
// }

// interface ArrowHelperProps {
//   direction: THREE.Vector3Tuple;
//   origin?: THREE.Vector3Tuple;
//   length: number;
//   color: string;
//   headLengthRatio?: number;
//   headWidthRatio?: number;
// }

// const ArrowHelper: React.FC<ArrowHelperProps> = ({
//   direction,
//   origin = [0, 0, 0],
//   length,
//   color,
//   headLengthRatio = 0.2, 
//   headWidthRatio = 0.08, 
// }) => {
//   if (length <= 0.001) return null; 

//   const dirVec = new THREE.Vector3(...direction).normalize();
//   const headLength = Math.max(0.1, length * headLengthRatio); 
//   const headWidth = Math.max(0.05, length * headWidthRatio * 2); 
//   const shaftLength = Math.max(0, length - headLength);
//   const shaftRadius = Math.max(0.01, headWidth * 0.2);

//   const quaternion = new THREE.Quaternion().setFromUnitVectors(
//     new THREE.Vector3(0, 1, 0), 
//     dirVec
//   );

//   const shaftPosition = new THREE.Vector3().fromArray(origin).add(dirVec.clone().multiplyScalar(shaftLength / 2));
//   const headPosition = new THREE.Vector3().fromArray(origin).add(dirVec.clone().multiplyScalar(shaftLength + headLength / 2));
  
//   return (
//     <group>
//       {shaftLength > 0.001 && (
//         <mesh position={shaftPosition} quaternion={quaternion}>
//           <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 8]} />
//           <meshStandardMaterial color={color} transparent opacity={0.8} />
//         </mesh>
//       )}
//       <mesh position={headPosition} quaternion={quaternion}>
//         <coneGeometry args={[headWidth / 2, headLength, 16]} />
//         <meshStandardMaterial color={color} />
//       </mesh>
//     </group>
//   );
// };

// interface LinearTransformationsCanvasViewProps {
//   matrix: number[][];
//   showError: (message: string | null) => void;
// }

// export default function LinearTransformationsCanvasView({ matrix, showError }: LinearTransformationsCanvasViewProps) {
//   const [transformedBasisVectors, setTransformedBasisVectors] = useState<TransformedVectorInfo[]>([]);

//   useEffect(() => {
//     try {
//       if (!matrix || matrix.length !== 3 || !matrix.every(row => row.length === 3 && row.every(cell => typeof cell === 'number'))) {
//         showError("Invalid matrix: Must be a 3x3 matrix of numbers.");
//         setTransformedBasisVectors([]);
//         return;
//       }
//       const mathUserMatrix = mathMatrix(matrix);

//       const basis: { vector: [number, number, number], color: string, transformedColor: string, label: string }[] = [
//         { vector: [1, 0, 0], color: "#FF6B6B", transformedColor: "#FFBABA", label: "i" },
//         { vector: [0, 1, 0], color: "#69F0AE", transformedColor: "#B9F6CA", label: "j" },
//         { vector: [0, 0, 1], color: "#74C0FC", transformedColor: "#BBDEFB", label: "k" },
//       ];

//       const newTransformedVectors = basis.map(b => {
//         const originalVec = new THREE.Vector3(...b.vector);
//         const mathBasisVector = mathColumn(b.vector);
        
//         const transformedMatrixResult = math.multiply(mathUserMatrix, mathBasisVector) as MathJSMatrixType;
        
//         const rawArrayData = transformedMatrixResult.toArray();
//         const transformedArray: number[] = (Array.isArray(rawArrayData[0]) ? (rawArrayData as number[][]).flat() : rawArrayData) as number[];

//         if (transformedArray.length !== 3 || transformedArray.some(isNaN)) {
//           throw new Error(`Transformation resulted in an invalid vector for basis ${b.label}.`);
//         }
//         const transformedVec = new THREE.Vector3(...transformedArray);

//         return {
//           original: originalVec,
//           transformed: transformedVec,
//           color: b.color,
//           transformedColor: b.transformedColor,
//           label: b.label,
//         };
//       });
//       setTransformedBasisVectors(newTransformedVectors);
//       showError(null); 
//     } catch (e) {
//       console.error("Error transforming vectors:", e);
//       if (e instanceof Error) {
//         showError(`Error applying transformation: ${e.message}`);
//       } else {
//         showError("An unknown error occurred during transformation.");
//       }
//       setTransformedBasisVectors([]); 
//     }
//   }, [matrix, showError]);

//   const sceneElements = useMemo(() => (
//     <>
//       <ambientLight intensity={Math.PI * 0.8} />
//       <directionalLight position={[8, 10, 5]} intensity={Math.PI * 1.5} color="#FFFFFF" castShadow />
//       <pointLight position={[-8, -5, -10]} intensity={Math.PI * 0.5} color="#FFFFDD" />
      
//       <primitive object={new THREE.AxesHelper(3)} /> 
//       <DreiGrid
//         infiniteGrid
//         cellSize={0.5}
//         sectionSize={2.5}
//         sectionColor={"hsl(var(--muted-foreground))"}
//         cellColor={"hsl(var(--border))"}
//         fadeDistance={25}
//         fadeStrength={3}
//       />

//       {transformedBasisVectors.map((vecInfo) => {
//         const originalLength = vecInfo.original.length();
//         const transformedLength = vecInfo.transformed.length();
//         const labelOffset = 0.15;

//         return (
//           <React.Fragment key={vecInfo.label}>
//             {originalLength > 0.001 && (
//               <>
//                 <ArrowHelper direction={vecInfo.original.toArray() as THREE.Vector3Tuple} length={originalLength} color={vecInfo.color} />
//                 <Html 
//                   position={vecInfo.original.clone().normalize().multiplyScalar(originalLength + labelOffset).toArray() as THREE.Vector3Tuple}
//                   center
//                   distanceFactor={6}
//                   className="pointer-events-none select-none"
//                 >
//                   <div style={{ color: vecInfo.color, fontSize: '14px', fontWeight: 'bold', textShadow: '0 0 2px black' }}>{vecInfo.label}</div>
//                 </Html>
//               </>
//             )}
//             {transformedLength > 0.001 && (
//               <>
//                 <ArrowHelper direction={vecInfo.transformed.toArray() as THREE.Vector3Tuple} length={transformedLength} color={vecInfo.transformedColor} />
//                 <Html 
//                   position={vecInfo.transformed.clone().normalize().multiplyScalar(transformedLength + labelOffset).toArray() as THREE.Vector3Tuple}
//                   center
//                   distanceFactor={6}
//                   className="pointer-events-none select-none"
//                 >
//                   <div style={{ color: vecInfo.transformedColor, fontSize: '14px', fontWeight: 'bold', textShadow: '0 0 2px black' }}>{vecInfo.label + "'"}</div>
//                 </Html>
//               </>
//             )}
//           </React.Fragment>
//         );
//       })}
//       <OrbitControls makeDefault minDistance={1} maxDistance={20} />
//     </>
//   ), [transformedBasisVectors]);
  
//   return (
//     <Canvas camera={{ position: [3.5, 3.5, 6], fov: 50 }} className="w-full h-full rounded-md">
//       {sceneElements}
//     </Canvas>
//   );
// }

// Placeholder content to avoid build errors if R3F dependencies are missing
export default function LinearTransformationsCanvasView_Disabled() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>3D Canvas View is currently disabled due to library installation issues.</p>
    </div>
  );
}
