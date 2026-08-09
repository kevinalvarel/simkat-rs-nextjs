import { z } from 'zod';

export const LoginFormSchema = z.object({
  email: z.email('Email dibutuhkan'),
  password: z.string().min(1, 'Password dibutuhkan'),
});

export type LoginFormSchema = z.infer<typeof LoginFormSchema>;
