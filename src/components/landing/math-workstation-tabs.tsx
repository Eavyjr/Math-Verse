
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calculator, Sigma, Ratio, BarChartHorizontalBig, Share2, Route, FunctionSquare, Grid3X3 } from 'lucide-react';

const workstations = [
  {
    value: "algebra",
    title: "Basic Algebra",
    icon: <Calculator className="mr-2 h-5 w-5" />,
    description: "Solve, simplify, and factor algebraic expressions with ease. Get step-by-step solutions and understand the fundamentals.",
    cta: "Explore Algebra",
    href: "/operations/algebra"
  },
  {
    value: "integration",
    title: "Integration",
    icon: <Sigma className="mr-2 h-5 w-5" />,
    description: "Compute definite and indefinite integrals. Visualize functions and explore various integration techniques.",
    cta: "Explore Integration",
    href: "/operations/integration"
  },
  {
    value: "differentiation",
    title: "Differentiation & DEs",
    icon: <Ratio className="mr-2 h-5 w-5" />,
    description: "Find derivatives, solve differential equations, understand their types, and see step-by-step solutions.",
    cta: "Explore Calculus",
    href: "/operations/differentiation"
  },
  {
    value: "matrix",
    title: "Matrix Operations",
    icon: <Grid3X3 className="mr-2 h-5 w-5" />, // Changed icon for Matrix
    description: "Perform a wide range of matrix operations, from basic arithmetic to complex decompositions. Visualize 2x2 matrices.",
    cta: "Explore Matrices",
    href: "/operations/matrix"
  },
  {
    value: "graph-theory",
    title: "Graph Theory",
    icon: <Share2 className="mr-2 h-5 w-5" />,
    description: "Interactively create, edit, and analyze graphs. Visualize algorithms like DFS, BFS, Dijkstra's, and more.",
    cta: "Explore Graph Theory",
    href: "/operations/graph-theory"
  },
  {
    value: "statistics",
    title: "Basic Statistics",
    icon: <BarChartHorizontalBig className="mr-2 h-5 w-5" />, // Changed icon for Statistics
    description: "Analyze data sets, calculate central tendencies, variance, and perform linear regression. Visualize with histograms and scatter plots.",
    cta: "Explore Statistics",
    href: "/operations/statistics"
  },
  {
    value: "graphing-calculator",
    title: "Graphing Calculator",
    icon: <FunctionSquare className="mr-2 h-5 w-5" />,
    description: "A full-featured Desmos graphing calculator for advanced plotting and exploration.",
    cta: "Open Calculator",
    href: "/operations/graphing-calculator"
  },
];

export default function MathWorkstationTabs() {
  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center mb-8 text-primary">
        Explore Our Math Workstations
      </h2>
      <Tabs defaultValue={workstations[0].value} className="w-full">
        <TabsList className="flex w-full overflow-x-auto items-center space-x-1 bg-transparent p-1 border-b no-scrollbar">
          {workstations.map((ws) => (
            <TabsTrigger
              key={ws.value}
              value={ws.value}
              className="py-3 px-4 flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg bg-card hover:bg-muted transition-all rounded-sm whitespace-nowrap"
            >
              {ws.icon} {ws.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {workstations.map((ws) => (
          <TabsContent key={ws.value} value={ws.value}>
            <Card className="shadow-xl border-t-4 border-primary mt-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  {ws.icon} {ws.title}
                </CardTitle>
                <CardDescription className="text-md pt-1">
                  {ws.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                  <Link href={ws.href}>
                    {ws.cta}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
