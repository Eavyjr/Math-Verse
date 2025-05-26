
// This file is temporarily unused as the component is dynamically imported
// and the feature is disabled due to R3F installation issues.
// Keeping the file structure for when it's re-enabled.

// 'use client';

// import React, { useEffect, useState, useMemo } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, Grid as DreiGrid, Html, Cylinder, Cone } from '@react-three/drei';
// import { create, all, matrix as mathMatrix, multiply, column as mathColumn, type Matrix as MathJSMatrixType, norm } from 'mathjs';
// import * as THREE from 'three';

// const math = create(all);

// interface TransformedVectorInfo {
//   original: THREE.Vector3;
//   transformed: THREE.Vector3;
//   color: string;
//   transformedColor: string;
//   label: string;
// }

// interface ArrowHelperProps {
//   direction: THREE.Vector3;
//   origin?: THREE.Vector3;
//   length: number;
//   color: string;
//   headLengthRatio?: number;
//   headWidthRatio?: number;
// }

// const ArrowHelper: React.FC<ArrowHelperProps> = ({
//   direction,
//   origin = new THREE.Vector3(0, 0, 0),
//   length,
//   color,
//   headLengthRatio = 0.2, // as a ratio of total length
//   headWidthRatio = 0.1,   // as a ratio of total length
// }) => {
//   if (length <= 0.001) return null;

//   const headLength = Math.max(0.05, length * headLengthRatio); // Ensure minimum head length
//   const headWidth = Math.max(0.025, length * headWidthRatio); // Ensure minimum head width
//   const shaftLength = Math.max(0, length - headLength);

//   const endPoint = new THREE.Vector3().copy(direction).normalize().multiplyScalar(length).add(origin);
//   const shaftVec = new THREE.Vector3().copy(direction).normalize();

//   const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), shaftVec.clone());

//   return (
//     <group>
//       {shaftLength > 0.001 && (
//         <mesh
//           position={origin.clone().add(shaftVec.clone().multiplyScalar(shaftLength / 2))}
//           quaternion={quaternion}
//         >
//           <cylinderGeometry args={[headWidth * 0.2, headWidth * 0.2, shaftLength, 8]} />
//           <meshStandardMaterial color={color} transparent opacity={0.8} />
//         </mesh>
//       )}
//       <mesh
//         position={origin.clone().add(shaftVec.clone().multiplyScalar(shaftLength + headLength / 2))}
//         quaternion={quaternion}
//       >
//         <coneGeometry args={[headWidth, headLength, 16]} />
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
//       if (!matrix || matrix.length !== 3 || !matrix.every(row => row.length === 3)) {
//         showError("Invalid matrix: Must be a 3x3 matrix.");
//         setTransformedBasisVectors([]);
//         return;
//       }
//       const mathUserMatrix = mathMatrix(matrix);

//       const basis: { vector: [number, number, number], color: string, transformedColor: string, label: string }[] = [
//         { vector: [1, 0, 0], color: "#FF0000", transformedColor: "#FFAAAA", label: "i" },
//         { vector: [0, 1, 0], color: "#00FF00", transformedColor: "#AAFFAA", label: "j" },
//         { vector: [0, 0, 1], color: "#0000FF", transformedColor: "#AAAAFF", label: "k" },
//       ];

//       const newTransformedVectors = basis.map(b => {
//         const mathBasisVector = mathColumn(b.vector);
//         const transformedMatrixResult = multiply(mathUserMatrix, mathBasisVector) as MathJSMatrixType;

//         const originalVec = new THREE.Vector3(...b.vector);
//         const transformedArray = (transformedMatrixResult.toArray() as number[][]).flat();
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
//       <ambientLight intensity={1.0 * Math.PI} />
//       <pointLight position={[8, 8, 8]} decay={0} intensity={Math.PI * 0.8} color="#FFFFFF" />
//       <directionalLight position={[-5, 5, 5]} intensity={1.0} color="#FFFFFF" />
//       <primitive object={new THREE.AxesHelper(2.5)} />
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

//         return (
//           <React.Fragment key={vecInfo.label}>
//             {/* Original Vector */}
//             {originalLength > 0.001 && (
//               <>
//                 <ArrowHelper direction={vecInfo.original} length={originalLength} color={vecInfo.color} />
//                 <Html position={vecInfo.original.clone().multiplyScalar(1.1)}>
//                   <div style={{ color: vecInfo.color, fontSize: '12px', userSelect: 'none', fontWeight: 'bold' }}>{vecInfo.label}</div>
//                 </Html>
//               </>
//             )}

//             {/* Transformed Vector */}
//             {transformedLength > 0.001 && (
//               <>
//                 <ArrowHelper direction={vecInfo.transformed} length={transformedLength} color={vecInfo.transformedColor} />
//                 <Html position={vecInfo.transformed.clone().multiplyScalar(1.1)}>
//                   <div style={{ color: vecInfo.transformedColor, fontSize: '12px', userSelect: 'none', fontWeight: 'bold' }}>{vecInfo.label + "'"}</div>
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
//     <Canvas camera={{ position: [3, 3, 5], fov: 50 }} className="w-full h-full rounded-md">
//       {sceneElements}
//     </Canvas>
//   );
// }
