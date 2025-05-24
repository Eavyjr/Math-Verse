
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import katex from 'katex';
import "katex/dist/katex.min.css"; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle2, Loader2, Brain, ArrowLeft, XCircle, Info } from 'lucide-react';
import { handlePerformAlgebraicOperationAction } from '@/app/actions';
import type { AlgebraicOperationInput, AlgebraicOperationOutput } from '@/ai/flows/perform-algebraic-operation';

const operations: { value: AlgebraicOperationInput['operation']; label: string; example: string }[] = [
  { value: "simplify", label: "Simplify", example: "e.g., 2^2+2(2)" },
  { value: "factor", label: "Factor", example: "e.g., x^2-1" },
  { value: "derive", label: "Derivative", example: "e.g., x^2 (for d/dx)" },
  { value: "integrate", label: "Integrate", example: "e.g., 2x (for ∫2x dx)" },
  { value: "zeroes", label: "Find Zeros", example: "e.g., x^2-4" },
  { value: "expand", label: "Expand", example: "e.g., (x+1)(x-1)" },
  { value: "log", label: "Logarithm", example: "e.g., 2:8 (for log base 2 of 8) or e^x" },
  { value: "trigsimplify", label: "Trigonometric Simplify", example: "e.g., sin(x)^2+cos(x)^2" },
];

const renderMath = (latexString: string | undefined, displayMode: boolean = false): string => {
  if (latexString === undefined || latexString === null || typeof latexString !== 'string') return "";
  let cleanLatexString = latexString.trim();

  // Attempt to strip common outer delimiters if AI accidentally includes them for main results
  if ((cleanLatexString.startsWith('\\(') && cleanLatexString.endsWith('\\)')) ||
      (cleanLatexString.startsWith('\\[') && cleanLatexString.endsWith('\\]'))) {
    cleanLatexString = cleanLatexString.substring(2, cleanLatexString.length - 2);
  }
  
  try {
    return katex.renderToString(cleanLatexString, {
      throwOnError: false,
      displayMode: displayMode,
    });
  } catch (e) {
    console.error("Katex rendering error:", e, "Original string:", latexString);
    return latexString; 
  }
};

const renderStepsContent = (stepsString: string | undefined): string => {
  if (!stepsString) return "";
  const parts = stepsString.split(/(\\\(.*?\\\)|\\\[.*?\\\])/g); 
  return parts.map((part) => {
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


export default function BasicAlgebraCalculatorPage() {
  const [expression, setExpression] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<AlgebraicOperationInput['operation'] | null>(null);
  const [apiResponse, setApiResponse] = useState<AlgebraicOperationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessExpression = async () => {
    if (!expression.trim()) {
      setError("Please enter a mathematical expression.");
      setApiResponse(null);
      return;
    }
    if (!selectedOperation) {
      setError("Please select an operation.");
      setApiResponse(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      const actionResult = await handlePerformAlgebraicOperationAction(expression, selectedOperation);
      if (actionResult.error) {
        setError(actionResult.error);
      } else if (actionResult.data) {
        setApiResponse(actionResult.data);
      } else {
        setError('Received no data from the server. Please try again.');
      }
    } catch (e: any) {
      let errorMessage = 'An unexpected error occurred while processing the expression.';
      if (e instanceof Error) {
        if (e.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        } else if (e.message.includes('model did not return a valid output')) {
            errorMessage = 'The AI model could not process this expression. Please try a different expression or operation.';
        } else {
            errorMessage = e.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setExpression('');
    setSelectedOperation(null); 
    setApiResponse(null);
    setError(null);
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
            <Brain className="h-8 w-8 mr-3" />
            Basic Algebra Calculator
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Enter an expression, select an operation, and get the result with steps (if available). Powered by AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label htmlFor="expression-input" className="block text-md font-semibold text-foreground">
                Enter Expression:
              </label>
              <Input
                id="expression-input"
                type="text"
                placeholder="e.g., x^2 + 2x + 1"
                value={expression}
                onChange={(e) => {
                  setExpression(e.target.value);
                  if (error) setError(null);
                  if (apiResponse) setApiResponse(null);
                }}
                className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="operation-select" className="block text-md font-semibold text-foreground">
                Select Operation:
              </label>
              <Select 
                value={selectedOperation || ""} 
                onValueChange={(value: AlgebraicOperationInput['operation']) => {
                  setSelectedOperation(value);
                  if (error) setError(null);
                  if (apiResponse) setApiResponse(null);
                }}
              >
                <SelectTrigger id="operation-select" className="text-lg p-3 h-auto">
                  <SelectValue placeholder="Choose an operation..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Algebraic Operations</SelectLabel>
                    {operations.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label} <span className="text-xs text-muted-foreground ml-2">({op.example})</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleProcessExpression}
              disabled={isLoading || !expression.trim() || !selectedOperation}
              size="lg"
              className="flex-grow"
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Calculate
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
                Calculating {operations.find(op => op.value === selectedOperation)?.label || selectedOperation} of &quot;{expression}&quot;...
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
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6 text-lg">
                <div>
                  <span className="font-semibold text-muted-foreground">Operation: </span>
                  <span className="capitalize p-1 rounded-sm">{apiResponse.operation}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Original Expression: </span>
                   <span 
                    className="font-mono p-1 rounded-sm bg-muted"
                    dangerouslySetInnerHTML={{ __html: renderMath(apiResponse.expression, false) }}
                   />
                </div>
                <div className="border-t pt-4 mt-4">
                  <span className="font-semibold text-muted-foreground">Computed Result: </span>
                  <span 
                    className="font-mono p-1 rounded-sm bg-muted text-primary dark:text-primary-foreground"
                    dangerouslySetInnerHTML={{ __html: renderMath(apiResponse.result, false) }}
                  />
                </div>

                {apiResponse.steps && apiResponse.steps.trim() !== "" && (
                  <Accordion type="single" collapsible className="w-full mt-4">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                        <Info className="mr-2 h-5 w-5" /> Show Steps
                      </AccordionTrigger>
                      <AccordionContent>
                        <div 
                          className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: renderStepsContent(apiResponse.steps) }}
                        />
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          Steps are provided by the AI and may vary in detail or format. Math expressions in steps are rendered using KaTeX.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                <p className="mt-2 text-xs text-muted-foreground italic">
                  Mathematical expressions are rendered using KaTeX.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
         <CardFooter className="p-6 bg-secondary/50">
            <p className="text-sm text-muted-foreground">
                This tool uses an AI model to perform algebraic operations. Results and steps may vary in precision and availability. 
                For logarithm, use format <code className="text-xs">base:number</code> (e.g., <code className="text-xs">2:8</code> for log<sub>2</sub>(8)) or a standard expression (e.g. <code className="text-xs">ln(x)</code>, <code className="text-xs">log(100)</code> for log base 10).
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
