
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Send, Loader2, TestTubeDiagonal, AlertCircle } from 'lucide-react';
import { fetchWolframAlphaStepsAction } from '@/app/actions'; // Import the Server Action

export default function IntegrationTestPage() {
  const [expression, setExpression] = useState<string>('');
  const [resultSteps, setResultSteps] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!expression.trim()) {
      setError('Please enter a mathematical expression.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultSteps(null);

    try {
      const actionResult = await fetchWolframAlphaStepsAction(expression);

      if (actionResult.error) {
        setError(actionResult.error);
      } else if (actionResult.data) {
        setResultSteps(actionResult.data);
      } else {
        setError('Received no data from the server.');
      }

    } catch (err: any) {
      console.error('Error calling fetchWolframAlphaStepsAction:', err);
      setError(err.message || 'An unknown error occurred while calling the server action.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Link href="/workstations" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <TestTubeDiagonal className="h-8 w-8 mr-3" />
            WolframAlpha Integration Test
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Enter an integration problem (e.g., "integrate x^2 dx") to get step-by-step solutions from WolframAlpha via a Server Action.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="expression-input" className="block text-md font-semibold text-foreground mb-1">
                Enter Integration Problem:
              </Label>
              <Input
                id="expression-input"
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="e.g., integrate e^x dx"
                className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Fetching Solution...' : 'Get Step-by-Step Solution'}
            </Button>
          </form>

          {isLoading && (
            <div className="flex items-center justify-center p-8 rounded-md bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-xl font-medium text-foreground">
                Contacting WolframAlpha via Server...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold">API Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resultSteps && !isLoading && !error && (
            <Card className="mt-6 border-accent border-t-4 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center text-primary">
                  Step-by-Step Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap p-4 bg-secondary rounded-md text-sm text-foreground/90 overflow-x-auto">
                  {resultSteps}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-xs text-muted-foreground">
            Results are proxied from the WolframAlpha API via a Next.js Server Action. The API Key <code className="text-xs">LKRWWW-KW2L4V2652</code> is used on the server-side.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
