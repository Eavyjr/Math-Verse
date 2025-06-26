
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
import { AlertCircle, Brain, Layers, ArrowRight, TestTubeDiagonal } from 'lucide-react'; // Added Layers, ArrowRight, TestTubeDiagonal
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

export default function HomePage() {
  const [aiResponse, setAiResponse] = useState<ClassifyExpressionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAiResult = (data: ClassifyExpressionOutput | null) => {
    if (data) {
      console.log("HomePage received AI result:", data);
      setAiResponse(data);
      setError(null);
    } else {
      console.log("HomePage received null data for AI result. Clearing previous response.");
      setAiResponse(null); 
    }
  };

  const handleAiError = (errorMessage: string | null) => {
    if (errorMessage) {
      console.error("HomePage received error:", errorMessage);
    } else {
      console.log("HomePage: AI error state cleared.");
    }
    setError(errorMessage);
    setAiResponse(null); 
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
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground/90">
                Your Universe for Mathematical Exploration and AI Assistance.
            </h2>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                From solving algebraic equations and calculating complex integrals to visualizing 3D transformations and running graph theory algorithms, MathVerse is your all-in-one interactive toolkit. Get instant AI-powered guidance, step-by-step solutions, and dynamic visualizations.
            </p>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                Explore our specialized workstations for algebra, calculus, linear algebra, and statistics. Or leverage the computational power of WolframAlpha for any query. Start by classifying an expression with our AI below, or jump straight into a workstation.
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
          {isLoading && (
            <div className="mt-4 text-center text-muted-foreground">
              AI is classifying your expression...
            </div>
          )}
          {error && !isLoading && (
            <Alert variant="destructive" className={cn("mt-4", error ? 'fade-in-content' : '')}>
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Classifier Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {aiResponse && !isLoading && !error && (
            <div className={cn("mt-6 space-y-6", aiResponse ? 'fade-in-content' : '')}>
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

      {/* Mathematical Model Generator Card & Integration Test Card */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <Layers className="mr-3 h-7 w-7 text-accent" />
              Mathematical Model Generator
            </CardTitle>
            <CardDescription>
              Define problems, generate mathematical models, and explore parameters with AI assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Dive into the world of mathematical modeling. Define parameters, simulate scenarios, and gain insights from complex systems. This tool will empower you to build and understand models across various disciplines.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/model-generator">
                Explore Model Generator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <TestTubeDiagonal className="mr-3 h-7 w-7 text-accent" />
              WolframAlpha Workspace
            </CardTitle>
            <CardDescription>
              Leverage WolframAlpha's computational engine for complex queries and detailed, formatted solutions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enter any mathematical query (e.g., "integrate x^2 dx") to fetch and display step-by-step solutions directly from WolframAlpha, the gold standard in computational knowledge.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/operations/wolframalpha-workspace">
                Open WolframAlpha Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Fun & Trivia Section */}
      <section className="w-full max-w-4xl mx-auto">
        <FunTriviaSection />
      </section>
    </div>
  );
}
