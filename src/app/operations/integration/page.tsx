
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { create, all, type MathJsStatic } from 'mathjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle2, Loader2, Sigma, ArrowLeft, XCircle, Info, Brain, LineChart as LineChartIconLucide, Lightbulb, ImageIcon } from 'lucide-react';
import { handlePerformIntegrationAction } from '@/app/actions'; 
import type { IntegrationInput, IntegrationOutput } from '@/ai/flows/perform-integration-flow';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Line as RechartsLine } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import KatexRenderer from '@/components/math-tools/katex-renderer';

const math: MathJsStatic = create(all);

interface PlotDataItem {
  x: number;
  original?: number;
  integral?: number;
}

const stripLatexDelimitersAndPrepareForMathJS = (latexStr: string | null | undefined): string => {
  if (!latexStr) return "";
  let str = latexStr.trim();
  
  str = str.replace(/\\sin/g, 'sin')
           .replace(/\\cos/g, 'cos')
           .replace(/\\tan/g, 'tan')
           .replace(/\\ln/g, 'log') 
           .replace(/\\log_{10}/g, 'log10') 
           .replace(/\\exp/g, 'exp')
           .replace(/\\sqrt{(.*?)}/g, 'sqrt($1)')
           .replace(/\\frac{(.*?)}{(.*?)}/g, '($1)/($2)')
           .replace(/\\cdot/g, '*')
           .replace(/\^/g, '^')
           .replace(/\\pi/g, 'pi');
  str = str.replace(/\s*\+\s*C\s*$/i, ''); 
  str = str.replace(/(?<![a-zA-Z0-9_])C(?:_?[0-9]+)?(?![a-zA-Z0-9_])/g, '(0)'); 
  str = str.replace(/(?<![a-zA-Z0-9_])c(?:_?[0-9]+)?(?![a-zA-Z0-9_])/g, '(0)');


  return str;
};


export default function IntegrationCalculatorPage() {
  const { toast } = useToast();
  const [functionString, setFunctionString] = useState('');
  const [variable, setVariable] = useState('x');
  const [integralType, setIntegralType] = useState<'indefinite' | 'definite'>('indefinite');
  const [lowerBound, setLowerBound] = useState('');
  const [upperBound, setUpperBound] = useState('');

  const [apiResponse, setApiResponse] = useState<IntegrationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

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
      latexPreview = `\\int_{${lb}}^{${ub}} ${func} \\, \\mathrm{d}${v}`; 
    } else {
      latexPreview = `\\int ${func} \\, \\mathrm{d}${v}`; 
    }
    setPreviewHtml(latexPreview);
  }, [functionString, variable, integralType, lowerBound, upperBound]);

  useEffect(() => {
    if (!apiResponse?.originalQuery?.functionString || !apiResponse?.integralResult) {
      setChartData(null);
      setPlotError(null);
      return;
    }
    
    setPlotError(null); 
    let currentPlotError: string | null = null;

    const originalFuncStr = stripLatexDelimitersAndPrepareForMathJS(apiResponse.originalQuery.functionString);
    const integralFuncStr = stripLatexDelimitersAndPrepareForMathJS(apiResponse.integralResult);
    const plotVar = apiResponse.originalQuery.variable || 'x';

    let compiledOriginal: any = null;
    let compiledIntegral: any = null;

    if (!originalFuncStr) {
      currentPlotError = "Original function string is missing or invalid for plotting.";
    } else {
      try {
        compiledOriginal = math.compile(originalFuncStr);
      } catch (e: any) {
        console.error("Error compiling original function for plot:", e);
        if(!currentPlotError) currentPlotError = `Could not plot original function: ${e.message}. Ensure standard notation (e.g. x^2, sin(x)).`;
      }
    }
    
    const isIntegralNumeric = apiResponse.integralResult && !isNaN(parseFloat(apiResponse.integralResult)) && integralFuncStr === parseFloat(apiResponse.integralResult).toString();

    if (isIntegralNumeric) {
      if(!currentPlotError) currentPlotError = "Integral is a constant value; only original function will be plotted if possible.";
    } else if (!integralFuncStr && apiResponse.integralResult && apiResponse.integralResult.trim() !== "" && !apiResponse.integralResult.toLowerCase().includes("error") && !apiResponse.integralResult.toLowerCase().includes("non-elementary")) {
      if(!currentPlotError) currentPlotError = "Integral result is not a plottable function (e.g., non-elementary).";
    } else if (integralFuncStr) { 
       try {
         compiledIntegral = math.compile(integralFuncStr);
       } catch (e: any) {
         console.warn("Error compiling integral function for plot:", e);
         if(!currentPlotError) currentPlotError = `Could not plot integral: ${e.message}. Original function might still be plotted.`;
       }
    }
    
    if (!compiledOriginal && !compiledIntegral) {
      setChartData(null);
      setPlotError(currentPlotError || "Neither original function nor integral could be prepared for plotting.");
      return;
    }
      
    const data: PlotDataItem[] = [];
    const xMin = -5; const xMax = 5; const points = 100;
    const step = (xMax - xMin) / (points - 1);

    for (let i = 0; i < points; i++) {
      const xVal = xMin + i * step;
      let originalY: number | undefined = undefined;
      let integralY: number | undefined = undefined;
      const scope = { [plotVar]: xVal, C: 0, c: 0, C1: 0, c1: 0, C2: 0, c2: 0 }; 
      
      if (compiledOriginal) {
        try {
          originalY = compiledOriginal.evaluate(scope);
          if (typeof originalY !== 'number' || isNaN(originalY) || !isFinite(originalY)) originalY = undefined;
        } catch (e) { /* ignore eval error for this point */ }
      }

      if (compiledIntegral && !isIntegralNumeric) { 
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
      setPlotError(currentPlotError); 
    } else {
      setChartData(null);
      setPlotError(currentPlotError || "Not enough valid data points to generate a plot for either function.");
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
        // Trim whitespace from steps and hints
        const trimmedData = {
          ...actionResult.data,
          steps: actionResult.data.steps?.trim(),
          additionalHints: actionResult.data.additionalHints?.trim(),
        };
        setApiResponse(trimmedData);
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

  const handleExportAsPng = useCallback(() => {
    if (resultCardRef.current === null) {
      return;
    }
    toast({
      title: "Exporting...",
      description: "Please wait while the image is being generated.",
    });

    toPng(resultCardRef.current, { cacheBust: true, backgroundColor: 'white', pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `mathverse-integration-${apiResponse?.originalQuery.functionString || 'result'}.png`;
        link.href = dataUrl;
        link.click();
        toast({
            title: "Export Successful",
            description: "Result card has been downloaded as a PNG image.",
        });
      })
      .catch((err) => {
        console.error('Image export failed:', err);
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "Could not export the result card as an image.",
        });
      });
  }, [apiResponse, toast]);
  
  const getOriginalQueryAsLatex = (query: IntegrationInput | undefined): string => {
    if (!query) return "";
    const funcStr = query.functionString.replace(/\\/g, '\\\\'); 
    const varStr = query.variable.replace(/\\/g, '\\\\');
    
    let latex = `\\int`;
    if (query.isDefinite) {
        const lb = query.lowerBound || 'a';
        const ub = query.upperBound || 'b';
        latex += `_{${lb}}^{${ub}} ${funcStr} \\, \\mathrm{d}${varStr}`;
    } else {
        latex += ` ${funcStr} \\, \\mathrm{d}${varStr}`;
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
            AI Integration Calculator
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Calculate definite or indefinite integrals with AI-powered step-by-step solutions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="p-4 border rounded-md bg-secondary/30">
            <p className="text-xl font-semibold text-center text-primary mb-2">Integral Preview:</p>
            <div className="text-2xl text-center font-mono p-2 bg-background rounded-md overflow-x-auto min-h-[50px] flex items-center justify-center">
              <KatexRenderer content={previewHtml} displayMode={true} />
            </div>
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
              Calculate Integral with AI
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
          
          <div>
              {isLoading && (
                <div className="flex items-center justify-center p-8 rounded-md bg-muted mt-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="ml-3 text-xl font-medium text-foreground">
                    AI is calculating the integral of &quot;{functionString}&quot;...
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
            
            <div className="mt-6">
              {apiResponse && !isLoading && !error && (
                <Card 
                  className="border-accent border-t-4 shadow-md mb-6" 
                  ref={resultCardRef}
                >
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center text-primary">
                        <CheckCircle2 className="h-7 w-7 mr-2 text-green-600" />
                        AI Integration Result
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div>
                            <span className="font-semibold text-muted-foreground">Original Query: </span> 
                            <span className="font-mono p-1 rounded-sm bg-muted text-sm inline-block overflow-x-auto">
                            <KatexRenderer content={getOriginalQueryAsLatex(apiResponse.originalQuery)} displayMode={true} />
                            </span>
                        </div>
                        
                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-xl font-semibold text-muted-foreground mb-2">Computed Result:</h3>
                            <div className="font-mono p-2 rounded-md bg-muted text-primary dark:text-primary-foreground text-xl block overflow-x-auto">
                            <KatexRenderer content={apiResponse.integralResult || ''} displayMode={true} />
                            </div>
                        </div>

                        {apiResponse.steps && apiResponse.steps.trim() !== "" && (
                            <Accordion type="single" collapsible className="w-full mt-4" defaultValue="steps">
                            <AccordionItem value="steps">
                                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                                <Info className="mr-2 h-5 w-5" /> Show Steps
                                </AccordionTrigger>
                                <AccordionContent> 
                                <div 
                                    className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: renderStepsContent(apiResponse.steps) }} 
                                />
                                </AccordionContent>
                            </AccordionItem>
                            </Accordion>
                        )}

                        {apiResponse.additionalHints && apiResponse.additionalHints.trim() !== "" && (
                            <Accordion type="single" collapsible className="w-full mt-2">
                            <AccordionItem value="hints">
                                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                                <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" /> Additional Hints & Insights
                                </AccordionTrigger>
                                <AccordionContent> 
                                <div 
                                    className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: renderStepsContent(apiResponse.additionalHints) }}
                                />
                                </AccordionContent>
                            </AccordionItem>
                            </Accordion>
                        )}
                    </CardContent>
                    <CardFooter className="p-4 bg-secondary/50 border-t flex justify-end">
                        <Button variant="outline" size="sm" onClick={handleExportAsPng}>
                        <ImageIcon className="mr-2 h-4 w-4" /> Export as PNG
                        </Button>
                    </CardFooter>
                </Card>
              )}
            
              {(chartData || plotError) && !isLoading && (
                  <Card className="border-accent/50 border-t-4 shadow-md w-full">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center"><LineChartIconLucide className="mr-2 h-5 w-5" /> Plot Information</CardTitle>
                        {apiResponse?.plotHint && 
                            <CardDescription>
                            <KatexRenderer content={apiResponse.plotHint} />
                            </CardDescription>
                        }
                      </CardHeader>
                      <CardContent>
                        {plotError && (
                            <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Plotting Error/Info</AlertTitle>
                            <AlertDescription>{plotError}</AlertDescription>
                            </Alert>
                        )}
                        {chartData && chartData.length > 0 ? (
                            <div className="h-[400px] w-full">
                              <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="x" type="number" label={{ value: variable || 'x', position: 'insideBottomRight', offset: -10 }} />
                                    <YAxis label={{ value: 'y', angle: -90, position: 'insideLeft' }} />
                                    <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
                                    <Legend verticalAlign="top" wrapperStyle={{paddingBottom: "10px"}} />
                                    <RechartsLine type="monotone" dataKey="original" stroke={chartConfig.original.color} strokeWidth={2} dot={false} name={chartConfig.original.label} connectNulls />
                                    <RechartsLine type="monotone" dataKey="integral" stroke={chartConfig.integral.color} strokeWidth={2} dot={false} name={chartConfig.integral.label} connectNulls />
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
              )}
            </div>
            </div>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
            <p className="text-sm text-muted-foreground">
                This tool uses an AI model to perform integration and provide step-by-step explanations. For best results, use standard mathematical notation.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
