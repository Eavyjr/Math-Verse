
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Info } from 'lucide-react';
import Image from 'next/image';

interface VisualizationPlaceholderProps {
  expression?: string;
  classification?: string;
}

const getPlaceholderDetails = (classification?: string): { hint: string; placeholderText: string } => {
  if (!classification) return { hint: "math graph", placeholderText: "Math Graph" };
  const lowerClass = classification.toLowerCase();
  if (lowerClass.includes("polynomial") || lowerClass.includes("linear") || lowerClass.includes("quadratic") || lowerClass.includes("cubic")) return { hint: "function plot", placeholderText: "Function Plot" };
  if (lowerClass.includes("trigonometric") || lowerClass.includes("sin") || lowerClass.includes("cos")) return { hint: "trig plot", placeholderText: "Trigonometric Plot" };
  if (lowerClass.includes("exponential") || lowerClass.includes("logarithm")) return { hint: "exponential plot", placeholderText: "Exponential Plot" };
  if (lowerClass.includes("differential equation")) return { hint: "slope field", placeholderText: "Slope Field" };
  if (lowerClass.includes("matrix")) return { hint: "matrix grid", placeholderText: "Matrix Grid" };
  return { hint: "math graph", placeholderText: "Math Graph" };
};

export default function VisualizationPlaceholder({ expression, classification }: VisualizationPlaceholderProps) {
  const { hint, placeholderText: dynamicPlaceholderText } = getPlaceholderDetails(classification);
  
  let displayTextInImage = dynamicPlaceholderText;
  if (expression) {
    // Truncate long expressions for the placeholder image text
    const shortExpr = expression.length > 25 ? expression.substring(0, 22) + "..." : expression;
    displayTextInImage = `${dynamicPlaceholderText}: ${shortExpr}`;
  }
  
  const placeholderUrl = `https://placehold.co/400x250.png?text=${encodeURIComponent(displayTextInImage)}`;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          Dynamic Visualization
        </CardTitle>
        <CardDescription>
          A visual representation of the classified expression will appear here. (Full interactive plotting coming soon!)
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        {expression && (
          <div className="mb-4 p-3 border rounded-md bg-secondary/50 text-sm">
            <p className="font-semibold text-foreground">
              Expression: <span className="font-mono bg-background/70 p-1 rounded">{expression}</span>
            </p>
            {classification && (
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
            key={placeholderUrl} // Add key to force re-render if URL changes
          />
          <p className="flex items-center gap-1 text-sm">
            <Info className="h-4 w-4" />
            {expression ? `Visual for: ${expression}` : "Enter an expression to see its visualization."}
          </p>
        </div>
        <p className="mt-4 text-xs text-muted-foreground italic">
          **Note:** Currently shows a dynamic placeholder. Interactive plotting is under development.
        </p>
      </CardContent>
    </Card>
  );
}
