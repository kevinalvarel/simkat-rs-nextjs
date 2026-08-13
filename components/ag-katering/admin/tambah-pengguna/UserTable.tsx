'use client';

import React from 'react';
import type { UserRecord, UserRole } from '@/servers/user.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Search, MoreHorizontal, Pencil, Trash2, ShieldCheck, Building2, Utensils } from 'lucide-react';

interface UserTableProps {
  users: UserRecord[];
  filteredUsers: UserRecord[];
  searchQuery: string;
  roleFilter: string;
  onSearchChange: (query: string) => void;
  onRoleFilterChange: (role: string) => void;
  onEditUser: (user: UserRecord) => void;
  onDeleteUser: (user: UserRecord) => void;
}

export function renderRoleBadge(role: string | null) {
  switch (role) {
    case 'supervisor':
      return (
        <Badge className='bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1 font-semibold'>
          <ShieldCheck className='w-3 h-3 text-purple-600' />
          Supervisor
        </Badge>
      );
    case 'gizi-rs':
      return (
        <Badge className='bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1 font-semibold'>
          <Building2 className='w-3 h-3 text-blue-500' />
          Ahli Gizi RS
        </Badge>
      );
    case 'gizi-katering':
    default:
      return (
        <Badge className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 font-semibold'>
          <Utensils className='w-3 h-3 text-emerald-500' />
          Ahli Gizi Katering
        </Badge>
      );
  }
}

export function UserTable({
  users,
  filteredUsers,
  searchQuery,
  roleFilter,
  onSearchChange,
  onRoleFilterChange,
  onEditUser,
  onDeleteUser,
}: UserTableProps) {
  return (
    <Card className='lg:col-span-7 border shadow-sm rounded-2xl overflow-hidden'>
      <CardHeader className='bg-muted/40 border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <CardTitle className='text-base font-bold flex items-center gap-2'>
            <Users className='w-4 h-4 text-primary' />
            Daftar Akun Terdaftar
          </CardTitle>
          <CardDescription className='text-xs'>
            Menampilkan total {users.length} akun pengguna aktif dalam sistem.
          </CardDescription>
        </div>

        {/* Filter Tabs */}
        <div className='flex items-center gap-1 bg-background border rounded-lg p-1 text-xs'>
          <button
            type='button'
            onClick={() => onRoleFilterChange('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              roleFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Semua
          </button>
          <button
            type='button'
            onClick={() => onRoleFilterChange('gizi-katering')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              roleFilter === 'gizi-katering'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Katering
          </button>
          <button
            type='button'
            onClick={() => onRoleFilterChange('gizi-rs')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              roleFilter === 'gizi-rs'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gizi RS
          </button>
          <button
            type='button'
            onClick={() => onRoleFilterChange('supervisor')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              roleFilter === 'supervisor'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Supervisor
          </button>
        </div>
      </CardHeader>

      <CardContent className='p-4 space-y-4'>
        {/* Search Input */}
        <div className='relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Cari nama atau email pengguna...'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className='pl-9 h-9 text-xs'
          />
        </div>

        {/* Table */}
        <div className='rounded-lg border overflow-hidden'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='font-semibold text-xs'>Pengguna</TableHead>
                  <TableHead className='font-semibold text-xs'>Role</TableHead>
                  <TableHead className='font-semibold text-xs'>Tanggal Dibuat</TableHead>
                  <TableHead className='font-semibold text-xs text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center py-8 text-muted-foreground text-xs'>
                      Tidak ada pengguna yang sesuai dengan kriteria pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id} className='hover:bg-muted/30 transition-colors'>
                      <TableCell className='py-3'>
                        <div className='space-y-0.5'>
                          <div className='font-bold text-xs text-foreground flex items-center gap-1.5'>
                            {u.name}
                          </div>
                          <div className='text-[11px] text-muted-foreground font-mono'>
                            {u.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='py-3'>{renderRoleBadge(u.role)}</TableCell>
                      <TableCell className='py-3 text-xs text-muted-foreground font-mono'>
                        {new Date(u.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className='py-3 text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
                                <MoreHorizontal className='h-4 w-4' />
                                <span className='sr-only'>Aksi</span>
                              </Button>
                            }
                          />
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => onEditUser(u)}>
                              <Pencil className='mr-2 h-4 w-4' />
                              Ubah Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteUser(u)}
                              className='text-destructive focus:text-destructive'
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Hapus Akun
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
