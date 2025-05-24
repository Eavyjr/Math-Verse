
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface AiGuidanceProps {
  classification: string | null | undefined;
  solutionStrategies: string | null | undefined;
}

export default function AiGuidance({ classification, solutionStrategies }: AiGuidanceProps) {
  const hasClassification = classification && classification !== "Classification not available.";
  const hasStrategies = solutionStrategies && solutionStrategies !== "Solution strategies not available.";

  if (!hasClassification && !hasStrategies) {
    return null; // Don't render if both are missing or "not available"
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          AI Analysis & Guidance
        </CardTitle>
        <CardDescription>
          Insights from our AI on your expression.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasClassification && (
          <div>
            <h3 className="font-semibold text-lg mb-1 text-primary">Expression Classification:</h3>
            <p className="text-md p-3 bg-secondary rounded-md">{classification}</p>
          </div>
        )}
        {hasStrategies && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="strategies">
              <AccordionTrigger className="font-semibold text-lg text-primary hover:no-underline">
                Suggested Solution Strategies:
              </AccordionTrigger>
              <AccordionContent>
                 <div className="text-md p-3 bg-secondary rounded-md whitespace-pre-wrap">
                  {solutionStrategies}
                 </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
         {!hasClassification && !hasStrategies && ( // This case should be rare now
            <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <p>No specific guidance available for this expression.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
