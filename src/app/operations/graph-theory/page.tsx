
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Trash2,
  Projector,
  LayoutGrid, // Changed from TableIcon
  Share2,
  Sigma,
  Network,
  Download,
  Settings2, 
  HelpCircle,
  PlusCircle,
  Activity,
  BookOpen, 
  Waypoints,
  Loader2,
  AlertTriangle,
  SearchCheck, 
  Route, 
  MousePointerSquare, 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription as AlertDescUI } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ReactFlow, Controls, Background, MiniMap, useNodesState, useEdgesState, MarkerType, type Node as RFNode, type Edge as RFEdge, type OnNodesChange, type OnEdgesChange, type OnNodesDelete, Panel } from '@xyflow/react';

interface Node {
  id: string;
  label: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

interface GraphProperties {
  vertexCount: number;
  edgeCount: number;
  degrees: Record<string, { degree?: number; inDegree?: number; outDegree?: number }>;
  loops: Edge[];
}

const initialRfNodes: RFNode[] = [];
const initialRfEdges: RFEdge[] = [];

export default function GraphTheoryPage() {
  const { toast } = useToast();
  const [isDirected, setIsDirected] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);
  
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]); 

  const [newEdgeSource, setNewEdgeSource] = useState('');
  const [newEdgeTarget, setNewEdgeTarget] = useState('');
  const [newEdgeWeight, setNewEdgeWeight] = useState<string>('');

  const [adjacencyMatrix, setAdjacencyMatrix] = useState<number[][]>([]);
  const [incidenceMatrix, setIncidenceMatrix] = useState<number[][]>([]);
  const [graphProperties, setGraphProperties] = useState<GraphProperties>({
    vertexCount: 0,
    edgeCount: 0,
    degrees: {},
    loops: [],
  });

  const [rfNodes, setRfNodesState, onRfNodesChange]: [RFNode[], any, OnNodesChange] = useNodesState(initialRfNodes);
  const [rfEdges, setRfEdgesState, onRfEdgesChange]: [RFEdge[], any, OnEdgesChange] = useEdgesState(initialRfEdges);

  // BFS Algorithm state
  const [startNodeBFS, setStartNodeBFS] = useState('');
  const [endNodeBFS, setEndNodeBFS] = useState('');
  const [foundPathBFS, setFoundPathBFS] = useState<string[] | null>(null);
  const [errorBFS, setErrorBFS] = useState<string | null>(null);
  const [isRunningBFS, setIsRunningBFS] = useState(false);

  // DFS Algorithm state
  const [startNodeDFS, setStartNodeDFS] = useState('');
  const [endNodeDFS, setEndNodeDFS] = useState('');
  const [foundPathDFS, setFoundPathDFS] = useState<string[] | null>(null);
  const [errorDFS, setErrorDFS] = useState<string | null>(null);
  const [isRunningDFS, setIsRunningDFS] = useState(false);
  
  // Dijkstra's Algorithm state
  const [startNodeDijkstra, setStartNodeDijkstra] = useState('');
  const [endNodeDijkstra, setEndNodeDijkstra] = useState('');
  const [foundPathDijkstra, setFoundPathDijkstra] = useState<string[] | null>(null);
  const [costDijkstra, setCostDijkstra] = useState<number | null>(null);
  const [errorDijkstra, setErrorDijkstra] = useState<string | null>(null);
  const [isRunningDijkstra, setIsRunningDijkstra] = useState(false);

  useEffect(() => {
    const uniqueNodeIds = new Set<string>();
    edges.forEach(edge => {
      uniqueNodeIds.add(edge.source);
      uniqueNodeIds.add(edge.target);
    });
    const derivedNodes: Node[] = Array.from(uniqueNodeIds).map(id => ({ id, label: id }));
    setNodes(derivedNodes.sort((a,b) => a.id.localeCompare(b.id)));
  }, [edges]);

  const defaultNodeStyle = { 
    background: 'hsl(var(--primary-foreground))', 
    color: 'hsl(var(--primary))', 
    border: '2px solid hsl(var(--primary))',
    borderRadius: '0.375rem', 
    padding: '0.5rem 1rem',
    width: 'auto',
    minWidth: '60px',
    textAlign: 'center',
  };
  const highlightedNodeStyle = { 
    ...defaultNodeStyle, 
    background: 'hsl(var(--accent))', 
    color: 'hsl(var(--accent-foreground))', 
    border: '2px solid hsl(var(--accent))' 
  };
  const defaultEdgeStyle = { stroke: 'hsl(var(--primary))', strokeWidth: 2 };
  const highlightedEdgeStyle = { ...defaultEdgeStyle, stroke: 'hsl(var(--accent))', strokeWidth: 4 };

  useEffect(() => {
    const newRfNodesData: RFNode[] = nodes.map((node, index) => {
      // Try to preserve existing positions if node already in rfNodes
      const existingRfNode = rfNodes.find(rfn => rfn.id === node.id);
      return {
        id: node.id,
        data: { label: node.label },
        position: existingRfNode?.position || { x: (index % 8) * 100 + Math.random() * 20, y: Math.floor(index / 8) * 100 + Math.random() * 20 }, 
        type: 'default', 
        style: defaultNodeStyle,
      };
    });

    const newRfEdgesData: RFEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: isWeighted && edge.weight !== undefined ? edge.weight.toString() : undefined,
      animated: isDirected && edge.source !== edge.target,
      markerEnd: isDirected ? { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' } : undefined,
      style: defaultEdgeStyle,
      labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 600 },
      labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.7 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 2,
    }));
    
    setRfNodesState(newRfNodesData);
    setRfEdgesState(newRfEdgesData);
  }, [nodes, edges, isDirected, isWeighted, rfNodes, defaultNodeStyle, defaultEdgeStyle, setRfNodesState, setRfEdgesState]); 

  useEffect(() => {
    if (nodes.length === 0) { setAdjacencyMatrix([]); return; }
    const nodeIndexMap = new Map(nodes.map((node, i) => [node.id, i]));
    const size = nodes.length;
    const matrix = Array(size).fill(null).map(() => Array(size).fill(0));
    edges.forEach(edge => {
      const sourceIdx = nodeIndexMap.get(edge.source); const targetIdx = nodeIndexMap.get(edge.target);
      if (sourceIdx === undefined || targetIdx === undefined) return;
      const value = isWeighted && edge.weight !== undefined ? edge.weight : 1;
      matrix[sourceIdx][targetIdx] = value;
      if (!isDirected && sourceIdx !== targetIdx) matrix[targetIdx][sourceIdx] = value;
    });
    setAdjacencyMatrix(matrix);
  }, [nodes, edges, isDirected, isWeighted]);

  useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) { setIncidenceMatrix([]); return; }
    const nodeIndexMap = new Map(nodes.map((node, i) => [node.id, i]));
    const matrix = Array(nodes.length).fill(null).map(() => Array(edges.length).fill(0));
    edges.forEach((edge, edgeIdx) => {
      const sourceIdx = nodeIndexMap.get(edge.source); const targetIdx = nodeIndexMap.get(edge.target);
      if (sourceIdx === undefined || targetIdx === undefined) return;
      const weightValue = isWeighted && edge.weight !== undefined ? edge.weight : 1;
      if (isDirected) {
        if (sourceIdx === targetIdx) matrix[sourceIdx][edgeIdx] = weightValue; 
        else { matrix[sourceIdx][edgeIdx] = weightValue; matrix[targetIdx][edgeIdx] = -weightValue; }
      } else { 
        matrix[sourceIdx][edgeIdx] = weightValue;
        if (sourceIdx !== targetIdx) matrix[targetIdx][edgeIdx] = weightValue; 
      }
    });
    setIncidenceMatrix(matrix);
  }, [nodes, edges, isDirected, isWeighted]);

  useEffect(() => {
    const newProperties: GraphProperties = { vertexCount: nodes.length, edgeCount: edges.length, degrees: {}, loops: [] };
    nodes.forEach(node => { newProperties.degrees[node.id] = isDirected ? { inDegree: 0, outDegree: 0 } : { degree: 0 }; });
    edges.forEach(edge => {
      if (edge.source === edge.target) newProperties.loops.push(edge);
      const sourceDegree = newProperties.degrees[edge.source]; const targetDegree = newProperties.degrees[edge.target];
      if (isDirected) {
        if(sourceDegree && sourceDegree.outDegree !== undefined) sourceDegree.outDegree++;
        if(targetDegree && targetDegree.inDegree !== undefined) targetDegree.inDegree++;
      } else {
        if(sourceDegree && sourceDegree.degree !== undefined) sourceDegree.degree++;
        if (edge.source !== edge.target && targetDegree && targetDegree.degree !== undefined) targetDegree.degree++;
        else if (edge.source === edge.target && sourceDegree && sourceDegree.degree !== undefined && newProperties.loops.find(l => l.id === edge.id)) sourceDegree.degree++;
      }
    });
    setGraphProperties(newProperties);
  }, [nodes, edges, isDirected]);

  const highlightPathOnGraph = useCallback((path: string[] | null) => {
    setRfNodesState(prev => prev.map(n => ({ ...n, style: path && path.includes(n.id) ? highlightedNodeStyle : defaultNodeStyle })));
    setRfEdgesState(prev => prev.map(e => {
      let isPathEdge = false;
      if (path) {
        for (let i = 0; i < path.length - 1; i++) {
          if ((e.source === path[i] && e.target === path[i+1]) || (!isDirected && e.target === path[i] && e.source === path[i+1])) {
            isPathEdge = true; break;
          }
        }
      }
      return { ...e, style: isPathEdge ? highlightedEdgeStyle : defaultEdgeStyle, animated: isPathEdge || (isDirected && e.source !== e.target && !isPathEdge) };
    }));
  }, [isDirected, setRfNodesState, setRfEdgesState, defaultNodeStyle, highlightedNodeStyle, defaultEdgeStyle, highlightedEdgeStyle]);

  const clearAllAlgorithmVisuals = useCallback(() => {
    setFoundPathBFS(null); setErrorBFS(null); setStartNodeBFS(''); setEndNodeBFS('');
    setFoundPathDFS(null); setErrorDFS(null); setStartNodeDFS(''); setEndNodeDFS('');
    setFoundPathDijkstra(null); setErrorDijkstra(null); setCostDijkstra(null); setStartNodeDijkstra(''); setEndNodeDijkstra('');
    highlightPathOnGraph(null);
    toast({ title: "Algorithm Visuals Cleared", description: "Path displays and graph highlights have been removed." });
  }, [highlightPathOnGraph, toast]);

  const handleAddEdge = () => {
    if (!newEdgeSource.trim() || !newEdgeTarget.trim()) {
      toast({ title: "Error Adding Edge", description: "Source and Target node IDs cannot be empty.", variant: "destructive" });
      return;
    }
    const weightValue = isWeighted ? parseFloat(newEdgeWeight) : undefined;
    if (isWeighted && (isNaN(weightValue!) || newEdgeWeight.trim() === '')) {
       toast({ title: "Error Adding Edge", description: "Please enter a valid weight for weighted graphs.", variant: "destructive" }); return;
    }
    const newEdge: Edge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      source: newEdgeSource.trim().toUpperCase(), target: newEdgeTarget.trim().toUpperCase(),
      ...(isWeighted && { weight: weightValue }),
    };
    setEdges(prevEdges => [...prevEdges, newEdge]);
    setNewEdgeSource(''); setNewEdgeTarget(''); setNewEdgeWeight('');
    toast({ title: "Edge Added", description: `Edge from ${newEdge.source} to ${newEdge.target} ${isWeighted && newEdge.weight !== undefined ? `(Weight: ${newEdge.weight})` : ''} added.` });
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(prevEdges => prevEdges.filter(edge => edge.id !== edgeId));
    toast({ title: "Edge Deleted", description: "The selected edge has been removed.", variant: "destructive" });
  };

  // BFS Pathfinding
  const findPathBFSLogic = (startId: string, endId: string): string[] | null => {
    if (!nodes.find(n => n.id === startId) || !nodes.find(n => n.id === endId)) return null;
    const queue: string[][] = [[startId]]; const visited = new Set<string>([startId]);
    while (queue.length > 0) {
      const currentPath = queue.shift()!; const currentNodeId = currentPath[currentPath.length - 1];
      if (currentNodeId === endId) return currentPath;
      const neighbors = edges.filter(edge => edge.source === currentNodeId).map(edge => edge.target)
        .concat(!isDirected ? edges.filter(edge => edge.target === currentNodeId).map(edge => edge.source) : []);
      const uniqueNeighbors = Array.from(new Set(neighbors));
      for (const neighborId of uniqueNeighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId); queue.push([...currentPath, neighborId]);
        }
      }
    }
    return null;
  };

  const handleFindPathBFS = () => {
    const start = startNodeBFS.trim().toUpperCase(); const end = endNodeBFS.trim().toUpperCase();
    clearAllAlgorithmVisuals(); 
    if (!start || !end) { setErrorBFS("Please enter both Start and End node IDs."); return; }
    if (!nodes.find(n => n.id === start) || !nodes.find(n => n.id === end)) { setErrorBFS("One or both specified nodes do not exist."); return; }
    setIsRunningBFS(true); setErrorBFS(null); setFoundPathBFS(null);
    setTimeout(() => {
      const path = findPathBFSLogic(start, end);
      if (path) { setFoundPathBFS(path); highlightPathOnGraph(path); toast({title: "BFS Path Found!", description: `Path from ${start} to ${end}: ${path.join(' → ')}`}); } 
      else { setErrorBFS(`No BFS path found from ${start} to ${end}.`); toast({title: "BFS Path Not Found", variant: "destructive"}); }
      setIsRunningBFS(false);
    }, 300);
  };

  // DFS Pathfinding
  const findPathDFSLogic = (startId: string, endId: string): string[] | null => {
    if (!nodes.find(n => n.id === startId) || !nodes.find(n => n.id === endId)) return null;
    const stack: { nodeId: string, path: string[] }[] = [{ nodeId: startId, path: [startId] }];
    const visitedInCurrentPath = new Set<string>(); 
    while (stack.length > 0) {
        const { nodeId, path } = stack.pop()!;
        if (nodeId === endId) return path;
        
        visitedInCurrentPath.add(nodeId);

        const neighbors = edges.filter(edge => edge.source === nodeId).map(edge => edge.target)
            .concat(!isDirected ? edges.filter(edge => edge.target === nodeId).map(edge => edge.source) : []);
        const uniqueNeighbors = Array.from(new Set(neighbors));

        for (const neighborId of uniqueNeighbors.reverse()) { 
            if (!path.includes(neighborId)) { 
                stack.push({ nodeId: neighborId, path: [...path, neighborId] });
            }
        }
    }
    return null;
  };

  const handleFindPathDFS = () => {
    const start = startNodeDFS.trim().toUpperCase(); const end = endNodeDFS.trim().toUpperCase();
    clearAllAlgorithmVisuals(); 
    if (!start || !end) { setErrorDFS("Please enter both Start and End node IDs."); return; }
    if (!nodes.find(n => n.id === start) || !nodes.find(n => n.id === end)) { setErrorDFS("One or both specified nodes do not exist."); return; }
    setIsRunningDFS(true); setErrorDFS(null); setFoundPathDFS(null);
    setTimeout(() => {
        const path = findPathDFSLogic(start, end);
        if (path) { setFoundPathDFS(path); highlightPathOnGraph(path); toast({title: "DFS Path Found!", description: `Path from ${start} to ${end}: ${path.join(' → ')}`}); } 
        else { setErrorDFS(`No DFS path found from ${start} to ${end}.`); toast({title: "DFS Path Not Found", variant: "destructive"}); }
        setIsRunningDFS(false);
    }, 300);
  };
  
  const findShortestPathDijkstraLogic = (startId: string, endId: string): { path: string[] | null, cost: number | null } => {
    if (!isWeighted) return { path: null, cost: null }; 
    const startNodeExists = nodes.some(n => n.id === startId);
    const endNodeExists = nodes.some(n => n.id === endId);
    if (!startNodeExists || !endNodeExists) return { path: null, cost: null };

    const distances: Record<string, number> = {};
    const predecessors: Record<string, string | null> = {};
    const pq: Set<string> = new Set(); 

    nodes.forEach(node => {
        distances[node.id] = Infinity;
        predecessors[node.id] = null;
        pq.add(node.id);
    });
    distances[startId] = 0;

    while (pq.size > 0) {
        let u: string | null = null;
        pq.forEach(nodeId => {
            if (u === null || distances[nodeId] < distances[u!]) { u = nodeId; }
        });
        if (u === null || distances[u] === Infinity) break; 
        pq.delete(u);
        if (u === endId) break; 

        edges.filter(edge => edge.source === u || (!isDirected && edge.target === u))
            .forEach(edge => {
                const v = edge.source === u ? edge.target : edge.source;
                const weight = edge.weight === undefined ? 1 : edge.weight; 
                if (weight < 0) throw new Error("Dijkstra's algorithm does not support negative edge weights.");
                const alt = distances[u!] + weight;
                if (alt < distances[v]) { distances[v] = alt; predecessors[v] = u; }
            });
    }
    if (distances[endId] === Infinity) return { path: null, cost: null }; 
    const path: string[] = []; let current: string | null = endId;
    while (current) { path.unshift(current); current = predecessors[current]; }
    return (path[0] === startId) ? { path, cost: distances[endId] } : { path: null, cost: null };
  };

  const handleFindShortestPathDijkstra = () => {
    const start = startNodeDijkstra.trim().toUpperCase(); const end = endNodeDijkstra.trim().toUpperCase();
    clearAllAlgorithmVisuals();
    if (!isWeighted) { setErrorDijkstra("Dijkstra's algorithm requires a weighted graph. Please enable weights."); return; }
    if (!start || !end) { setErrorDijkstra("Please enter both Start and End node IDs."); return; }
    if (!nodes.find(n => n.id === start) || !nodes.find(n => n.id === end)) { setErrorDijkstra("One or both specified nodes do not exist."); return; }
    setIsRunningDijkstra(true); setErrorDijkstra(null); setFoundPathDijkstra(null); setCostDijkstra(null);
    setTimeout(() => {
        try {
            const result = findShortestPathDijkstraLogic(start, end);
            if (result.path && result.cost !== null) {
                setFoundPathDijkstra(result.path); setCostDijkstra(result.cost); highlightPathOnGraph(result.path);
                toast({title: "Dijkstra's Path Found!", description: `Shortest path from ${start} to ${end} (Cost: ${result.cost}): ${result.path.join(' → ')}`});
            } else { setErrorDijkstra(`No path found from ${start} to ${end} using Dijkstra's algorithm.`); toast({title: "Dijkstra's Path Not Found", variant: "destructive"}); }
        } catch (e: any) { setErrorDijkstra(e.message || "An error occurred during Dijkstra's calculation."); toast({title: "Dijkstra's Error", description: e.message, variant: "destructive"}); }
        setIsRunningDijkstra(false);
    }, 300);
  };

  const handleAddNodeVisual = () => {
    const existingNodeIds = new Set(nodes.map(n => n.id));
    let newNodeId = '';
    let counter = nodes.length + 1;
    do {
        newNodeId = `N${counter}`;
        counter++;
    } while (existingNodeIds.has(newNodeId));
    const newNodeData: Node = { id: newNodeId, label: newNodeId };
    setNodes(prevNodes => [...prevNodes, newNodeData]);
    toast({ title: "Node Added", description: `Node ${newNodeId} added.` });
  };

  const onNodesDeleteFromVisual: OnNodesDelete = useCallback(
    (deletedRfNodes) => {
      if (deletedRfNodes.length > 0) {
        const deletedNodeIds = new Set(deletedRfNodes.map(n => n.id));
        setNodes(prevNodes => prevNodes.filter(node => !deletedNodeIds.has(node.id)));
        setEdges(prevEdges => prevEdges.filter(edge => !deletedNodeIds.has(edge.source) && !deletedNodeIds.has(edge.target)));
        toast({ title: "Node(s) Deleted", description: `${deletedRfNodes.length} node(s) and associated edges removed from the graph via visual editor.` });
      }
    },
    [setNodes, setEdges, toast]
  );

  const renderEdgeInputTable = () => (
    <Card className="h-full flex flex-col">
      <CardHeader><CardTitle className="text-lg">Edge List Editor</CardTitle><CardDescription>Define graph edges. Nodes are derived automatically. Use ALL CAPS for Node IDs.</CardDescription></CardHeader>
      <CardContent className="flex-grow overflow-auto space-y-4">
        <div className="space-y-2"><div className={`grid ${isWeighted ? 'grid-cols-3' : 'grid-cols-2'} gap-2 items-end`}><div><Label htmlFor="new-edge-source">Source Node</Label><Input id="new-edge-source" placeholder="e.g., A" value={newEdgeSource} onChange={e => setNewEdgeSource(e.target.value)} className="uppercase"/></div><div><Label htmlFor="new-edge-target">Target Node</Label><Input id="new-edge-target" placeholder="e.g., B" value={newEdgeTarget} onChange={e => setNewEdgeTarget(e.target.value)} className="uppercase"/></div>{isWeighted && (<div><Label htmlFor="new-edge-weight">Weight</Label><Input id="new-edge-weight" type="number" placeholder="e.g., 5" value={newEdgeWeight} onChange={e => setNewEdgeWeight(e.target.value)} /></div>)}</div><Button onClick={handleAddEdge} size="sm" className="w-full"><PlusCircle className="mr-2 h-4 w-4"/> Add Edge</Button></div>
        <div className="border rounded-md"><Table><TableHeader><TableRow><TableHead className="w-[30%]">Source</TableHead><TableHead className="w-[30%]">Target</TableHead>{isWeighted && <TableHead className="w-[20%]">Weight</TableHead>}<TableHead className="w-[20%] text-right">Action</TableHead></TableRow></TableHeader><TableBody>{edges.length === 0 && (<TableRow><TableCell colSpan={isWeighted ? 4 : 3} className="text-center text-muted-foreground h-24">No edges defined yet. Add edges using the form above.</TableCell></TableRow>)}{edges.map((edge) => (<TableRow key={edge.id}><TableCell>{edge.source}</TableCell><TableCell>{edge.target}</TableCell>{isWeighted && <TableCell>{edge.weight ?? 'N/A'}</TableCell>}<TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteEdge(edge.id)} aria-label="Delete edge"><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table></div>
         <div className="mt-4 text-sm"><p><span className="font-semibold">Nodes:</span> {nodes.map(n => n.label).join(', ') || 'None'}</p><p><span className="font-semibold">Edge Count:</span> {edges.length}</p></div>
      </CardContent>
    </Card>
  );

  const renderGraphVisualization = () => (
    <Card className="h-full flex flex-col">
      <CardHeader><CardTitle className="text-lg">Graph Visualization</CardTitle><CardDescription>Interactive graph visualization. Updates as you edit the edge list.</CardDescription></CardHeader>
      <CardContent className="flex-grow relative flex items-center justify-center bg-muted/30 rounded-md">
        <ReactFlow nodes={rfNodes} edges={rfEdges} onNodesChange={onRfNodesChange} onEdgesChange={onRfEdgesChange} fitView attributionPosition="bottom-right" className="bg-muted/30 rounded-md">
          <Controls /><MiniMap nodeStrokeWidth={3} zoomable pannable /><Background gap={16} color="hsl(var(--border))" />
        </ReactFlow>
      </CardContent>
    </Card>
  );

  const renderVisualEditorTab = () => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Visual Graph Editor</CardTitle>
            <CardDescription>Drag nodes, add new ones, or delete nodes. Edges are managed in the Grid Editor.</CardDescription>
          </div>
          <Button onClick={handleAddNodeVisual} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Node
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow relative flex items-center justify-center bg-muted/30 rounded-md min-h-[500px]">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onRfNodesChange}
          onEdgesChange={onRfEdgesChange}
          onNodesDelete={onNodesDeleteFromVisual}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          attributionPosition="bottom-right"
          className="bg-muted/30 rounded-md"
        >
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Background gap={16} color="hsl(var(--border))" />
          <Panel position="top-left" className="p-2 bg-card border rounded-md shadow">
             <p className="text-xs text-muted-foreground">Select nodes and press Delete/Backspace to remove.</p>
          </Panel>
        </ReactFlow>
      </CardContent>
      <CardFooter className="p-2 bg-secondary/30 border-t">
        <p className="text-xs text-muted-foreground">
          Nodes added here will appear in the Grid Editor. Edge creation/weight editing via Grid Editor.
        </p>
      </CardFooter>
    </Card>
  );


  const renderAdjacencyMatrix = () => (
    <Card className="h-full flex flex-col">
      <CardHeader><CardTitle className="text-lg">Adjacency Matrix</CardTitle><CardDescription>Rows/Cols: {nodes.map(n => n.label).join(', ')}</CardDescription></CardHeader>
      <CardContent className="flex-grow overflow-auto">{nodes.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-muted-foreground"><LayoutGrid className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>No nodes to build matrix.</p></div>) : (<Table><TableHeader><TableRow><TableHead className="min-w-[40px] sticky left-0 bg-card z-10"></TableHead>{nodes.map(node => <TableHead key={node.id} className="text-center min-w-[40px]">{node.label}</TableHead>)}</TableRow></TableHeader><TableBody>{nodes.map((rowNode, rowIndex) => (<TableRow key={rowNode.id}><TableHead className="font-semibold sticky left-0 bg-card z-10 min-w-[40px]">{rowNode.label}</TableHead>{nodes.map((colNode, colIndex) => (<TableCell key={colNode.id} className="text-center min-w-[40px]">{adjacencyMatrix[rowIndex]?.[colIndex] ?? 0}</TableCell>))}</TableRow>))}</TableBody></Table>)}</CardContent>
    </Card>
  );

  const renderIncidenceMatrix = () => (
    <Card className="h-full flex flex-col">
      <CardHeader><CardTitle className="text-lg">Incidence Matrix</CardTitle><CardDescription>Rows: Nodes ({nodes.map(n => n.label).join(', ')}), Cols: Edges (e1, e2,...)</CardDescription></CardHeader>
      <CardContent className="flex-grow overflow-auto">{nodes.length === 0 || edges.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-muted-foreground"><Sigma className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>Not enough nodes or edges to build matrix.</p></div>) : (<Table><TableHeader><TableRow><TableHead className="min-w-[40px] sticky left-0 bg-card z-10"></TableHead>{edges.map((edge, idx) => <TableHead key={edge.id} className="text-center min-w-[60px]">e{idx + 1}</TableHead>)}</TableRow></TableHeader><TableBody>{nodes.map((node, rowIndex) => (<TableRow key={node.id}><TableHead className="font-semibold sticky left-0 bg-card z-10 min-w-[40px]">{node.label}</TableHead>{edges.map((edge, colIndex) => (<TableCell key={edge.id} className="text-center min-w-[60px]">{incidenceMatrix[rowIndex]?.[colIndex] ?? 0}</TableCell>))}</TableRow>))}</TableBody></Table>)}</CardContent>
    </Card>
  );

  const renderGraphProperties = () => (
    <Card><CardHeader><CardTitle className="text-lg flex items-center"><Activity className="mr-2 h-5 w-5" />Graph Properties</CardTitle><CardDescription>Calculated properties of the current graph.</CardDescription></CardHeader>
      <CardContent className="space-y-3 text-sm"><p><span className="font-semibold">Graph Type:</span> {isDirected ? 'Directed' : 'Undirected'}, {isWeighted ? 'Weighted' : 'Unweighted'}</p><p><span className="font-semibold">Number of Vertices (Nodes):</span> {graphProperties.vertexCount}</p><p><span className="font-semibold">Number of Edges:</span> {graphProperties.edgeCount}</p><div><h4 className="font-semibold mb-1">Node Degrees:</h4>{nodes.length > 0 ? (<ul className="list-disc list-inside pl-4 space-y-1 text-xs max-h-40 overflow-y-auto">{nodes.map(node => (<li key={node.id}><span className="font-mono">{node.label}:</span>{isDirected ? ` In-degree: ${graphProperties.degrees[node.id]?.inDegree ?? 0}, Out-degree: ${graphProperties.degrees[node.id]?.outDegree ?? 0}` : ` Degree: ${graphProperties.degrees[node.id]?.degree ?? 0}`}</li>))}</ul>) : <p className="text-muted-foreground text-xs">No nodes defined.</p>}</div><div><h4 className="font-semibold mb-1">Loops:</h4>{graphProperties.loops.length > 0 ? (<ul className="list-disc list-inside pl-4 space-y-1 text-xs max-h-20 overflow-y-auto">{graphProperties.loops.map(loop => (<li key={loop.id}><span className="font-mono">{loop.source} &rarr; {loop.target}</span>{isWeighted && loop.weight !== undefined ? ` (Weight: ${loop.weight})` : ''}</li>))}</ul>) : <p className="text-muted-foreground text-xs">No loops detected.</p>}</div></CardContent>
    </Card>
  );

  const renderAlgorithmsTab = () => (
    <div className="space-y-6">
      <Button onClick={clearAllAlgorithmVisuals} variant="outline" className="w-full sm:w-auto"><Trash2 className="mr-2 h-4 w-4"/> Clear All Algorithm Results & Highlights</Button>
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center"><Waypoints className="mr-2 h-5 w-5 text-primary" />Breadth-First Search (BFS) Pathfinding</CardTitle><CardDescription>Finds the shortest path in terms of number of edges.</CardDescription></CardHeader>
        <CardContent className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label htmlFor="start-node-bfs">Start Node ID</Label><Input id="start-node-bfs" placeholder="e.g., A" value={startNodeBFS} onChange={e => setStartNodeBFS(e.target.value.toUpperCase())} className="uppercase"/></div><div><Label htmlFor="end-node-bfs">End Node ID</Label><Input id="end-node-bfs" placeholder="e.g., Z" value={endNodeBFS} onChange={e => setEndNodeBFS(e.target.value.toUpperCase())} className="uppercase"/></div></div>
          <Button onClick={handleFindPathBFS} disabled={isRunningBFS} className="w-full">{isRunningBFS ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Waypoints className="mr-2 h-4 w-4"/>}{isRunningBFS ? "Searching (BFS)..." : "Find Path (BFS)"}</Button>
          {errorBFS && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>BFS Error</AlertTitle><AlertDescUI>{errorBFS}</AlertDescUI></Alert>)}
          {foundPathBFS && !errorBFS && (<Alert variant="default" className="border-green-500"><Waypoints className="h-4 w-4 text-green-600" /><AlertTitle className="text-green-700">BFS Path Found!</AlertTitle><AlertDescUI className="font-mono text-sm">{foundPathBFS.join(' → ')}</AlertDescUI></Alert>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center"><SearchCheck className="mr-2 h-5 w-5 text-primary" />Depth-First Search (DFS) Pathfinding</CardTitle><CardDescription>Finds a path between two nodes (not necessarily the shortest).</CardDescription></CardHeader>
        <CardContent className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label htmlFor="start-node-dfs">Start Node ID</Label><Input id="start-node-dfs" placeholder="e.g., A" value={startNodeDFS} onChange={e => setStartNodeDFS(e.target.value.toUpperCase())} className="uppercase"/></div><div><Label htmlFor="end-node-dfs">End Node ID</Label><Input id="end-node-dfs" placeholder="e.g., Z" value={endNodeDFS} onChange={e => setEndNodeDFS(e.target.value.toUpperCase())} className="uppercase"/></div></div>
          <Button onClick={handleFindPathDFS} disabled={isRunningDFS} className="w-full">{isRunningDFS ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SearchCheck className="mr-2 h-4 w-4"/>}{isRunningDFS ? "Searching (DFS)..." : "Find Path (DFS)"}</Button>
          {errorDFS && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>DFS Error</AlertTitle><AlertDescUI>{errorDFS}</AlertDescUI></Alert>)}
          {foundPathDFS && !errorDFS && (<Alert variant="default" className="border-green-500"><SearchCheck className="h-4 w-4 text-green-600" /><AlertTitle className="text-green-700">DFS Path Found!</AlertTitle><AlertDescUI className="font-mono text-sm">{foundPathDFS.join(' → ')}</AlertDescUI></Alert>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center"><Route className="mr-2 h-5 w-5 text-primary" />Dijkstra's Shortest Path</CardTitle><CardDescription>Finds the shortest path in a weighted graph. Requires 'Weighted' graph type to be enabled.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {!isWeighted && <Alert variant="default" className="border-amber-500"><AlertTriangle className="h-4 w-4 text-amber-600"/><AlertTitle className="text-amber-700">Enable Weighted Graph</AlertTitle><AlertDescUI>Dijkstra's algorithm requires edge weights. Please enable 'Weighted' graph type in settings.</AlertDescUI></Alert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label htmlFor="start-node-dijkstra">Start Node ID</Label><Input id="start-node-dijkstra" placeholder="e.g., A" value={startNodeDijkstra} onChange={e => setStartNodeDijkstra(e.target.value.toUpperCase())} className="uppercase" disabled={!isWeighted}/></div><div><Label htmlFor="end-node-dijkstra">End Node ID</Label><Input id="end-node-dijkstra" placeholder="e.g., Z" value={endNodeDijkstra} onChange={e => setEndNodeDijkstra(e.target.value.toUpperCase())} className="uppercase" disabled={!isWeighted}/></div></div>
          <Button onClick={handleFindShortestPathDijkstra} disabled={isRunningDijkstra || !isWeighted} className="w-full">{isRunningDijkstra ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Route className="mr-2 h-4 w-4"/>}{isRunningDijkstra ? "Searching (Dijkstra)..." : "Find Shortest Path (Dijkstra)"}</Button>
          {errorDijkstra && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Dijkstra's Error</AlertTitle><AlertDescUI>{errorDijkstra}</AlertDescUI></Alert>)}
          {foundPathDijkstra && !errorDijkstra && (<Alert variant="default" className="border-green-500"><Route className="h-4 w-4 text-green-600" /><AlertTitle className="text-green-700">Dijkstra's Path Found!</AlertTitle><AlertDescUI className="font-mono text-sm">Path: {foundPathDijkstra.join(' → ')} <br/> Total Cost: {costDijkstra !== null ? costDijkstra.toFixed(2) : 'N/A'}</AlertDescUI></Alert>)}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Workstations</Link>
      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6"><CardTitle className="text-3xl font-bold flex items-center"><Share2 className="h-8 w-8 mr-3" />Graph Theory Explorer</CardTitle><CardDescription className="text-primary-foreground/90 text-lg">Interactively build graphs, visualize them, and explore their properties through matrices and algorithms.</CardDescription></CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-md bg-secondary/30"><div><Label className="block text-md font-semibold text-foreground mb-1">Graph Type</Label><Select value={isDirected ? "directed" : "undirected"} onValueChange={(val) => setIsDirected(val === "directed")}><SelectTrigger className="w-full"><SelectValue placeholder="Select graph directionality" /></SelectTrigger><SelectContent><SelectItem value="undirected">Undirected</SelectItem><SelectItem value="directed">Directed</SelectItem></SelectContent></Select></div><div><Label className="block text-md font-semibold text-foreground mb-1">Edge Weight</Label><Select value={isWeighted ? "weighted" : "unweighted"} onValueChange={(val) => { setIsWeighted(val === "weighted"); if (val === "unweighted") setNewEdgeWeight(''); }}><SelectTrigger className="w-full"><SelectValue placeholder="Select edge weight type" /></SelectTrigger><SelectContent><SelectItem value="unweighted">Unweighted</SelectItem><SelectItem value="weighted">Weighted</SelectItem></SelectContent></Select></div></div>
          <Tabs defaultValue="grid-editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 sticky top-[calc(var(--header-height,60px)+1px)] z-10 bg-card border-b"><TabsTrigger value="grid-editor" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"><LayoutGrid className="mr-2 h-5 w-5" /> Grid Editor</TabsTrigger><TabsTrigger value="canvas-editor" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"><MousePointerSquare className="mr-2 h-5 w-5" /> Visual Editor</TabsTrigger><TabsTrigger value="algorithms" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"><Settings2 className="mr-2 h-5 w-5" /> Algorithms</TabsTrigger><TabsTrigger value="properties" className="py-3 text-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"><BookOpen className="mr-2 h-5 w-5" /> Properties & Learn</TabsTrigger></TabsList>
            <TabsContent value="grid-editor" className="mt-4 min-h-[600px] space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full md:min-h-[calc(100vh-var(--header-height,60px)-250px)]"><div className="md:col-span-1 h-full min-h-[400px] md:min-h-0">{renderEdgeInputTable()}</div><div className="md:col-span-1 h-full min-h-[400px] md:min-h-0">{renderGraphVisualization()}</div><div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">{renderAdjacencyMatrix()}</div><div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">{renderIncidenceMatrix()}</div></div>{renderGraphProperties()}</TabsContent>
            <TabsContent value="canvas-editor" className="mt-4 min-h-[600px]">{renderVisualEditorTab()}</TabsContent>
            <TabsContent value="algorithms" className="mt-4 min-h-[600px]">{renderAlgorithmsTab()}</TabsContent>
            <TabsContent value="properties" className="mt-4 min-h-[600px]"><Card><CardHeader><CardTitle className="flex items-center"><BookOpen className="mr-2 h-6 w-6" /> Graph Theory Concepts & Learning</CardTitle><CardDescription>Explore fundamental concepts in graph theory.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm"><p className="text-base text-foreground/90 leading-relaxed">Graph theory is the study of graphs, which are mathematical structures used to model pairwise relations between objects. A graph in this context is made up of <em>vertices</em> (also called nodes or points) which are connected by <em>edges</em> (also called links or lines).</p><Accordion type="multiple" className="w-full"><AccordionItem value="item-1"><AccordionTrigger className="text-md font-semibold">What is a Graph?</AccordionTrigger><AccordionContent className="space-y-2 p-2"><p>A graph G = (V, E) consists of:</p><ul className="list-disc pl-5 space-y-1"><li><strong>V (Vertices):</strong> A finite set of points or nodes. These represent the objects in our model.</li><li><strong>E (Edges):</strong> A set of pairs of vertices, representing connections or relationships between them. An edge e = (u, v) connects vertex u to vertex v.</li></ul><p>Graphs are incredibly versatile and can represent many real-world scenarios, like social networks, road systems, computer networks, and molecular structures.</p></AccordionContent></AccordionItem><AccordionItem value="item-2"><AccordionTrigger className="text-md font-semibold">Types of Graphs</AccordionTrigger><AccordionContent className="space-y-2 p-2"><ul className="list-disc pl-5 space-y-1"><li><strong>Directed Graph (Digraph):</strong> Edges have a direction (e.g., a one-way street). An edge (u,v) is different from (v,u).</li><li><strong>Undirected Graph:</strong> Edges have no direction (e.g., a friendship connection). An edge (u,v) is the same as (v,u).</li><li><strong>Weighted Graph:</strong> Each edge has an associated numerical value, called a weight or cost (e.g., distance between cities).</li><li><strong>Unweighted Graph:</strong> Edges do not have weights, or all weights are implicitly 1.</li><li><strong>Simple Graph:</strong> An unweighted, undirected graph with no loops (edges connecting a vertex to itself) and no multiple edges between the same pair of vertices.</li><li><strong>Multigraph:</strong> Allows multiple edges between the same pair of vertices.</li><li><strong>Loop:</strong> An edge that connects a vertex to itself.</li></ul><p>This explorer allows you to specify if your graph is directed and/or weighted via the controls above the editor.</p></AccordionContent></AccordionItem><AccordionItem value="item-3"><AccordionTrigger className="text-md font-semibold">Degree of a Vertex</AccordionTrigger><AccordionContent className="space-y-2 p-2"><ul className="list-disc pl-5 space-y-1"><li><strong>Degree (Undirected):</strong> The number of edges incident to a vertex. A loop usually contributes 2 to the degree.</li><li><strong>In-degree (Directed):</strong> The number of edges pointing <em>into</em> a vertex.</li><li><strong>Out-degree (Directed):</strong> The number of edges pointing <em>out from*</em> a vertex.</li></ul><p>The sum of degrees in an undirected graph is always twice the number of edges (Handshaking Lemma).</p></AccordionContent></AccordionItem><AccordionItem value="item-4"><AccordionTrigger className="text-md font-semibold">Paths, Cycles, and Connectivity</AccordionTrigger><AccordionContent className="space-y-2 p-2"><ul className="list-disc pl-5 space-y-1"><li><strong>Path:</strong> A sequence of vertices where each adjacent pair in the sequence is connected by an edge.</li><li><strong>Simple Path:</strong> A path that does not revisit any vertex.</li><li><strong>Cycle:</strong> A path that starts and ends at the same vertex and does not revisit other vertices (except the start/end).</li><li><strong>Connected Graph (Undirected):</strong> There is a path between every pair of distinct vertices.</li><li><strong>Strongly Connected Graph (Directed):</strong> There is a directed path from u to v and from v to u for every pair of distinct vertices u, v.</li><li><strong>Connected Components:</strong> The maximal connected subgraphs of an undirected graph.</li></ul></AccordionContent></AccordionItem><AccordionItem value="item-5"><AccordionTrigger className="text-md font-semibold">Common Graph Representations</AccordionTrigger><AccordionContent className="space-y-2 p-2"><p>Graphs can be represented in several ways for computational purposes:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Adjacency Matrix:</strong> A |V| x |V| matrix where A[i][j] = 1 (or weight) if there is an edge from vertex i to vertex j, and 0 otherwise.</li><li><strong>Adjacency List:</strong> For each vertex, a list of its adjacent vertices. More space-efficient for sparse graphs.</li><li><strong>Incidence Matrix:</strong> A |V| x |E| matrix where M[v][e] = 1 if vertex v is an endpoint of edge e (or +1/-1 for directed graphs), and 0 otherwise.</li></ul><p>This explorer visualizes Adjacency and Incidence matrices for your graph in the "Grid Editor" tab.</p></AccordionContent></AccordionItem><AccordionItem value="item-6"><AccordionTrigger className="text-md font-semibold">Explore Further: Algorithms</AccordionTrigger><AccordionContent className="space-y-2 p-2"><p>Graph theory is fundamental to many algorithms, including:</p><ul className="list-disc pl-5 space-y-1"><li><strong>Graph Traversal:</strong> Depth-First Search (DFS), Breadth-First Search (BFS).</li><li><strong>Shortest Path Algorithms:</strong> Dijkstra's Algorithm, Bellman-Ford Algorithm, Floyd-Warshall Algorithm.</li><li><strong>Minimum Spanning Tree (MST):</strong> Prim's Algorithm, Kruskal's Algorithm.</li><li><strong>Network Flow:</strong> Max-Flow Min-Cut Theorem, Ford-Fulkerson Algorithm.</li><li><strong>Topological Sorting</strong> (for Directed Acyclic Graphs - DAGs).</li></ul><p>The "Algorithms" tab in this explorer provides implementations for some of these pathfinding algorithms!</p></AccordionContent></AccordionItem></Accordion></CardContent></Card></TabsContent>
          </Tabs>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end"><Button variant="outline" disabled><Download className="mr-2 h-5 w-5" /> Export Graph (Soon)</Button><Button variant="outline" disabled>Import Graph (Soon)</Button></div>
        </CardContent>
        <CardFooter className="p-6 bg-secondary/50 border-t"><p className="text-sm text-muted-foreground">Use the editors above to build your graph. More advanced features like algorithm visualization and saving graphs are coming soon.</p></CardFooter>
      </Card>
    </div>
  );
}

