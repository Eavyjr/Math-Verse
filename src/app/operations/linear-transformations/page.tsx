
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
import { OrbitControls, Grid as DreiGrid, AxesHelper, Arrow, Html } from '@react-three/drei';
import { create, all, matrix as mathMatrix, multiply, column as mathColumn, type Matrix, type MathJsStatic } from 'mathjs';
import type { Vector3 } from 'three';

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
    try {
      const userMatrix: Matrix = mathMatrix(matrix);
      const basis = [
        { vector: [1, 0, 0], color: "hsl(var(--chart-1))", transformedColor: "hsl(var(--chart-1), 0.6)", label: "i" }, // Red-ish
        { vector: [0, 1, 0], color: "hsl(var(--chart-2))", transformedColor: "hsl(var(--chart-2), 0.6)", label: "j" }, // Green-ish
        { vector: [0, 0, 1], color: "hsl(var(--chart-3))", transformedColor: "hsl(var(--chart-3), 0.6)", label: "k" }, // Blue-ish
      ];

      const transformed = basis.map(b => {
        const mathBasisVector = mathMatrix(mathColumn(b.vector));
        const resultMatrix = multiply(userMatrix, mathBasisVector) as Matrix;
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
    } catch (error) {
      console.error("Error transforming vectors:", error);
      toast({
        variant: "destructive",
        title: "Transformation Error",
        description: "Could not apply matrix to basis vectors. Check matrix values.",
      });
      // Reset to identity or some safe state if transformation fails
      setTransformedBasisVectors(basis.map(b => ({
        original: b.vector,
        transformed: b.vector, // Show original if error
        color: b.color,
        transformedColor: b.color, // Show original if error
        label: b.label,
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
            Explore how 3x3 matrices transform 3D space. Visualize changes to basis vectors.
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
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm opacity-60" style={{ backgroundColor: "hsl(var(--chart-1))" }}></div>Transformed i' (Lighter Red-ish)</div>
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm opacity-60" style={{ backgroundColor: "hsl(var(--chart-2))" }}></div>Transformed j' (Lighter Green-ish)</div>
                <div className="flex items-center"><div className="w-4 h-4 mr-2 rounded-sm opacity-60" style={{ backgroundColor: "hsl(var(--chart-3))" }}></div>Transformed k' (Lighter Blue-ish)</div>
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
                  <Canvas camera={{ position: [3, 3, 5], fov: 50 }}>
                    <ambientLight intensity={Math.PI / 2 * 0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} />
                    <pointLight position={[-5, -5, -5]} intensity={0.5} decay={2} distance={100} />
                    
                    <AxesHelper args={[2.5]} />
                    <DreiGrid 
                        position={[0, -0.01, 0]}
                        args={[10.5, 10.5]} 
                        cellSize={0.5} 
                        cellThickness={0.5}
                        cellColor={'hsl(var(--border))'}
                        sectionSize={2}
                        sectionThickness={1}
                        sectionColor={'hsl(var(--primary))'}
                        fadeDistance={30}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid
                    />
                    
                    {transformedBasisVectors.map((vecInfo, index) => (
                      <React.Fragment key={index}>
                        {/* Original Vector */}
                        <Arrow
                          args={[math.norm(vecInfo.original) as number > 0.001 ? math.normalize(vecInfo.original) as any as Vector3 : [0.001,0,0] , [0,0,0], math.norm(vecInfo.original) as number, 0.05, 0.1, 0.07]}
                          position={[0,0,0]}
                          direction={vecInfo.original as any as Vector3}
                          length={math.norm(vecInfo.original) as number}
                          headWidth={0.15}
                          headLength={0.2}
                          color={vecInfo.color}
                        >
                           <Html position={vecInfo.original as [number,number,number]}  style={{ pointerEvents: 'none', fontSize: '10px', color: vecInfo.color }}>
                            {vecInfo.label}
                           </Html>
                        </Arrow>
                        {/* Transformed Vector */}
                        <Arrow
                          args={[math.norm(vecInfo.transformed) as number > 0.001 ? math.normalize(vecInfo.transformed) as any as Vector3 : [0.001,0,0], [0,0,0], math.norm(vecInfo.transformed) as number, 0.05, 0.1, 0.07]}
                          position={[0,0,0]}
                          direction={vecInfo.transformed as any as Vector3}
                          length={math.norm(vecInfo.transformed) as number}
                          headWidth={0.15}
                          headLength={0.2}
                          color={vecInfo.transformedColor}
                        >
                           <Html position={vecInfo.transformed as [number,number,number]} style={{ pointerEvents: 'none', fontSize: '10px', color: vecInfo.transformedColor, opacity: 0.8 }}>
                            {vecInfo.label}'
                           </Html>
                        </Arrow>
                      </React.Fragment>
                    ))}
                    
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
            Adjust the 3x3 matrix (A) to see how it transforms the standard basis vectors i (red), j (green), and k (blue). The transformed vectors i', j', k' are shown in lighter shades.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

