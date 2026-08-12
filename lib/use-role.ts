'use client';
import { useSession } from '@/lib/auth-client';

export function useRole() {
  const { data: session, isPending } = useSession();

  const role = session?.user.role ?? null;

  return {
    role,
    isPending,
  };
}
