import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ag-katering/navigation/app-sidebar';
import { LogoutButton } from '@/components/auth/logout-button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ahli Gizi Katering - Dashboard',
  description: 'Ahli Gizi Katering',
};

export default function AhliGiziKateringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center justify-between border-b px-4'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator
              orientation='vertical'
              className='mr-2 data-vertical:h-4 data-vertical:self-auto'
            />
            <h2 className='text-[clamp(12px, 1rem, 20px)] font-semibold'>
              Dashboard - Ahli Gizi Katering
            </h2>
          </div>
          <LogoutButton variant='outline' size='sm' />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
