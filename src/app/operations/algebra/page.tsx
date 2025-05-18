
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Loader2, Brain, ArrowLeft, XCircle } from 'lucide-react';

interface NewtonApiResponse {
  operation: string;
  expression: string;
  result: string;
}

async function callNewtonApi(operation: string, expression: string): Promise<NewtonApiResponse> {
  if (!expression.trim()) {
    throw new Error("Expression cannot be empty.");
  }
  if (!operation) {
    throw new Error("Operation must be selected.");
  }

  const encodedExpression = encodeURIComponent(expression);
  const apiUrl = `https://newton.vercel.app/api/v2/${operation}/${encodedExpression}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    let errorData;
    let errorMessage = `API Error (${response.status}): `;
    try {
      errorData = await response.json();
      errorMessage += errorData.error || response.statusText || "An unknown API error occurred.";
    } catch (e) {
      // If response is not JSON or response.json() fails
      errorMessage += response.statusText || "Failed to parse error response.";
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

const operations = [
  { value: "simplify", label: "Simplify", example: "e.g., 2^2+2(2)" },
  { value: "factor", label: "Factor", example: "e.g., x^2-1" },
  { value: "derive", label: "Derivative", example: "e.g., x^2 (for d/dx)" },
  { value: "integrate", label: "Integrate", example: "e.g., 2x (for ∫2x dx)" },
  { value: "zeroes", label: "Find Zeros", example: "e.g., x^2-4" },
  { value: "expand", label: "Expand (uses simplify)", example: "e.g., (x+1)(x-1)" },
  { value: "log", label: "Logarithm", example: "e.g., 2:8 (for log base 2 of 8)" },
  { value: "trigsimplify", label: "Trigonometric Simplify", example: "e.g., sin(x)^2+cos(x)^2" },
];

export default function BasicAlgebraCalculatorPage() {
  const [expression, setExpression] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<NewtonApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiResponse && typeof window !== 'undefined' && window.MathJax) {
      if (window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
        // Fallback for MathJax v2 if needed, though v3 is expected
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }
    }
  }, [apiResponse]);

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

    let apiOperation = selectedOperation;
    if (selectedOperation === 'expand' || selectedOperation === 'trigsimplify') {
      apiOperation = 'simplify';
    }
    
    try {
      const result = await callNewtonApi(apiOperation, expression);
      setApiResponse(result);
    } catch (e: any) {
      setError(e.message || 'An error occurred while processing the expression.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setExpression('');
    setSelectedOperation(null); // This will make Select show placeholder due to `value={selectedOperation || ""}`
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
            Enter an expression, select an operation, and get the result. Powered by Newton API.
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
                onValueChange={(value) => {
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
                Calculating for &quot;{expression}&quot; using {operations.find(op => op.value === selectedOperation)?.label || selectedOperation}...
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
                   <span className="font-mono p-1 rounded-sm bg-muted">{`\\( ${apiResponse.expression} \\)`}</span>
                </div>
                <div className="border-t pt-4 mt-4">
                  <span className="font-semibold text-muted-foreground">Computed Result: </span>
                  <div className="p-4 border border-dashed rounded-md bg-background min-h-[70px] flex items-center justify-center text-2xl font-mono text-accent-foreground select-all">
                    {/* MathJax will render this */}
                    {`\\[ ${apiResponse.result} \\]`}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground italic">
                  Results are rendered using MathJax. If not displaying correctly, ensure your browser supports it and there are no console errors related to MathJax.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
         <CardFooter className="p-6 bg-secondary/50">
            <p className="text-sm text-muted-foreground">
                Newton API URL: <code className="text-xs">https://newton.vercel.app/api/v2/:operation/:expression</code>. 
                This tool is a frontend for this public API. Note: For logarithm, use format <code className="text-xs">base:number</code> in expression field e.g., <code className="text-xs">2:8</code> for log<sub>2</sub>(8).
                'Expand' and 'Trig Simplify' operations use the 'simplify' API endpoint.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
