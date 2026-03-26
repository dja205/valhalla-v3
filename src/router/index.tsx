import { createBrowserRouter, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

const Home = lazy(() => import('@/views/Home').then(m => ({ default: m.Home })));
const Backlog = lazy(() => import('@/views/Backlog').then(m => ({ default: m.Backlog })));
const Pipeline = lazy(() => import('@/views/Pipeline').then(m => ({ default: m.Pipeline })));
const Completed = lazy(() => import('@/views/Completed').then(m => ({ default: m.Completed })));
const Analytics = lazy(() => import('@/views/Analytics').then(m => ({ default: m.Analytics })));

function Layout() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg-base">
        <Navigation />
        {/* Main content: sidebar width varies, so use min-width */}
        <main className="md:ml-48 lg:ml-56 pb-16 md:pb-0 min-h-screen">
          <Suspense fallback={<SkeletonCard variant="stage" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'backlog', element: <Backlog /> },
      { path: 'pipeline', element: <Pipeline /> },
      { path: 'completed', element: <Completed /> },
      { path: 'analytics', element: <Analytics /> },
    ],
  },
]);
