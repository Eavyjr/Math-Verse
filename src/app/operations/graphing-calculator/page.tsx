
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator as CalculatorIcon } from 'lucide-react'; // Renamed Calculator to CalculatorIcon
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

declare global {
  interface Window {
    Desmos?: any;
  }
}

export default function GraphingCalculatorPage() {
  const desmosContainerRef = useRef<HTMLDivElement>(null);
  const desmosCalculatorRef = useRef<any>(null);
  const [desmosError, setDesmosError] = useState<string | null>(null);
  const [isDesmosReady, setIsDesmosReady] = useState(false);

  useEffect(() => {
    const container = desmosContainerRef.current;
    let initIntervalId: NodeJS.Timeout | null = null;
    let calculatorInstance: any = null;

    function initDesmosInstance() {
      if (container && window.Desmos && !desmosCalculatorRef.current) {
        try {
          // Initialize the GraphingCalculator with default options
          // It already includes scientific functions and basic geometry tools.
          calculatorInstance = window.Desmos.GraphingCalculator(container, {
            // Examples of options:
            // expressions: false, // Hide expressions list by default
            // settingsMenu: false, // Hide settings menu
            // zoomButtons: true, // Show zoom buttons
            // lockViewport: true, // Prevent panning/zooming
          });
          desmosCalculatorRef.current = calculatorInstance;
          setIsDesmosReady(true);
          setDesmosError(null);
        } catch (e) {
          console.error("Error initializing Desmos calculator on graphing page:", e);
          setDesmosError("Failed to initialize Desmos graphing calculator.");
          setIsDesmosReady(false);
        }
      }
    }

    if (typeof window.Desmos !== 'undefined') {
      initDesmosInstance();
    } else {
      initIntervalId = setInterval(() => {
        if (typeof window.Desmos !== 'undefined') {
          if (initIntervalId) clearInterval(initIntervalId);
          initDesmosInstance();
        }
      }, 100);
    }

    return () => {
      if (initIntervalId) {
        clearInterval(initIntervalId);
      }
      if (desmosCalculatorRef.current && typeof desmosCalculatorRef.current.destroy === 'function') {
        desmosCalculatorRef.current.destroy();
        desmosCalculatorRef.current = null;
      } else if (calculatorInstance && typeof calculatorInstance.destroy === 'function') {
        calculatorInstance.destroy();
      }
      setIsDesmosReady(false);
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,60px)-var(--footer-height,0px)-2rem)] space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workstations
        </Link>
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <CalculatorIcon className="mr-2 h-6 w-6" /> {/* Use renamed import */}
          Graphing Calculator
        </h1>
      </div>
      
      <Card className="flex-grow flex flex-col shadow-lg">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-lg">Desmos Graphing Calculator</CardTitle>
          <CardDescription className="text-sm">
            Explore functions, plot data, evaluate equations, and utilize scientific and geometry tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 relative">
          <div
            ref={desmosContainerRef}
            className="w-full h-full min-h-[500px] md:min-h-[calc(100%-0px)]" // Ensure it takes full height within CardContent
            aria-label="Interactive Desmos Graphing Calculator"
          >
            {!isDesmosReady && !desmosError && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Loading Desmos Calculator...</p>
              </div>
            )}
            {desmosError && (
              <div className="flex items-center justify-center h-full text-destructive p-4">
                <p>{desmosError}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
