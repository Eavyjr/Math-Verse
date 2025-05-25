
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shapes, Dices, Trash2, PlusCircle, MinusCircle, RotateCcw, Palette, Eye, Sigma } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Placeholder for future react-three-fiber imports
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, Box, Sphere, Line } from '@react-three/drei';

const initialMatrix3x3 = () => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export default function LinearTransformationsPage() {
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<number[][]>(initialMatrix3x3());
  // Add state for vectors, shapes to transform, etc. later

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
            .map(() => parseFloat((Math.random() * 20 - 10).toFixed(1)))
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
                  (Options for displaying basis vectors, unit cube, custom vectors, etc. - Coming Soon)
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
              <CardContent className="flex-grow flex items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-md">
                {/* Canvas for react-three-fiber will go here */}
                <p className="text-muted-foreground text-center">
                  3D Visualization Area
                  <br />
                  (react-three-fiber integration coming soon)
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-sm text-muted-foreground">
            Interact with the 3x3 matrix to see its effect on 3D space. More features and shapes coming soon.
            Requires <code className="text-xs">three</code> and <code className="text-xs">@react-three/fiber</code> to be installed.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
