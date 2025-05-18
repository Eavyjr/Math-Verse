import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AiGuidanceProps {
  classification: string;
  solutionStrategies: string;
}

export default function AiGuidance({ classification, solutionStrategies }: AiGuidanceProps) {
  if (!classification && !solutionStrategies) {
    return null;
  }

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
          <div>
            <h3 className="font-semibold text-lg mb-1 text-primary">Suggested Solution Strategies:</h3>
            <p className="text-md p-3 bg-secondary rounded-md whitespace-pre-wrap">{solutionStrategies}</p>
          </div>
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
