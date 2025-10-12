import Link from 'next/link';
import { Home } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
        <span className="text-lg font-black text-primary-foreground">IS</span>
      </div>
      <span className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-headline">
        InmoSmart
      </span>
    </Link>
  );
}
