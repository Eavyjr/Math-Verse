
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Desmos?: any;
  }
}

const DesmosCalculator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const container = containerRef.current;
    if (!container) return;

    let initIntervalId: NodeJS.Timeout | null = null;
    let calculatorInstance: any = null;

    function initDesmos() {
      if (container && window.Desmos && !instanceRef.current) {
        try {
          calculatorInstance = window.Desmos.GraphingCalculator(container, {
            keypad: true,
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
          });
          instanceRef.current = calculatorInstance;
          setIsReady(true);
          setError(null);
        } catch (e) {
          console.error("Error initializing Desmos Calculator:", e);
          setError("Failed to initialize Desmos Graphing Calculator.");
          setIsReady(false);
        }
      }
    }

    // Check if Desmos script is already loaded
    if (typeof window.Desmos !== 'undefined') {
      initDesmos();
    } else {
      // If not, poll for it. This assumes the script is loaded via next/script in the layout.
      initIntervalId = setInterval(() => {
        if (typeof window.Desmos !== 'undefined') {
          if (initIntervalId) clearInterval(initIntervalId);
          initDesmos();
        }
      }, 100);
    }

    return () => {
      if (initIntervalId) clearInterval(initIntervalId);
      if (instanceRef.current && typeof instanceRef.current.destroy === 'function') {
        instanceRef.current.destroy();
        instanceRef.current = null;
      } else if (calculatorInstance && typeof calculatorInstance.destroy === 'function') {
        calculatorInstance.destroy();
      }
      setIsReady(false);
    };
  }, [isClient]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      aria-label="Interactive Desmos Graphing Calculator"
    >
      {!isReady && !error && (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading Desmos Calculator...</p>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-full text-destructive p-4">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default DesmosCalculator;
