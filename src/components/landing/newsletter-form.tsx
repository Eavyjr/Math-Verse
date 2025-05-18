
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const newsletterSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});
type NewsletterFormData = z.infer<typeof newsletterSchema>;

export default function NewsletterForm({ variant = "card" }: { variant?: "card" | "inline" }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });

  const onSubmit: SubmitHandler<NewsletterFormData> = async (data) => {
    setIsLoading(true);
    console.log('Newsletter subscription:', data.email);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Subscribed!',
      description: `Thank you for subscribing with ${data.email}.`,
    });
    form.reset();
    setIsLoading(false);
  };

  if (variant === "inline") {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2 items-end w-full max-w-md">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-grow w-full sm:w-auto">
                <FormLabel className="sr-only">Email for newsletter</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your.email@example.com" {...field} className="bg-background/70"/>
                </FormControl>
                <FormMessage className="text-xs px-1" />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Mail className="h-6 w-6 text-accent" />
          Stay Updated!
        </CardTitle>
        <CardDescription>
          Subscribe to our newsletter for the latest MathVerse features, tips, and mathematical insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Subscribing...' : 'Subscribe to Newsletter'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
