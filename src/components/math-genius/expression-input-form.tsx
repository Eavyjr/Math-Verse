'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { handleClassifyExpressionAction } from '@/app/actions';
import type { ClassifyExpressionOutput } from '@/ai/flows/classify-expression';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  expression: z.string().min(1, 'Expression cannot be empty.'),
});
type FormData = z.infer<typeof formSchema>;

interface ExpressionInputFormProps {
  onResult: (data: ClassifyExpressionOutput) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function ExpressionInputForm({ onResult, onError, onLoading, isLoading }: ExpressionInputFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { expression: '' },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    onLoading(true);
    // Clear previous error/result before new submission
    onError(''); 
    const result = await handleClassifyExpressionAction(data.expression);
    if (result.error) {
      onError(result.error);
      onResult(null as any); // Clear previous result on error
    } else if (result.data) {
      onResult(result.data);
      onError(''); // Clear previous error on success
    }
    onLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-primary">Math Expression Analyzer</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="expression"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md font-medium">Enter Mathematical Expression</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., x^2 + 2x + 1, dy/dx = 2y, integrate(sin(x), x)"
                      className="min-h-[120px] text-base focus:ring-accent focus:border-accent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Classify & Suggest Solution'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
