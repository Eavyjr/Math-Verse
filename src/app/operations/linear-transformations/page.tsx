
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shapes } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Canvas } from '@react-three/fiber'; // Problematic import
import { OrbitControls } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

export default function LinearTransformationsPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
            Linear Transformations Visualizer (3D) - Minimal Test
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Testing minimal R3F Canvas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <Card className="h-[500px] md:h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">3D Viewport</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-md p-0 overflow-hidden">
                {isClient ? (
                  <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <mesh>
                      <boxGeometry args={[1, 1, 1]} />
                      <meshStandardMaterial color="orange" />
                    </mesh>
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
        </CardContent>
      </Card>
    </div>
  );
}
