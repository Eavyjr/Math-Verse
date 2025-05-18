
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AiGuidanceProps {
  classification: string;
  solutionStrategies: string;
}

export default function AiGuidance({ classification, solutionStrategies }: AiGuidanceProps) {
  const [isStrategiesExpanded, setIsStrategiesExpanded] = useState(false);

  if (!classification && !solutionStrategies) {
    return null;
  }

  const strategiesArray = solutionStrategies?.split('\n').filter(s => s.trim() !== '');
  const initialStrategies = strategiesArray?.slice(0, 2).join('\n');
  const remainingStrategies = strategiesArray?.slice(2).join('\n');
  const canExpand = strategiesArray && strategiesArray.length > 2;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          AI Analysis & Guidance
        </CardTitle>
        <CardDescription>
          Here's what our AI thinks about your expression and how to approach it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {classification && (
          <div>
            <h3 className="font-semibold text-lg mb-1 text-primary">Expression Classification:</h3>
            <p className="text-md p-3 bg-secondary rounded-md">{classification}</p>
          </div>
        )}
        {solutionStrategies && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
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
        {!classification && !solutionStrategies && (
            <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <p>No guidance available for this expression.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
