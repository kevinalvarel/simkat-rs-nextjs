'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Shield, User, Mail, Loader2, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { signOutAction } from '@/servers/login.service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  showLabel?: boolean;
}

export function LogoutButton({
  className,
  variant = 'destructive',
  size = 'sm',
  showLabel = true,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: sessionData, isPending } = authClient.useSession();

  const user = sessionData?.user;
  const role = user?.role;

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      // Call the server action to sign out and redirect
      await signOutAction();
      toast.success('Berhasil keluar dari sistem');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback client-side signout if server action fails or behaves unexpectedly
      try {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/');
              toast.success('Berhasil keluar dari sistem');
            },
          },
        });
      } catch (err) {
        toast.error('Gagal keluar dari sistem. Silakan coba lagi.');
      }
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  }

  // Map roles to nice display names and colors
  function getRoleBadge(roleName?: string | null) {
    if (!roleName) return { label: 'Tamu / Guest', style: 'bg-muted text-muted-foreground' };
    
    const formatted = roleName.toLowerCase();
    if (formatted.includes('admin')) {
      return { label: 'Administrator', style: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200' };
    }
    if (formatted.includes('katering') || formatted.includes('catering')) {
      return { label: 'Ahli Gizi Katering', style: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200' };
    }
    if (formatted.includes('rs') || formatted.includes('rumah_sakit') || formatted.includes('hospital')) {
      return { label: 'Ahli Gizi Rumah Sakit', style: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200' };
    }
    
    // Default fallback
    return {
      label: roleName.toUpperCase().replace('_', ' '),
      style: 'bg-primary/10 text-primary border-primary/20'
    };
  }

  const roleInfo = getRoleBadge(role);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant={variant}
            size={size}
            className={className}
            title="Keluar dari akun"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {showLabel && <span>Keluar</span>}
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="gap-1 border-b pb-4">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Konfirmasi Keluar
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Apakah Anda yakin ingin keluar dari sesi aplikasi saat ini?
          </DialogDescription>
        </DialogHeader>

        {/* User Session Detail */}
        <div className="py-4 space-y-3.5">
          <div className="bg-muted/40 p-4 rounded-xl border space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Informasi Sesi Aktif
            </p>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground/80">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground">{user?.name || 'Memuat nama...'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-foreground/80">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-muted-foreground">{user?.email || 'Memuat email...'}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground mr-1">Role saat ini:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleInfo.style}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isLoggingOut}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-1.5"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mengeluarkan...
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Keluar Aplikasi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
