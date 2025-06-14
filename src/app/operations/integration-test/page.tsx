
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Send, Loader2, TestTubeDiagonal, AlertCircle } from 'lucide-react';

// Define a more specific type for the API response structure we expect
interface WolframPod {
  title: string;
  id: string;
  subpods: Array<{
    title: string;
    plaintext: string;
    img?: { src: string; alt: string; title: string; width: number; height: number; type: string; };
  }>;
}

interface WolframQueryResult {
  success: boolean;
  error: false | { code: string; msg: string; };
  numpods: number;
  datatypes: string;
  timedout: string;
  timedoutpods: string;
  timing: number;
  parsetiming: number;
  parsetimedout: boolean;
  recalculate: string;
  id: string;
  host: string;
  server: string;
  related: string;
  version: string;
  inputstring: string;
  pods?: WolframPod[];
}

interface WolframAlphaResponse {
  queryresult: WolframQueryResult;
}

export default function IntegrationTestPage() {
  const [expression, setExpression] = useState<string>('');
  const [resultSteps, setResultSteps] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // IMPORTANT: For production, this API key should NOT be in client-side code.
  // It should be on a backend server and calls proxied.
  const WOLFRAM_APP_ID = 'LKRWWW-KW2L4V2652';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!expression.trim()) {
      setError('Please enter a mathematical expression.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultSteps(null);

    const encodedInput = encodeURIComponent(expression);
    const apiUrl = `https://api.wolframalpha.com/v2/query?appid=${WOLFRAM_APP_ID}&input=${encodedInput}&format=plaintext&podstate=Step-by-step+solution&output=json`;

    try {
      // Note: WolframAlpha API often doesn't support CORS for direct client-side calls.
      // This might require a backend proxy. For this test, we'll try directly.
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data: WolframAlphaResponse = await response.json();

      if (!data.queryresult.success) {
        if (data.queryresult.error && typeof data.queryresult.error === 'object') {
            setError(`WolframAlpha Error: ${data.queryresult.error.msg} (Code: ${data.queryresult.error.code})`);
        } else {
            setError('WolframAlpha could not process the query. No specific error message provided.');
        }
        return;
      }

      if (!data.queryresult.pods || data.queryresult.pods.length === 0) {
        setError('No results (pods) returned from WolframAlpha.');
        return;
      }
      
      // Try to find the step-by-step solution pod more reliably
      const stepByStepPod = data.queryresult.pods.find(
        pod => 
          pod.id?.toLowerCase().includes('step-by-step solution') ||
          pod.id?.toLowerCase().includes('step-by-step') ||
          pod.title?.toLowerCase().includes('step-by-step solution') ||
          (pod.id?.toLowerCase().includes('integral') && pod.subpods.some(sp => sp.title?.toLowerCase().includes('step-by-step')))
      );

      if (stepByStepPod && stepByStepPod.subpods.length > 0) {
        const steps = stepByStepPod.subpods
          .map(subpod => subpod.plaintext)
          .filter(text => text && text.trim() !== '')
          .join('\\n\\n---\\n\\n'); // Join subpod plaintexts with a separator
        setResultSteps(steps || 'No step-by-step solution found in the designated pod.');
      } else {
        // Fallback: try finding an "Indefinite integral" or "Definite integral" pod if steps are not explicitly found
        const integralPod = data.queryresult.pods.find(
          pod => pod.id?.toLowerCase().includes('indefiniteintegral') || pod.id?.toLowerCase().includes('definiteintegral') || pod.title?.toLowerCase().includes('integral')
        );
        if (integralPod && integralPod.subpods.length > 0) {
            const resultText = integralPod.subpods
              .map(subpod => subpod.plaintext)
              .filter(text => text && text.trim() !== '')
              .join('\\n\\n');
            setResultSteps(`Result found (but not explicitly step-by-step):\\n${resultText}`);
        } else {
            setResultSteps('No step-by-step solution or direct integral result pod found. Full response logged.');
            console.warn("WolframAlpha Full Response (for debugging):", data);
        }
      }

    } catch (err: any) {
      console.error('WolframAlpha API call error:', err);
      // Check if the error is due to CORS by inspecting err.message or err.name
      if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
        setError('Failed to fetch from WolframAlpha. This might be a CORS issue if running directly in the browser. For production, use a backend proxy.');
      } else {
        setError(err.message || 'An unknown error occurred.');
      }
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
            Enter an integration problem (e.g., "integrate x^2 dx") to get step-by-step solutions from WolframAlpha.
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
                Contacting WolframAlpha...
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
            Results are powered by the WolframAlpha API. Note: Direct client-side API calls might be restricted by CORS in some environments; a backend proxy is recommended for production. API Key: <code className="text-xs">{WOLFRAM_APP_ID}</code> (Test key, for dev purposes only).
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
