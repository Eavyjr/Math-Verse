
'use client';

import { useState } from 'react';
import type { ClassifyExpressionOutput } from '@/ai/flows/classify-expression';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, Sparkles, BookOpen, Workflow, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ExpressionInputForm from '@/components/math-genius/expression-input-form';
import AiGuidance from '@/components/math-genius/ai-guidance';
import VisualizationPlaceholder from '@/components/math-genius/visualization-placeholder';
import NewsletterForm from '@/components/landing/newsletter-form';
import MathWorkstationTabs from '@/components/landing/math-workstation-tabs';
import FunTriviaSection from '@/components/landing/fun-trivia-section';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const [aiResponse, setAiResponse] = useState<ClassifyExpressionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAiResult = (data: ClassifyExpressionOutput | null) => {
    setAiResponse(data);
    if (data) setError(null);
  };

  const handleAiError = (errorMessage: string) => {
    setError(errorMessage);
    if (errorMessage) setAiResponse(null);
  };

  const handleLoadingState = (loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null);
      setAiResponse(null);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-12 py-8 px-4 sm:px-6 lg:px-8">
      {/* Main Content: Above the Fold */}
      <section className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-start w-full">
        {/* Left 2/3 Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-lg shadow-lg bg-card">
            <h1 className="text-4xl font-bold text-primary mb-6 flex items-center">
              <Sparkles className="h-10 w-10 mr-3 text-accent" />
              Welcome to MathVerse!
            </h1>
            <p className="text-lg text-foreground/80 leading-relaxed mb-4">
              Unlock the power of mathematics with MathVerse, your all-in-one platform for exploration, learning, and AI-powered assistance.
              Whether you're tackling complex equations, visualizing functions, or just curious about the wonders of math,
              MathVerse provides the tools and insights you need.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed mb-6">
              From classifying expressions with our AI genius to diving deep into algebra, calculus, graph theory, and statistics,
              our intuitive interface and powerful features make learning and problem-solving engaging and efficient.
            </p>
            <div className="flex space-x-4">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="#workstations">
                  <Workflow className="mr-2" /> Explore Workstations
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/signup">
                  <BookOpen className="mr-2" /> Get Started
                </Link>
              </Button>
            </div>
          </div>
          <NewsletterForm />
        </div>

        {/* Right 1/3 Column: Quick Expression Classifier */}
        <div className="space-y-6">
          <ExpressionInputForm
            onResult={handleAiResult}
            onError={handleAiError}
            onLoading={handleLoadingState}
            isLoading={isLoading}
          />

          {isLoading && (
            <div className="w-full space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="w-full">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Classifier Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && aiResponse && (
            <AiGuidance
              classification={aiResponse.classification}
              solutionStrategies={aiResponse.solutionStrategies}
            />
          )}
          
          {!isLoading && (aiResponse || !error) && ( // Show placeholder if not loading and no error, or if there is an AI response
            <VisualizationPlaceholder expressionType={aiResponse?.classification} />
          )}

          {!isLoading && !error && !aiResponse && (
            <Alert className="w-full bg-secondary">
              <Lightbulb className="h-5 w-5" />
              <AlertTitle>Expression Genius</AlertTitle>
              <AlertDescription>
                Enter a mathematical expression above. Our AI will analyze it and provide insights &amp; solution strategies.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </section>

      {/* Below the Fold Content */}
      <section id="workstations" className="container mx-auto w-full space-y-12 pt-12">
        <MathWorkstationTabs />
        <FunTriviaSection />
      </section>
    </div>
  );
}
