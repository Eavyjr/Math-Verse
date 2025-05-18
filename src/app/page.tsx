'use client';

import { useState } from 'react';
import ExpressionInputForm from '@/components/math-genius/expression-input-form';
import AiGuidance from '@/components/math-genius/ai-guidance';
import VisualizationPlaceholder from '@/components/math-genius/visualization-placeholder';
import type { ClassifyExpressionOutput } from '@/ai/flows/classify-expression';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const [aiResponse, setAiResponse] = useState<ClassifyExpressionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAiResult = (data: ClassifyExpressionOutput | null) => {
    setAiResponse(data);
    if (data) setError(null); // Clear error if we get data
  };

  const handleAiError = (errorMessage: string) => {
    setError(errorMessage);
    if (errorMessage) setAiResponse(null); // Clear data if we get an error
  };

  const handleLoadingState = (loading: boolean) => {
    setIsLoading(loading);
    if (loading) { // Clear previous results/errors when a new request starts
      setError(null);
      setAiResponse(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 flex flex-col items-center space-y-10">
      <ExpressionInputForm
        onResult={handleAiResult}
        onError={handleAiError}
        onLoading={handleLoadingState}
        isLoading={isLoading}
      />

      {isLoading && (
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive" className="w-full max-w-2xl">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && aiResponse && (
         <AiGuidance
          classification={aiResponse.classification}
          solutionStrategies={aiResponse.solutionStrategies}
        />
      )}
      
      {!isLoading && !error && (aiResponse || !error && !aiResponse && !isLoading) && ( // Show placeholder if no error and not loading, even if no AI response yet
         <VisualizationPlaceholder expressionType={aiResponse?.classification} />
      )}

      {!isLoading && !error && !aiResponse && (
        <Alert className="w-full max-w-2xl mt-6 bg-secondary">
          <Info className="h-5 w-5" />
          <AlertTitle>Welcome to MathGenius!</AlertTitle>
          <AlertDescription>
            Enter a mathematical expression above to get started. Our AI will analyze it and provide insights.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
