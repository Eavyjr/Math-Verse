
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info as InfoIcon, AlertTriangle } from 'lucide-react';
import ThreejsLinearTransformationsCanvas from '@/components/math-tools/threejs-linear-transformations-canvas';

interface LegendAndInfoProps {
    visualizationError: string | null;
}

export const LegendAndInfo: React.FC<LegendAndInfoProps> = ({ visualizationError }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><InfoIcon className="mr-2 h-5 w-5"/>Legend & Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <p>Use the input fields to define a 3x3 matrix.</p>
                <p>The 3D viewport shows how this matrix transforms the standard basis vectors (i, j, k).</p>
                
                <p><span className="font-semibold" style={{color: "hsl(var(--chart-1))"}}>Red (i):</span> Original X-axis</p>
                <p><span className="font-semibold" style={{color: "hsl(var(--chart-2))"}}>Green (j):</span> Original Y-axis</p>
                <p><span className="font-semibold" style={{color: "hsl(var(--chart-4))"}}>Blue (k):</span> Original Z-axis</p>
                <p className="border-t pt-2 mt-2"><span className="font-semibold text-pink-400">Light Red (i'):</span> Transformed X-axis</p>
                <p><span className="font-semibold text-lime-300">Light Green (j'):</span> Transformed Y-axis</p>
                <p><span className="font-semibold text-cyan-300">Light Blue (k'):</span> Transformed Z-axis</p>

                {visualizationError && (
                    <Alert variant="destructive" className="mt-2 text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{visualizationError}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

interface ViewportProps {
    isClient: boolean;
    matrix: number[][];
}

export const Viewport: React.FC<ViewportProps> = ({ isClient, matrix }) => {
    return (
        <Card className="h-[500px] md:h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl">3D Viewport</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-md p-0 overflow-hidden">
                {isClient ? (
                    <ThreejsLinearTransformationsCanvas matrix={matrix} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p>Loading 3D Viewport...</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
