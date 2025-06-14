
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Send, Loader2, TestTubeDiagonal, AlertCircle, Brain, Sigma, Wand2 } from 'lucide-react';
import { fetchWolframAlphaStepsAction, type EnhancedWolframResult } from '@/app/actions'; 
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';

const renderKaTeX = (mathString: string | undefined | null, displayMode: boolean = false): string => {
  if (!mathString) return "";
  let cleanLatexString = mathString.trim();
  
  try {
    return katex.renderToString(cleanLatexString, {
      throwOnError: false,
      displayMode: displayMode,
      output: 'html',
      macros: { "\\dd": "\\mathrm{d}"} 
    });
  } catch (e) {
    console.error("Katex rendering error:", e, "Original string:", mathString);
    return mathString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); 
  }
};

const cleanAndPrepareContentForDisplay = (content: string | undefined | null): string => {
  if (!content) return "";
  // Remove form feed characters () and trim whitespace
  return content.replace(//g, '').trim(); 
};


export default function IntegrationTestPage() {
  const [expression, setExpression] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<EnhancedWolframResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const hintsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = stepsContainerRef.current;
    const stepsContent = apiResponse?.geminiExplanation?.explainedSteps;

    if (container) {
        const cleanedSteps = cleanAndPrepareContentForDisplay(stepsContent);
        if (cleanedSteps) { // Only proceed if cleanedSteps has actual content
            container.innerHTML = cleanedSteps;
            if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
                try {
                    (window as any).renderMathInElement(container, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true }
                        ],
                        throwOnError: false
                    });
                } catch (e) {
                    console.error("Error during manual KaTeX re-render for steps:", e);
                    // Optionally, set a fallback or error message in the container
                    // container.innerHTML = `<p class="text-destructive">Error rendering math in steps.</p><pre>${cleanedSteps.replace(/</g, '&lt;')}</pre>`;
                }
            }
        } else {
            container.innerHTML = ""; // Clear if no steps or steps became empty after cleaning
        }
    }
  }, [apiResponse?.geminiExplanation?.explainedSteps]);

  useEffect(() => {
    const container = hintsContainerRef.current;
    const hintsContent = apiResponse?.geminiExplanation?.additionalHints;

    if (container) {
        const cleanedHints = cleanAndPrepareContentForDisplay(hintsContent);
        if (cleanedHints) { // Only proceed if cleanedHints has actual content
            container.innerHTML = cleanedHints;
            if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
                try {
                    (window as any).renderMathInElement(container, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true }
                        ],
                        throwOnError: false
                    });
                } catch (e) {
                    console.error("Error during manual KaTeX re-render for hints:", e);
                }
            }
        } else {
            container.innerHTML = ""; // Clear if no hints or hints became empty after cleaning
        }
    }
  }, [apiResponse?.geminiExplanation?.additionalHints]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!expression.trim()) {
      setError('Please enter a mathematical expression.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const actionResult = await fetchWolframAlphaStepsAction(expression);

      if (actionResult.error) {
        setError(actionResult.error);
        if(actionResult.data) setApiResponse(actionResult.data); 
      } else if (actionResult.data) {
        setApiResponse(actionResult.data);
      } else {
        setError('Received no data or error from the server.');
      }

    } catch (err: any) {
      console.error('Error calling fetchWolframAlphaStepsAction on client:', err);
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
            <Wand2 className="h-8 w-8 mr-3" />
            AI-Enhanced Integration Solver
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Enter an integration problem (e.g., "integrate x^2 dx"). Gemini refines your query for WolframAlpha, then explains the solution.
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
                placeholder="e.g., integral of x*sin(x) dx from 0 to pi"
                className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Processing with AI...' : 'Solve & Explain'}
            </Button>
          </form>

          {isLoading && (
            <div className="flex items-center justify-center p-8 rounded-md bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-xl font-medium text-foreground">
                AI is processing your request...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Processing Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {apiResponse && !isLoading && (
            <Card className="mt-6 border-t-4 border-accent shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center text-primary">
                  <Sigma className="h-7 w-7 mr-2"/> Solution Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-muted-foreground">Original Query:</h3>
                  <p className="p-2 bg-secondary rounded-md text-sm italic">{apiResponse.originalQuery}</p>
                </div>
                {apiResponse.cleanedQuery && (
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground">Query sent to WolframAlpha:</h3>
                    <p className="p-2 bg-secondary rounded-md text-sm font-mono">{apiResponse.cleanedQuery}</p>
                  </div>
                )}
                
                {apiResponse.geminiExplanation?.formattedResult && (
                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-2">Formatted Result:</h3>
                    <div className="p-3 bg-muted rounded-md text-lg overflow-x-auto"
                         dangerouslySetInnerHTML={{ __html: renderKaTeX(apiResponse.geminiExplanation.formattedResult, true) }} />
                  </div>
                )}

                {apiResponse.geminiExplanation?.explainedSteps && (
                  <Accordion type="single" collapsible className="w-full" defaultValue="steps">
                    <AccordionItem value="steps">
                      <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                        <Brain className="mr-2 h-5 w-5"/> Gemini&apos;s Explanation of Steps
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          ref={stepsContainerRef} 
                          className="prose prose-sm dark:prose-invert max-w-none p-4 bg-secondary rounded-md whitespace-pre-wrap overflow-x-auto"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                 {apiResponse.geminiExplanation?.additionalHints && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="hints">
                      <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                       <TestTubeDiagonal className="mr-2 h-5 w-5"/> Additional Hints & Insights
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          ref={hintsContainerRef} 
                          className="prose prose-sm dark:prose-invert max-w-none p-4 bg-secondary rounded-md whitespace-pre-wrap overflow-x-auto"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {apiResponse.wolframPlaintextResult && !apiResponse.geminiExplanation && (
                    <div>
                        <h3 className="text-lg font-semibold text-muted-foreground">Raw WolframAlpha Result:</h3>
                        <pre className="whitespace-pre-wrap p-2 bg-secondary rounded-md text-xs">{apiResponse.wolframPlaintextResult}</pre>
                    </div>
                )}
              </CardContent>
               <CardFooter className="p-4 bg-secondary/50 border-t">
                  <p className="text-xs text-muted-foreground">
                    Original query processed by Gemini, sent to WolframAlpha, then results explained and formatted by Gemini. Math rendered with KaTeX.
                  </p>
              </CardFooter>
            </Card>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-xs text-muted-foreground">
            This page demonstrates a multi-step AI pipeline for solving integration problems. Results depend on interpretations by both Gemini and WolframAlpha.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

