
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Loader2, Brain } from 'lucide-react';

// Mock Newton API client (replace with actual API calls to Newton API or a similar service)
async function callNewtonApi(operation: string, expression: string): Promise<string> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  if (!expression.trim()) {
    throw new Error("Expression cannot be empty.");
  }

  // Simulate some basic responses - a real API would be far more capable.
  // Examples for Newton API syntax (though we are just mocking the response string here):
  // solve: '2x+5=10' -> 'x=2.5'
  // simplify: '(x+2)(x-2)' -> 'x^2-4'
  // factor: 'x^2-4' -> '(x-2)(x+2)'
  switch (operation) {
    case 'solve':
      if (expression.includes('x + 5 = 10')) return 'x = 5';
      if (expression.includes('2*x = 6')) return 'x = 3';
      if (expression.includes('y = mx + c')) return 'Cannot solve for multiple variables without more equations (mock response).';
      return `Solution for "${expression}" (e.g., x = ...). Note: This is a simplified mock response.`;
    case 'simplify':
      if (expression.toLowerCase().includes('2 + 2')) return '4';
      if (expression.toLowerCase().includes('x + x')) return '2x';
      if (expression.toLowerCase().includes('(a+b)^2')) return 'a^2 + 2ab + b^2';
      return `Simplified: "${expression}". Note: This is a simplified mock response.`;
    case 'factor':
      if (expression.includes('x^2 - 4')) return '(x - 2)(x + 2)';
      if (expression.includes('a^2 - b^2')) return '(a - b)(a + b)';
      if (expression.includes('x^2 + 2x + 1')) return '(x + 1)^2';
      return `Factored: "${expression}". Note: This is a simplified mock response.`;
    default:
      throw new Error(`Invalid operation: ${operation}. Supported operations are solve, simplify, factor.`);
  }
}

export default function BasicAlgebraPage() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  const handleProcessExpression = async (operation: 'solve' | 'simplify' | 'factor') => {
    if (!expression.trim()) {
      setError("Please enter a mathematical expression.");
      setResult(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentOperation(operation);

    try {
      const apiResult = await callNewtonApi(operation, expression);
      setResult(apiResult);
    } catch (e: any) {
      setError(e.message || 'An error occurred while processing the expression.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3" />
            Basic Algebra Solver
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Input an algebraic expression and select an operation: Solve, Simplify, or Factor. 
            Our system will process it and display the result.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <label htmlFor="expression-input" className="block text-md font-semibold text-foreground mb-2">
              Enter Algebraic Expression:
            </label>
            <Input
              id="expression-input"
              type="text"
              placeholder="e.g., 2x + 5 = 15,  (y+1)(y-1),  a^2 - 9"
              value={expression}
              onChange={(e) => {
                setExpression(e.target.value);
                if (error) setError(null); 
                if (result) setResult(null);
              }}
              className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
            <Button 
              onClick={() => handleProcessExpression('solve')} 
              disabled={isLoading || !expression.trim()} 
              size="lg"
              className="flex-grow sm:flex-grow-0"
            >
              {isLoading && currentOperation === 'solve' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Solve Equation
            </Button>
            <Button 
              onClick={() => handleProcessExpression('simplify')} 
              disabled={isLoading || !expression.trim()} 
              size="lg"
              className="flex-grow sm:flex-grow-0"
            >
              {isLoading && currentOperation === 'simplify' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Simplify Expression
            </Button>
            <Button 
              onClick={() => handleProcessExpression('factor')} 
              disabled={isLoading || !expression.trim()} 
              size="lg"
              className="flex-grow sm:flex-grow-0"
            >
              {isLoading && currentOperation === 'factor' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Factor Expression
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-8 rounded-md bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-xl font-medium text-foreground">
                Calculating result for &quot;{expression}&quot; using {currentOperation}...
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

          {result && !isLoading && !error && (
            <Card className="mt-6 border-accent border-t-4 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center text-primary">
                  <CheckCircle2 className="h-7 w-7 mr-2 text-green-600" />
                  Processed Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold text-muted-foreground">Original Expression: </span> 
                  <code className="bg-muted p-1 rounded-sm text-sm">{expression}</code>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Operation Performed: </span>
                  <span className="capitalize p-1 rounded-sm text-sm">{currentOperation}</span>
                </div>
                <div className="p-4 border border-dashed rounded-md bg-background min-h-[70px] flex items-center justify-center">
                  {/* TODO: Implement LaTeX rendering here (e.g., using react-katex or MathJax). For now, displaying as text. */}
                  <p className="text-xl font-mono text-accent-foreground select-all">
                    {result}
                  </p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground italic">
                  Note: Results are currently plain text. LaTeX rendering for proper mathematical notation will be added soon.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

       <Card className="mt-8 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">About This Tool</CardTitle>
        </CardHeader>
        <CardContent className="text-foreground/80 space-y-2">
          <p>
            This Basic Algebra tool helps you perform common algebraic operations:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>Solve:</strong> Finds the value of variables in equations. (e.g., <code className="bg-muted p-1 rounded-sm text-xs">2x + 4 = 10</code>).</li>
            <li><strong>Simplify:</strong> Reduces expressions to their simplest form. (e.g., <code className="bg-muted p-1 rounded-sm text-xs">2x + 3x - y</code>).</li>
            <li><strong>Factor:</strong> Breaks down expressions into their constituent factors. (e.g., <code className="bg-muted p-1 rounded-sm text-xs">x^2 - y^2</code>).</li>
          </ul>
          <p className="mt-3">
            The operations are powered by a simulated API (like the Newton API) to provide quick and accurate results. Proper mathematical formatting using LaTeX will be integrated for enhanced readability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
    