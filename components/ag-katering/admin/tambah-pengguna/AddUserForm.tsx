'use client';

import React, { useState } from 'react';
import type { UserRole } from '@/servers/user.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, User as UserIcon, Mail, Lock, Eye, EyeOff, Utensils, Building2, ShieldCheck, Loader2 } from 'lucide-react';

interface AddUserFormProps {
  name: string;
  email: string;
  password: string;
  selectedRole: UserRole;
  isSubmitting: boolean;
  onNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onRoleChange: (role: UserRole) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddUserForm({
  name,
  email,
  password,
  selectedRole,
  isSubmitting,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onRoleChange,
  onSubmit,
}: AddUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className='lg:col-span-5 border shadow-sm rounded-2xl overflow-hidden'>
      <CardHeader className='bg-muted/40 border-b pb-4'>
        <CardTitle className='text-base font-bold flex items-center gap-2'>
          <UserPlus className='w-4 h-4 text-primary' />
          Form Tambah Akun Pengguna
        </CardTitle>
        <CardDescription className='text-xs'>
          Daftarkan akun pengguna baru untuk tim Ahli Gizi Katering atau Ahli Gizi RS.
        </CardDescription>
      </CardHeader>

      <CardContent className='p-5 space-y-4'>
        <form onSubmit={onSubmit} className='space-y-4'>
          {/* Nama Pengguna */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
              <UserIcon className='w-3.5 h-3.5 text-muted-foreground' />
              Nama Lengkap <span className='text-destructive'>*</span>
            </label>
            <Input
              type='text'
              placeholder='cth: Dr. Anita Rahmawati'
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className='h-9 text-sm'
              required
            />
          </div>

          {/* Email */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
              <Mail className='w-3.5 h-3.5 text-muted-foreground' />
              Email Akses <span className='text-destructive'>*</span>
            </label>
            <Input
              type='email'
              placeholder='cth: anita.gizi@katering.rs.id'
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className='h-9 text-sm'
              required
            />
          </div>

          {/* Password */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
              <Lock className='w-3.5 h-3.5 text-muted-foreground' />
              Password <span className='text-destructive'>*</span>
            </label>
            <div className='relative'>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Minimal 6 karakter'
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                className='h-9 text-sm pr-9'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
              >
                {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
              </button>
            </div>
          </div>

          {/* Select Role */}
          <div className='space-y-2 pt-1'>
            <label className='text-xs font-semibold text-foreground block'>
              Pilih Role Pengguna <span className='text-destructive'>*</span>
            </label>

            <div className='grid grid-cols-1 gap-2'>
              {/* Role Option: gizi-katering */}
              <label
                onClick={() => onRoleChange('gizi-katering')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedRole === 'gizi-katering'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <input
                  type='radio'
                  name='userRole'
                  checked={selectedRole === 'gizi-katering'}
                  onChange={() => onRoleChange('gizi-katering')}
                  className='sr-only'
                />
                <div className='p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0'>
                  <Utensils className='w-4 h-4' />
                </div>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-1.5'>
                    <span className='font-bold text-xs text-foreground'>
                      Ahli Gizi Katering
                    </span>
                    <Badge variant='outline' className='text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20'>
                      Utama
                    </Badge>
                  </div>
                  <p className='text-[11px] text-muted-foreground leading-tight'>
                    Akses modul overview produksi, pemorsian, status snapshot, & tabulasi katering.
                  </p>
                </div>
              </label>

              {/* Role Option: gizi-rs */}
              <label
                onClick={() => onRoleChange('gizi-rs')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedRole === 'gizi-rs'
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <input
                  type='radio'
                  name='userRole'
                  checked={selectedRole === 'gizi-rs'}
                  onChange={() => onRoleChange('gizi-rs')}
                  className='sr-only'
                />
                <div className='p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0'>
                  <Building2 className='w-4 h-4' />
                </div>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-1.5'>
                    <span className='font-bold text-xs text-foreground'>
                      Ahli Gizi RS
                    </span>
                    <Badge variant='outline' className='text-[10px] bg-blue-500/10 text-blue-700 border-blue-500/20'>
                      Utama
                    </Badge>
                  </div>
                  <p className='text-[11px] text-muted-foreground leading-tight'>
                    Akses input data pasien rawat inap, diet, bed, & pengajuan revisi diet RS.
                  </p>
                </div>
              </label>

              {/* Role Option: supervisor */}
              <label
                onClick={() => onRoleChange('supervisor')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedRole === 'supervisor'
                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <input
                  type='radio'
                  name='userRole'
                  checked={selectedRole === 'supervisor'}
                  onChange={() => onRoleChange('supervisor')}
                  className='sr-only'
                />
                <div className='p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0'>
                  <ShieldCheck className='w-4 h-4' />
                </div>
                <div className='space-y-0.5'>
                  <span className='font-bold text-xs text-foreground block'>
                    Supervisor / Admin
                  </span>
                  <p className='text-[11px] text-muted-foreground leading-tight'>
                    Akses penuh ke semua halaman admin, otorisasi revisi, & tambah pengguna.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type='submit'
            disabled={isSubmitting}
            className='w-full gap-2 mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Mendaftarkan...
              </>
            ) : (
              <>
                <UserPlus className='w-4 h-4' />
                Buat Akun Pengguna
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
