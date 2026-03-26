import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Home } from '@/views/Home';
import { Backlog } from '@/views/Backlog';
import { Pipeline } from '@/views/Pipeline';
import { Completed } from '@/views/Completed';
import { Analytics } from '@/views/Analytics';

function Layout() {
  return (
    <div className="min-h-screen bg-bg-base">
      <Navigation />
      <main className="md:ml-64 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
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
