
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Info, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { create, all } from 'mathjs';

const math = create(all);

interface VisualizationPlaceholderProps {
  expression?: string;
  classification?: string;
}

interface PlotDataPoint {
  x: number;
  y: number | null; // Allow y to be null if evaluation fails for a point
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
  const placeholderText = expression ? `${dynamicPlaceholderText}: ${expression}` : dynamicPlaceholderText;
  const placeholderUrl = `https://placehold.co/400x250.png?text=${encodeURIComponent(placeholderText)}`;

  const [plotData, setPlotData] = React.useState<PlotDataPoint[]>([]);
  const [plotError, setPlotError] = React.useState<string | null>(null);
  const [showPlot, setShowPlot] = React.useState<boolean>(false);

  const chartConfig = {
    y: { label: expression ? (expression.length > 30 ? `${expression.substring(0,27)}...` : expression) : "y", color: "hsl(var(--chart-1))" },
  };

  React.useEffect(() => {
    if (expression) {
      setShowPlot(false); // Reset plot visibility on new expression
      setPlotError(null);
      setPlotData([]);

      try {
        const compiledExpr = math.compile(expression);
        const dataPoints: PlotDataPoint[] = [];
        let validPointsCount = 0;

        // Generate data points (e.g., x from 0 to 10)
        // For a more dynamic range, further analysis of the expression would be needed
        for (let i = 0; i <= 100; i++) { // 101 points for smoother curve
          const x = i / 10; // x from 0 to 10 with 0.1 step
          let yValue: number | null = null;
          try {
            const evaluated = compiledExpr.evaluate({ x });
            if (typeof evaluated === 'number' && isFinite(evaluated)) {
              yValue = parseFloat(evaluated.toFixed(4)); // Limit precision
              validPointsCount++;
            } else if (typeof evaluated === 'object' && 're' in evaluated && 'im' in evaluated && typeof evaluated.re === 'number' && isFinite(evaluated.re)) {
              // Handle complex numbers by plotting the real part if imaginary part is negligible
              if (Math.abs(evaluated.im) < 1e-9) {
                 yValue = parseFloat(evaluated.re.toFixed(4));
                 validPointsCount++;
              } else {
                // For now, skip complex results with significant imaginary parts
              }
            }
          } catch (evalError) {
            // Error evaluating at a specific point, yValue remains null
            console.warn(`Error evaluating expression at x=${x}:`, evalError);
          }
          dataPoints.push({ x: parseFloat(x.toFixed(2)), y: yValue });
        }
        
        if (validPointsCount >= 2) {
          setPlotData(dataPoints);
          setShowPlot(true);
        } else {
          setPlotError("Could not generate enough valid data points to plot the expression. Ensure it's a function of 'x'.");
          setShowPlot(false);
        }

      } catch (error: any) {
        console.error("Error compiling/evaluating expression:", error);
        setPlotError(`Error evaluating expression: ${error.message}. Please check the syntax (e.g., use 'x*x' not 'xx', ensure functions like 'sin(x)' are used).`);
        setShowPlot(false);
      }
    } else {
      // No expression, clear plot
      setShowPlot(false);
      setPlotError(null);
      setPlotData([]);
    }
  }, [expression]);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          Dynamic Visualization
        </CardTitle>
        <CardDescription>
          Attempting to plot the expression. For functions of 'x'. (Experimental)
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

        {showPlot && plotData.length >= 2 && !plotError ? (
          <div className="h-[300px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer>
                <LineChart
                  data={plotData.filter(p => p.y !== null)} // Only plot points with valid y values
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    allowDataOverflow={true}
                    tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
                  />
                  <RechartsTooltip
                    content={<ChartTooltipContent indicator="line" />}
                    formatter={(value: any, name: any) => [typeof value === 'number' ? value.toFixed(2) : value, name]}
                  />
                  <Line
                    type="monotone"
                    dataKey="y"
                    stroke={chartConfig.y.color}
                    strokeWidth={2}
                    dot={false}
                    name={chartConfig.y.label as string}
                    connectNulls={false} // Do not connect lines across null data points
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
             <p className="mt-2 text-xs text-muted-foreground italic">
                Plotting functions of 'x' from x=0 to x=10. This is an experimental feature.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
            {plotError ? (
              <>
                <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                <p className="text-sm text-destructive text-center">{plotError}</p>
              </>
            ) : (
              <>
                <Image
                  src={placeholderUrl}
                  alt={classification ? `${classification} plot placeholder` : "Graph placeholder"}
                  width={400}
                  height={250}
                  data-ai-hint={hint}
                  className="opacity-75 mb-2 rounded-md object-contain max-h-[100px]"
                />
                <p className="flex items-center gap-1 text-sm">
                  <Info className="h-4 w-4" />
                  {expression ? `No plot generated for: ${expression}` : "Enter an expression to visualize."}
                </p>
              </>
            )}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground italic">
            **Note:** Dynamic plotting uses math.js. For optimal results, ensure expressions are valid functions of 'x' (e.g., 'x^2', 'sin(x*pi/2)').
        </p>
      </CardContent>
    </Card>
  );
}
