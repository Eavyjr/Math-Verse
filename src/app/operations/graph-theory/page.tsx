
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Trash2,
  Projector,
  TableIcon,
  Share2,
  Sigma,
  Network,
  Download,
  Settings2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Placeholder types for graph data (will be expanded)
interface Edge {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

interface Node {
  id: string;
  label: string;
}

const initialEdges: Edge[] = [
  { id: 'e1', source: 'A', target: 'B', weight: 1 },
  { id: 'e2', source: 'B', target: 'C', weight: 2 },
];

export default function GraphTheoryPage() {
  const [isDirected, setIsDirected] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nodes, setNodes] = useState<Node[]>([]); // Will be derived or manually added

  const [newEdgeSource, setNewEdgeSource] = useState('');
  const [newEdgeTarget, setNewEdgeTarget] = useState('');
  const [newEdgeWeight, setNewEdgeWeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Derive nodes from edges for simplicity initially
    const derivedNodes = new Set<string>();
    edges.forEach(edge => {
      derivedNodes.add(edge.source);
      derivedNodes.add(edge.target);
    });
    setNodes(Array.from(derivedNodes).map(id => ({ id, label: id })));
  }, [edges]);

  const handleAddEdge = () => {
    if (!newEdgeSource || !newEdgeTarget) {
      // Add toast notification here later
      console.error("Source and Target are required for an edge.");
      return;
    }
    const newEdge: Edge = {
      id: `e${Date.now()}`, // Simple ID generation
      source: newEdgeSource,
      target: newEdgeTarget,
      ...(isWeighted && newEdgeWeight !== undefined && { weight: newEdgeWeight }),
    };
    setEdges([...edges, newEdge]);
    setNewEdgeSource('');
    setNewEdgeTarget('');
    setNewEdgeWeight(undefined);
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(edges.filter(edge => edge.id !== edgeId));
  };

  const renderEdgeInputTable = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Edge List Editor</CardTitle>
        <CardDescription>Define graph edges and their properties.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <div className="space-y-2 mb-4">
            <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                    <Label htmlFor="new-edge-source">Source</Label>
                    <Input id="new-edge-source" placeholder="Node ID (e.g., A)" value={newEdgeSource} onChange={e => setNewEdgeSource(e.target.value.toUpperCase())} />
                </div>
                <div>
                    <Label htmlFor="new-edge-target">Target</Label>
                    <Input id="new-edge-target" placeholder="Node ID (e.g., B)" value={newEdgeTarget} onChange={e => setNewEdgeTarget(e.target.value.toUpperCase())} />
                </div>
                {isWeighted && (
                    <div>
                        <Label htmlFor="new-edge-weight">Weight</Label>
                        <Input id="new-edge-weight" type="number" placeholder="e.g., 5" value={newEdgeWeight ?? ''} onChange={e => setNewEdgeWeight(parseFloat(e.target.value) || undefined)} />
                    </div>
                )}
            </div>
            <Button onClick={handleAddEdge} size="sm" className="w-full">Add Edge</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Target</TableHead>
              {isWeighted && <TableHead>Weight</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {edges.map((edge) => (
              <TableRow key={edge.id}>
                <TableCell>{edge.source}</TableCell>
                <TableCell>{edge.target}</TableCell>
                {isWeighted && <TableCell>{edge.weight ?? 'N/A'}</TableCell>}
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteEdge(edge.id)} aria-label="Delete edge">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
             {edges.length === 0 && (
                <TableRow>
                    <TableCell colSpan={isWeighted ? 4 : 3} className="text-center text-muted-foreground">
                        No edges defined yet. Add edges using the form above.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderGraphVisualizationPlaceholder = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Graph Visualization</CardTitle>
        <CardDescription>Live interactive view of your graph.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center border-2 border-dashed border-border rounded-md bg-muted/30">
        <div className="text-center text-muted-foreground">
          <Network className="h-16 w-16 mx-auto mb-2 opacity-50" />
          <p>Graph visualization will appear here.</p>
          <p className="text-xs">(Integrating library like React Flow or Cytoscape.js)</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdjacencyMatrixPlaceholder = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Adjacency Matrix</CardTitle>
        <CardDescription>Matrix representation of node connections.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center border-2 border-dashed border-border rounded-md bg-muted/30">
        <div className="text-center text-muted-foreground">
          <TableIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
          <p>Adjacency matrix will be displayed here.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderIncidenceMatrixPlaceholder = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Incidence Matrix</CardTitle>
        <CardDescription>Matrix relating nodes to edges.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center border-2 border-dashed border-border rounded-md bg-muted/30">
        <div className="text-center text-muted-foreground">
          <Sigma className="h-16 w-16 mx-auto mb-2 opacity-50" />
          <p>Incidence matrix will be displayed here.</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workstations
      </Link>

      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Share2 className="h-8 w-8 mr-3" />
            Graph Theory Explorer
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Interactively build graphs, visualize algorithms, and explore graph properties.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-md bg-secondary/30">
            <div>
              <Label className="block text-md font-semibold text-foreground mb-1">Graph Type</Label>
              <Select value={isDirected ? "directed" : "undirected"} onValueChange={(val) => setIsDirected(val === "directed")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select graph directionality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undirected">Undirected</SelectItem>
                  <SelectItem value="directed">Directed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-md font-semibold text-foreground mb-1">Edge Weight</Label>
              <Select value={isWeighted ? "weighted" : "unweighted"} onValueChange={(val) => setIsWeighted(val === "weighted")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select edge weight type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unweighted">Unweighted</SelectItem>
                  <SelectItem value="weighted">Weighted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="table-editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 sticky top-[calc(var(--header-height,60px)+1px)] z-10 bg-card border-b">
              <TabsTrigger value="table-editor" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                <TableIcon className="mr-2 h-5 w-5" /> Grid Editor
              </TabsTrigger>
              <TabsTrigger value="canvas-editor" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                <Projector className="mr-2 h-5 w-5" /> Visual Editor
              </TabsTrigger>
              <TabsTrigger value="algorithms" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                 <Settings2 className="mr-2 h-5 w-5" /> Algorithms
              </TabsTrigger>
              <TabsTrigger value="properties" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none">
                 <HelpCircle className="mr-2 h-5 w-5" /> Properties & Learn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table-editor" className="mt-4 min-h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full md:min-h-[70vh]">
                <div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">
                  {renderEdgeInputTable()}
                </div>
                <div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">
                  {renderGraphVisualizationPlaceholder()}
                </div>
                <div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">
                  {renderAdjacencyMatrixPlaceholder()}
                </div>
                <div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">
                  {renderIncidenceMatrixPlaceholder()}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="canvas-editor" className="mt-4 min-h-[600px]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Visual Graph Builder</CardTitle>
                  <CardDescription>Click and drag to create nodes and edges. More features coming soon!</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[500px] border-2 border-dashed border-border rounded-md bg-muted/30">
                   <div className="text-center text-muted-foreground">
                    <Projector className="h-24 w-24 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Interactive graph canvas will be here.</p>
                    <p>(Drag & drop nodes, create edges)</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="algorithms" className="mt-4 min-h-[600px]">
              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Visualizations</CardTitle>
                  <CardDescription>Select an algorithm to visualize on your current graph. (Coming Soon)</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>Visualizations for DFS, BFS, Dijkstra's, etc., will be available here.</p>
                   <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-md p-4 mt-4 bg-muted/30">
                        <Image 
                            src="https://placehold.co/300x150.png" 
                            alt="Algorithm placeholder" 
                            width={300} 
                            height={150}
                            data-ai-hint="algorithm flowchart"
                            className="opacity-50 mb-2 rounded"
                        />
                        <p className="text-sm text-muted-foreground">Algorithm controls and animation.</p>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="mt-4 min-h-[600px]">
              <Card>
                <CardHeader>
                  <CardTitle>Graph Properties & Learning</CardTitle>
                  <CardDescription>Analyze graph properties and access learning materials. (Coming Soon)</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>Information like vertex/edge counts, degree, paths, cycles, connectivity, and learning tutorials will be here.</p>
                   <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-md p-4 mt-4 bg-muted/30">
                        <Image 
                            src="https://placehold.co/300x150.png" 
                            alt="Properties placeholder" 
                            width={300} 
                            height={150}
                            data-ai-hint="data chart"
                            className="opacity-50 mb-2 rounded"
                        />
                        <p className="text-sm text-muted-foreground">Display of graph metrics.</p>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <Button variant="outline">
                <Download className="mr-2 h-5 w-5" /> Export Graph (Soon)
            </Button>
            <Button variant="outline">
                Import Graph (Soon)
            </Button>
          </div>

        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t">
          <p className="text-sm text-muted-foreground">
            Use the editors above to build your graph. More advanced features like algorithm visualization and saving graphs are coming soon.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    