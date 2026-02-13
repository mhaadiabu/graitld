'use client';

import { Unauthenticated } from 'convex/react';
import type { ReactNode } from 'react';

export function AuthLayoutClient({ children }: { children: ReactNode }) {
  return (
    <Unauthenticated>
      <main>{children}</main>
    </Unauthenticated>
  );
}
