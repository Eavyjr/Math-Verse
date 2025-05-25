
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import katex from 'katex';
import "katex/dist/katex.min.css";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { ArrowLeft, BarChartHorizontalBig, PlusCircle, Trash2, Calculator, Sigma, Ratio, Brain, XCircle, Info, Loader2, Activity } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { handlePerformMatrixOperationAction } from '@/app/actions';
import type { MatrixOperationInput, MatrixOperationOutput } from '@/ai/flows/perform-matrix-operation';

// Helper function to render a single LaTeX string to HTML
const renderMath = (latexString: string | undefined, displayMode: boolean = false): string => {
  if (latexString === undefined || latexString === null || typeof latexString !== 'string') return "";
  let cleanLatexString = latexString.trim();
  if ((cleanLatexString.startsWith('\\(') && cleanLatexString.endsWith('\\)')) ||
      (cleanLatexString.startsWith('\\[') && cleanLatexString.endsWith('\\]'))) {
    cleanLatexString = cleanLatexString.substring(2, cleanLatexString.length - 2).trim();
  }
  try {
    return katex.renderToString(cleanLatexString, {
      throwOnError: false,
      displayMode: displayMode,
    });
  } catch (e) {
    console.error("Katex rendering error for math string:", latexString, e);
    return cleanLatexString; 
  }
};

const renderStepsContent = (stepsString: string | undefined): string => {
  if (!stepsString) return "";
  console.log("renderStepsContent input:", stepsString);

  const parts = stepsString.split(/(\\\(.*?\\\)|\\\[.*?\\\])/g);
  const htmlParts = parts.map((part) => {
    try {
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const latex = part.slice(2, -2);
        return katex.renderToString(latex, { throwOnError: false, displayMode: false, output: 'html' });
      } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const latex = part.slice(2, -2);
        return katex.renderToString(latex, { throwOnError: false, displayMode: true, output: 'html' });
      }
      return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } catch (e) {
        console.error("KaTeX steps rendering error for part:", part, e);
        return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  });
  const finalHtml = htmlParts.join('');
  console.log("renderStepsContent output HTML:", finalHtml);
  return finalHtml;
};

const initialMatrix = () => [[0, 0], [0, 0]];

const parseAIResult = (resultString: string): number[][] | number | string => {
    if (!resultString) return resultString;
    try {
        const parsed = JSON.parse(resultString);
        if (Array.isArray(parsed) && parsed.every(row => Array.isArray(row) && row.every(el => typeof el === 'number'))) {
            return parsed as number[][];
        }
    } catch (e) {
      // Not a valid JSON matrix string
    }
    const num = parseFloat(resultString);
    if (!isNaN(num) && isFinite(num) && num.toString().trim() === resultString.trim()) {
        return num;
    }
    return resultString; 
};

interface MatrixProperties {
  shape: string;
  isSquare: boolean;
  isSymmetric: boolean | null; // null if not square
  isIdentity: boolean | null; // null if not square
  isDiagonal: boolean | null; // null if not square
  isZeroMatrix: boolean;
}

export default function MatrixOperationsPage() {
  const { toast } = useToast();
  const [matrixA, setMatrixA] = useState<number[][]>(initialMatrix());
  const [matrixB, setMatrixB] = useState<number[][]>(initialMatrix());
  const [scalarValue, setScalarValue] = useState<number>(1);
  const [selectedOperation, setSelectedOperation] = useState<MatrixOperationInput['operation'] | null>(null);
  
  const [apiResponse, setApiResponse] = useState<MatrixOperationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matrixAProperties, setMatrixAProperties] = useState<MatrixProperties | null>(null);

  const operations: { label: string; options: { value: MatrixOperationInput['operation']; label: string }[] }[] = [
    {
      label: "Basic Operations",
      options: [
        { value: "add", label: "Addition (A + B)" },
        { value: "subtract", label: "Subtraction (A - B)" },
        { value: "scalarMultiply", label: "Scalar Multiplication (k * A)" },
        { value: "multiply", label: "Matrix Multiplication (A * B)" },
        { value: "transposeA", label: "Transpose (A)" },
        { value: "determinantA", label: "Determinant (A)" },
        { value: "inverseA", label: "Inverse (A)" },
        { value: "rankA", label: "Rank (A)" },
      ]
    },
    {
      label: "Advanced Operations",
      options: [
        { value: "eigenvaluesA", label: "Eigenvalues (A)" },
        { value: "eigenvectorsA", label: "Eigenvectors (A)" },
        { value: "charPolynomialA", label: "Characteristic Polynomial (A)" },
        { value: "luDecompositionA", label: "LU Decomposition (A)" },
        { value: "qrDecompositionA", label: "QR Decomposition (A)" },
        { value: "svdDecompositionA", label: "SVD Decomposition (A)" },
      ]
    }
  ];

  // Matrix Properties Calculation
  useEffect(() => {
    if (!matrixA || matrixA.length === 0 || matrixA[0].length === 0) {
      setMatrixAProperties(null);
      return;
    }

    const rows = matrixA.length;
    const cols = matrixA[0].length;
    const shape = `${rows} x ${cols}`;
    const square = rows === cols;

    let symmetric: boolean | null = null;
    let identity: boolean | null = null;
    let diagonal: boolean | null = null;
    
    if (square) {
      // Symmetric
      symmetric = true;
      for (let i = 0; i < rows; i++) {
        for (let j = i + 1; j < cols; j++) {
          if (matrixA[i][j] !== matrixA[j][i]) {
            symmetric = false;
            break;
          }
        }
        if (!symmetric) break;
      }

      // Identity
      identity = true;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (i === j && matrixA[i][j] !== 1) {
            identity = false;
            break;
          }
          if (i !== j && matrixA[i][j] !== 0) {
            identity = false;
            break;
          }
        }
        if (!identity) break;
      }

      // Diagonal
      diagonal = true;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (i !== j && matrixA[i][j] !== 0) {
            diagonal = false;
            break;
          }
        }
        if (!diagonal) break;
      }
    }

    // Zero Matrix
    let zero = true;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (matrixA[i][j] !== 0) {
          zero = false;
          break;
        }
      }
      if (!zero) break;
    }

    setMatrixAProperties({
      shape,
      isSquare: square,
      isSymmetric: symmetric,
      isIdentity: identity,
      isDiagonal: diagonal,
      isZeroMatrix: zero,
    });
  }, [matrixA]);


  const handleMatrixChange = (
    matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const numValue = parseFloat(value);
    matrixSetter(prevMatrix => {
      const newMatrix = prevMatrix.map(row => [...row]);
      newMatrix[rowIndex][colIndex] = isNaN(numValue) ? 0 : numValue; // Default to 0 if NaN
      return newMatrix;
    });
    setError(null);
    setApiResponse(null);
  };

  const addRow = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    const numCols = matrix.length > 0 && matrix[0] ? matrix[0].length : 1; // Default to 1 column if matrix is empty
    matrixSetter(prev => [...prev, Array(numCols).fill(0)]);
  };

  const removeRow = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    if (matrix.length > 1) {
      matrixSetter(prev => prev.slice(0, -1));
    } else {
      toast({ title: "Cannot remove last row", variant: "destructive", description: "A matrix must have at least one row." });
    }
  };

  const addCol = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>) => {
     matrixSetter(prev => {
        if (prev.length === 0) return [[0]]; // Handle case where matrix is initially empty
        return prev.map(row => [...row, 0])
     });
  };

  const removeCol = (matrixSetter: React.Dispatch<React.SetStateAction<number[][]>>, matrix: number[][]) => {
    if (matrix.length > 0 && matrix[0] && matrix[0].length > 1) {
      matrixSetter(prev => prev.map(row => row.slice(0, -1)));
    } else {
       toast({ title: "Cannot remove last column", variant: "destructive", description: "A matrix must have at least one column." });
    }
  };

  const renderMatrixInput = (matrix: number[][], setMatrix: React.Dispatch<React.SetStateAction<number[][]>>, label: string) => (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-foreground mb-3">{label}</h3>
      <div className="space-y-2 overflow-x-auto">
        {matrix.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 items-center">
            {row.map((cell, colIndex) => (
              <Input
                key={colIndex}
                type="number"
                value={cell}
                onChange={(e) => handleMatrixChange(setMatrix, rowIndex, colIndex, e.target.value)}
                className="w-20 min-w-[5rem] text-center border-2 focus:border-accent focus:ring-accent"
                aria-label={`${label} row ${rowIndex + 1} col ${colIndex + 1}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => addRow(setMatrix, matrix)}><PlusCircle className="mr-1 h-4 w-4" /> Row</Button>
        <Button variant="destructive" size="sm" onClick={() => removeRow(setMatrix, matrix)} disabled={matrix.length <=1}><Trash2 className="mr-1 h-4 w-4" /> Row</Button>
        <Button variant="outline" size="sm" onClick={() => addCol(setMatrix)}><PlusCircle className="mr-1 h-4 w-4" /> Col</Button>
        <Button variant="destructive" size="sm" onClick={() => removeCol(setMatrix, matrix)} disabled={matrix.length > 0 && matrix[0] && matrix[0].length <=1}><Trash2 className="mr-1 h-4 w-4" /> Col</Button>
      </div>
    </Card>
  );
  
  const handleCalculate = async () => {
    if (!selectedOperation) {
      setError("Please select an operation.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    let requiresMatrixB = ['add', 'subtract', 'multiply'].includes(selectedOperation);
    let matrixBToSend = requiresMatrixB ? matrixB : undefined;
    let scalarToSend = selectedOperation === 'scalarMultiply' ? scalarValue : undefined;

    if (selectedOperation === 'scalarMultiply' && (scalarValue === undefined || isNaN(scalarValue))) {
      setError("Please enter a valid scalar value for scalar multiplication.");
      setIsLoading(false);
      return;
    }

    const actionResult = await handlePerformMatrixOperationAction(
      matrixA,
      selectedOperation,
      matrixBToSend,
      scalarToSend
    );

    if (actionResult.error) {
      setError(actionResult.error);
    } else if (actionResult.data) {
      setApiResponse(actionResult.data);
    } else {
      setError("Received no data from the server.");
    }
    setIsLoading(false);
  };

  const handleClear = () => {
    setMatrixA(initialMatrix());
    setMatrixB(initialMatrix());
    setScalarValue(1);
    setSelectedOperation(null);
    setApiResponse(null);
    setError(null);
    setMatrixAProperties(null);
  };

  const formatMatrixForKaTeX = (matrix: number[][]): string => {
    if (!matrix || matrix.length === 0) return "";
    const rows = matrix.map(row => row.join(' & '));
    return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
  };

  const renderComputedResult = (result: string) => {
    const parsedResult = parseAIResult(result);

    if (typeof parsedResult === 'number') {
      return <span className="font-mono p-1 rounded-sm bg-muted text-primary dark:text-primary-foreground text-lg" dangerouslySetInnerHTML={{ __html: renderMath(parsedResult.toString(), false) }} />;
    } else if (Array.isArray(parsedResult)) { // Check if it's a matrix (array of arrays)
      return <div className="p-2 bg-muted rounded-md overflow-x-auto text-lg"
                  dangerouslySetInnerHTML={{ __html: renderMath(formatMatrixForKaTeX(parsedResult), true) }} />;
    } else { // It's a descriptive string, potentially with KaTeX
      return <div className="p-2 bg-muted rounded-md text-sm whitespace-pre-wrap overflow-x-auto overflow-wrap-break-word"
                  dangerouslySetInnerHTML={{ __html: renderStepsContent(parsedResult) }} />;
    }
  };

  const renderMatrixProperties = () => {
    if (!matrixAProperties) {
      return <p className="text-muted-foreground">Enter Matrix A to see its properties.</p>;
    }
    const { shape, isSquare, isSymmetric, isIdentity, isDiagonal, isZeroMatrix } = matrixAProperties;
    return (
      <ul className="space-y-1 text-sm">
        <li><span className="font-semibold">Shape:</span> {shape}</li>
        <li><span className="font-semibold">Square:</span> {isSquare ? 'Yes' : 'No'}</li>
        <li><span className="font-semibold">Symmetric:</span> {isSquare ? (isSymmetric ? 'Yes' : 'No') : 'N/A'}</li>
        <li><span className="font-semibold">Identity:</span> {isSquare ? (isIdentity ? 'Yes' : 'No') : 'N/A'}</li>
        <li><span className="font-semibold">Diagonal:</span> {isSquare ? (isDiagonal ? 'Yes' : 'No') : 'N/A'}</li>
        <li><span className="font-semibold">Zero Matrix:</span> {isZeroMatrix ? 'Yes' : 'No'}</li>
      </ul>
    );
  };


  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <BarChartHorizontalBig className="h-8 w-8 mr-3" />
            Matrix Operations
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Perform various matrix operations. Adjust rows/columns and see results. Powered by AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {renderMatrixInput(matrixA, setMatrixA, "Matrix A")}
            {renderMatrixInput(matrixB, setMatrixB, "Matrix B (for binary operations like A+B, A*B)")}
          </div>

          {selectedOperation === 'scalarMultiply' && (
            <div className="space-y-2">
                <Label htmlFor="scalar-input" className="block text-md font-semibold text-foreground">
                    Scalar Value (k):
                </Label>
                <Input
                    id="scalar-input"
                    type="number"
                    value={scalarValue}
                    onChange={(e) => setScalarValue(parseFloat(e.target.value))}
                    placeholder="Enter scalar value"
                    className="text-lg p-3 border-2 focus:border-accent focus:ring-accent w-full md:w-1/3"
                />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="operation-select" className="block text-md font-semibold text-foreground">
              Select Operation:
            </label>
            <Select
              value={selectedOperation || ""}
              onValueChange={(value: MatrixOperationInput['operation']) => {
                setSelectedOperation(value);
                setError(null);
                setApiResponse(null);
              }}
            >
              <SelectTrigger id="operation-select" className="text-lg p-3 h-auto">
                <SelectValue placeholder="Choose an operation..." />
              </SelectTrigger>
              <SelectContent>
                {operations.map(group => (
                  <SelectGroup key={group.label}>
                    <SelectLabel className="text-md">{group.label}</SelectLabel>
                    {group.options.map(op => (
                      <SelectItem key={op.value} value={op.value} className="text-base">
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleCalculate}
              disabled={isLoading || !selectedOperation}
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
              Clear All
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-8 rounded-md bg-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-xl font-medium text-foreground">
                Calculating...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6">
              <Calculator className="h-5 w-5" />
              <AlertTitle className="font-semibold">Operation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {apiResponse && !isLoading && !error && (
            <Card className="mt-6 border-accent border-t-4 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center text-primary">
                  <Brain className="h-7 w-7 mr-2"/>
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-lg space-y-4">
                 <div>
                  <span className="font-semibold text-muted-foreground">Operation: </span>
                  <span className="capitalize p-1 rounded-sm">{apiResponse.originalQuery.operation}</span>
                </div>
                <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Computed Result:</h4>
                    {renderComputedResult(apiResponse.result)}
                </div>

                {apiResponse.steps && apiResponse.steps.trim() !== "" && (
                  <Accordion type="single" collapsible className="w-full mt-4">
                    <AccordionItem value="steps">
                      <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                        <Info className="mr-2 h-5 w-5" /> Show Steps
                      </AccordionTrigger>
                      <AccordionContent>
                        <div 
                          className="p-4 bg-secondary rounded-md text-sm text-foreground/90 whitespace-pre-wrap overflow-x-auto overflow-wrap-break-word min-h-[50px]"
                          dangerouslySetInnerHTML={{ __html: renderStepsContent(apiResponse.steps) }}
                        />
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          Steps are provided by the AI. KaTeX renders math expressions.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                 <p className="mt-4 text-xs text-muted-foreground italic">
                  Mathematical expressions are rendered using KaTeX.
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card className="mt-8 bg-secondary/30">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Activity className="mr-2 h-5 w-5"/>Matrix Properties (Matrix A)</CardTitle>
                <CardDescription>Calculated characteristics of Matrix A.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderMatrixProperties()}
            </CardContent>
          </Card>

          <Card className="mt-8 bg-secondary/30">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5"/>2x2 Matrix Visualization (Coming Soon)</CardTitle>
                <CardDescription>Visual representation of 2x2 matrices and transformations on vectors/grids.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md p-4 bg-background">
                    <Image 
                        src="https://placehold.co/300x150.png" 
                        alt="Matrix visualization placeholder" 
                        width={300} 
                        height={150}
                        data-ai-hint="matrix grid"
                        className="opacity-50 mb-2 rounded"
                    />
                    <p className="text-sm text-muted-foreground">Interactive visualization canvas for 2x2 matrices.</p>
                </div>
            </CardContent>
          </Card>

        </CardContent>
         <CardFooter className="p-6 bg-secondary/50 border-t">
            <p className="text-sm text-muted-foreground">
                This tool uses an AI model to perform matrix operations. Results for complex operations or large matrices may vary in precision.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
