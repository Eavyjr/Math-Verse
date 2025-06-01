
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import katex from 'katex';
import "katex/dist/katex.min.css";
import { create, all, type MathJsStatic, type EvalFunction } from 'mathjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft, XCircle, Info, Brain, Ratio, FunctionSquare, PlusCircle, Trash2, Sigma, LineChart as LineChartIconLucide } from 'lucide-react';
import { handlePerformDifferentiationAction, handleSolveDifferentialEquationAction } from '@/app/actions';
import type { DifferentiationInput, DifferentiationOutput } from '@/ai/flows/perform-differentiation-flow';
import type { DESolutionInput, DESolutionOutput } from '@/ai/flows/solve-differential-equation-flow'; 
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const math: MathJsStatic = create(all);

const renderMath = (latexString: string | undefined | null, displayMode: boolean = false): string => {
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
      macros: { "\\dd": "\\mathrm{d}"} 
    });
  } catch (e) {
    console.error("Katex rendering error for main result:", e, "Original string:", latexString);
    return cleanLatexString; 
  }
};

const renderStepsContent = (stepsString: string | undefined | null): string => {
  if (!stepsString) return "";
  const parts = stepsString.split(/(\\\(.*?\\\)|\\\[.*?\\\])/g);
  
  const htmlParts = parts.map((part) => {
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
  return finalHtml;
};

interface PlotDataItem {
  x: number;
  original?: number;
  derivative?: number;
}

const stripLatexDelimiters = (latexStr: string | null | undefined): string => {
  if (!latexStr) return "";
  let str = latexStr.trim();
  if ((str.startsWith('\\(') && str.endsWith('\\)')) || (str.startsWith('\\[') && str.endsWith('\\]'))) {
    str = str.substring(2, str.length - 2).trim();
  }
  // Replace common LaTeX functions with math.js compatible syntax if necessary
  // This is a basic replacement, more complex LaTeX would need a proper parser
  str = str.replace(/\\sin/g, 'sin')
           .replace(/\\cos/g, 'cos')
           .replace(/\\tan/g, 'tan')
           .replace(/\\ln/g, 'log') // math.js uses log for natural log
           .replace(/\\log_{10}/g, 'log10')
           .replace(/\\exp/g, 'exp')
           .replace(/\\sqrt{(.*?)}/g, 'sqrt($1)')
           .replace(/\\frac{(.*?)}{(.*?)}/g, '($1)/($2)')
           .replace(/\^/g, '^');
  return str;
};

export default function DifferentiationCalculatorPage() {
  const [functionString, setFunctionString] = useState('');
  const [variable, setVariable] = useState('x');
  const [order, setOrder] = useState<number>(1);
  const [diffApiResponse, setDiffApiResponse] = useState<DifferentiationOutput | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [diffPreviewHtml, setDiffPreviewHtml] = useState<string>('');
  const [chartData, setChartData] = useState<PlotDataItem[] | null>(null);
  const [plotError, setPlotError] = useState<string | null>(null);

  const [deString, setDeString] = useState('');
  const [deDependentVar, setDeDependentVar] = useState('y');
  const [deIndependentVar, setDeIndependentVar] = useState('x');
  const [initialConditions, setInitialConditions] = useState<string[]>([]); 
  const [currentIcInput, setCurrentIcInput] = useState(''); 
  const [deApiResponse, setDeApiResponse] = useState<DESolutionOutput | null>(null); 
  const [isDeLoading, setIsDeLoading] = useState(false);
  const [deError, setDeError] = useState<string | null>(null);
  const [dePreviewHtml, setDePreviewHtml] = useState<string>('');


  const derivativeOrders = [
    { label: '1st Derivative', value: 1 },
    { label: '2nd Derivative', value: 2 },
    { label: '3rd Derivative', value: 3 },
    { label: '4th Derivative', value: 4 },
  ];

  const getDerivativeNotation = (func: string, v: string, ord: number) => {
    if (!func.trim() && !v.trim()) return renderMath("d/dx(f(x))", true); 
    const cleanFunc = func || `f(${v || 'x'})`;
    if (ord === 1) return `\\frac{\\mathrm{d}}{\\mathrm{d}${v}} \\left( ${cleanFunc} \\right)`;
    return `\\frac{\\mathrm{d}^{${ord}}}{\\mathrm{d}${v}^{${ord}}} \\left( ${cleanFunc} \\right)`;
  };
  
  useEffect(() => {
    const latexPreview = getDerivativeNotation(functionString, variable, order);
    setDiffPreviewHtml(renderMath(latexPreview, true));
  }, [functionString, variable, order]);

  useEffect(() => {
    if (deString.trim()) {
        let preview = deString;
        if(initialConditions.length > 0){
            preview += `, \\quad ` + initialConditions.map(ic => ic.replace(/=/g, " = ")).join(",\\ ");
        }
        setDePreviewHtml(renderMath(preview, true));
    } else {
        setDePreviewHtml(renderMath("y' + P(x)y = Q(x)", true)); 
    }
  }, [deString, deDependentVar, deIndependentVar, initialConditions]);

  useEffect(() => {
    if (diffApiResponse?.originalQuery?.functionString && diffApiResponse?.derivativeResult) {
      setPlotError(null);
      const originalFuncStr = stripLatexDelimiters(diffApiResponse.originalQuery.functionString);
      const derivativeFuncStr = stripLatexDelimiters(diffApiResponse.derivativeResult);
      const plotVar = diffApiResponse.originalQuery.variable || 'x';

      if (!originalFuncStr || !derivativeFuncStr) {
        setPlotError("Function strings are missing for plotting.");
        setChartData(null);
        return;
      }
      
      try {
        const compiledOriginal = math.compile(originalFuncStr);
        const compiledDerivative = math.compile(derivativeFuncStr);
        
        const data: PlotDataItem[] = [];
        const xMin = -5; const xMax = 5; const points = 100;
        const step = (xMax - xMin) / (points - 1);

        for (let i = 0; i < points; i++) {
          const xVal = xMin + i * step;
          let originalY: number | undefined = undefined;
          let derivativeY: number | undefined = undefined;
          const scope = { [plotVar]: xVal };
          
          try {
            originalY = compiledOriginal.evaluate(scope);
            if (typeof originalY !== 'number' || isNaN(originalY) || !isFinite(originalY)) originalY = undefined;
          } catch (e) { /* ignore eval error for this point */ }

          try {
            derivativeY = compiledDerivative.evaluate(scope);
            if (typeof derivativeY !== 'number' || isNaN(derivativeY) || !isFinite(derivativeY)) derivativeY = undefined;
          } catch (e) { /* ignore eval error for this point */ }
          
          if (originalY !== undefined || derivativeY !== undefined) {
            data.push({ x: parseFloat(xVal.toFixed(3)), original: originalY, derivative: derivativeY });
          }
        }
        if (data.length > 1) { // Need at least 2 points to draw a line
          setChartData(data);
        } else {
          setPlotError("Not enough valid data points to generate a plot.");
          setChartData(null);
        }

      } catch (e: any) {
        console.error("Error compiling/evaluating for plot:", e);
        setPlotError(`Could not plot functions: ${e.message}. Ensure functions use standard notation (e.g. x^2, sin(x)).`);
        setChartData(null);
      }
    } else {
      setChartData(null);
      setPlotError(null);
    }
  }, [diffApiResponse]);


  const handleDiffSubmit = async () => {
    if (!functionString.trim()) {
      setDiffError("Please enter a function to differentiate.");
      setDiffApiResponse(null);
      return;
    }
    if (!variable.trim()) {
      setDiffError("Please enter a variable of differentiation.");
      setDiffApiResponse(null);
      return;
    }

    setIsDiffLoading(true);
    setDiffError(null);
    setDiffApiResponse(null);
    setChartData(null);
    setPlotError(null);
    
    const input: DifferentiationInput = {
      functionString,
      variable,
      order,
    };

    try {
      const actionResult = await handlePerformDifferentiationAction(input);
      if (actionResult.error) {
        setDiffError(actionResult.error);
      } else if (actionResult.data) {
        setDiffApiResponse(actionResult.data);
      } else {
        setDiffError('Received no data from the server. Please try again.');
      }
    } catch (e: any) {
      setDiffError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsDiffLoading(false);
    }
  };

  const handleDiffClear = () => {
    setFunctionString('');
    setVariable('x');
    setOrder(1);
    setDiffApiResponse(null);
    setDiffError(null);
    setChartData(null);
    setPlotError(null);
  };
  
  const getOriginalQueryAsLatex = (query: DifferentiationInput | undefined): string => {
    if (!query) return "";
    const funcStr = query.functionString.replace(/\\/g, '\\\\'); 
    const varStr = query.variable.replace(/\\/g, '\\\\');
    return getDerivativeNotation(funcStr, varStr, query.order);
  }

  const handleDeSubmit = async () => {
    if (!deString.trim()) {
        setDeError("Please enter a differential equation.");
        setDeApiResponse(null);
        return;
    }
    setIsDeLoading(true);
    setDeError(null);
    setDeApiResponse(null);

    const input: DESolutionInput = {
        equationString: deString,
        dependentVariable: deDependentVar,
        independentVariable: deIndependentVar,
        initialConditions: initialConditions.filter(ic => ic.trim()), 
    };
    
    try {
        const actionResult = await handleSolveDifferentialEquationAction(input);
        if (actionResult.error) {
            setDeError(actionResult.error);
            setDeApiResponse(null);
        } else if (actionResult.data !== null && actionResult.data !== undefined) {
            setDeApiResponse(actionResult.data); 
        } else {
            setDeError('Received no data from the DE solver. Please try again.');
            setDeApiResponse(null);
        }
    } catch (e: any) {
        setDeError(e.message || 'An unexpected error occurred while solving the DE.');
        setDeApiResponse(null);
    } finally {
        setIsDeLoading(false);
    }
  };

  const handleDeClear = () => {
    setDeString('');
    setDeDependentVar('y');
    setDeIndependentVar('x');
    setInitialConditions([]);
    setCurrentIcInput('');
    setDeApiResponse(null);
    setDeError(null);
  };

  const addInitialCondition = () => {
    if (currentIcInput.trim()) {
      setInitialConditions([...initialConditions, currentIcInput.trim()]);
      setCurrentIcInput(''); 
    }
  };

  const removeInitialCondition = (index: number) => {
    setInitialConditions(initialConditions.filter((_, i) => i !== index));
  };

  const getDEOriginalQueryAsLatex = (query: DESolutionInput | undefined | null): string => {
    if (!query || !query.equationString) return "DE Query Error";
    let latex = query.equationString;
    if (query.initialConditions && query.initialConditions.length > 0) {
        latex += ",\\quad " + query.initialConditions.map(ic => ic.replace(/=/g, " = ")).join(',\\ ');
    }
    return latex;
  };

  const chartConfig = {
    original: { label: `f(${variable})`, color: "hsl(var(--chart-1))" },
    derivative: { label: `f'(${variable})`, color: "hsl(var(--chart-2))" },
  } satisfies Record<string, any>;


  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Ratio className="h-8 w-8 mr-3" /> 
            Calculus Engine: Derivatives & DEs
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Calculate function derivatives or explore solutions to differential equations with AI assistance.
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="derivatives" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sticky top-[calc(var(--header-height,60px)+1px)] z-10 bg-card border-b">
            <TabsTrigger value="derivatives" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
              <FunctionSquare className="mr-2 h-5 w-5" /> Function Derivatives
            </TabsTrigger>
            <TabsTrigger value="des" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
               <Sigma className="mr-2 h-5 w-5" /> Differential Equations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="derivatives" className="p-0">
            <CardContent className="p-6 space-y-6">
              <div className="p-4 border rounded-md bg-secondary/30">
                <p className="text-xl font-semibold text-center text-primary mb-2">Derivative Preview:</p>
                <div 
                    className="text-2xl text-center font-mono p-2 bg-background rounded-md overflow-x-auto min-h-[50px] flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: diffPreviewHtml }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="function-input" className="block text-md font-semibold text-foreground">
                    Function, e.g., f({variable || 'x'}):
                  </Label>
                  <Input
                    id="function-input"
                    type="text"
                    placeholder="e.g., x^3 + sin(x)"
                    value={functionString}
                    onChange={(e) => {
                      setFunctionString(e.target.value);
                      setDiffError(null); setDiffApiResponse(null); setChartData(null); setPlotError(null);
                    }}
                    className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variable-input" className="block text-md font-semibold text-foreground">
                    Variable:
                  </Label>
                  <Input
                    id="variable-input"
                    type="text"
                    placeholder="x"
                    value={variable}
                    onChange={(e) => {
                      setVariable(e.target.value || 'x'); 
                      setDiffError(null); setDiffApiResponse(null); setChartData(null); setPlotError(null);
                    }}
                    className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-select" className="block text-md font-semibold text-foreground">
                  Order of Derivative:
                </Label>
                <Select 
                  value={order.toString()} 
                  onValueChange={(value) => {
                    setOrder(parseInt(value, 10));
                    setDiffError(null); setDiffApiResponse(null); setChartData(null); setPlotError(null);
                  }}
                >
                  <SelectTrigger id="order-select" className="text-lg p-3 h-auto">
                    <SelectValue placeholder="Choose order..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Derivative Order</SelectLabel>
                      {derivativeOrders.map(opt => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleDiffSubmit}
                  disabled={isDiffLoading || !functionString.trim() || !variable.trim()}
                  size="lg"
                  className="flex-grow"
                >
                  {isDiffLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Ratio className="mr-2 h-5 w-5" />}
                  Calculate Derivative
                </Button>
                <Button
                  onClick={handleDiffClear}
                  variant="outline"
                  size="lg"
                  className="flex-grow sm:flex-grow-0"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Clear
                </Button>
              </div>

              {isDiffLoading && (
                <div className="flex items-center justify-center p-8 rounded-md bg-muted">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="ml-3 text-xl font-medium text-foreground">
                    Calculating derivative...
                  </p>
                </div>
              )}

              {diffError && !isDiffLoading && (
                <Alert variant="destructive" className="mt-6">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="font-semibold">Differentiation Error</AlertTitle>
                  <AlertDescription>{diffError}</AlertDescription>
                </Alert>
              )}

              {diffApiResponse && !isDiffLoading && !diffError && (
                <Card className="mt-6 border-accent border-t-4 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center text-primary">
                      <CheckCircle2 className="h-7 w-7 mr-2 text-green-600" />
                      Differentiation Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6 text-lg">
                    <div>
                      <span className="font-semibold text-muted-foreground">Original Query: </span>
                      <span 
                        className="font-mono p-1 rounded-sm bg-muted text-sm block overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: renderMath(getOriginalQueryAsLatex(diffApiResponse.originalQuery), true) }}
                      />
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-xl font-semibold text-muted-foreground mb-2">Computed Derivative:</h3>
                      <div 
                        className="font-mono p-2 rounded-md bg-muted text-primary dark:text-primary-foreground text-xl block overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: renderMath(diffApiResponse.derivativeResult, false) }} 
                      />
                    </div>

                    {diffApiResponse.steps && diffApiResponse.steps.trim() !== "" && (
                      <Accordion type="single" collapsible className="w-full mt-4">
                        <AccordionItem value="steps">
                          <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                            <Info className="mr-2 h-5 w-5" /> Show Steps
                          </AccordionTrigger>
                          <AccordionContent>
                            <div 
                              className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap overflow-x-auto overflow-wrap-break-word min-h-[50px]"
                              dangerouslySetInnerHTML={{ __html: renderStepsContent(diffApiResponse.steps) }}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {(chartData || plotError || diffApiResponse.plotHint) && (
                      <Accordion type="single" collapsible className="w-full mt-4" defaultValue='plot-info'>
                        <AccordionItem value="plot-info">
                          <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                            <LineChartIconLucide className="mr-2 h-5 w-5" /> Plot Information
                          </AccordionTrigger>
                          <AccordionContent>
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Visualizing the Functions</CardTitle>
                                    {diffApiResponse.plotHint && <CardDescription>{diffApiResponse.plotHint}</CardDescription>}
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
                                            <Line type="monotone" dataKey="derivative" stroke={chartConfig.derivative.color} strokeWidth={2} dot={false} name={chartConfig.derivative.label} connectNulls />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </ChartContainer>
                                    </div>
                                  ) : !plotError && (
                                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                                       <p className="text-sm text-muted-foreground">No plot data available or expression could not be plotted.</p>
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
            <CardFooter className="p-6 bg-secondary/50 border-t">
              <p className="text-sm text-muted-foreground">
                  This tool uses an AI model for differentiation. Results and steps may vary. Use standard mathematical notation.
              </p>
            </CardFooter>
          </TabsContent>

          <TabsContent value="des" className="p-0">
            <CardContent className="p-6 space-y-6">
                <div className="p-4 border rounded-md bg-secondary/30">
                    <p className="text-xl font-semibold text-center text-primary mb-2">DE Preview:</p>
                    <div 
                        className="text-2xl text-center font-mono p-2 bg-background rounded-md overflow-x-auto min-h-[50px] flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: dePreviewHtml }}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="de-input" className="block text-md font-semibold text-foreground">
                        Differential Equation:
                    </Label>
                    <Textarea
                        id="de-input"
                        placeholder="e.g., y' + 2*y = x,  y'' - 3*y' + 2*y = 0, dy/dx = y/x"
                        value={deString}
                        onChange={(e) => {
                            setDeString(e.target.value);
                            setDeError(null); setDeApiResponse(null);
                        }}
                        className="text-lg p-3 min-h-[100px] border-2 focus:border-accent focus:ring-accent"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="de-dependent-var" className="block text-md font-semibold text-foreground">
                            Dependent Variable (e.g., y):
                        </Label>
                        <Input
                            id="de-dependent-var"
                            type="text"
                            value={deDependentVar}
                            onChange={(e) => setDeDependentVar(e.target.value || 'y')}
                            className="text-lg p-3"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="de-independent-var" className="block text-md font-semibold text-foreground">
                            Independent Variable (e.g., x):
                        </Label>
                        <Input
                            id="de-independent-var"
                            type="text"
                            value={deIndependentVar}
                            onChange={(e) => setDeIndependentVar(e.target.value || 'x')}
                            className="text-lg p-3"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="block text-md font-semibold text-foreground">Initial Conditions (Optional - one per line):</Label>
                    {initialConditions.map((ic, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 text-sm">
                           <span className="font-mono flex-grow p-1 bg-background rounded" dangerouslySetInnerHTML={{__html: renderMath(ic, false) }} />
                            <Button variant="ghost" size="icon" onClick={() => removeInitialCondition(index)} aria-label="Remove initial condition">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder="e.g., y(0)=1"
                            value={currentIcInput}
                            onChange={(e) => setCurrentIcInput(e.target.value)}
                            className="flex-grow"
                            aria-label="New initial condition"
                        />
                        <Button variant="outline" onClick={addInitialCondition} className="shrink-0">
                            <PlusCircle className="mr-2 h-5 w-5" /> Add
                        </Button>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={handleDeSubmit}
                        disabled={isDeLoading || !deString.trim()}
                        size="lg"
                        className="flex-grow"
                    >
                        {isDeLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
                        Solve Differential Equation
                    </Button>
                    <Button
                        onClick={handleDeClear}
                        variant="outline"
                        size="lg"
                        className="flex-grow sm:flex-grow-0"
                    >
                        <XCircle className="mr-2 h-5 w-5" />
                        Clear DE Form
                    </Button>
                </div>

                {isDeLoading && (
                    <div className="flex items-center justify-center p-8 rounded-md bg-muted">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="ml-3 text-xl font-medium text-foreground">Solving DE...</p>
                    </div>
                )}

                {deError && !isDeLoading && (
                    <Alert variant="destructive" className="mt-6">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle className="font-semibold">DE Solver Error</AlertTitle>
                        <AlertDescription>{deError}</AlertDescription>
                    </Alert>
                )}
                
                {deApiResponse && !isDeLoading && !deError && (
                     <Card className="mt-6 border-accent border-t-4 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center text-primary">
                                <CheckCircle2 className="h-7 w-7 mr-2 text-green-600" />
                                Differential Equation Solution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6 text-lg">
                             <div>
                                <h3 className="font-semibold text-muted-foreground mb-1">Original Query:</h3>
                                <div 
                                    className="font-mono p-2 rounded-md bg-muted text-sm overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: renderMath(getDEOriginalQueryAsLatex(deApiResponse.originalQuery), true) }}
                                />
                            </div>
                            
                            {deApiResponse.classification && (
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1">Classification:</h3>
                                <p className="p-2 bg-secondary rounded-md text-base">{deApiResponse.classification}</p>
                            </div>
                            )}

                            {deApiResponse.solutionMethod && (
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1">Solution Method:</h3>
                                <p className="p-2 bg-secondary rounded-md text-base">{deApiResponse.solutionMethod}</p>
                            </div>
                            )}
                            
                            {deApiResponse.generalSolution && (
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-xl font-semibold text-muted-foreground mb-2">General Solution:</h3>
                                <div 
                                    className="font-mono p-2 rounded-md bg-muted text-primary dark:text-primary-foreground text-xl block overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: renderMath(deApiResponse.generalSolution, true) }} 
                                />
                            </div>
                            )}

                            {deApiResponse.particularSolution && (
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-xl font-semibold text-muted-foreground mb-2">Particular Solution:</h3>
                                <div 
                                    className="font-mono p-2 rounded-md bg-muted text-primary dark:text-primary-foreground text-xl block overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: renderMath(deApiResponse.particularSolution, true) }} 
                                />
                            </div>
                            )}

                            {deApiResponse.steps && deApiResponse.steps.trim() !== "" && (
                            <Accordion type="single" collapsible className="w-full mt-4">
                                <AccordionItem value="steps">
                                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                                    <Info className="mr-2 h-5 w-5" /> Show Steps
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div 
                                    className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap overflow-x-auto overflow-wrap-break-word min-h-[50px]"
                                    dangerouslySetInnerHTML={{ __html: renderStepsContent(deApiResponse.steps) }}
                                    />
                                </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            )}

                            {deApiResponse.plotHint && (
                            <Accordion type="single" collapsible className="w-full mt-4">
                                <AccordionItem value="plot-info">
                                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                                    <LineChartIconLucide className="mr-2 h-5 w-5" /> Plot Information
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Card className="shadow-none">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Visualizing the Solution</CardTitle>
                                            <CardDescription>{deApiResponse.plotHint}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                                                <LineChartIconLucide 
                                                    className="h-16 w-16 text-muted-foreground opacity-50 mb-2"
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    Interactive plot generation for DE solutions coming soon.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            )}
                            
                            <p className="mt-4 text-xs text-muted-foreground italic">
                                Mathematical expressions are rendered using KaTeX. Solution quality depends on AI interpretation.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
            <CardFooter className="p-6 bg-secondary/50 border-t">
                <p className="text-sm text-muted-foreground">
                    The Differential Equations solver uses an AI model. For best results, use standard notation (e.g., y', dy/dx, y''). Provide initial conditions if a particular solution is desired.
                </p>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

