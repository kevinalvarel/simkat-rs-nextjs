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
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator
            orientation='vertical'
            className='mr-2 data-vertical:h-4 data-vertical:self-auto'
          />
          <h2 className='text-[clamp(12px, 1rem, 20px)] font-semibold'>
            Dashboard - Ahli Gizi Katering
          </h2>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
