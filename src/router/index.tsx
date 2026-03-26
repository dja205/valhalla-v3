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
      {/* Main content: sidebar width varies, so use min-width */}
      <main className="md:ml-48 lg:ml-56 pb-16 md:pb-0 min-h-screen">
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
