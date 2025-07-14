
'use client';

import Link from 'next/link';
import React, { useState, useRef, useCallback } from 'react';
import "katex/dist/katex.min.css";
import { toPng } from 'html-to-image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Move3d, Calculator, Brain, XCircle, Info, Loader2, CheckCircle2, AlertTriangle, ImageIcon } from 'lucide-react';
import { handlePerformVectorOperationAction } from '@/app/actions';
import type { VectorOperationInput, VectorOperationOutput } from '@/ai/flows/perform-vector-operation';
import { useToast } from '@/hooks/use-toast';
import KatexRenderer from '@/components/math-tools/katex-renderer';
import { renderStepsContent } from '@/lib/katex-helper';

export default function VectorOperationsPage() {
  const { toast } = useToast();
  const [vectorAString, setVectorAString] = useState('');
  const [vectorBString, setVectorBString] = useState('');
  const [scalarString, setScalarString] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<VectorOperationInput['operation'] | null>(null);
  
  const [apiResponse, setApiResponse] = useState<VectorOperationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const operations: { value: VectorOperationInput['operation']; label: string; needsVectorB: boolean; needsScalar: boolean; }[] = [
    { value: "magnitudeA", label: "Magnitude of Vector A", needsVectorB: false, needsScalar: false },
    { value: "normalizeA", label: "Normalize Vector A", needsVectorB: false, needsScalar: false },
    { value: "add", label: "Add (A + B)", needsVectorB: true, needsScalar: false },
    { value: "subtract", label: "Subtract (A - B)", needsVectorB: true, needsScalar: false },
    { value: "scalarMultiplyA", label: "Scalar Multiply (k * A)", needsVectorB: false, needsScalar: true },
    { value: "dotProduct", label: "Dot Product (A · B)", needsVectorB: true, needsScalar: false },
    { value: "crossProduct", label: "Cross Product (A × B) (3D only)", needsVectorB: true, needsScalar: false },
    { value: "angleBetween", label: "Angle Between A and B (radians)", needsVectorB: true, needsScalar: false },
  ];

  const parseVectorString = (vecStr: string): number[] | null => {
    if (!vecStr.trim()) return [];
    const parts = vecStr.split(/[,;\s]+/).map(s => s.trim()).filter(s => s !== '');
    const numbers = parts.map(Number);
    if (parts.length > 0 && numbers.some(isNaN)) return null;
    return numbers;
  };

  const handleCalculate = async () => {
    if (!selectedOperation) {
      setError("Please select an operation.");
      return;
    }

    const vectorA = parseVectorString(vectorAString);
    if (vectorA === null) {
      setError("Vector A contains invalid numbers. Please use comma, space, or semicolon separated numbers.");
      return;
    }
    if (vectorA.length === 0 && selectedOperation !== 'scalarMultiplyA') {
        setError("Vector A cannot be empty for this operation.");
        return;
    }


    let vectorB: number[] | undefined = undefined;
    if (operations.find(op => op.value === selectedOperation)?.needsVectorB) {
      const parsedB = parseVectorString(vectorBString);
      if (parsedB === null) {
        setError("Vector B contains invalid numbers.");
        return;
      }
      if (parsedB.length === 0) {
         setError("Vector B cannot be empty for this operation.");
         return;
      }
      vectorB = parsedB;
    }

    let scalar: number | undefined = undefined;
    if (operations.find(op => op.value === selectedOperation)?.needsScalar) {
      const parsedScalar = parseFloat(scalarString);
      if (isNaN(parsedScalar)) {
        setError("Scalar value must be a valid number.");
        return;
      }
      scalar = parsedScalar;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    const input: VectorOperationInput = {
      vectorA,
      operation: selectedOperation,
      ...(vectorB && { vectorB }),
      ...(scalar !== undefined && { scalar }),
    };

    const actionResult = await handlePerformVectorOperationAction(input);

    if (actionResult.error) {
      setError(actionResult.error);
    } else if (actionResult.data) {
      setApiResponse(actionResult.data);
      if (typeof actionResult.data.result === 'string' && actionResult.data.result.toLowerCase().includes("error:")) {
         toast({ title: "Operation Warning", description: actionResult.data.result, variant: "destructive" });
      } else {
         toast({ title: "Calculation Successful", description: `Operation: ${selectedOperation}` });
      }
    } else {
      setError("Received no data from the server.");
    }
    setIsLoading(false);
  };

  const handleClear = () => {
    setVectorAString('');
    setVectorBString('');
    setScalarString('');
    setSelectedOperation(null);
    setApiResponse(null);
    setError(null);
  };
  
  const handleExportAsPng = useCallback(() => {
    if (resultCardRef.current === null) {
      return;
    }
    toast({
      title: "Exporting...",
      description: "Please wait while the image is being generated.",
    });

    toPng(resultCardRef.current, { cacheBust: true, backgroundColor: 'white', pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `mathverse-vector-${apiResponse?.originalQuery.operation || 'result'}.png`;
        link.href = dataUrl;
        link.click();
        toast({
            title: "Export Successful",
            description: "Result card has been downloaded as a PNG image.",
        });
      })
      .catch((err) => {
        console.error('Image export failed:', err);
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "Could not export the result card as an image.",
        });
      });
  }, [apiResponse, toast]);

  const currentOperation = operations.find(op => op.value === selectedOperation);
  
  const formatVectorForKaTeX = (vector: number[]): string => `\\begin{bmatrix} ${vector.join(' \\\\ ')} \\end{bmatrix}`;

  const renderComputedResult = (result: VectorOperationOutput['result']) => {
    if (typeof result === 'number') {
      return <KatexRenderer content={result.toString()} />;
    }
    if (Array.isArray(result)) {
      return <KatexRenderer content={formatVectorForKaTeX(result)} displayMode={true} />;
    }
    return <p className="text-destructive text-base">{result}</p>;
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
            <Move3d className="h-8 w-8 mr-3" />
            Vector Operations
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Perform various vector calculations with AI assistance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vectorA-input" className="text-md font-semibold">Vector A (comma/space separated)</Label>
              <Input
                id="vectorA-input"
                placeholder="e.g., 1, 2, 3 or 1 2 3"
                value={vectorAString}
                onChange={(e) => { setVectorAString(e.target.value); setError(null); }}
                className="text-lg p-3"
              />
            </div>
            
            <div className={`space-y-2 ${currentOperation?.needsVectorB ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <Label htmlFor="vectorB-input" className="text-md font-semibold">Vector B (if needed)</Label>
              <Input
                id="vectorB-input"
                placeholder="e.g., 4, 5, 6"
                value={vectorBString}
                onChange={(e) => { setVectorBString(e.target.value); setError(null); }}
                className="text-lg p-3"
                disabled={!currentOperation?.needsVectorB}
              />
            </div>
          </div>

          <div className={`space-y-2 ${currentOperation?.needsScalar ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <Label htmlFor="scalar-input" className="text-md font-semibold">Scalar k (if needed)</Label>
            <Input
              id="scalar-input"
              type="number"
              placeholder="e.g., 2.5"
              value={scalarString}
              onChange={(e) => { setScalarString(e.target.value); setError(null); }}
              className="text-lg p-3 md:w-1/3"
              disabled={!currentOperation?.needsScalar}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operation-select" className="text-md font-semibold">Select Operation</Label>
            <Select
              value={selectedOperation || ""}
              onValueChange={(value: VectorOperationInput['operation']) => {
                setSelectedOperation(value);
                setError(null);
                setApiResponse(null);
              }}
            >
              <SelectTrigger id="operation-select" className="text-lg p-3 h-auto">
                <SelectValue placeholder="Choose an operation..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Vector Operations</SelectLabel>
                  {operations.map(op => (
                    <SelectItem key={op.value} value={op.value} className="text-base">
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleCalculate}
              disabled={isLoading || !selectedOperation || !vectorAString.trim()}
              size="lg"
              className="flex-grow"
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Calculator className="mr-2 h-5 w-5" />}
              Calculate
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="lg"
              className="flex-grow sm:flex-grow-0"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Clear
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-8 rounded-md bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-xl font-medium text-foreground">Calculating...</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {apiResponse && !isLoading && !error && (
            <Card className="mt-6 border-accent border-t-4 shadow-md" ref={resultCardRef}>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center text-primary">
                  <CheckCircle2 className="h-7 w-7 mr-2 text-green-600" />
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 text-lg">
                <div>
                  <span className="font-semibold text-muted-foreground">Operation: </span>
                  <span className="capitalize p-1 rounded-sm">{apiResponse.originalQuery.operation}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Original Query:</span>
                  <div className="font-mono p-1 text-sm bg-muted rounded-sm overflow-x-auto">
                    A = [{apiResponse.originalQuery.vectorA.join(', ')}]
                    {apiResponse.originalQuery.vectorB && <span>, B = [{apiResponse.originalQuery.vectorB.join(', ')}]</span>}
                    {apiResponse.originalQuery.scalar !== undefined && <span>, k = {apiResponse.originalQuery.scalar}</span>}
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">Computed Result:</h3>
                   <div className="font-mono p-2 rounded-md bg-muted text-primary dark:text-primary-foreground text-xl inline-block overflow-x-auto">
                      {renderComputedResult(apiResponse.result)}
                   </div>
                </div>

                {apiResponse.steps && apiResponse.steps.trim() !== "" && (
                  <Accordion type="single" collapsible className="w-full mt-4">
                    <AccordionItem value="steps">
                      <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                        <Info className="mr-2 h-5 w-5" /> Show Steps
                      </AccordionTrigger>
                      <AccordionContent>
                        <div 
                           className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap overflow-x-auto min-h-[50px]"
                           dangerouslySetInnerHTML={{ __html: renderStepsContent(apiResponse.steps) }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </CardContent>
              <CardFooter className="p-4 bg-secondary/50 border-t flex justify-end">
                <Button variant="outline" size="sm" onClick={handleExportAsPng}>
                    <ImageIcon className="mr-2 h-4 w-4" /> Export as PNG
                </Button>
              </CardFooter>
            </Card>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-sm text-muted-foreground">
            Enter vector components separated by commas, spaces, or semicolons. Cross product is for 3D vectors only. AI provides calculations and steps.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
