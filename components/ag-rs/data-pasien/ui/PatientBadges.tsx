import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: string }) {
  if (status === 'AKTIF') {
    return (
      <Badge className='bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer'>
        Aktif
      </Badge>
    );
  }
  if (status === 'PULANG') {
    return (
      <Badge variant='outline' className='bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 cursor-pointer'>
        Pulang
      </Badge>
    );
  }
  return (
    <Badge variant='secondary' className='capitalize cursor-pointer'>
      {status.toLowerCase().replace(/_/g, ' ')}
    </Badge>
  );
}

export function NpoBadge({ isNpo }: { isNpo: boolean }) {
  if (isNpo) {
    return (
      <Badge className='bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-100 cursor-pointer'>
        NPO
      </Badge>
    );
  }
  return (
    <span className='text-muted-foreground text-sm hover:text-foreground cursor-pointer transition-colors'>
      Normal
    </span>
  );
}
