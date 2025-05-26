
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shapes, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Canvas } from '@react-three/fiber'; 
import { OrbitControls, Box } from '@react-three/drei';


export default function LinearTransformationsPage() {
  const [isClient, setIsClient] = useState(false);
  const [matrix, setMatrix] = useState<number[][]>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simplified matrix input handling
  const handleMatrixInputChange = (rowIndex: number, colIndex: number, value: string) => {
    const newValue = parseFloat(value);
    if (!isNaN(newValue)) {
      const newMatrix = matrix.map((row, rIdx) =>
        rIdx === rowIndex
          ? row.map((cell, cIdx) => (cIdx === colIndex ? newValue : cell))
          : [...row]
      );
      setMatrix(newMatrix);
    }
  };

  const resetMatrix = () => {
    setMatrix([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
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
            Visualize 3D matrix transformations. (Basic R3F Setup)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transformation Matrix (3x3)</CardTitle>
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
                      />
                    ))}
                  </div>
                ))}
                <Button onClick={resetMatrix} variant="outline" className="w-full mt-2">
                  Reset to Identity
                </Button>
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
                  <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
                    <ambientLight intensity={Math.PI / 2} />
                    <pointLight position={[10, 10, 10]} decay={0} intensity={Math.PI} />
                    <Box position={[0, 0, 0]} args={[1, 1, 1]}>
                      <meshStandardMaterial color="orange" />
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
      </Card>
    </div>
  );
}
