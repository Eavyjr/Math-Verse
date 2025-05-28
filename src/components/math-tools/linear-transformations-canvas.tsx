'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// import dynamic from 'next/dynamic'; // Keep commented for now
import { ArrowLeft, Shapes, RotateCcw, Zap, Info as InfoIcon, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import ThreejsLinearTransformationsCanvas from '@/components/math-tools/threejs-linear-transformations-canvas'; // Ensure this is the plain Three.js one

// Dynamically import the canvas view with SSR disabled
// const LinearTransformationsCanvasView = dynamic(
//   () => import('@/components/math-tools/threejs-linear-transformations-canvas'), // Ensure this points to the plain Three.js one
//   {
//     ssr: false,
//     loading: () => (
//       <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
//         <Loader2 className="h-8 w-8 animate-spin mb-2" />
//         <p>Loading 3D Viewport...</p>
//       </div>
//     )
//   }
// );

const initialMatrix3x3 = (): number[][] => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export default function LinearTransformationsPage() {
  const [matrix, setMatrix] = useState<number[][]>(initialMatrix3x3());
  const [isClient, setIsClient] = useState(false);
  const [visualizationError, setVisualizationError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMatrixInputChange = (rowIndex: number, colIndex: number, value: string) => {
    const newValue = parseFloat(value);
    setMatrix(prevMatrix => {
      const newMatrix = prevMatrix.map(row => [...row]);
      newMatrix[rowIndex][colIndex] = isNaN(newValue) ? 0 : newValue;
      return newMatrix;
    });
    setVisualizationError(null); 
  };

  const resetMatrix = useCallback(() => {
    setMatrix(initialMatrix3x3());
    setVisualizationError(null);
    toast({ title: "Matrix Reset", description: "Transformation matrix reset to identity." });
  }, [toast]);

  const randomizeMatrix = useCallback(() => {
    const newMatrix = Array(3).fill(null).map(() =>
      Array(3).fill(null).map(() => parseFloat((Math.random() * 4 - 2).toFixed(1))) // Range -2 to 2
    );
    setMatrix(newMatrix);
    setVisualizationError(null);
    toast({ title: "Matrix Randomized", description: "Transformation matrix has been randomized." });
  }, [toast]);

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
            3D Linear Transformations Visualizer
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Enter a 3x3 matrix to visualize its transformation effect in 3D space.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transformation Matrix (A)</CardTitle>
                <CardDescription>Define the 3x3 transformation matrix.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {matrix.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    {row.map((cell, colIndex) => (
                      <Input
                        key={colIndex}
                        type="number"
                        value={cell}
                        onChange={(e) => handleMatrixInputChange(rowIndex, colIndex, e.target.value)}
                        className="w-full text-center"
                        step="0.1"
                        aria-label={`Matrix A row ${rowIndex + 1} column ${colIndex + 1}`}
                      />
                    ))}
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button onClick={randomizeMatrix} variant="outline" className="w-full">
                    <Zap className="mr-2 h-4 w-4" /> Randomize
                  </Button>
                  <Button onClick={resetMatrix} variant="destructive" className="w-full">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><InfoIcon className="mr-2 h-5 w-5"/>Legend & Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                 <p>Use the input fields to define a 3x3 matrix.</p>
                <p>The 3D viewport will show how this matrix transforms the standard basis vectors (i, j, k).</p>
                <p><span className="font-semibold text-red-500">Red (i):</span> Original X-axis</p>
                <p><span className="font-semibold text-green-500">Green (j):</span> Original Y-axis</p>
                <p><span className="font-semibold text-blue-500">Blue (k):</span> Original Z-axis</p>
                <p><span className="font-semibold" style={{color: '#FFBABA'}}>Light Red (i'):</span> Transformed X-axis</p>
                <p><span className="font-semibold" style={{color: '#B9F6CA'}}>Light Green (j'):</span> Transformed Y-axis</p>
                <p><span className="font-semibold" style={{color: '#BBDEFB'}}>Light Blue (k'):</span> Transformed Z-axis</p>
                {visualizationError && (
                    <Alert variant="destructive" className="mt-2 text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{visualizationError}</AlertDescription>
                    </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="h-[500px] md:h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">3D Viewport</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-md p-0 overflow-hidden">
                {isClient ? (
                  <ThreejsLinearTransformationsCanvas matrix={matrix} />
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
        <CardFooter className="p-4 bg-secondary/30 border-t">
          <p className="text-xs text-muted-foreground">
            Interact with the 3D scene using your mouse (Orbit, Zoom, Pan). Visualization shows effect on basis vectors.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}