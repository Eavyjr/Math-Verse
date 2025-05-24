
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Info, AlertTriangle, Maximize } from 'lucide-react';

interface VisualizationPlaceholderProps {
  expression?: string | null;
  classification?: string | null;
}

declare global {
  interface Window {
    Desmos?: any;
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
    let calculatorInstance: any = null; 

    function initDesmosInstance() {
      if (container && window.Desmos && !desmosCalculatorRef.current) {
        try {
          calculatorInstance = window.Desmos.GraphingCalculator(container, {
            keypad: false,
            expressions: false,
            settingsMenu: false,
            zoomButtons: true,
            showGrid: true,
          });
          desmosCalculatorRef.current = calculatorInstance;
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

  useEffect(() => {
    if (desmosCalculatorRef.current && isDesmosReady) {
      const exprToSet = expression && expression.trim() ? expression : '';
      try {
        desmosCalculatorRef.current.setExpression({ id: 'graph1', latex: exprToSet });
        setDesmosError(null);
      } catch (e) {
        console.error("Error setting expression in Desmos:", e);
        setDesmosError(`Desmos could not plot: "${exprToSet}". Please check the expression syntax.`);
      }
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
          An interactive plot of the classified expression.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(expression && expression.trim() || classification && classification !== "Classification not available.") && (
          <div className="p-3 border rounded-md bg-secondary/50 text-sm">
            {expression && expression.trim() && (
              <p className="font-semibold text-foreground">
                Expression: <span className="font-mono bg-background/70 p-1 rounded">{expression}</span>
              </p>
            )}
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
          aria-label="Desmos Graphing Calculator Preview"
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
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Graphing Error</AlertTitle>
            <AlertDescription>{desmosError}</AlertDescription>
          </Alert>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href="/operations/graphing-calculator">
            <Maximize className="mr-2 h-4 w-4" /> Explore More Graphing
          </Link>
        </Button>

        <p className="text-xs text-muted-foreground italic">
          Graphing is powered by the Desmos API. A valid API key is required for full functionality.
        </p>
      </CardContent>
    </Card>
  );
}
