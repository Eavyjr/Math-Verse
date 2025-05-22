
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Sigma, Percent, Calculator, FileText, UploadCloud, ClipboardPaste, Download, Loader2, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


interface DescriptiveStats {
  count: number | null;
  mean: number | null;
  median: number | null;
  mode: string | null; // Can be multiple values or 'No mode'
  range: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  varianceSample: number | null;
  stdDevSample: number | null;
  variancePopulation: number | null;
  stdDevPopulation: number | null;
  skewness: string | null; // Placeholder
  kurtosis: string | null; // Placeholder
}

export default function BasicStatisticsPage() {
  const { toast } = useToast();
  const [rawData, setRawData] = useState<string>('');
  const [parsedData, setParsedData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DescriptiveStats | null>(null);

  const calculateMean = (data: number[]): number | null => {
    if (data.length === 0) return null;
    return data.reduce((acc, val) => acc + val, 0) / data.length;
  };

  const calculateMedian = (data: number[]): number | null => {
    if (data.length === 0) return null;
    const sortedData = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sortedData.length / 2);
    return sortedData.length % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2;
  };

  const calculateMode = (data: number[]): string | null => {
    if (data.length === 0) return null;
    const frequency: Record<number, number> = {};
    data.forEach(val => { frequency[val] = (frequency[val] || 0) + 1; });
    
    let maxFreq = 0;
    for (const key in frequency) {
      if (frequency[key] > maxFreq) {
        maxFreq = frequency[key];
      }
    }
    
    if (maxFreq === 1 && data.length > 1 && new Set(data).size === data.length) return "No mode"; // All values unique

    const modes = Object.keys(frequency)
      .filter(key => frequency[Number(key)] === maxFreq)
      .map(Number);
    
    return modes.length > 0 ? modes.join(', ') : "No mode";
  };

  const calculateRange = (data: number[]): { range: number | null, min: number | null, max: number | null } => {
    if (data.length === 0) return { range: null, min: null, max: null };
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    return { range: maxVal - minVal, min: minVal, max: maxVal };
  };

  const calculateQuartiles = (data: number[]): { q1: number | null, q3: number | null } => {
    if (data.length < 1) return { q1: null, q3: null }; // Need at least 1 for percentile calc
    const sortedData = [...data].sort((a, b) => a - b);
    
    const getPercentile = (p: number): number => {
        const pos = (sortedData.length -1) * p;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sortedData[base + 1] !== undefined) {
            return sortedData[base] + rest * (sortedData[base + 1] - sortedData[base]);
        } else {
            return sortedData[base];
        }
    };
    const q1 = data.length > 0 ? getPercentile(0.25) : null;
    const q3 = data.length > 0 ? getPercentile(0.75) : null;

    return { q1, q3 };
  };
  
  const calculateVariance = (data: number[], meanVal: number | null, isSample: boolean): number | null => {
    if (data.length === 0 || meanVal === null) return null;
    if (isSample && data.length < 2) return null; // Sample variance undefined for n < 2
    const squaredDifferences = data.map(val => Math.pow(val - meanVal, 2));
    const sumSquaredDiff = squaredDifferences.reduce((acc, val) => acc + val, 0);
    return isSample ? sumSquaredDiff / (data.length - 1) : sumSquaredDiff / data.length;
  };

  const calculateStdDev = (varianceVal: number | null): number | null => {
    if (varianceVal === null || varianceVal < 0) return null;
    return Math.sqrt(varianceVal);
  };

  const handleProcessData = () => {
    setIsLoading(true);
    setError(null);
    setParsedData([]);
    setStats(null);

    if (!rawData.trim()) {
      setError("Please enter some data.");
      setIsLoading(false);
      return;
    }

    const numbers = rawData
      .split(/[\s,;\n\t]+/) // Added semicolon and tab as delimiters
      .map(val => val.trim())
      .filter(val => val !== '')
      .map(val => parseFloat(val));

    if (numbers.some(isNaN)) {
      setError("Invalid input: Data contains non-numeric values. Please enter numbers separated by commas, spaces, newlines, tabs or semicolons.");
      setIsLoading(false);
      return;
    }

    if (numbers.length === 0) {
      setError("No valid numeric data found to process.");
      setIsLoading(false);
      return;
    }
    
    setParsedData(numbers);

    // Calculate statistics
    const meanVal = calculateMean(numbers);
    const medianVal = calculateMedian(numbers);
    const modeVal = calculateMode(numbers);
    const { range: rangeVal, min: minVal, max: maxVal } = calculateRange(numbers);
    const { q1, q3 } = calculateQuartiles(numbers);
    const iqrVal = (q1 !== null && q3 !== null) ? q3 - q1 : null;
    
    const varianceSampleVal = calculateVariance(numbers, meanVal, true);
    const stdDevSampleVal = calculateStdDev(varianceSampleVal);
    const variancePopulationVal = calculateVariance(numbers, meanVal, false);
    const stdDevPopulationVal = calculateStdDev(variancePopulationVal);

    setStats({
      count: numbers.length,
      mean: meanVal,
      median: medianVal,
      mode: modeVal,
      range: rangeVal,
      min: minVal,
      max: maxVal,
      q1: q1,
      q3: q3,
      iqr: iqrVal,
      varianceSample: varianceSampleVal,
      stdDevSample: stdDevSampleVal,
      variancePopulation: variancePopulationVal,
      stdDevPopulation: stdDevPopulationVal,
      skewness: "Calculation coming soon", // Placeholder
      kurtosis: "Calculation coming soon", // Placeholder
    });

    toast({
      title: "Data Processed",
      description: `Successfully parsed ${numbers.length} numeric values and calculated statistics.`,
    });
    setIsLoading(false);
  };

  const handleClearData = () => {
    setRawData('');
    setParsedData([]);
    setError(null);
    setStats(null);
    toast({
      title: "Data Cleared",
      description: "Input field and results have been cleared.",
    });
  };

  const formatNumber = (num: number | null | undefined, decimalPlaces: number = 2): string => {
    if (num === null || num === undefined) return 'N/A';
    return num.toFixed(decimalPlaces);
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
            <Sigma className="h-8 w-8 mr-3" />
            Basic Statistics Analyzer
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Analyze ungrouped data, calculate descriptive statistics, visualize distributions, and perform regression analysis.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Data Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Data Input</CardTitle>
              <CardDescription>Enter your data below (numbers separated by commas, spaces, newlines, tabs, or semicolons).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rawData" className="text-md font-semibold">
                  Enter Data:
                </Label>
                <Textarea
                  id="rawData"
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="e.g., 10, 25, 12.5, 8, 30  or  10 25 12.5 8 30"
                  className="min-h-[120px] text-base focus:ring-accent focus:border-accent"
                  rows={5}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleProcessData} disabled={isLoading} className="flex-grow">
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Calculator className="mr-2 h-5 w-5" />}
                  {isLoading ? 'Processing...' : 'Calculate Statistics'}
                </Button>
                <Button onClick={handleClearData} variant="outline" className="flex-grow sm:flex-grow-0">
                   <XCircle className="mr-2 h-5 w-5" />
                  Clear Data
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Button variant="outline" disabled className="w-full">
                  <UploadCloud className="mr-2 h-5 w-5" /> Upload CSV (Coming Soon)
                </Button>
                <Button variant="outline" disabled className="w-full">
                  <ClipboardPaste className="mr-2 h-5 w-5" /> Paste from Spreadsheet (Coming Soon)
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Input Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Analysis & Results Section */}
          {stats && !isLoading && (
            <Tabs defaultValue="descriptive" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
                <TabsTrigger value="descriptive" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                    <BarChart3 className="mr-2 h-5 w-5"/>Descriptive Stats
                </TabsTrigger>
                <TabsTrigger value="visualizations" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                    <Info className="mr-2 h-5 w-5"/>Visualizations
                </TabsTrigger>
                <TabsTrigger value="regression" disabled className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                    <Percent className="mr-2 h-5 w-5"/>Regression (Soon)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="descriptive" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Descriptive Statistics Results</CardTitle>
                    <CardDescription>Summary of your dataset ({stats.count} data points).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Measure</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Count</TableCell>
                          <TableCell>{stats.count}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Mean (Average)</TableCell>
                          <TableCell>{formatNumber(stats.mean)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Median (Middle Value)</TableCell>
                          <TableCell>{formatNumber(stats.median)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Mode (Most Frequent)</TableCell>
                          <TableCell>{stats.mode || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Minimum</TableCell>
                          <TableCell>{formatNumber(stats.min)}</TableCell>
                        </TableRow>
                         <TableRow>
                          <TableCell className="font-medium">Maximum</TableCell>
                          <TableCell>{formatNumber(stats.max)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Range (Max - Min)</TableCell>
                          <TableCell>{formatNumber(stats.range)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Q1 (First Quartile)</TableCell>
                          <TableCell>{formatNumber(stats.q1)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Q3 (Third Quartile)</TableCell>
                          <TableCell>{formatNumber(stats.q3)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">IQR (Interquartile Range)</TableCell>
                          <TableCell>{formatNumber(stats.iqr)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Variance (Sample)</TableCell>
                          <TableCell>{formatNumber(stats.varianceSample, 4)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Standard Deviation (Sample)</TableCell>
                          <TableCell>{formatNumber(stats.stdDevSample, 4)}</TableCell>
                        </TableRow>
                         <TableRow>
                          <TableCell className="font-medium">Variance (Population)</TableCell>
                          <TableCell>{formatNumber(stats.variancePopulation, 4)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Standard Deviation (Population)</TableCell>
                          <TableCell>{formatNumber(stats.stdDevPopulation, 4)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Skewness</TableCell>
                          <TableCell>{stats.skewness}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Kurtosis</TableCell>
                          <TableCell>{stats.kurtosis}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visualizations" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Data Visualizations</CardTitle>
                     <CardDescription>Visual representations of your data will appear here. (Coming Soon)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-muted/30">
                            <CardHeader><CardTitle className="text-lg">Histogram</CardTitle></CardHeader>
                            <CardContent className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-md p-4">
                                <Image 
                                    src="https://placehold.co/300x150.png" 
                                    alt="Histogram placeholder" 
                                    data-ai-hint="histogram chart"
                                    width={300} 
                                    height={150}
                                    className="opacity-50 mb-2 rounded"
                                />
                                <p className="text-sm text-muted-foreground">Histogram display coming soon.</p>
                            </CardContent>
                        </Card>
                         <Card className="bg-muted/30">
                            <CardHeader><CardTitle className="text-lg">Box Plot</CardTitle></CardHeader>
                            <CardContent className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-md p-4">
                                <Image 
                                    src="https://placehold.co/300x150.png" 
                                    alt="Box plot placeholder" 
                                    data-ai-hint="box plot"
                                    width={300} 
                                    height={150}
                                    className="opacity-50 mb-2 rounded"
                                />
                                <p className="text-sm text-muted-foreground">Box plot display coming soon.</p>
                            </CardContent>
                        </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="regression" className="mt-4">
                 <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Regression Analysis</CardTitle>
                    <CardDescription>Simple and Multiple Linear Regression analysis will be available here. (Coming Soon)</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-md p-4 mt-4 bg-muted/30">
                        <Image 
                            src="https://placehold.co/400x200.png" 
                            alt="Regression placeholder" 
                            data-ai-hint="scatter plot"
                            width={400} 
                            height={200}
                            className="opacity-50 mb-2 rounded"
                        />
                        <p className="text-sm text-muted-foreground">Regression tools coming soon.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Export Options Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">Export Results</CardTitle>
               <CardDescription>Download your statistical summary or visualizations.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" disabled className="w-full sm:w-auto">
                <Download className="mr-2 h-5 w-5" /> Download CSV (Coming Soon)
              </Button>
              <Button variant="outline" disabled className="w-full sm:w-auto">
                <FileText className="mr-2 h-5 w-5" /> Download PDF (Coming Soon)
              </Button>
            </CardContent>
          </Card>

        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-sm text-muted-foreground">
            This tool helps analyze basic statistical properties of ungrouped data. More advanced features and visualizations are under development. For accurate statistical analysis, ensure data is clean and appropriate for the chosen methods.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
