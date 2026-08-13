'use client';

import React from 'react';
import type { UserStats } from '@/servers/user.service';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Utensils, Building2, ShieldCheck } from 'lucide-react';

interface UserStatsGridProps {
  stats: UserStats;
}

export function UserStatsGrid({ stats }: UserStatsGridProps) {
  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 w-full'>
      {/* Total Users */}
      <Card className='border shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-muted-foreground'>Total Pengguna</p>
            <h3 className='text-2xl font-extrabold tracking-tight'>{stats.totalUsers}</h3>
          </div>
          <div className='p-3 bg-primary/10 rounded-xl text-primary'>
            <Users className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Gizi Katering */}
      <Card className='border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-emerald-700 dark:text-emerald-400'>Gizi Katering</p>
            <h3 className='text-2xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-300'>
              {stats.giziKateringCount}
            </h3>
          </div>
          <div className='p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400'>
            <Utensils className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Gizi RS */}
      <Card className='border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-blue-700 dark:text-blue-400'>Gizi RS</p>
            <h3 className='text-2xl font-extrabold tracking-tight text-blue-800 dark:text-blue-300'>
              {stats.giziRsCount}
            </h3>
          </div>
          <div className='p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400'>
            <Building2 className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Supervisor */}
      <Card className='border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-purple-700 dark:text-purple-400'>Supervisor</p>
            <h3 className='text-2xl font-extrabold tracking-tight text-purple-800 dark:text-purple-300'>
              {stats.supervisorCount}
            </h3>
          </div>
          <div className='p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400'>
            <ShieldCheck className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
