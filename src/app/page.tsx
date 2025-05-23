
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ExpressionInputForm from '@/components/math-genius/expression-input-form';
import AiGuidance from '@/components/math-genius/ai-guidance';
import VisualizationPlaceholder from '@/components/math-genius/visualization-placeholder';
import type { ClassifyExpressionOutput } from '@/ai/flows/classify-expression';
import MathWorkstationTabs from '@/components/landing/math-workstation-tabs';
import FunTriviaSection from '@/components/landing/fun-trivia-section';
import NewsletterForm from '@/components/landing/newsletter-form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Brain } from 'lucide-react';

export default function HomePage() {
  const [aiResponse, setAiResponse] = useState<ClassifyExpressionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAiResult = (data: ClassifyExpressionOutput) => {
    setAiResponse(data);
    setError(null); // Clear previous errors on new result
  };

  const handleAiError = (errorMessage: string) => {
    setError(errorMessage);
    setAiResponse(null); // Clear previous results on error
  };

  const handleAiLoading = (loadingState: boolean) => {
    setIsLoading(loadingState);
  };

  return (
    <div className="flex flex-col items-center space-y-12 md:space-y-16">
      {/* Hero/Main Section */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
        {/* Left 2/3: Catchy Paragraph & Newsletter */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
              Welcome to <span className="text-accent">MathVerse</span>!
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
              Your ultimate companion for exploring the universe of mathematics. From classifying complex expressions with AI insights to solving intricate problems across various domains like algebra, calculus, and graph theory, MathVerse empowers you to learn, experiment, and conquer math challenges.
            </p>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
              Dive into our interactive workstations, get step-by-step solutions, and visualize mathematical concepts like never before.
            </p>
          </div>
          <div className="pt-4">
            <NewsletterForm variant="inline" />
          </div>
        </div>

        {/* Right 1/3: Quick Expression Classifier */}
        <div className="space-y-6 p-6 bg-card rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold text-center text-primary flex items-center justify-center gap-2">
            <Brain className="h-7 w-7" /> Quick AI Classifier
          </h2>
          <ExpressionInputForm 
            onResult={handleAiResult} 
            onError={handleAiError}
            onLoading={handleAiLoading}
            isLoading={isLoading}
          />
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Classifier Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {aiResponse && !isLoading && !error && (
            <div className="mt-6 space-y-6">
              <AiGuidance 
                classification={aiResponse.classification} 
                solutionStrategies={aiResponse.solutionStrategies} 
              />
              <VisualizationPlaceholder 
                expression={aiResponse.originalExpression} 
                classification={aiResponse.classification} 
              />
            </div>
          )}
        </div>
      </section>

      {/* Math Workstation Tabs */}
      <section className="w-full">
        <MathWorkstationTabs />
      </section>

      {/* Fun & Trivia Section */}
      <section className="w-full max-w-4xl mx-auto">
        <FunTriviaSection />
      </section>
    </div>
  );
}
