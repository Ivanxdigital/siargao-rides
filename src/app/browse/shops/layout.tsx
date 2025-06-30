import type { Metadata } from 'next';
import { defaultShopsMetadata } from './metadata';

export const metadata: Metadata = defaultShopsMetadata;

export default function ShopsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}