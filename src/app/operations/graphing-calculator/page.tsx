
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator as CalculatorIcon, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

declare global {
  interface Window {
    Desmos?: any;
  }
}

export default function GraphingAndGeometryPage() {
  const desmosGraphingContainerRef = useRef<HTMLDivElement>(null);
  const desmosGraphingInstanceRef = useRef<any>(null);
  const [desmosGraphingError, setDesmosGraphingError] = useState<string | null>(null);
  const [isDesmosGraphingReady, setIsDesmosGraphingReady] = useState(false);

  const desmosGeometryContainerRef = useRef<HTMLDivElement>(null);
  const desmosGeometryInstanceRef = useRef<any>(null);
  const [desmosGeometryError, setDesmosGeometryError] = useState<string | null>(null);
  const [isDesmosGeometryReady, setIsDesmosGeometryReady] = useState(false);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for Graphing Calculator
  useEffect(() => {
    if (!isClient) return;

    const container = desmosGraphingContainerRef.current;
    let initIntervalId: NodeJS.Timeout | null = null;
    let calculatorInstance: any = null;

    function initDesmosGraphingInstance() {
      if (container && window.Desmos && !desmosGraphingInstanceRef.current) {
        try {
          const desmosOptions = {
            keypad: true,
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
          };
          calculatorInstance = window.Desmos.GraphingCalculator(container, desmosOptions);
          desmosGraphingInstanceRef.current = calculatorInstance;
          setIsDesmosGraphingReady(true);
          setDesmosGraphingError(null);
        } catch (e) {
          console.error("Error initializing Desmos Graphing Calculator:", e);
          setDesmosGraphingError("Failed to initialize Desmos Graphing Calculator.");
          setIsDesmosGraphingReady(false);
        }
      }
    }

    if (typeof window.Desmos !== 'undefined') {
      initDesmosGraphingInstance();
    } else {
      initIntervalId = setInterval(() => {
        if (typeof window.Desmos !== 'undefined') {
          if (initIntervalId) clearInterval(initIntervalId);
          initDesmosGraphingInstance();
        }
      }, 100);
    }

    return () => {
      if (initIntervalId) clearInterval(initIntervalId);
      if (desmosGraphingInstanceRef.current && typeof desmosGraphingInstanceRef.current.destroy === 'function') {
        desmosGraphingInstanceRef.current.destroy();
        desmosGraphingInstanceRef.current = null;
      } else if (calculatorInstance && typeof calculatorInstance.destroy === 'function') {
        calculatorInstance.destroy();
      }
      setIsDesmosGraphingReady(false);
    };
  }, [isClient]);

  // Effect for Geometry Calculator
  useEffect(() => {
    if (!isClient) return;

    const container = desmosGeometryContainerRef.current;
    let initIntervalId: NodeJS.Timeout | null = null;
    let geometryInstance: any = null;

    function initDesmosGeometryInstance() {
      if (container && window.Desmos && !desmosGeometryInstanceRef.current) {
        try {
          // Options for Geometry Calculator can be added here if needed
          const desmosOptions = {
            // Common options: settingsMenu, zoomButtons, etc.
            // Geometry specific options might be available, refer to Desmos API docs
          };
          geometryInstance = window.Desmos.GeometryCalculator(container, desmosOptions);
          desmosGeometryInstanceRef.current = geometryInstance;
          setIsDesmosGeometryReady(true);
          setDesmosGeometryError(null);
        } catch (e) {
          console.error("Error initializing Desmos Geometry Calculator:", e);
          setDesmosGeometryError("Failed to initialize Desmos Geometry Calculator.");
          setIsDesmosGeometryReady(false);
        }
      }
    }

    if (typeof window.Desmos !== 'undefined') {
      initDesmosGeometryInstance();
    } else {
      initIntervalId = setInterval(() => {
        if (typeof window.Desmos !== 'undefined') {
          if (initIntervalId) clearInterval(initIntervalId);
          initDesmosGeometryInstance();
        }
      }, 100);
    }

    return () => {
      if (initIntervalId) clearInterval(initIntervalId);
      if (desmosGeometryInstanceRef.current && typeof desmosGeometryInstanceRef.current.destroy === 'function') {
        desmosGeometryInstanceRef.current.destroy();
        desmosGeometryInstanceRef.current = null;
      } else if (geometryInstance && typeof geometryInstance.destroy === 'function') {
        geometryInstance.destroy();
      }
      setIsDesmosGeometryReady(false);
    };
  }, [isClient]);


  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,60px)-var(--footer-height,0px)-2rem)] space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workstations
        </Link>
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <CalculatorIcon className="mr-2 h-6 w-6" />
          Graphing & Geometry
        </h1>
      </div>
      
      <Card className="flex-grow flex flex-col shadow-lg overflow-hidden">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-lg flex items-center">
             <CalculatorIcon className="mr-2 h-5 w-5" /> Desmos Graphing Calculator
          </CardTitle>
          <CardDescription className="text-sm">
            Explore functions, plot data, evaluate equations, and utilize scientific tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 relative min-h-[300px] md:min-h-[400px]">
          <div
            ref={desmosGraphingContainerRef}
            className="w-full h-full"
            aria-label="Interactive Desmos Graphing Calculator"
          >
            {!isClient && (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Initializing graphing calculator...</p>
                </div>
            )}
            {isClient && !isDesmosGraphingReady && !desmosGraphingError && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Loading Desmos Graphing Calculator...</p>
              </div>
            )}
            {desmosGraphingError && (
              <div className="flex items-center justify-center h-full text-destructive p-4">
                <p>{desmosGraphingError}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="flex-grow flex flex-col shadow-lg overflow-hidden mt-6">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-lg flex items-center">
            <Compass className="mr-2 h-5 w-5" /> Desmos Geometry Tool
          </CardTitle>
          <CardDescription className="text-sm">
            Construct geometric figures, explore transformations, and measure angles and distances.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 relative min-h-[300px] md:min-h-[400px]">
          <div
            ref={desmosGeometryContainerRef}
            className="w-full h-full"
            aria-label="Interactive Desmos Geometry Calculator"
          >
            {!isClient && (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Initializing geometry tool...</p>
                </div>
            )}
            {isClient && !isDesmosGeometryReady && !desmosGeometryError && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Loading Desmos Geometry Tool...</p>
              </div>
            )}
            {desmosGeometryError && (
              <div className="flex items-center justify-center h-full text-destructive p-4">
                <p>{desmosGeometryError}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
