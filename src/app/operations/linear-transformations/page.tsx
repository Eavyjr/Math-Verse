
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
import { OrbitControls, Box, Grid as DreiGrid, AxesHelper } from '@react-three/drei'; // Added Grid and AxesHelper

const initialMatrix3x3 = (): number[][] => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export default function LinearTransformationsPage() {
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<number[][]>(initialMatrix3x3());
  const [isClient, setIsClient] = useState(false);

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
            .map(() => parseFloat((Math.random() * 4 - 2).toFixed(1))) // Smaller range for better visualization
        )
    );
    toast({ title: "Matrix Randomized", description: "3x3 matrix values have been randomized." });
  };

  const handleResetMatrix = () => {
    setMatrix(initialMatrix3x3());
    toast({ title: "Matrix Reset", description: "Matrix reset to identity." });
  };

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
            Explore how 3x3 matrices transform 3D space. Visualize changes to vectors and basic shapes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Controls */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Sigma className="mr-2 h-5 w-5" />Transformation Matrix (3x3)</CardTitle>
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
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Eye className="mr-2 h-5 w-5" />Visualization Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  (Options for basis vectors, unit cube, custom vectors - Coming Soon)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: 3D Visualization */}
          <div className="md:col-span-2">
            <Card className="h-[500px] md:h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Palette className="mr-2 h-5 w-5" />3D Viewport</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-md p-0 overflow-hidden">
                {isClient ? (
                  <Canvas camera={{ position: [3, 3, 5], fov: 50 }}>
                    <ambientLight intensity={Math.PI / 2} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
                    
                    <AxesHelper args={[2]} /> {/* Red: X, Green: Y, Blue: Z */}
                    <DreiGrid 
                        position={[0, -0.01, 0]}
                        args={[10.5, 10.5]} 
                        cellSize={0.5} 
                        cellThickness={1}
                        cellColor={'#6f6f6f'}
                        sectionSize={2}
                        sectionThickness={1.5}
                        sectionColor={'hsl(var(--primary))'}
                        fadeDistance={25}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid
                    />
                    
                    {/* Simple Box as a placeholder for future transformed objects */}
                    <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
                      <meshStandardMaterial color="hsl(var(--accent))" />
                    </Box>
                    
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
            Interact with the 3x3 matrix. The 3D visualization will update to show the transformation (future).
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
