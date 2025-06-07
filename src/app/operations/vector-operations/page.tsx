
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Move3d, Construction } from 'lucide-react'; // Using Move3d as a placeholder vector icon

export default function VectorOperationsPage() {
  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Move3d className="h-8 w-8 mr-3" />
            Vector Operations Workstation
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Perform various vector operations like dot product, cross product, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6 min-h-[300px] flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <Construction className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">Coming Soon!</h2>
            <p className="text-muted-foreground">
              This workstation for vector operations is currently under construction.
              Stay tuned for updates!
            </p>
            <Button asChild variant="outline">
              <Link href="/">Return to Homepage</Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-sm text-muted-foreground">
            Vector algebra is a fundamental part of many scientific and engineering disciplines.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
