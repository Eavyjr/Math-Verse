
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import katex from 'katex';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft, XCircle, Info, Brain, Ratio } from 'lucide-react'; // Using Ratio for differentiation icon
import { handlePerformDifferentiationAction } from '@/app/actions';
import type { DifferentiationInput, DifferentiationOutput } from '@/ai/flows/perform-differentiation-flow';

// Helper function to render a single LaTeX string to HTML
const renderMath = (latexString: string | undefined, displayMode: boolean = false): string => {
  if (!latexString) return "";
  try {
    return katex.renderToString(latexString, {
      throwOnError: false,
      displayMode: displayMode,
      output: 'html',
      macros: { "\\dd": "\\mathrm{d}"} // Example macro for d
    });
  } catch (e) {
    console.error("Katex rendering error:", e);
    return latexString; // Fallback to raw string on error
  }
};

// Helper function to render content with mixed text and KaTeX
const renderStepsContent = (stepsString: string | undefined): string => {
  if (!stepsString) return "";
  // Split by \(...\) or \[...\]
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
      // Escape HTML characters in plain text parts for safety, though AI output is generally trusted.
      // A more robust sanitizer could be used for user-generated content.
      return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } catch (e) {
      console.error("KaTeX steps rendering error:", e, "Part:", part);
      return part; // Fallback for the specific part
    }
  }).join('');
};


export default function DifferentiationCalculatorPage() {
  const [functionString, setFunctionString] = useState('');
  const [variable, setVariable] = useState('x');
  const [order, setOrder] = useState<number>(1);

  const [apiResponse, setApiResponse] = useState<DifferentiationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const derivativeOrders = [
    { label: '1st Derivative', value: 1 },
    { label: '2nd Derivative', value: 2 },
    { label: '3rd Derivative', value: 3 },
    { label: '4th Derivative', value: 4 },
  ];

  const getDerivativeNotation = (func: string, v: string, ord: number) => {
    if (ord === 1) return `\\frac{\\mathrm{d}}{\\mathrm{d}${v}} \\left( ${func} \\right)`;
    return `\\frac{\\mathrm{d}^{${ord}}}{\\mathrm{d}${v}^{${ord}}} \\left( ${func} \\right)`;
  };
  
  useEffect(() => {
    const func = functionString || 'f(x)';
    const v = variable || 'x';
    const latexPreview = getDerivativeNotation(func, v, order);
    setPreviewHtml(renderMath(latexPreview, true));
  }, [functionString, variable, order]);


  const handleSubmit = async () => {
    if (!functionString.trim()) {
      setError("Please enter a function to differentiate.");
      setApiResponse(null);
      return;
    }
    if (!variable.trim()) {
      setError("Please enter a variable of differentiation.");
      setApiResponse(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    
    const input: DifferentiationInput = {
      functionString,
      variable,
      order,
    };

    try {
      const actionResult = await handlePerformDifferentiationAction(input);
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
    setOrder(1);
    setApiResponse(null);
    setError(null);
  };
  
  const getOriginalQueryAsLatex = (query: DifferentiationInput | undefined): string => {
    if (!query) return "";
    const funcStr = query.functionString.replace(/\\/g, '\\\\');
    const varStr = query.variable.replace(/\\/g, '\\\\');
    return getDerivativeNotation(funcStr, varStr, query.order);
  }


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
            Differentiation & DEs
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Calculate derivatives and explore differential equations with AI assistance.
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="derivatives" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="derivatives">Function Derivatives</TabsTrigger>
            <TabsTrigger value="des">Differential Equations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="derivatives" className="p-0">
            <CardContent className="p-6 space-y-6">
              <div className="p-4 border rounded-md bg-secondary/30">
                <p className="text-xl font-semibold text-center text-primary mb-2">Derivative Preview:</p>
                <div 
                    className="text-2xl text-center font-mono p-2 bg-background rounded-md overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="function-input" className="block text-md font-semibold text-foreground">
                    Function to differentiate, f(v):
                  </Label>
                  <Input
                    id="function-input"
                    type="text"
                    placeholder="e.g., x^3 + sin(x)"
                    value={functionString}
                    onChange={(e) => {
                      setFunctionString(e.target.value);
                      setError(null); setApiResponse(null);
                    }}
                    className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variable-input" className="block text-md font-semibold text-foreground">
                    Variable (v):
                  </Label>
                  <Input
                    id="variable-input"
                    type="text"
                    placeholder="x"
                    value={variable}
                    onChange={(e) => {
                      setVariable(e.target.value);
                      setError(null); setApiResponse(null);
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
                    setError(null); setApiResponse(null);
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
                  onClick={handleSubmit}
                  disabled={isLoading || !functionString.trim() || !variable.trim()}
                  size="lg"
                  className="flex-grow"
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
                  Calculate Derivative
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
                    Calculating derivative...
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
                      Differentiation Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6 text-lg">
                    <div>
                      <span className="font-semibold text-muted-foreground">Original Query: </span>
                      <span 
                        className="font-mono p-1 rounded-sm bg-muted text-sm"
                        dangerouslySetInnerHTML={{ __html: renderMath(getOriginalQueryAsLatex(apiResponse.originalQuery), false) }}
                      />
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-xl font-semibold text-muted-foreground mb-2">Computed Derivative:</h3>
                      <span 
                        className="font-mono p-2 rounded-md bg-muted text-primary dark:text-primary-foreground text-xl inline-block overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: renderMath(apiResponse.derivativeResult, false) }} 
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
                              className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: renderStepsContent(apiResponse.steps) }}
                            />
                            <p className="mt-2 text-xs text-muted-foreground italic">
                              Steps are provided by the AI. Math in steps is rendered by KaTeX.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {apiResponse.plotHint && (
                      <Accordion type="single" collapsible className="w-full mt-4">
                        <AccordionItem value="plot-info">
                          <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                            <Info className="mr-2 h-5 w-5" /> Plot Information
                          </AccordionTrigger>
                          <AccordionContent>
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Visualizing the Derivative</CardTitle>
                                    <CardDescription>{apiResponse.plotHint}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                                        <Image 
                                            src="https://placehold.co/400x200.png" 
                                            alt="Derivative plot placeholder" 
                                            width={400} 
                                            height={200}
                                            data-ai-hint="calculus graph"
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

          <TabsContent value="des" className="p-0">
            <CardContent className="p-6 space-y-6 min-h-[400px] flex flex-col items-center justify-center">
                <Card className="w-full max-w-lg p-8 text-center">
                    <CardTitle className="text-2xl mb-4">Differential Equation Solver</CardTitle>
                    <CardDescription className="mb-6">
                        Functionality to solve various types of differential equations is under development.
                        Stay tuned for updates!
                    </CardDescription>
                    <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
                     <Input 
                        type="text"
                        placeholder="Enter differential equation, e.g., y' + y = 0"
                        className="text-lg p-3 mb-4"
                        disabled 
                    />
                    <Button disabled size="lg">Solve DE (Coming Soon)</Button>
                </Card>
            </CardContent>
            <CardFooter className="p-6 bg-secondary/50 border-t">
                <p className="text-sm text-muted-foreground">
                    The differential equations module will support common DE types and solution methods.
                </p>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
