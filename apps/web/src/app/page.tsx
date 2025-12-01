'use client';

import DashboardPage from '@/components/pages/DashboardPage';

export default function Home() {
  // No auth gate - everyone can access
  return <DashboardPage />;
}
