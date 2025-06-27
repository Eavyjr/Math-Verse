
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Cpu, Dna, Layers, Rocket, Sparkles, User, Telescope, GitBranch, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MathLogoIcon } from '@/components/icons/math-logo';

const BentoCard = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <Card className={cn(
    "bg-card/50 shadow-lg border border-border/50 rounded-xl flex flex-col justify-between",
    "transform-gpu transition-all duration-500 ease-in-out hover:shadow-2xl hover:-translate-y-1",
    "animate-in fade-in zoom-in-95",
    className
  )}>
    {children}
  </Card>
);

const TechIcon = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
  <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
    <Icon className="h-8 w-8" />
    <span className="text-xs font-medium">{label}</span>
  </div>
);

const NavigationStep = ({ icon: Icon, title, description, step }: { icon: React.ElementType, title: string, description: string, step: number }) => (
  <div className="flex items-start gap-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
      {step}
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-primary">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);


export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>
      
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          About MathVerse
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Fusing the precision of computation with the creativity of artificial intelligence to redefine mathematical exploration.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <BentoCard className="md:col-span-2 md:row-span-2 p-6 [animation-delay:100ms]">
          <CardHeader>
            <Dna className="h-10 w-10 text-accent mb-4" />
            <CardTitle className="text-3xl font-bold">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-md md:text-lg text-foreground/80 space-y-4">
            <p>
              MathVerse was born from a simple yet powerful idea: to make mathematics more accessible, intuitive, and engaging for everyone. We believe that the right tools can transform complex challenges into exciting discoveries.
            </p>
            <p>
              Our mission is to build a comprehensive universe of mathematical tools that not only provide answers but also illuminate the 'how' and 'why' behind them. By integrating cutting-edge AI with robust computational engines and interactive visualizations, we aim to empower students, educators, and professionals alike to explore, learn, and create with confidence.
            </p>
          </CardContent>
        </BentoCard>

        <BentoCard className="p-4 [animation-delay:200ms]">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Cpu className="h-6 w-6 text-accent"/>Technology Core</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around items-center h-full">
            <TechIcon icon={Layers} label="Next.js" />
            <TechIcon icon={Sparkles} label="Genkit" />
            <TechIcon icon={Rocket} label="Vercel" />
          </CardContent>
        </BentoCard>
        
        <BentoCard className="p-4 [animation-delay:300ms]">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><User className="h-6 w-6 text-accent"/>The Creator</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full gap-3">
             <Avatar className="h-16 w-16">
                <AvatarImage src="https://github.com/Eavyjr.png" alt="@Eavyjr" />
                <AvatarFallback>E</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold">Eavy</h3>
            <Button asChild variant="outline" size="sm">
                <Link href="https://github.com/Eavyjr" target="_blank" rel="noopener noreferrer">
                    <GitBranch className="mr-2 h-4 w-4"/>
                    GitHub
                </Link>
            </Button>
          </CardContent>
        </BentoCard>

        <BentoCard className="md:col-span-3 p-6 [animation-delay:400ms]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2"><Telescope className="h-8 w-8 text-accent"/>Future Vision</CardTitle>
            <CardDescription>What's next for MathVerse?</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                <li><span className="font-semibold text-foreground">Advanced AI Collaboration:</span> Introducing AI agents that can work alongside you on multi-step problems.</li>
                <li><span className="font-semibold text-foreground">Personalized Learning Paths:</span> AI-curated exercises and content based on your progress and learning style.</li>
                <li><span className="font-semibold text-foreground">Community & Collaboration:</span> Share your work, collaborate on projects, and build a community of math enthusiasts.</li>
                <li><span className="font-semibold text-foreground">More Workstations:</span> Expanding our toolkit to cover even more advanced topics like number theory, abstract algebra, and quantum computing concepts.</li>
            </ul>
          </CardContent>
        </BentoCard>
        
      </div>
    </div>
  );
}
