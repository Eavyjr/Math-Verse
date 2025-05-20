
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import katex from 'katex';
import "katex/dist/katex.min.css";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft, XCircle, Info, Brain, Ratio, FunctionSquare, PlusCircle, Trash2, Sigma } from 'lucide-react';
import { handlePerformDifferentiationAction, handleSolveDifferentialEquationAction } from '@/app/actions';
import type { DifferentiationInput, DifferentiationOutput } from '@/ai/flows/perform-differentiation-flow';
import type { DESolutionInput, DESolutionOutput } from '@/ai/flows/solve-differential-equation-flow';
import { Textarea } from '@/components/ui/textarea';

const renderMath = (latexString: string | undefined, displayMode: boolean = false): string => {
  if (!latexString) return "";
  try {
    return katex.renderToString(latexString, {
      throwOnError: false,
      displayMode: displayMode,
      output: 'html',
      macros: { "\\dd": "\\mathrm{d}"} // Example custom macro
    });
  } catch (e) {
    console.error("Katex rendering error:", e);
    return latexString;
  }
};

const renderStepsContent = (stepsString: string | undefined): string => {
  if (!stepsString) return "";
  const parts = stepsString.split(/(\\\(.*?\\\)|\\\[.*?\\\])/g);
  return parts.map((part, index) => {
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
      console.error("KaTeX steps rendering error:", e, "Part:", part);
      return part;
    }
  }).join('');
};

export default function DifferentiationCalculatorPage() {
  // State for Function Derivatives
  const [functionString, setFunctionString] = useState('');
  const [variable, setVariable] = useState('x');
  const [order, setOrder] = useState<number>(1);
  const [diffApiResponse, setDiffApiResponse] = useState<DifferentiationOutput | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [diffPreviewHtml, setDiffPreviewHtml] = useState<string>('');

  // State for Differential Equations
  const [deString, setDeString] = useState('');
  const [deDependentVar, setDeDependentVar] = useState('y');
  const [deIndependentVar, setDeIndependentVar] = useState('x');
  const [initialConditions, setInitialConditions] = useState<{ condition: string; value: string }[]>([]);
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
    if (!func.trim() && !v.trim()) return renderMath("d/dx(f(x))", true); // Default preview
    const cleanFunc = func || `f(${v || 'x'})`;
    if (ord === 1) return `\\frac{\\mathrm{d}}{\\mathrm{d}${v}} \\left( ${cleanFunc} \\right)`;
    return `\\frac{\\mathrm{d}^{${ord}}}{\\mathrm{d}${v}^{${ord}}} \\left( ${cleanFunc} \\right)`;
  };
  
  useEffect(() => {
    const latexPreview = getDerivativeNotation(functionString, variable, order);
    setDiffPreviewHtml(renderMath(latexPreview, true));
  }, [functionString, variable, order]);

  useEffect(() => {
    // For DE preview, we'll just render the input string.
    // A more sophisticated preview would parse it or try to format it nicely.
    if (deString.trim()) {
        setDePreviewHtml(renderMath(deString, true));
    } else {
        setDePreviewHtml(renderMath("y' + P(x)y = Q(x)", true)); // Default placeholder
    }
  }, [deString]);


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
  };
  
  const getOriginalQueryAsLatex = (query: DifferentiationInput | undefined): string => {
    if (!query) return "";
    const funcStr = query.functionString.replace(/\\/g, '\\\\'); // Basic escape for TeX commands in input
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
        initialConditions: initialConditions.filter(ic => ic.condition.trim() && ic.value.trim()), // Send only non-empty ICs
    };

    try {
        const actionResult = await handleSolveDifferentialEquationAction(input);
        if (actionResult.error) {
            setDeError(actionResult.error);
        } else if (actionResult.data) {
            setDeApiResponse(actionResult.data);
        } else {
            setDeError('Received no data from the DE solver. Please try again.');
        }
    } catch (e: any) {
        setDeError(e.message || 'An unexpected error occurred while solving the DE.');
    } finally {
        setIsDeLoading(false);
    }
  };

  const handleDeClear = () => {
    setDeString('');
    setDeDependentVar('y');
    setDeIndependentVar('x');
    setInitialConditions([]);
    setDeApiResponse(null);
    setDeError(null);
  };

  const addInitialCondition = () => {
    setInitialConditions([...initialConditions, { condition: '', value: '' }]);
  };

  const updateInitialCondition = (index: number, field: 'condition' | 'value', val: string) => {
    const newConditions = [...initialConditions];
    newConditions[index][field] = val;
    setInitialConditions(newConditions);
  };

  const removeInitialCondition = (index: number) => {
    setInitialConditions(initialConditions.filter((_, i) => i !== index));
  };

  const getDEOriginalQueryAsLatex = (query: DESolutionInput | undefined): string => {
    if (!query || !query.equationString) return "DE Query Error";
    let latex = query.equationString;
    if (query.initialConditions && query.initialConditions.length > 0) {
        latex += ",\\quad " + query.initialConditions.map(ic => `${ic.condition} = ${ic.value}`).join(',\\ ');
    }
    return latex;
  };


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
          
          {/* Function Derivatives Tab Content */}
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
                      setDiffError(null); setDiffApiResponse(null);
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
                      setDiffError(null); setDiffApiResponse(null);
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
                    setDiffError(null); setDiffApiResponse(null);
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
                        dangerouslySetInnerHTML={{ __html: renderMath(diffApiResponse.derivativeResult, true) }} 
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
                              className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: renderStepsContent(diffApiResponse.steps) }}
                            />
                            <p className="mt-2 text-xs text-muted-foreground italic">
                              Steps are provided by the AI. Math in steps is rendered by KaTeX.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {diffApiResponse.plotHint && (
                      <Accordion type="single" collapsible className="w-full mt-4">
                        <AccordionItem value="plot-info">
                          <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                            <Info className="mr-2 h-5 w-5" /> Plot Information
                          </AccordionTrigger>
                          <AccordionContent>
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Visualizing the Derivative</CardTitle>
                                    <CardDescription>{diffApiResponse.plotHint}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                                        <Image 
                                            src="https://placehold.co/400x200.png" 
                                            alt="Derivative plot placeholder" 
                                            data-ai-hint="calculus graph"
                                            width={400} 
                                            height={200}
                                            className="opacity-75 mb-2 rounded"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Interactive plot generation coming soon.
                                        </p>
                                    </div>
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

          {/* Differential Equations Tab Content */}
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
                    <Label className="block text-md font-semibold text-foreground">Initial Conditions (Optional):</Label>
                    {initialConditions.map((ic, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                            <Input
                                type="text"
                                placeholder="e.g., y(0)"
                                value={ic.condition}
                                onChange={(e) => updateInitialCondition(index, 'condition', e.target.value)}
                                className="flex-grow"
                                aria-label={`Initial condition ${index + 1} expression`}
                            />
                            <span className="text-lg">=</span>
                            <Input
                                type="text"
                                placeholder="e.g., 1"
                                value={ic.value}
                                onChange={(e) => updateInitialCondition(index, 'value', e.target.value)}
                                className="flex-grow"
                                aria-label={`Initial condition ${index + 1} value`}
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeInitialCondition(index)} aria-label="Remove initial condition">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" onClick={addInitialCondition} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-5 w-5" /> Add Initial Condition
                    </Button>
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
                                DE Solution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6 text-lg">
                             <div>
                                <span className="font-semibold text-muted-foreground">Original Query: </span>
                                <span 
                                    className="font-mono p-1 rounded-sm bg-muted text-sm block overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: renderMath(getDEOriginalQueryAsLatex(deApiResponse.originalQuery), true) }}
                                />
                            </div>
                            <div>
                                <span className="font-semibold text-muted-foreground">Classification: </span>
                                <span className="p-1 rounded-sm bg-secondary">{deApiResponse.classification}</span>
                            </div>
                             <div>
                                <span className="font-semibold text-muted-foreground">Solution Method: </span>
                                <span className="p-1 rounded-sm bg-secondary">{deApiResponse.solutionMethod}</span>
                            </div>

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
                                    <AccordionItem value="de-steps">
                                    <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                                        <Info className="mr-2 h-5 w-5" /> Show Steps
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div 
                                        className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: renderStepsContent(deApiResponse.steps) }}
                                        />
                                        <p className="mt-2 text-xs text-muted-foreground italic">
                                        Steps are provided by the AI. Math in steps is rendered by KaTeX.
                                        </p>
                                    </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            )}

                            {deApiResponse.plotHint && (
                                <Accordion type="single" collapsible className="w-full mt-4">
                                    <AccordionItem value="de-plot-info">
                                    <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                                        <Info className="mr-2 h-5 w-5" /> Plot Information
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Card className="shadow-none">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Visualizing the Solution</CardTitle>
                                                <CardDescription>{deApiResponse.plotHint}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                                                    <Image 
                                                        src="https://placehold.co/400x200.png" 
                                                        alt="DE solution plot placeholder" 
                                                        data-ai-hint="calculus graph solution"
                                                        width={400} 
                                                        height={200}
                                                        className="opacity-75 mb-2 rounded"
                                                    />
                                                    <p className="text-sm text-muted-foreground">
                                                        Interactive plot generation coming soon.
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
