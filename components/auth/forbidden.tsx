'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ForbiddenProps {
  currentUserRole?: string | null;
  requiredRole?: string;
}

export function Forbidden({ currentUserRole = 'guest', requiredRole = 'admin' }: ForbiddenProps) {
  // Translate roles to user-friendly names
  const getRoleDisplayName = (roleName?: string | null) => {
    if (!roleName) return 'Tamu';
    const formatted = roleName.toLowerCase();
    if (formatted.includes('admin')) return 'Administrator';
    if (formatted.includes('katering')) return 'Ahli Gizi Katering';
    if (formatted.includes('rs')) return 'Ahli Gizi Rumah Sakit';
    return roleName.toUpperCase();
  };

  const userRoleDisplay = getRoleDisplayName(currentUserRole);
  const requiredRoleDisplay = getRoleDisplayName(requiredRole);

  // Determine redirect url based on role
  const getDashboardUrl = () => {
    if (currentUserRole === 'gizi-rs') return '/dashboard/ag-rs';
    return '/dashboard/ag-katering/overview';
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <Card className="w-full max-w-md overflow-hidden border border-red-500/25 shadow-lg bg-background/60 backdrop-blur-md">
        {/* Decorative Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />
        
        <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
          {/* Pulsing Alert Icon */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
            <div className="absolute inset-0 rounded-full border border-red-500/30 scale-110 animate-ping opacity-25" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
              403 Forbidden
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Akses Ditolak / Unauthorized
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              Halaman ini merupakan area terproteksi dan hanya dapat diakses oleh pengguna dengan kewenangan khusus.
            </p>
          </div>

          {/* Role Status Panel */}
          <div className="w-full bg-muted/40 border rounded-xl p-4 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between border-b pb-2 border-border/60">
              <span className="text-muted-foreground font-medium">Role Anda:</span>
              <span className="font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200">
                {userRoleDisplay}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Role yang dibutuhkan:</span>
              <span className="font-bold px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200">
                {requiredRoleDisplay}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="bg-red-500/5 dark:bg-red-950/10 border border-red-500/10 rounded-lg p-3 text-[11px] leading-relaxed text-red-800 dark:text-red-300 w-full">
            Maaf, akun Anda ({userRoleDisplay}) tidak memiliki izin untuk mengakses modul ini. Tindakan ini memerlukan hak akses {requiredRoleDisplay}.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 text-xs h-10 shadow-sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </Button>
            
            <Link
              href={getDashboardUrl()}
              className={cn(
                buttonVariants({ variant: 'default' }),
                "flex-1 gap-2 text-xs h-10 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center rounded-lg"
              )}
            >
              <Home className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
