import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ahli Gizi RS - Dashboard',
  description: 'Ahli Gizi RS',
};

export default function AhliGiziRSLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
