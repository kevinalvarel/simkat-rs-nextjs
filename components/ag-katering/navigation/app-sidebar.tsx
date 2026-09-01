'use client';
import * as React from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  routeDataProduksi,
  routeDataSupervisor,
} from '@/components/ag-katering/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRole } from '@/lib/use-role';
import Image from 'next/image';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { role } = useRole();
  const routeData =
    role === 'supervisor' ? routeDataSupervisor : routeDataProduksi;

  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              render={<Link href='/dashboard/ag-katering/overview/produksi' />}
            >
              <div className='flex flex-row items-center gap-2'>
                <Image
                  src='/logo-rsud.webp'
                  alt='Logo'
                  width={50}
                  height={50}
                />
                <div className='flex flex-col gap-0.5 leading-none'>
                  <span className='font-medium text-xl'>SIMKAT</span>
                  <span className='text-xs text-muted-foreground'>
                    Ahli Gizi Katering
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {routeData.navMain.map((item) => (
              <Collapsible
                key={item.title}
                defaultOpen
                className='group/collapsible'
              >
                <SidebarMenuItem>
                  <SidebarMenuButton render={<CollapsibleTrigger />}>
                    {item.title}{' '}
                    <PlusIcon className='ml-auto group-aria-expanded/menu-button:hidden' />
                    <MinusIcon className='ml-auto hidden group-aria-expanded/menu-button:block' />
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              isActive={pathname === subItem.url}
                              render={<Link href={subItem.url} />}
                            >
                              {subItem.title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
