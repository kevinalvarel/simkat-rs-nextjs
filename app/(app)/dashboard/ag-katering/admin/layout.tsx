import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Forbidden } from '@/components/auth/forbidden';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/');
  }

  if (session.user.role !== 'supervisor') {
    return (
      <Forbidden
        currentUserRole={session.user.role}
        requiredRole='supervisor'
      />
    );
  }

  return <>{children}</>;
}
