
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import katex from 'katex';
import "katex/dist/katex.min.css"; 
import { create, all, type MathJsStatic } from 'mathjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle2, Loader2, Sigma, ArrowLeft, XCircle, Info, Brain, LineChart as LineChartIconLucide } from 'lucide-react';
import { handlePerformIntegrationAction } from '@/app/actions';
import type { IntegrationInput, IntegrationOutput } from '@/ai/flows/perform-integration-flow';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const math: MathJsStatic = create(all);

const renderMath = (latexString: string | undefined, displayMode: boolean = false): string => {
  if (latexString === undefined || latexString === null || typeof latexString !== 'string') return "";
  let cleanLatexString = latexString.trim();

  if ((cleanLatexString.startsWith('\\(') && cleanLatexString.endsWith('\\)')) ||
      (cleanLatexString.startsWith('\\[') && cleanLatexString.endsWith('\\]'))) {
    cleanLatexString = cleanLatexString.substring(2, cleanLatexString.length - 2).trim();
  }
  
  try {
    return katex.renderToString(cleanLatexString, {
      throwOnError: false,
      displayMode: displayMode,
    });
  } catch (e) {
    console.error("Katex rendering error for main result:", e, "Original string:", latexString);
    return cleanLatexString;
  }
};

const renderStepsContent = (stepsString: string | undefined): string => {
  if (!stepsString) return "";
  console.log("renderStepsContent input:", stepsString);

  const parts = stepsString.split(/(\\\(.+?\\\)|\\\[.+?\\\])/g);
  
  const htmlParts = parts.map((part, index) => {
    try {
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const latex = part.slice(2, -2);
        return katex.renderToString(latex, { throwOnError: false, displayMode: false, output: 'html' });
      } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const latex = part.slice(2, -2);
        return katex.renderToString(latex, { throwOnError: false, displayMode: true, output: 'html' });
      }
      return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } catch (e) {
        console.error("KaTeX steps rendering error for part:", part, e);
        return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); 
    }
  });
  const finalHtml = htmlParts.join('');
  console.log("renderStepsContent output HTML:", finalHtml);
  return finalHtml;
};

interface PlotDataItem {
  x: number;
  original?: number;
  integral?: number;
}

const stripLatexDelimitersAndPrepareForMathJS = (latexStr: string | null | undefined): string => {
  if (!latexStr) return "";
  let str = latexStr.trim();
  // Remove outer delimiters if present
  if ((str.startsWith('\\(') && str.endsWith('\\)')) || (str.startsWith('\\[') && str.endsWith('\\]'))) {
    str = str.substring(2, str.length - 2).trim();
  }
  // Replace common LaTeX functions with math.js compatible syntax
  // This is a basic replacement list and might need expansion
  str = str.replace(/\\sin/g, 'sin')
           .replace(/\\cos/g, 'cos')
           .replace(/\\tan/g, 'tan')
           .replace(/\\ln/g, 'log') // math.js uses log for natural log
           .replace(/\\log_{10}/g, 'log10')
           .replace(/\\exp/g, 'exp')
           .replace(/\\sqrt{(.*?)}/g, 'sqrt($1)')
           .replace(/\\frac{(.*?)}{(.*?)}/g, '($1)/($2)')
           .replace(/\\cdot/g, '*')
           .replace(/\^/g, '^');
  // Remove "+ C" from indefinite integrals for plotting
  str = str.replace(/\s*\+\s*C\s*$/i, '');
  return str;
};


export default function IntegrationCalculatorPage() {
  const [functionString, setFunctionString] = useState('');
  const [variable, setVariable] = useState('x');
  const [integralType, setIntegralType] = useState<'indefinite' | 'definite'>('indefinite');
  const [lowerBound, setLowerBound] = useState('');
  const [upperBound, setUpperBound] = useState('');

  const [apiResponse, setApiResponse] = useState<IntegrationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [chartData, setChartData] = useState<PlotDataItem[] | null>(null);
  const [plotError, setPlotError] = useState<string | null>(null);

  useEffect(() => {
    const func = functionString || 'f(x)';
    const v = variable || 'x';
    let latexPreview = '';
    if (integralType === 'definite') {
      const lb = lowerBound || 'a';
      const ub = upperBound || 'b';
      latexPreview = `\\int_{${lb}}^{${ub}} ${func} \\,d${v}`;
    } else {
      latexPreview = `\\int ${func} \\,d${v}`;
    }
    setPreviewHtml(renderMath(latexPreview, true));
  }, [functionString, variable, integralType, lowerBound, upperBound]);

  useEffect(() => {
    if (apiResponse?.originalQuery?.functionString && apiResponse?.integralResult) {
      setPlotError(null);
      const originalFuncStr = stripLatexDelimitersAndPrepareForMathJS(apiResponse.originalQuery.functionString);
      const integralFuncStr = stripLatexDelimitersAndPrepareForMathJS(apiResponse.integralResult);
      const plotVar = apiResponse.originalQuery.variable || 'x';

      if (!originalFuncStr) {
        setPlotError("Original function string is missing for plotting.");
        setChartData(null);
        return;
      }
      if (!integralFuncStr && apiResponse.integralResult && apiResponse.integralResult.trim() !== "" && !isNaN(parseFloat(apiResponse.integralResult))) {
         // If integral is a constant number, no function to plot for integral
         setPlotError("Integral is a constant value, no function to plot for the integral. Original function plotted if possible.");
      } else if (!integralFuncStr) {
         setPlotError("Integral result string is missing or not plottable.");
      }
      
      try {
        const compiledOriginal = math.compile(originalFuncStr);
        let compiledIntegral: any = null;
        if (integralFuncStr) {
           try {
             compiledIntegral = math.compile(integralFuncStr);
           } catch (e: any) {
             console.warn("Error compiling integral function for plot:", e);
             setPlotError(`Could not plot integral: ${e.message}. Original function might still be plotted.`);
           }
        }
        
        const data: PlotDataItem[] = [];
        const xMin = -5; const xMax = 5; const points = 100;
        const step = (xMax - xMin) / (points - 1);

        for (let i = 0; i < points; i++) {
          const xVal = xMin + i * step;
          let originalY: number | undefined = undefined;
          let integralY: number | undefined = undefined;
          const scope = { [plotVar]: xVal, C: 0 }; // Assume C=0 for plotting indefinite integral
          
          try {
            originalY = compiledOriginal.evaluate(scope);
            if (typeof originalY !== 'number' || isNaN(originalY) || !isFinite(originalY)) originalY = undefined;
          } catch (e) { /* ignore eval error for this point */ }

          if (compiledIntegral) {
            try {
              integralY = compiledIntegral.evaluate(scope);
              if (typeof integralY !== 'number' || isNaN(integralY) || !isFinite(integralY)) integralY = undefined;
            } catch (e) { /* ignore eval error for this point */ }
          }
          
          if (originalY !== undefined || integralY !== undefined) {
            data.push({ x: parseFloat(xVal.toFixed(3)), original: originalY, integral: integralY });
          }
        }
        if (data.length > 1) { 
          setChartData(data);
        } else {
          if (!plotError) setPlotError("Not enough valid data points to generate a plot.");
          setChartData(null);
        }

      } catch (e: any) {
        console.error("Error compiling/evaluating original function for plot:", e);
        if (!plotError) setPlotError(`Could not plot original function: ${e.message}. Ensure functions use standard notation (e.g. x^2, sin(x)).`);
        setChartData(null);
      }
    } else {
      setChartData(null);
      setPlotError(null);
    }
  }, [apiResponse]);


  const handleSubmit = async () => {
    if (!functionString.trim()) {
      setError("Please enter a function to integrate.");
      setApiResponse(null);
      return;
    }
    if (!variable.trim()) {
      setError("Please enter a variable of integration.");
      setApiResponse(null);
      return;
    }
    if (integralType === 'definite') {
      if (!lowerBound.trim()) {
        setError("Please enter a lower bound for the definite integral.");
        setApiResponse(null);
        return;
      }
      if (!upperBound.trim()) {
        setError("Please enter an upper bound for the definite integral.");
        setApiResponse(null);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    setChartData(null);
    setPlotError(null);
    
    const input: IntegrationInput = {
      functionString,
      variable,
      isDefinite: integralType === 'definite',
      lowerBound: integralType === 'definite' ? lowerBound : undefined,
      upperBound: integralType === 'definite' ? upperBound : undefined,
    };

    try {
      const actionResult = await handlePerformIntegrationAction(input);
      if (actionResult.error) {
        setError(actionResult.error);
      } else if (actionResult.data) {
        setApiResponse(actionResult.data);
      } else {
        setError('Received no data from the server. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFunctionString('');
    setVariable('x');
    setIntegralType('indefinite');
    setLowerBound('');
    setUpperBound('');
    setApiResponse(null);
    setError(null);
    setChartData(null);
    setPlotError(null);
  };
  
  const getOriginalQueryAsLatex = (query: IntegrationInput | undefined): string => {
    if (!query) return "";
    const funcStr = query.functionString.replace(/\\/g, '\\\\'); 
    const varStr = query.variable.replace(/\\/g, '\\\\');
    
    let latex = `\\int`;
    if (query.isDefinite) {
        const lb = query.lowerBound || 'a';
        const ub = query.upperBound || 'b';
        latex += `_{${lb}}^{${ub}} ${funcStr} \\,d${varStr}`;
    } else {
        latex += ` ${funcStr} \\,d${varStr}`;
    }
    return latex;
  }

  const chartConfig = {
    original: { label: `f(${variable})`, color: "hsl(var(--chart-1))" },
    integral: { label: `∫f(${variable})d${variable}`, color: "hsl(var(--chart-2))" },
  } satisfies Record<string, any>;


  return (
    <div className="space-y-8">
      <Link href="/workstations" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Sigma className="h-8 w-8 mr-3" />
            Integration Calculator
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Calculate definite and indefinite integrals with AI assistance. Results and steps provided.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="p-4 border rounded-md bg-secondary/30">
            <p className="text-xl font-semibold text-center text-primary mb-2">Integral Preview:</p>
            <div 
                className="text-2xl text-center font-mono p-2 bg-background rounded-md overflow-x-auto min-h-[50px] flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label htmlFor="function-input" className="block text-md font-semibold text-foreground">
                Function to integrate, f({variable || 'x'}):
              </Label>
              <Input
                id="function-input"
                type="text"
                placeholder="e.g., x^2 + 2*x + 1 or sin(x)"
                value={functionString}
                onChange={(e) => {
                  setFunctionString(e.target.value);
                  setError(null); setApiResponse(null); setChartData(null); setPlotError(null);
                }}
                className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variable-input" className="block text-md font-semibold text-foreground">
                Variable of integration (e.g., x):
              </Label>
              <Input
                id="variable-input"
                type="text"
                placeholder="x"
                value={variable}
                onChange={(e) => {
                  setVariable(e.target.value || 'x');
                  setError(null); setApiResponse(null); setChartData(null); setPlotError(null);
                }}
                className="text-lg p-3 border-2 focus:border-accent focus:ring-accent w-full md:w-1/2"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="block text-md font-semibold text-foreground">Type of Integral:</Label>
            <RadioGroup
              value={integralType}
              onValueChange={(value: 'indefinite' | 'definite') => {
                setIntegralType(value);
                setError(null); setApiResponse(null); setChartData(null); setPlotError(null);
              }}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="indefinite" id="indefinite" />
                <Label htmlFor="indefinite" className="text-md">Indefinite Integral</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="definite" id="definite" />
                <Label htmlFor="definite" className="text-md">Definite Integral</Label>
              </div>
            </RadioGroup>
          </div>

          {integralType === 'definite' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-2">
                <Label htmlFor="lower-bound-input" className="block text-md font-semibold text-foreground">
                  Lower Bound (a):
                </Label>
                <Input
                  id="lower-bound-input"
                  type="text"
                  placeholder="e.g., 0"
                  value={lowerBound}
                  onChange={(e) => {
                    setLowerBound(e.target.value);
                    setError(null); setApiResponse(null); setChartData(null); setPlotError(null);
                  }}
                  className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upper-bound-input" className="block text-md font-semibold text-foreground">
                  Upper Bound (b):
                </Label>
                <Input
                  id="upper-bound-input"
                  type="text"
                  placeholder="e.g., 1"
                  value={upperBound}
                  onChange={(e) => {
                    setUpperBound(e.target.value);
                    setError(null); setApiResponse(null); setChartData(null); setPlotError(null);
                  }}
                  className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !functionString.trim() || !variable.trim() || (integralType === 'definite' && (!lowerBound.trim() || !upperBound.trim()))}
              size="lg"
              className="flex-grow"
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
              Calculate Integral
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="lg"
              className="flex-grow sm:flex-grow-0"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Clear
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-8 rounded-md bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-xl font-medium text-foreground">
                Calculating integral of &quot;{functionString}&quot;...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Processing Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {apiResponse && !isLoading && !error && (
            <Card className="mt-6 border-accent border-t-4 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center text-primary">
                  <CheckCircle2 className="h-7 w-7 mr-2 text-green-600" />
                  Integration Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 text-lg">
                <div>
                  <span className="font-semibold text-muted-foreground">Original Query: </span>
                  <span 
                    className="font-mono p-1 rounded-sm bg-muted text-sm inline-block overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: renderMath(getOriginalQueryAsLatex(apiResponse.originalQuery), false) }}
                  />
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">Computed Result:</h3>
                  <span 
                    className="font-mono p-2 rounded-md bg-muted text-primary dark:text-primary-foreground text-xl inline-block overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: renderMath(apiResponse.integralResult, false) }} 
                  />
                </div>

                {apiResponse.steps && apiResponse.steps.trim() !== "" && (
                  <Accordion type="single" collapsible className="w-full mt-4">
                    <AccordionItem value="steps">
                      <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                        <Info className="mr-2 h-5 w-5" /> Show Steps
                      </AccordionTrigger>
                      <AccordionContent>
                        <div 
                           className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap overflow-x-auto overflow-wrap-break-word min-h-[50px]"
                           dangerouslySetInnerHTML={{ __html: renderStepsContent(apiResponse.steps) }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {(chartData || plotError || apiResponse.plotHint) && (
                    <Accordion type="single" collapsible className="w-full mt-4" defaultValue='plot-info'>
                    <AccordionItem value="plot-info">
                      <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                        <LineChartIconLucide className="mr-2 h-5 w-5" /> Plot Information
                      </AccordionTrigger>
                      <AccordionContent>
                        <Card className="shadow-none">
                            <CardHeader>
                                <CardTitle className="text-lg">Visualizing the Functions</CardTitle>
                                {apiResponse.plotHint && <CardDescription>{apiResponse.plotHint}</CardDescription>}
                            </CardHeader>
                            <CardContent>
                              {plotError && (
                                <Alert variant="destructive" className="mb-4">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>Plotting Error</AlertTitle>
                                  <AlertDescription>{plotError}</AlertDescription>
                                </Alert>
                              )}
                              {chartData && chartData.length > 0 && !plotError ? (
                                <div className="h-[400px] w-full">
                                  <ChartContainer config={chartConfig} className="h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="x" type="number" label={{ value: variable || 'x', position: 'insideBottomRight', offset: -10 }} />
                                        <YAxis label={{ value: 'y', angle: -90, position: 'insideLeft' }} />
                                        <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
                                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: "10px"}} />
                                        <Line type="monotone" dataKey="original" stroke={chartConfig.original.color} strokeWidth={2} dot={false} name={chartConfig.original.label} connectNulls />
                                        <Line type="monotone" dataKey="integral" stroke={chartConfig.integral.color} strokeWidth={2} dot={false} name={chartConfig.integral.label} connectNulls />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </ChartContainer>
                                </div>
                              ) : !plotError && (
                                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                                   <p className="text-sm text-muted-foreground">No plot data available or expression(s) could not be plotted.</p>
                                </div>
                              )}
                            </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                <p className="mt-4 text-xs text-muted-foreground italic">
                  Mathematical expressions are rendered using KaTeX.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
         <CardFooter className="p-6 bg-secondary/50">
            <p className="text-sm text-muted-foreground">
                This tool uses an AI model to perform integration. Results and steps may vary. For best results, use standard mathematical notation (e.g., <code className="text-xs">x^2</code>, <code className="text-xs">sin(x)</code>, <code className="text-xs">exp(x)</code>).
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
