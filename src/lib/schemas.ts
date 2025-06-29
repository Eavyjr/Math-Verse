
import { z } from 'zod';

export const signUpSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name cannot be empty.').max(50, 'Full name must be 50 characters or less.'),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
