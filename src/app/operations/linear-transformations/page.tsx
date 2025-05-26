
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Shapes, RotateCcw, Zap, Info as InfoIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Dynamically import the R3F canvas component
const LinearTransformationsCanvasView = dynamic(
  () => import('@/components/math-tools/linear-transformations-canvas'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Loading 3D Viewport...</p>
      </div>
    )
  }
);

const initialMatrix3x3 = () => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export default function LinearTransformationsPage() {
  const [isClient, setIsClient] = useState(false);
  const [matrix, setMatrix] = useState<number[][]>(initialMatrix3x3());
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
      Array(3).fill(null).map(() => parseFloat((Math.random() * 4 - 2).toFixed(1)))
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
            Enter a 3x3 matrix to visualize its transformation effect on standard basis vectors in 3D space.
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
                        <Zap className="mr-2" /> Randomize
                    </Button>
                    <Button onClick={resetMatrix} variant="destructive" className="w-full">
                        <RotateCcw className="mr-2" /> Reset
                    </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><InfoIcon className="mr-2"/>Legend & Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><span style={{ color: '#FF0000', fontWeight: 'bold' }}>Red</span>: Original i-vector / Transformed i' (light red)</p>
                <p><span style={{ color: '#00FF00', fontWeight: 'bold' }}>Green</span>: Original j-vector / Transformed j' (light green)</p>
                <p><span style={{ color: '#0000FF', fontWeight: 'bold' }}>Blue</span>: Original k-vector / Transformed k' (light blue)</p>
                <p className="text-xs text-muted-foreground mt-2">Original vectors are darker, transformed vectors are lighter.</p>
                 {visualizationError && <Alert variant="destructive" className="mt-2 text-xs"><AlertDescription>{visualizationError}</AlertDescription></Alert>}
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
                  <LinearTransformationsCanvasView matrix={matrix} showError={setVisualizationError} />
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
                This tool visualizes the transformation of standard basis vectors (i, j, k) by the entered 3x3 matrix. Use mouse to rotate, zoom, and pan the 3D view.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
