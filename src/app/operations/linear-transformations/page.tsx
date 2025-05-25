
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shapes, Dices, RotateCcw, Palette, Eye, Sigma, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid as DreiGrid, AxesHelper, Html, Cylinder, Cone } from '@react-three/drei';
import { create, all, matrix as mathMatrix, multiply, column as mathColumn, type Matrix, type MathJsStatic, norm } from 'mathjs';
import * as THREE from 'three'; // Import THREE for Vector3

// Initialize math.js
const math: MathJsStatic = create(all);

const initialMatrix3x3 = (): number[][] => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

interface TransformedVectorInfo {
  original: number[];
  transformed: number[];
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
  origin = new THREE.Vector3(0,0,0),
  length,
  color,
  headLength = length * 0.2, // Default head length
  headWidth = length * 0.1, // Default head width
}) => {
  if (length === 0) return null; // Don't render a zero-length arrow

  const dir = direction.clone().normalize();
  const shaftLength = length - headLength;

  const orientation = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  orientation.setFromUnitVectors(up, dir);

  // Position for the shaft (midpoint)
  const shaftPosition = new THREE.Vector3()
    .copy(dir)
    .multiplyScalar(shaftLength / 2)
    .add(origin);

  // Position for the cone (at the end of the shaft)
  const conePosition = new THREE.Vector3()
    .copy(dir)
    .multiplyScalar(shaftLength)
    .add(origin);

  return (
    <group position={origin}>
      {shaftLength > 0 && (
        <mesh position={shaftPosition} quaternion={orientation}>
          <cylinderGeometry args={[headWidth * 0.3, headWidth * 0.3, shaftLength, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      <mesh position={conePosition} quaternion={orientation}>
        <coneGeometry args={[headWidth, headLength, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};


export default function LinearTransformationsPage() {
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<number[][]>(initialMatrix3x3());
  const [isClient, setIsClient] = useState(false);
  const [transformedBasisVectors, setTransformedBasisVectors] = useState<TransformedVectorInfo[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMatrixChange = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const numValue = parseFloat(value);
    setMatrix(prevMatrix => {
      const newMatrix = prevMatrix.map(row => [...row]);
      newMatrix[rowIndex][colIndex] = isNaN(numValue) ? 0 : numValue;
      return newMatrix;
    });
  };

  const handleRandomizeMatrix = () => {
    setMatrix(
      Array(3)
        .fill(null)
        .map(() =>
          Array(3)
            .fill(null)
            .map(() => parseFloat((Math.random() * 4 - 2).toFixed(1)))
        )
    );
    toast({ title: "Matrix Randomized", description: "3x3 matrix values have been randomized." });
  };

  const handleResetMatrix = () => {
    setMatrix(initialMatrix3x3());
    toast({ title: "Matrix Reset", description: "Matrix reset to identity." });
  };

  useEffect(() => {
    const basisVectorsData = [
      { vector: [1, 0, 0], color: "hsl(var(--chart-1))", transformedColor: "hsla(var(--chart-1), 0.7)", label: "i" },
      { vector: [0, 1, 0], color: "hsl(var(--chart-2))", transformedColor: "hsla(var(--chart-2), 0.7)", label: "j" },
      { vector: [0, 0, 1], color: "hsl(var(--chart-3))", transformedColor: "hsla(var(--chart-3), 0.7)", label: "k" },
    ];

    try {
      const userMatrix = mathMatrix(matrix);
      if (userMatrix.size().length !== 2 || userMatrix.size()[0] !== 3 || userMatrix.size()[1] !== 3) {
        throw new Error("Matrix must be 3x3.");
      }

      const transformed = basisVectorsData.map(b => {
        const basisVector = mathColumn(b.vector);
        const resultMatrix = multiply(userMatrix, basisVector) as Matrix;
        const resultArray = resultMatrix.toArray().flat() as number[];
        return {
          original: b.vector,
          transformed: resultArray,
          color: b.color,
          transformedColor: b.transformedColor,
          label: b.label,
        };
      });
      setTransformedBasisVectors(transformed);
    } catch (error: any) {
      console.error("Error transforming vectors:", error);
      toast({
        variant: "destructive",
        title: "Transformation Error",
        description: error.message || "Could not apply matrix to basis vectors.",
      });
      setTransformedBasisVectors(basisVectorsData.map(b => ({
        ...b,
        transformed: b.vector, // Show original if error
        transformedColor: b.color,
      })));
    }
  }, [matrix, toast]);

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Shapes className="h-8 w-8 mr-3" />
            Linear Transformations Visualizer (3D)
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Explore how 3x3 matrices transform 3D space by visualizing changes to basis vectors.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Sigma className="mr-2 h-5 w-5" />Transformation Matrix (A)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {matrix.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    {row.map((cell, colIndex) => (
                      <Input
                        key={colIndex}
                        type="number"
                        step="0.1"
                        value={cell}
                        onChange={(e) => handleMatrixChange(rowIndex, colIndex, e.target.value)}
                        className="w-full text-center border-2 focus:border-accent focus:ring-accent"
                        aria-label={`Matrix row ${rowIndex + 1} col ${colIndex + 1}`}
                      />
                    ))}
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleRandomizeMatrix} variant="outline" size="sm" className="flex-1">
                    <Dices className="mr-2 h-4 w-4" /> Randomize
                  </Button>
                  <Button onClick={handleResetMatrix} variant="outline" size="sm" className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset (Identity)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Eye className="mr-2 h-5 w-5" />Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm" style={{ backgroundColor: "hsl(var(--chart-1))" }}></div>Original i-vector (Red-ish)</div>
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm" style={{ backgroundColor: "hsl(var(--chart-2))" }}></div>Original j-vector (Green-ish)</div>
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm" style={{ backgroundColor: "hsl(var(--chart-3))" }}></div>Original k-vector (Blue-ish)</div>
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm opacity-70" style={{ backgroundColor: "hsl(var(--chart-1))" }}></div>Transformed i' (Lighter Red-ish)</div>
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm opacity-70" style={{ backgroundColor: "hsl(var(--chart-2))" }}></div>Transformed j' (Lighter Green-ish)</div>
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm opacity-70" style={{ backgroundColor: "hsl(var(--chart-3))" }}></div>Transformed k' (Lighter Blue-ish)</div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="h-[500px] md:h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Palette className="mr-2 h-5 w-5" />3D Viewport</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-md p-0 overflow-hidden">
                {isClient ? (
                  <Canvas camera={{ position: [3.5, 3.5, 5], fov: 50 }}>
                    <ambientLight intensity={Math.PI / 2 * 0.7} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} decay={2} distance={100} />
                    
                    <AxesHelper args={[3]} />
                    <DreiGrid 
                        position={[0, -0.01, 0]}
                        args={[10.5, 10.5]} 
                        cellSize={0.5} 
                        cellThickness={0.5}
                        cellColor={'hsl(var(--border))'}
                        sectionSize={2.5}
                        sectionThickness={1}
                        sectionColor={'hsl(var(--primary))'}
                        fadeDistance={35}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid
                    />
                    
                    <Suspense fallback={null}>
                      {transformedBasisVectors.map((vecInfo, index) => {
                        const originalVec3 = new THREE.Vector3(...vecInfo.original);
                        const transformedVec3 = new THREE.Vector3(...vecInfo.transformed);
                        const originalLength = originalVec3.length();
                        const transformedLength = transformedVec3.length();

                        return (
                          <React.Fragment key={index}>
                            {/* Original Vector */}
                            {originalLength > 0.001 && (
                              <ArrowHelper
                                direction={originalVec3}
                                length={originalLength}
                                color={vecInfo.color}
                                headLength={0.2}
                                headWidth={0.1}
                              />
                            )}
                             <Html position={originalVec3}  style={{ pointerEvents: 'none', fontSize: '12px', color: vecInfo.color, userSelect: 'none' }}>
                                {vecInfo.label}
                             </Html>
                            
                            {/* Transformed Vector */}
                            {transformedLength > 0.001 && (
                              <ArrowHelper
                                direction={transformedVec3}
                                length={transformedLength}
                                color={vecInfo.transformedColor}
                                headLength={0.2}
                                headWidth={0.1}
                              />
                            )}
                             <Html position={transformedVec3} style={{ pointerEvents: 'none', fontSize: '12px', color: vecInfo.transformedColor, userSelect: 'none', opacity: 0.8 }}>
                                {vecInfo.label}'
                             </Html>
                          </React.Fragment>
                        );
                      })}
                    </Suspense>
                    
                    <OrbitControls />
                  </Canvas>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Loading 3D Viewport...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-sm text-muted-foreground">
            Adjust the 3x3 matrix (A) to see how it transforms the standard basis vectors i (red-ish), j (green-ish), and k (blue-ish). The transformed vectors i', j', k' are shown in lighter/translucent shades.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
