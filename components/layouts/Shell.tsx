import { ReactNode } from 'react';

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {children}
      </main>
    </div>
  );
}
