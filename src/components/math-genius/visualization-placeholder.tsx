import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Info } from 'lucide-react';
import Image from 'next/image';

interface VisualizationPlaceholderProps {
  expression?: string;
  classification?: string;
}

// Helper function to determine a relevant AI hint for image generation
const classificationToHint = (classification?: string): string => {
  if (!classification) return "math graph";
  const lowerClass = classification.toLowerCase();
  if (lowerClass.includes("polynomial") || lowerClass.includes("linear") || lowerClass.includes("quadratic") || lowerClass.includes("cubic")) return "function plot";
  if (lowerClass.includes("trigonometric") || lowerClass.includes("sin") || lowerClass.includes("cos")) return "trig plot";
  if (lowerClass.includes("exponential") || lowerClass.includes("logarithm")) return "exponential plot";
  if (lowerClass.includes("differential equation")) return "slope field";
  if (lowerClass.includes("matrix")) return "matrix grid";
  return "math graph"; // Default hint
};

export default function VisualizationPlaceholder({ expression, classification }: VisualizationPlaceholderProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          Dynamic Visualization
        </CardTitle>
        <CardDescription>
          Visual representation of the expression or related data will appear here.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        {expression && classification && (
          <div className="mb-4 p-3 border rounded-md bg-secondary/50 text-sm">
            <p className="font-semibold text-foreground">
              Expression: <span className="font-mono bg-background/70 p-1 rounded">{expression}</span>
            </p>
            <p className="text-foreground/80">
              Type: <span className="font-medium">{classification}</span>
            </p>
          </div>
        )}
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
          <Image 
            src="https://placehold.co/300x150.png" 
            alt={classification ? `${classification} plot placeholder` : "Graph placeholder"}
            width={300} 
            height={150}
            data-ai-hint={classificationToHint(classification)}
            className="opacity-50 mb-2 rounded-md"
          />
          <p className="flex items-center gap-1 text-sm">
            <Info className="h-4 w-4" />
            Interactive graph/chart coming soon!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
