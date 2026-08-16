import { LogoutButton } from '@/components/auth/logout-button';

export default function Navbar() {
  return (
    <header className='flex justify-between items-center w-full bg-primary text-primary-foreground shadow-lg sticky top-0 z-50 py-4 px-8'>
      <h1 className='font-bold text-lg tracking-wide'>Halo Ahli Gizi RS</h1>
      <LogoutButton variant='secondary' size='sm' className='text-primary bg-primary-foreground hover:bg-primary-foreground/90 hover:text-primary transition-all duration-200 shadow-xs' />
    </header>
  );
}
