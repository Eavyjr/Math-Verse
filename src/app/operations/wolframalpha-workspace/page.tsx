
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Send, Loader2, TestTubeDiagonal, AlertCircle, Sigma, HelpCircle } from 'lucide-react';
import { fetchWolframAlphaStepsAction, type EnhancedWolframResult } from '@/app/actions'; 
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import katex from 'katex';
import "katex/dist/katex.min.css";

const cleanAndPrepareContentForDisplay = (content: string | undefined | null): string => {
  if (!content) return "";
  return content.replace(/\f/g, '\n').trim(); 
};

const renderKaTeX = (mathString: string | undefined, displayMode: boolean = false): string => {
    if (mathString === undefined || mathString === null || typeof mathString !== 'string') return "";
    try {
        return katex.renderToString(mathString, {
            throwOnError: false,
            displayMode: displayMode,
        });
    } catch (e) {
        console.error("Katex rendering error:", e, "Original string:", mathString);
        return mathString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
};

const renderWolframStepsWithKatex = (stepsString: string | undefined | null): string => {
  if (!stepsString) return "";
  const cleanedString = cleanAndPrepareContentForDisplay(stepsString);
  const parts = cleanedString.split(/(\\\(.*?\\\)|\\\[.*?\\\])/g);

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

  return htmlParts.join('');
};


export default function WolframAlphaWorkspacePage() {
  const [expression, setExpression] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<EnhancedWolframResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!expression.trim()) {
      setError('Please enter a query.');
      setApiResponse(null);
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
        setError('Received no data or error from the server. Please check the logs.');
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
            <TestTubeDiagonal className="h-8 w-8 mr-3" />
            WolframAlpha Workspace
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Leverage the power of WolframAlpha's computational engine. Enter any query for a detailed solution.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="expression-input" className="block text-md font-semibold text-foreground mb-1">
                Enter your query:
              </Label>
              <Input
                id="expression-input"
                type="text"
                value={expression}
                onChange={(e) => {
                  setExpression(e.target.value);
                  setError(null); 
                  setApiResponse(null); 
                }}
                placeholder="e.g., integrate x*sin(x) dx, solve x^2+2x-3=0, d/dx(e^x*sin(x))"
                className="text-lg p-3 border-2 focus:border-accent focus:ring-accent"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Processing...' : 'Solve with WolframAlpha'}
            </Button>
          </form>

          {isLoading && (
            <div className="flex items-center justify-center p-8 rounded-md bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-xl font-medium text-foreground">
                Querying WolframAlpha...
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
                    <h3 className="text-lg font-semibold text-muted-foreground">Query Sent to WolframAlpha:</h3>
                    <p className="p-2 bg-secondary rounded-md text-sm font-mono">{apiResponse.cleanedQuery}</p>
                  </div>
                )}
                
                {apiResponse.pods.length > 0 ? (
                  <Accordion type="multiple" defaultValue={['Result', 'Step-by-step solution']} className="w-full space-y-4">
                    {apiResponse.pods.map(pod => (
                      <AccordionItem value={pod.id} key={pod.id} className="border-b-0">
                        <Card>
                          <AccordionTrigger className="p-4 text-xl font-semibold text-primary hover:no-underline rounded-t-lg">
                            <h3 className="text-left">{pod.title}</h3>
                          </AccordionTrigger>
                          <AccordionContent className="p-4 pt-0">
                            <div className="space-y-4">
                              {pod.subpods.map((subpod, index) => (
                                <div key={index}>
                                  {subpod.title && <h4 className="font-semibold text-md mb-2">{subpod.title}</h4>}
                                  {subpod.img ? (
                                    <div className="bg-white p-2 rounded-md inline-block">
                                      <Image 
                                        src={subpod.img.src} 
                                        alt={subpod.img.alt || `WolframAlpha image for ${pod.title}`}
                                        width={subpod.img.width}
                                        height={subpod.img.height}
                                        style={{
                                          maxWidth: '100%',
                                          height: 'auto',
                                        }}
                                        unoptimized
                                      />
                                    </div>
                                  ) : (
                                    <div className="p-2 bg-muted rounded-md text-sm whitespace-pre-wrap overflow-x-auto"
                                         dangerouslySetInnerHTML={{ __html: renderWolframStepsWithKatex(subpod.plaintext) }}>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <Alert>
                    <HelpCircle className="h-5 w-5"/>
                    <AlertTitle>No Pods Returned</AlertTitle>
                    <AlertDescription>WolframAlpha did not return any displayable content sections for this query.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
               <CardFooter className="p-4 bg-secondary/50 border-t">
                  <p className="text-xs text-muted-foreground">
                    Original query processed by an AI, sent to WolframAlpha. Results displayed using images where available, with plaintext fallbacks.
                  </p>
              </CardFooter>
            </Card>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-xs text-muted-foreground">
            This workspace demonstrates a multi-step pipeline for solving complex problems. Results depend on interpretations by the AI preprocessor and WolframAlpha.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
