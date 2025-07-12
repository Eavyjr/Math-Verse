
'use client';

import React, from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator as CalculatorIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DesmosCalculator from '@/components/math-tools/desmos-calculator';

export default function GraphingAndGeometryPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,60px)-var(--footer-height,0px)-2rem)] space-y-6 p-0 sm:p-4">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <Link href="/workstations" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workstations
        </Link>
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <CalculatorIcon className="mr-2 h-6 w-6" />
          Graphing Calculator
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
        <CardContent className="flex-grow p-0 relative min-h-[400px]">
          <DesmosCalculator />
        </CardContent>
      </Card>
    </div>
  );
}
