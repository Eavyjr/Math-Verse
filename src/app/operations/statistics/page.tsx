
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Sigma, Percent, Calculator, FileText, UploadCloud, ClipboardPaste, Download, Loader2, XCircle, Info, List } from 'lucide-react';
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";


interface DescriptiveStats {
  count: number | null;
  mean: number | null;
  median: number | null;
  mode: string | null;
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
  frequencyTable: { value: number; count: number }[] | null;
  skewness: number | null;
  kurtosis: number | null;
}

interface HistogramData {
  name: string; // Bin label e.g., "0-10"
  count: number;
}

interface BoxPlotChartDataItem {
  name: string; // e.g., "Dataset"
  min: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  max: number | null;
  // These are for Recharts Bar dataKey access, not direct props to <Bar>
  box: [number, number] | null; // Represents [Q1, Q3] for the main bar
}


// Custom shape component for the whiskers in the box plot
const WhiskerBarShape = (props: any) => {
  // Extract only the props that <rect> understands or that you want to use for drawing
  // Recharts passes x, y, width, height, fill, stroke, etc.
  // The 'width' prop passed by Recharts here would be for the full bar slot if not for barSize.
  // We want a fixed width for our whisker line representation.
  const { x, y, height, fill } = props;
  return <rect x={x} y={y} width={2} height={height} fill={fill} />;
};


export default function BasicStatisticsPage() {
  const { toast } = useToast();
  const [rawData, setRawData] = useState<string>('');
  const [parsedData, setParsedData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DescriptiveStats | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramData[]>([]);
  const [boxPlotChartData, setBoxPlotChartData] = useState<BoxPlotChartDataItem[]>([]);


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

  const getFrequencyMap = (data: number[]): Record<number, number> => {
    const frequency: Record<number, number> = {};
    data.forEach(val => { frequency[val] = (frequency[val] || 0) + 1; });
    return frequency;
  };

  const calculateMode = (data: number[], frequencyMap: Record<number, number>): string | null => {
    if (data.length === 0) return null;
    
    let maxFreq = 0;
    for (const key in frequencyMap) {
      if (frequencyMap[key] > maxFreq) {
        maxFreq = frequencyMap[key];
      }
    }
    
    if (maxFreq === 0) return "N/A"; // Should not happen if data is not empty
    if (maxFreq === 1 && data.length > 1 && new Set(data).size === data.length) return "No mode (all values unique)";

    const modes = Object.keys(frequencyMap)
      .filter(key => frequencyMap[Number(key)] === maxFreq)
      .map(Number);
    
    return modes.length > 0 ? modes.sort((a,b) => a-b).join(', ') : "No mode";
  };

  const calculateRange = (data: number[]): { range: number | null, min: number | null, max: number | null } => {
    if (data.length === 0) return { range: null, min: null, max: null };
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    return { range: maxVal - minVal, min: minVal, max: maxVal };
  };

  const calculateQuartiles = (data: number[]): { q1: number | null, q3: number | null } => {
    if (data.length < 1) return { q1: null, q3: null }; // Needs at least 1 for simple percentile, more for robust
    const sortedData = [...data].sort((a, b) => a - b);
    
    // Using a common method for quartiles (inclusive median for halves)
    // This is one of many methods; results can vary slightly.
    const getPercentile = (p: number): number | null => {
        if (sortedData.length === 0) return null;
        const pos = (sortedData.length -1) * p; // (n-1)p for 0-indexed
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sortedData[base + 1] !== undefined) {
            return sortedData[base] + rest * (sortedData[base + 1] - sortedData[base]);
        } else {
            return sortedData[base]; // Last element if pos is n-1
        }
    };
    const q1 = getPercentile(0.25);
    const q3 = getPercentile(0.75);

    return { q1, q3 };
  };
  
  const calculateVariance = (data: number[], meanVal: number | null, isSample: boolean): number | null => {
    if (data.length === 0 || meanVal === null) return null;
    if (isSample && data.length < 2) return null; 
    if (!isSample && data.length < 1) return null;

    const squaredDifferences = data.map(val => Math.pow(val - meanVal, 2));
    const sumSquaredDiff = squaredDifferences.reduce((acc, val) => acc + val, 0);
    
    const divisor = isSample ? data.length - 1 : data.length;
    return divisor > 0 ? sumSquaredDiff / divisor : null;
  };

  const calculateStdDev = (varianceVal: number | null): number | null => {
    if (varianceVal === null || varianceVal < 0) return null;
    return Math.sqrt(varianceVal);
  };

  const calculateFrequencyTable = (frequencyMap: Record<number, number>): { value: number; count: number }[] | null => {
    if (Object.keys(frequencyMap).length === 0) return null;
    return Object.entries(frequencyMap)
      .map(([value, count]) => ({ value: Number(value), count }))
      .sort((a, b) => a.value - b.value);
  };

  const calculateSkewness = (data: number[], mean: number | null, stdDevSample: number | null): number | null => {
    if (data.length < 3 || mean === null || stdDevSample === null || stdDevSample === 0) {
      return null; // Skewness is typically undefined for n < 3 or if stdDev is 0
    }
    const n = data.length;
    const sumOfCubedStdScores = data.reduce((acc, val) => {
      return acc + Math.pow((val - mean) / stdDevSample, 3);
    }, 0);
    // Adjusted Fisher-Pearson standardized moment coefficient (G1)
    // return (n / ((n - 1) * (n - 2))) * sumOfCubedStdScores; 
    // Simpler version (biased for small n, but common):
     return sumOfCubedStdScores / n;
  };

  const calculateKurtosis = (data: number[], mean: number | null, stdDevSample: number | null): number | null => {
    if (data.length < 4 || mean === null || stdDevSample === null || stdDevSample === 0) {
      return null; // Kurtosis is typically undefined for n < 4 or if stdDev is 0
    }
    const n = data.length;
    const sumOfQuarticStdScores = data.reduce((acc, val) => {
      return acc + Math.pow((val - mean) / stdDevSample, 4);
    }, 0);
    // Sample excess kurtosis (g2)
    // const term1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    // const term2 = sumOfQuarticStdScores;
    // const term3 = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    // return term1 * term2 - term3;
    // Simpler version of excess kurtosis:
    return (sumOfQuarticStdScores / n) - 3;
  };

  const prepareHistogramData = (data: number[], minVal: number | null, maxVal: number | null): HistogramData[] => {
    if (data.length === 0 || minVal === null || maxVal === null) return [];
    const n = data.length;
    // Sturges' formula or square-root choice are common. Let's use sqrt for simplicity.
    const numBins = Math.max(1, Math.ceil(Math.sqrt(n))); 
    const binWidth = (maxVal - minVal) / numBins || 1; // Avoid division by zero if max=min, default to binWidth=1

    const bins: HistogramData[] = [];
    for (let i = 0; i < numBins; i++) {
      const binStart = minVal + i * binWidth;
      const binEnd = minVal + (i + 1) * binWidth;
      // Make sure last bin includes the max value if it falls on the edge
      bins.push({ name: `${formatNumber(binStart,1)}-${formatNumber(i === numBins -1 ? maxVal : binEnd,1)}`, count: 0 });
    }
    
    if (bins.length === 0 && n > 0 && minVal === maxVal) { // Handle case where all data points are the same
        bins.push({ name: `${formatNumber(minVal,1)}-${formatNumber(maxVal,1)}`, count: n });
    }


    data.forEach(val => {
      if (binWidth === 0 && val === minVal && bins.length > 0) { // All values are the same
           bins[0].count++;
           return;
      }
      let binIndex = Math.floor((val - minVal) / binWidth);
      // Ensure the maximum value falls into the last bin
      if (val === maxVal) {
        binIndex = numBins - 1;
      }
      if (binIndex >= 0 && binIndex < numBins) {
        bins[binIndex].count++;
      } else if (binIndex === -1 && val === minVal) { // Handle floating point precision for min value
        bins[0].count++;
      }
    });
    return bins;
  };
  
  const prepareBoxPlotData = (s: DescriptiveStats | null): BoxPlotChartDataItem[] => {
    if (!s || s.min === null || s.q1 === null || s.median === null || s.q3 === null || s.max === null) {
      return [];
    }
    return [
      {
        name: "Dataset",
        min: s.min,
        q1: s.q1,
        median: s.median,
        q3: s.q3,
        max: s.max,
        box: [s.q1, s.q3] // Used by the main box Bar
      }
    ];
  };


  const handleProcessData = () => {
    setIsLoading(true);
    setError(null);
    setParsedData([]);
    setStats(null);
    setHistogramData([]);
    setBoxPlotChartData([]);

    if (!rawData.trim()) {
      setError("Please enter some data.");
      setIsLoading(false);
      return;
    }

    const numbers = rawData
      .split(/[\s,;\n\t]+/) 
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

    const frequencyMap = getFrequencyMap(numbers);
    const meanVal = calculateMean(numbers);
    const medianVal = calculateMedian(numbers);
    const modeVal = calculateMode(numbers, frequencyMap);
    const { range: rangeVal, min: minVal, max: maxVal } = calculateRange(numbers);
    const { q1, q3 } = calculateQuartiles(numbers);
    const iqrVal = (q1 !== null && q3 !== null) ? q3 - q1 : null;
    
    const varianceSampleVal = calculateVariance(numbers, meanVal, true);
    const stdDevSampleVal = calculateStdDev(varianceSampleVal);
    const variancePopulationVal = calculateVariance(numbers, meanVal, false);
    const stdDevPopulationVal = calculateStdDev(variancePopulationVal);
    const frequencyTableVal = calculateFrequencyTable(frequencyMap);
    const skewnessVal = calculateSkewness(numbers, meanVal, stdDevSampleVal);
    const kurtosisVal = calculateKurtosis(numbers, meanVal, stdDevSampleVal);

    const currentStats: DescriptiveStats = {
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
      frequencyTable: frequencyTableVal,
      skewness: skewnessVal, 
      kurtosis: kurtosisVal, 
    };
    setStats(currentStats);

    if (minVal !== null && maxVal !== null) {
      setHistogramData(prepareHistogramData(numbers, minVal, maxVal));
    }
    setBoxPlotChartData(prepareBoxPlotData(currentStats));


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
    setHistogramData([]);
    setBoxPlotChartData([]);
    toast({
      title: "Data Cleared",
      description: "Input field and results have been cleared.",
    });
  };

  const formatNumber = (num: number | null | undefined, decimalPlaces: number = 2): string => {
    if (num === null || num === undefined) return 'N/A';
    if (isNaN(num)) return 'N/A';
    return num.toFixed(decimalPlaces);
  };

  const chartConfig = {
    count: { label: "Frequency", color: "hsl(var(--chart-1))" },
    dataset: { label: "Dataset", color: "hsl(var(--chart-2))" },
  } satisfies Record<string, any>;


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
                  <Info className="h-5 w-5" />
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
                    <CardDescription>Summary of your dataset ({stats.count} data points). Sample estimators are used for Skewness and Kurtosis.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[350px]">Measure</TableHead>
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
                          <TableCell className="font-medium">Variance (Sample, s²)</TableCell>
                          <TableCell>{formatNumber(stats.varianceSample, 4)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Standard Deviation (Sample, s)</TableCell>
                          <TableCell>{formatNumber(stats.stdDevSample, 4)}</TableCell>
                        </TableRow>
                         <TableRow>
                          <TableCell className="font-medium">Variance (Population, σ²)</TableCell>
                          <TableCell>{formatNumber(stats.variancePopulation, 4)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Standard Deviation (Population, σ)</TableCell>
                          <TableCell>{formatNumber(stats.stdDevPopulation, 4)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Skewness (Sample)</TableCell>
                          <TableCell>{formatNumber(stats.skewness, 4)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Excess Kurtosis (Sample)</TableCell>
                          <TableCell>{formatNumber(stats.kurtosis, 4)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {stats.frequencyTable && stats.frequencyTable.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <List className="mr-2 h-5 w-5 text-primary" /> 
                          Frequency Table
                        </h3>
                        <Card className="max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Value</TableHead>
                                <TableHead className="text-right">Frequency</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stats.frequencyTable.map((item) => (
                                <TableRow key={item.value}>
                                  <TableCell>{item.value}</TableCell>
                                  <TableCell className="text-right">{item.count}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visualizations" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Data Visualizations</CardTitle>
                     <CardDescription>Visual representations of your data.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {histogramData.length > 0 ? (
                       <Card className="bg-card">
                          <CardHeader>
                            <CardTitle className="text-lg">Histogram</CardTitle>
                            <CardDescription>Distribution of data values across bins.</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[300px] w-full p-0">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" tickLine={false} axisLine={false} dy={5} />
                                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} dx={-5} />
                                  <RechartsTooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    content={<ChartTooltipContent hideLabel />}
                                  />
                                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          </CardContent>
                       </Card>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4"/>
                        <AlertTitle>Histogram</AlertTitle>
                        <AlertDescription>Not enough data to display histogram.</AlertDescription>
                      </Alert>
                    )}

                    {boxPlotChartData.length > 0 && stats && stats.min !== null && stats.q1 !== null && stats.median !== null && stats.q3 !== null && stats.max !== null ? (
                       <Card className="bg-card">
                          <CardHeader>
                            <CardTitle className="text-lg">Box Plot</CardTitle>
                            <CardDescription>Summary of data distribution (Min, Q1, Median, Q3, Max).</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[200px] w-full p-0">
                             <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={boxPlotChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                    <XAxis type="number" domain={[stats.min!, stats.max!]} />
                                    <YAxis type="category" dataKey="name" hide/>
                                    <RechartsTooltip 
                                       cursor={{fill: 'transparent'}}
                                       content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const dataItem = payload[0].payload as BoxPlotChartDataItem;
                                            if (!dataItem) return null;
                                            return (
                                                <div className="bg-popover text-popover-foreground p-2 shadow-md rounded-md border text-xs">
                                                    <p>Min: {formatNumber(dataItem.min)}</p>
                                                    <p>Q1: {formatNumber(dataItem.q1)}</p>
                                                    <p>Median: {formatNumber(dataItem.median)}</p>
                                                    <p>Q3: {formatNumber(dataItem.q3)}</p>
                                                    <p>Max: {formatNumber(dataItem.max)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                       }}
                                    />
                                    {/* Main box from Q1 to Q3 */}
                                    <Bar dataKey="box" fill="hsl(var(--chart-1))" barSize={30} stackId="a"/>
                                    
                                    {/* Lower whisker: invisible bar for positioning, use ReferenceLine for actual whisker line */}
                                    <Bar dataKey={(d: BoxPlotChartDataItem) => [d.min, d.q1]} stackId="a" fill="transparent" shape={<WhiskerBarShape fill="hsl(var(--foreground))" />} />

                                    {/* Upper whisker: invisible bar for positioning, use ReferenceLine for actual whisker line */}
                                    <Bar dataKey={(d: BoxPlotChartDataItem) => [d.q3, d.max]} stackId="a" fill="transparent" shape={<WhiskerBarShape fill="hsl(var(--foreground))" />} />
                                   
                                    {/* Median Line */}
                                    {stats.median !== null && <ReferenceLine x={stats.median} stroke="hsl(var(--destructive))" strokeWidth={2} />}
                                </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <p className="text-xs text-muted-foreground p-2">Note: This is a simplified Box Plot representation. Min/Max whiskers extend to data extremes.</p>
                          </CardContent>
                       </Card>
                    ) : (
                       <Alert>
                        <Info className="h-4 w-4"/>
                        <AlertTitle>Box Plot</AlertTitle>
                        <AlertDescription>Not enough data or calculated statistics to display box plot.</AlertDescription>
                      </Alert>
                    )}
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
                            data-ai-hint="scatter plot"
                            alt="Regression placeholder" 
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

    