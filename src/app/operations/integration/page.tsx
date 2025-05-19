
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle2, Loader2, Sigma, ArrowLeft, XCircle, Info, Brain } from 'lucide-react';
import { handlePerformIntegrationAction } from '@/app/actions';
import type { IntegrationInput, IntegrationOutput } from '@/ai/flows/perform-integration-flow';

export default function IntegrationCalculatorPage() {
  const [functionString, setFunctionString] = useState('');
  const [variable, setVariable] = useState('x');
  const [integralType, setIntegralType] = useState<'indefinite' | 'definite'>('indefinite');
  const [lowerBound, setLowerBound] = useState('');
  const [upperBound, setUpperBound] = useState('');

  const [apiResponse, setApiResponse] = useState<IntegrationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiResponse && typeof window !== 'undefined' && window.MathJax) {
      const MathJax = window.MathJax as any;
      if (MathJax.startup?.promise) {
        MathJax.startup.promise.then(() => {
          MathJax.typesetPromise?.();
        }).catch((err: any) => console.error('MathJax typesetPromise error after startup:', err));
      } else if (MathJax.typesetPromise) {
         MathJax.typesetPromise().catch((err: any) => console.error('MathJax typesetPromise error:', err));
      } else if (MathJax.Hub?.Queue) { 
         MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
      }
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
  };

  const getIntegralSymbol = () => {
    if (integralType === 'definite') {
      return `\\( \\int_{${lowerBound || 'a'}}^{${upperBound || 'b'}} ${functionString || 'f(x)'} \\,d${variable || 'x'} \\)`;
    }
    return `\\( \\int ${functionString || 'f(x)'} \\,d${variable || 'x'} \\)`;
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
            <div className="text-2xl text-center font-mono p-2 bg-background rounded-md overflow-x-auto">
              {getIntegralSymbol()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label htmlFor="function-input" className="block text-md font-semibold text-foreground">
                Function to integrate, f(x):
              </Label>
              <Input
                id="function-input"
                type="text"
                placeholder="e.g., x^2 + 2*x + 1 or sin(x)"
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
                Variable of integration (e.g., x):
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
                setError(null); setApiResponse(null);
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
                    setError(null); setApiResponse(null);
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
                    setError(null); setApiResponse(null);
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
                  <span className="font-mono p-1 rounded-sm bg-muted text-sm">
                    Integrate 
                    {` \\( ${apiResponse.originalQuery.functionString} \\) `}
                    with respect to 
                    {` \\( ${apiResponse.originalQuery.variable} \\) `}
                    {apiResponse.originalQuery.isDefinite ? 
                      `from \\( ${apiResponse.originalQuery.lowerBound} \\) to \\( ${apiResponse.originalQuery.upperBound} \\)` : 
                      '(indefinite)'}.
                  </span>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">Computed Result:</h3>
                  <div className="font-mono p-3 text-2xl rounded-md bg-muted text-primary dark:text-primary-foreground overflow-x-auto">
                    {`\\[ ${apiResponse.integralResult} \\]`}
                  </div>
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
                        >
                          {apiResponse.steps}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          Steps are provided by the AI and may vary in detail or format.
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
                                <CardTitle className="text-lg">Visualizing the Integral</CardTitle>
                                <CardDescription>{apiResponse.plotHint}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                                    <Image 
                                        src="https://placehold.co/400x200.png" 
                                        alt="Integral plot placeholder" 
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
                  Results are rendered using MathJax. Ensure the AI's output is a valid mathematical expression.
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
