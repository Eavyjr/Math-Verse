
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
  const desmosCalculatorRef = useRef<any>(null);
  const [desmosError, setDesmosError] = useState<string | null>(null);
  const [isDesmosReady, setIsDesmosReady] = useState(false);

  useEffect(() => {
    const container = desmosContainerRef.current;
    let initIntervalId: NodeJS.Timeout | null = null;

    function initDesmosInstance() {
      if (container && window.Desmos && !desmosCalculatorRef.current) {
        try {
          // Desmos manages its own container content. No need to manually remove children here.
          const calculator = window.Desmos.GraphingCalculator(container, {
            keypad: false,
            expressions: false,
            settingsMenu: false,
            zoomButtons: true,
            showGrid: true,
          });
          desmosCalculatorRef.current = calculator;
          setIsDesmosReady(true);
          setDesmosError(null);
        } catch (e) {
          console.error("Error initializing Desmos calculator:", e);
          setDesmosError("Failed to initialize Desmos graphing calculator.");
          setIsDesmosReady(false);
        }
      }
    }

    if (typeof window.Desmos !== 'undefined') {
      initDesmosInstance();
    } else {
      // Poll for Desmos API if not immediately available
      initIntervalId = setInterval(() => {
        if (typeof window.Desmos !== 'undefined') {
          if (initIntervalId) clearInterval(initIntervalId);
          initDesmosInstance();
        }
      }, 200); // Poll frequently
    }

    // Cleanup function for the main useEffect
    return () => {
      if (initIntervalId) {
        clearInterval(initIntervalId);
      }
      if (desmosCalculatorRef.current && typeof desmosCalculatorRef.current.destroy === 'function') {
        desmosCalculatorRef.current.destroy();
        desmosCalculatorRef.current = null; // Clear the ref
        setIsDesmosReady(false); // Reset ready state
      }
    };
  }, []); // Empty dependency array ensures this runs on mount and unmount

  useEffect(() => {
    if (desmosCalculatorRef.current && isDesmosReady) {
      if (expression && expression.trim()) {
        try {
          desmosCalculatorRef.current.setExpression({ id: 'graph1', latex: expression });
          setDesmosError(null);
        } catch (e) {
          console.error("Error setting expression in Desmos:", e);
          setDesmosError(`Desmos could not plot: "${expression}". Please check the expression syntax.`);
        }
      } else {
        // Clear the graph if expression is empty or null
        if (desmosCalculatorRef.current.setExpression) { // Ensure method exists
            desmosCalculatorRef.current.setExpression({ id: 'graph1', latex: '' });
        }
        setDesmosError(null);
      }
    }
  }, [expression, isDesmosReady]); // Re-run when expression or Desmos readiness changes

  const getPlaceholderDetails = () => {
    if (!classification || classification === "Classification not available." || !expression) {
      return { hint: "math graph", text: "Enter an expression to see a plot" };
    }
    switch (classification.toLowerCase()) {
      case 'polynomial':
      case 'linear equation':
      case 'quadratic equation':
      case 'cubic equation':
        return { hint: "function plot", text: `Plot of: ${classification}` };
      case 'trigonometric identity':
      case 'trigonometric equation':
        return { hint: "trigonometry plot", text: `Plot of: ${classification}` };
      case 'exponential function':
      case 'logarithmic function':
        return { hint: "exponential logarithmic", text: `Plot of: ${classification}` };
      default:
        return { hint: "math visualization", text: `Visualization for: ${classification}` };
    }
  };

  const placeholderDetails = getPlaceholderDetails();

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          Expression Visualization (via Desmos)
        </CardTitle>
        <CardDescription>
          An interactive plot of the expression. Desmos API Key provided by user.
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
           {isDesmosReady && (!expression || !expression.trim()) && !desmosError && (
             <p className="flex items-center gap-1 text-sm text-center p-4">
              <Info className="h-4 w-4 shrink-0" />
              Enter an expression above to plot.
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
          Graphing is powered by the Desmos API.
        </p>
      </CardContent>
    </Card>
  );
}
