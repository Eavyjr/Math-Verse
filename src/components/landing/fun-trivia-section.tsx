
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMathTrivia, type GenerateMathTriviaOutput } from '@/ai/flows/generate-math-trivia';
import { Lightbulb, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function FunTriviaSection() {
  const [trivia, setTrivia] = useState<GenerateMathTriviaOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrivia = async () => {
    setIsLoading(true);
    setError(null);
    setTrivia(null); // Clear previous trivia before fetching new one
    try {
      const result = await generateMathTrivia({ topic: 'general' }); 
      setTrivia(result);
    } catch (e) {
      console.error("Error fetching trivia:", e);
      setError("Could not load a fun fact right now. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrivia(); 

    const intervalId = setInterval(() => {
      fetchTrivia();
    }, 60000); 

    return () => clearInterval(intervalId); 
  }, []);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-400" />
          Math Fun & Trivia
        </CardTitle>
        <CardDescription>
          Discover interesting math facts, puzzles, and historical insights! Refreshes periodically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-2 min-h-[60px]">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
        {error && !isLoading && (
          <div className={cn("text-destructive flex items-center gap-2 min-h-[60px]", error ? 'fade-in-content' : '')}>
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && trivia && (
          <p className={cn("text-md text-foreground/90 p-4 bg-secondary rounded-md min-h-[60px]", trivia ? 'fade-in-content' : '')}>
            {trivia.trivia}
          </p>
        )}
        <Button onClick={fetchTrivia} variant="outline" disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Get New Fact'}
        </Button>
      </CardContent>
    </Card>
  );
}
