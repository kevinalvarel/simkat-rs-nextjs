'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginFormSchema } from '@/validations/LoginFormSchema';
import Image from 'next/image';
import { signIn } from '@/servers/login.service';
import { toast } from 'sonner';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Eye, EyeClosed } from 'lucide-react';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(values: LoginFormSchema) {
    setIsLoading(true);
    const { success, message } = await signIn(values.email, values.password);
    if (success) {
      toast.success(message as string);
      router.push('/dashboard');
    } else {
      toast.error(message as string);
      setIsLoading(false);
    }
  }

  const showPasswordHandler = () => {
    setShowPassword((prev) => !prev);
  };

  const form = useForm<LoginFormSchema>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <div className={cn('flex flex-col gap-6 ', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form onSubmit={form.handleSubmit(onSubmit)} className='p-6 md:p-8'>
            <FieldGroup>
              <div className='flex flex-col items-center gap-2 text-center'>
                <h1 className='text-2xl font-bold'>Selamat Datang</h1>
                <p className='text-balance text-muted-foreground'>
                  Masuk dengan akun kamu untuk mengakses dashboard SIMKAT
                </p>
              </div>
              <Controller
                control={form.control}
                name='email'
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor='email'>Email</FieldLabel>
                    <Input
                      {...field}
                      id='email'
                      type='email'
                      placeholder='m@example.com'
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name='password'
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor='password'>Password</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id='password'
                        type={showPassword ? 'text' : 'password'}
                      />
                      <InputGroupAddon
                        onClick={showPasswordHandler}
                        align={'inline-end'}
                        className='cursor-pointer'
                      >
                        {showPassword ? <Eye /> : <EyeClosed />}
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Field>
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Masuk'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className='relative hidden bg-muted md:block'>
            <Image
              src='/login.jpeg'
              alt='Image'
              height={500}
              width={500}
              className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className='px-6 text-center text-xs'>
        &copy; 2026 RSUD dr Slamet Garut. Managed by{' '}
        <a
          href='https://www.instagram.com/tradcoenergy/'
          rel='noopener noreferrer'
          target='_blank'
          className='underline'
        >
          Tradco Energy
        </a>
        .
      </FieldDescription>
    </div>
  );
}
