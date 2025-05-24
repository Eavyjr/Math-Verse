
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Info, AlertTriangle } from 'lucide-react';

interface VisualizationPlaceholderProps {
  expression?: string | null;
  classification?: string | null;
}

declare global {
  interface Window {
    Desmos?: any; // Desmos loads itself onto the window object
  }
}

export default function VisualizationPlaceholder({ expression, classification }: VisualizationPlaceholderProps) {
  const desmosContainerRef = useRef<HTMLDivElement>(null);
  const desmosCalculatorRef = useRef<any>(null); // Stores the Desmos calculator instance
  const [desmosError, setDesmosError] = useState<string | null>(null);
  const [isDesmosReady, setIsDesmosReady] = useState(false);

  useEffect(() => {
    if (typeof window.Desmos !== 'undefined' && desmosContainerRef.current && !desmosCalculatorRef.current) {
      try {
        // Ensure the API key is mentioned in the docs or use a placeholder key from Desmos examples if you don't have one
        // The key 'dsmr_api_0123456789abcdef' is often used in public examples.
        // For production, obtain a proper API key from Desmos.
        const elt = desmosContainerRef.current;
        // Clear previous instance if any
        if (elt.firstChild) {
           elt.removeChild(elt.firstChild);
        }
        desmosCalculatorRef.current = window.Desmos.GraphingCalculator(elt, {
          keypad: false,
          expressions: false,
          settingsMenu: false,
          zoomButtons: true,
          showGrid: true,
        });
        setIsDesmosReady(true);
        setDesmosError(null); // Clear previous errors
      } catch (e) {
        console.error("Error initializing Desmos calculator:", e);
        setDesmosError("Failed to initialize Desmos graphing calculator.");
        setIsDesmosReady(false);
      }
    } else if (!window.Desmos) {
      // Poll for Desmos API if not immediately available
      const intervalId = setInterval(() => {
        if (typeof window.Desmos !== 'undefined' && desmosContainerRef.current && !desmosCalculatorRef.current) {
          clearInterval(intervalId);
          try {
            const elt = desmosContainerRef.current;
            if (elt.firstChild) {
               elt.removeChild(elt.firstChild);
            }
            desmosCalculatorRef.current = window.Desmos.GraphingCalculator(elt, {
                keypad: false,
                expressions: false,
                settingsMenu: false,
                zoomButtons: true,
                showGrid: true,
            });
            setIsDesmosReady(true);
            setDesmosError(null);
          } catch (e) {
            console.error("Error initializing Desmos (retry):", e);
            setDesmosError("Failed to initialize Desmos graphing calculator on retry.");
            setIsDesmosReady(false);
          }
        }
      }, 500);
      return () => clearInterval(intervalId);
    }
  }, []); // Runs once on mount

  useEffect(() => {
    if (desmosCalculatorRef.current && isDesmosReady && expression && expression.trim()) {
      try {
        desmosCalculatorRef.current.setExpression({ id: 'graph1', latex: expression });
        setDesmosError(null); // Clear previous expression errors
      } catch(e) {
        console.error("Error setting expression in Desmos:", e);
        setDesmosError(`Desmos could not plot: ${expression}. Please check the expression syntax.`);
        // Optionally clear the graph if expression is invalid
        // desmosCalculatorRef.current.setExpression({ id: 'graph1', latex: '' });
      }
    } else if (desmosCalculatorRef.current && isDesmosReady && (!expression || !expression.trim())) {
      // Clear the graph if expression is empty or null
      desmosCalculatorRef.current.setExpression({ id: 'graph1', latex: '' });
      setDesmosError(null);
    }
  }, [expression, isDesmosReady]);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          Expression Visualization (via Desmos)
        </CardTitle>
        <CardDescription>
          An interactive plot of the expression powered by Desmos.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        {expression && expression.trim() && (
          <div className="mb-4 p-3 border rounded-md bg-secondary/50 text-sm">
            <p className="font-semibold text-foreground">
              Expression: <span className="font-mono bg-background/70 p-1 rounded">{expression}</span>
            </p>
            {classification && classification !== "Classification not available." && (
              <p className="text-foreground/80">
                Classification: <span className="font-medium">{classification}</span>
              </p>
            )}
          </div>
        )}

        <div 
          ref={desmosContainerRef} 
          className="w-full h-[300px] border-2 border-dashed border-border rounded-md bg-background flex items-center justify-center"
          aria-label="Desmos Graphing Calculator"
        >
          {!isDesmosReady && !desmosError && (
            <p className="flex items-center gap-1 text-sm text-center p-4">
              <Info className="h-4 w-4 shrink-0" />
              Loading Desmos Graphing Calculator...
            </p>
          )}
        </div>
        
        {desmosError && (
            <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-5 w-5"/>
                <AlertTitle>Graphing Error</AlertTitle>
                <AlertDescription>{desmosError}</AlertDescription>
            </Alert>
        )}

        <p className="mt-4 text-xs text-muted-foreground italic">
          **Note:** Graphing is powered by the Desmos API. 
          An API key is required for full functionality; this example uses a placeholder. 
          <a href="https://www.desmos.com/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Get your Desmos API key</a>.
        </p>
      </CardContent>
    </Card>
  );
}
