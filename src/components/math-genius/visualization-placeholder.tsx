
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Info, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface VisualizationPlaceholderProps {
  expression?: string;
  classification?: string;
}

interface PlotDataPoint {
  x: number;
  y: number | null; // Allow null if evaluation fails for a point
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

// Basic "sanitization" - very limited and not foolproof.
// Allows numbers, x, basic operators, common Math functions, parentheses.
const allowedCharsRegex = /^[0-9xX\s\.\+\-\*\/\^\(\)\=\>\<\!\&\|\~%eEa-zA-Z]*$/;
const mathKeywords = ['Math.sin', 'Math.cos', 'Math.tan', 'Math.asin', 'Math.acos', 'Math.atan', 'Math.sqrt', 'Math.log', 'Math.log10', 'Math.exp', 'Math.pow', 'Math.abs', 'Math.PI', 'Math.E'];

function isSafeExpression(expr: string): boolean {
  if (!allowedCharsRegex.test(expr)) {
    console.warn("Expression contains disallowed characters:", expr);
    return false;
  }
  // Further checks can be added, e.g., for keywords like 'window', 'document', 'alert', etc.
  // This is still not a comprehensive security measure.
  const potentiallyUnsafeKeywords = ['window', 'document', 'alert', 'script', 'eval', 'function', 'constructor', 'prototype', '__proto__', 'this'];
  for (const keyword of potentiallyUnsafeKeywords) {
    // Use a regex to check for whole word occurrences to avoid false positives on substrings
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(expr)) {
      console.warn("Expression contains potentially unsafe keyword:", keyword, "in", expr);
      return false;
    }
  }
  return true;
}


export default function VisualizationPlaceholder({ expression, classification }: VisualizationPlaceholderProps) {
  const [plotData, setPlotData] = React.useState<PlotDataPoint[]>([]);
  const [plotError, setPlotError] = React.useState<string | null>(null);
  const [showPlot, setShowPlot] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (expression) {
      setShowPlot(false); // Reset plot visibility on new expression
      setPlotError(null);
      setPlotData([]);

      if (!isSafeExpression(expression)) {
        setPlotError("Expression contains potentially unsafe or unsupported characters for plotting.");
        return;
      }

      let functionBody = expression.toLowerCase();
      // Replace ^ with ** for exponentiation
      functionBody = functionBody.replace(/\^/g, '**');
      // Ensure common math functions are called correctly, e.g. sin(x) -> Math.sin(x)
      // This is a naive replacement and might not cover all cases or be perfectly robust.
      mathKeywords.forEach(keyword => {
        const bareFunc = keyword.substring(5); // e.g., "sin" from "Math.sin"
        // Regex to match function if not already Math.func
        const regex = new RegExp(`(?<!Math\\.)${bareFunc}\\s*\\(`, 'gi');
        functionBody = functionBody.replace(regex, `${keyword}(`);
      });
      
      try {
        // Using new Function for evaluation. This is still risky with unsanitized input.
        // For a production app, a dedicated math parsing/evaluation library is essential.
        const func = new Function('x', `try { return ${functionBody}; } catch(e) { return null; }`);
        const dataPoints: PlotDataPoint[] = [];
        let allYAreNull = true;

        for (let i = 0; i <= 10; i++) { // Generate points from x=0 to x=10 for this example
          const xVal = i;
          let yVal = null;
          try {
            yVal = func(xVal);
            if (typeof yVal !== 'number' || isNaN(yVal) || !isFinite(yVal)) {
              yVal = null; // Ensure yVal is a valid number or null
            }
          } catch (evalError) {
            console.error(`Error evaluating expression for x=${xVal}:`, evalError);
            yVal = null; // Set y to null if evaluation for this point fails
          }
          dataPoints.push({ x: xVal, y: yVal });
          if (yVal !== null) {
            allYAreNull = false;
          }
        }

        if (allYAreNull) {
          setPlotError("Could not evaluate the expression for any x in the range 0-10. Ensure it's a function of 'x'.");
        } else {
          setPlotData(dataPoints);
          setShowPlot(true);
        }

      } catch (e: any) {
        console.error("Error creating or evaluating function from expression:", e);
        setPlotError(`Could not plot expression. Error: ${e.message || "Invalid expression format."}`);
      }
    } else {
      setShowPlot(false);
      setPlotError(null);
      setPlotData([]);
    }
  }, [expression]);

  const { hint, placeholderText } = getPlaceholderDetails(classification);
  const placeholderUrl = `https://placehold.co/400x250.png?text=${encodeURIComponent(plotError || placeholderText)}`;

  const chartConfig = {
    y: { label: "y", color: "hsl(var(--chart-1))" },
  } satisfies Record<string, any>;


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          Dynamic Visualization
        </CardTitle>
        <CardDescription>
          {showPlot && !plotError ? "Plot of the expression" : "Visual representation or placeholder"}
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
                Type: <span className="font-medium">{classification}</span>
              </p>
            )}
          </div>
        )}

        {showPlot && !plotError && plotData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={plotData.filter(p => p.y !== null)} // Only plot points where y is a valid number
                  margin={{
                    top: 5,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} />
                  <YAxis type="number" domain={['auto', 'auto']} />
                  <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Legend />
                  <Line type="monotone" dataKey="y" stroke={chartConfig.y.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} name={expression || "f(x)"} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            <p className="mt-2 text-xs text-center">Plot for x = 0 to 10. Points where evaluation failed are omitted.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
            {plotError && (
                <div className="text-destructive text-center mb-2 p-2 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-5 w-5 inline mr-1"/> Error: {plotError}
                    <p className="text-xs text-muted-foreground mt-1">Showing placeholder instead.</p>
                </div>
            )}
            <Image
              src={placeholderUrl}
              alt={plotError ? "Error placeholder" : (classification ? `${classification} plot placeholder` : "Graph placeholder")}
              width={400}
              height={250}
              data-ai-hint={hint}
              className="opacity-75 mb-2 rounded-md object-contain"
            />
            {!plotError && (
              <p className="flex items-center gap-1 text-sm">
                <Info className="h-4 w-4" />
                {expression ? "Attempting to plot..." : "Enter an expression to see a visualization."}
              </p>
            )}
          </div>
        )}
         <p className="mt-4 text-xs text-muted-foreground italic">
            **Note:** Dynamic plotting is experimental and supports simple functions of 'x' (e.g., 2\*x + 5, x^2, Math.sin(x)). For complex expressions or security, dedicated math parsing libraries are recommended.
        </p>
      </CardContent>
    </Card>
  );
}
