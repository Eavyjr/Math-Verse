
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, Brain, Send, Loader2, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle as AlertUITitle, AlertDescription as AlertUIDescription } from "@/components/ui/alert"; // Aliased to avoid conflict
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { app } from '@/lib/firebase'; // Firebase app instance
import { cn } from '@/lib/utils';

interface ModelSuggestion {
  name: string;
  rationale: string;
}

interface FirebaseFunctionResponse {
  models: ModelSuggestion[];
}

export default function MathematicalModelGeneratorPage() {
  const [problemDescription, setProblemDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedModels, setSuggestedModels] = useState<ModelSuggestion[] | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null);

  const handleSubmitProblem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!problemDescription.trim()) {
      setGenerationError("Please enter a problem description.");
      setSuggestedModels(null);
      setSelectedModelName(null);
      return;
    }
    if (!app) {
      setGenerationError("Firebase app is not initialized. Please check the configuration.");
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    setSuggestedModels(null);
    setGenerationError(null);
    setSelectedModelName(null);

    try {
      const functions = getFunctions(app);
      const generateMathematicalModel = httpsCallable<
        { problemDescription: string },
        FirebaseFunctionResponse
      >(functions, 'generateMathematicalModel');
      
      console.log('Calling generateMathematicalModel with:', problemDescription);
      const result: HttpsCallableResult<FirebaseFunctionResponse> = await generateMathematicalModel({ problemDescription });
      console.log('Firebase Function response:', result.data);
      
      if (result.data && result.data.models && Array.isArray(result.data.models)) {
        setSuggestedModels(result.data.models);
        if (result.data.models.length === 0) {
             setGenerationError("The AI didn't suggest any models for this problem. Try rephrasing or adding more detail.");
        }
      } else {
        console.error('Unexpected response structure from Firebase Function:', result.data);
        setGenerationError('Received an unexpected response format from the model generator.');
      }
    } catch (error: any) {
      console.error('Error calling Firebase Function:', error);
      let errorMessage = "An error occurred while generating models. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.code === 'functions/unavailable') {
        errorMessage = "The model generation service is currently unavailable. Please try again later.";
      } else if (error.code === 'functions/internal' || error.message.includes("internal")) {
        errorMessage = "An internal error occurred in the model generator. The AI might have had trouble with the request. Please check the function logs or try rephrasing your problem.";
      } else if (error.message.includes("quota")) {
        errorMessage = "The AI service quota has been exceeded. Please try again later.";
      }
      setGenerationError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedModelName(modelName);
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
            <Layers className="h-8 w-8 mr-3" />
            AI-Powered Mathematical Model Generator
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Define problems, generate mathematical models, and analyze solutions with AI assistance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Section 1: Problem Input */}
          <div className="problem-input-section p-4 border rounded-lg bg-card shadow">
            <h2 className="text-xl font-semibold text-primary mb-3 flex items-center">
              <Brain className="mr-2 h-6 w-6 text-accent" />
              1. Describe Your Mathematical Problem
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Clearly articulate the problem you want to model. Provide context, variables, known relationships, and any constraints.
              The more detail you provide, the better the AI can assist in generating relevant models.
            </p>
            <form onSubmit={handleSubmitProblem} className="space-y-4">
              <div>
                <Label htmlFor="problemDescription" className="block text-md font-medium text-foreground mb-1">
                  Problem Description:
                </Label>
                <Textarea
                  id="problemDescription"
                  value={problemDescription}
                  onChange={(e) => {
                    setProblemDescription(e.target.value);
                    if (generationError) setGenerationError(null);
                    if (suggestedModels) setSuggestedModels(null);
                    if (selectedModelName) setSelectedModelName(null);
                  }}
                  placeholder="e.g., 'Model the spread of a disease in a small town.' or 'Optimize the production schedule for a factory with multiple products and resource constraints.'"
                  className="min-h-[150px] p-3 border-2 focus:border-accent focus:ring-accent"
                  rows={6}
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? 'Generating Models...' : 'Generate Model Suggestions'}
              </Button>
            </form>
          </div>

          {/* Section 2: Model Generation & Refinement */}
          <div className="model-generation-section p-4 border rounded-lg bg-card shadow min-h-[200px]">
            <h2 className="text-xl font-semibold text-primary mb-3 flex items-center">
              <Lightbulb className="mr-2 h-6 w-6 text-accent" />
              2. AI Model Suggestions
            </h2>
            {isGenerating && (
              <div className="flex items-center justify-center p-8 rounded-md bg-muted">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-xl font-medium text-foreground">
                  AI is thinking...
                </p>
              </div>
            )}
            {generationError && !isGenerating && (
              <Alert variant="destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertUITitle className="font-semibold">Model Generation Failed</AlertUITitle>
                <AlertUIDescription>{generationError}</AlertUIDescription>
              </Alert>
            )}
            {!isGenerating && !generationError && suggestedModels && suggestedModels.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Here are some mathematical models suggested by the AI. Click on a model to select it:
                </p>
                <ul className="space-y-3">
                  {suggestedModels.map((model, index) => (
                    <li key={index}>
                      <Card 
                        className={cn(
                          "bg-secondary/50 hover:shadow-md transition-shadow cursor-pointer",
                          selectedModelName === model.name && "ring-2 ring-accent border-accent bg-accent/10"
                        )}
                        onClick={() => handleModelSelect(model.name)}
                      >
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-lg text-secondary-foreground flex items-center">
                            {selectedModelName === model.name && <CheckCircle className="h-5 w-5 mr-2 text-accent" />}
                            {model.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <p className="text-sm text-muted-foreground">{model.rationale}</p>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
                {selectedModelName && (
                  <div className="mt-6 p-3 border-t border-dashed">
                    <h3 className="text-md font-semibold text-primary flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Selected Model: <span className="ml-2 font-bold text-accent">{selectedModelName}</span>
                    </h3>
                  </div>
                )}
              </div>
            )}
            {!isGenerating && !generationError && (!suggestedModels || suggestedModels.length === 0) && (
                <p className="text-sm text-muted-foreground italic text-center p-4">
                Submit a problem description above to see AI-generated model suggestions here.
              </p>
            )}
          </div>

          {/* Section 3: Solution Breakdown & Comparison */}
          <div className="solution-analysis-section p-4 border rounded-lg bg-card shadow">
            <h2 className="text-xl font-semibold text-primary mb-3 flex items-center">
              <Layers className="mr-2 h-6 w-6 text-accent" />
              3. Model Analysis & Solution Exploration (Coming Soon)
            </h2>
            <p className="text-muted-foreground text-sm">
              Once models are generated, this section will allow you to dive deeper. Explore the implications, view solution breakdowns, simulate, visualize, and compare different approaches.
              {selectedModelName && <span className="block mt-1 font-medium">You have selected: <strong className="text-accent">{selectedModelName}</strong>. Analysis tools for this model will appear here.</span>}
            </p>
            <div className="mt-4 p-4 bg-muted rounded-md min-h-[100px]">
              <p className="text-sm text-muted-foreground italic">
                Tools for model simulation, step-by-step solution walkthroughs, parameter adjustments, charts, and model comparison features will be available here in a future update.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
            <p className="text-sm text-muted-foreground mx-auto">
                This interactive tool is designed to guide you through the process of mathematical modeling, from problem definition to AI-assisted model selection and future analysis.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}


