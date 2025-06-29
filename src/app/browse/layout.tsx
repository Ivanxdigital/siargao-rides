import type { Metadata } from 'next';
import { defaultBrowseMetadata } from './metadata';

export const metadata: Metadata = defaultBrowseMetadata;

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}