
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Info, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface VisualizationPlaceholderProps {
  expression?: string | null;
  classification?: string | null;
}

const getPlaceholderDetails = (classification?: string | null): { hint: string; placeholderText: string } => {
  if (!classification || classification === "Classification not available.") {
    return { hint: "math graph", placeholderText: "Math Graph" };
  }
  const lowerClass = classification.toLowerCase();
  if (lowerClass.includes("polynomial") || lowerClass.includes("linear") || lowerClass.includes("quadratic") || lowerClass.includes("cubic")) return { hint: "function plot", placeholderText: "Function Plot" };
  if (lowerClass.includes("trigonometric") || lowerClass.includes("sin") || lowerClass.includes("cos")) return { hint: "trig plot", placeholderText: "Trigonometric Plot" };
  if (lowerClass.includes("exponential") || lowerClass.includes("logarithm")) return { hint: "exponential plot", placeholderText: "Exponential Plot" };
  if (lowerClass.includes("differential equation")) return { hint: "slope field", placeholderText: "Slope Field/Solution Curve" };
  if (lowerClass.includes("matrix")) return { hint: "matrix grid", placeholderText: "Matrix Representation" };
  if (lowerClass.includes("identity")) return { hint: "identity graph", placeholderText: "Identity Plot" };
  return { hint: "math graph", placeholderText: "Mathematical Visualization" };
};

export default function VisualizationPlaceholder({ expression, classification }: VisualizationPlaceholderProps) {
  const { hint, placeholderText: dynamicPlaceholderText } = getPlaceholderDetails(classification);
  
  let textInImage = dynamicPlaceholderText;
  if (expression && expression.trim()) {
    const shortExpr = expression.length > 20 ? expression.substring(0, 17) + "..." : expression;
    textInImage = `${dynamicPlaceholderText}: ${shortExpr}`;
  }
  
  const placeholderUrl = `https://placehold.co/400x250.png?text=${encodeURIComponent(textInImage)}`;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          Expression Visualization
        </CardTitle>
        <CardDescription>
          A visual representation based on the classified expression. (Interactive plotting is experimental/coming soon for specific types).
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
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
          <Image
            src={placeholderUrl}
            alt={classification ? `${classification} plot placeholder` : "Graph placeholder"}
            width={400}
            height={250}
            data-ai-hint={hint}
            className="opacity-75 mb-2 rounded-md object-contain max-h-[100px]"
            key={placeholderUrl} 
          />
          <p className="flex items-center gap-1 text-sm text-center">
            <Info className="h-4 w-4 shrink-0" />
            {expression ? `Placeholder visualization for: ${expression}` : "Enter an expression for classification."}
          </p>
        </div>
        <p className="mt-4 text-xs text-muted-foreground italic">
          **Note:** This is a dynamic placeholder image. Actual interactive plotting is limited or under development.
        </p>
      </CardContent>
    </Card>
  );
}
