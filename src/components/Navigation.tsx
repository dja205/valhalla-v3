import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/backlog', label: 'Backlog', icon: '📋' },
  { path: '/pipeline', label: 'Pipeline', icon: '🔄' },
  { path: '/completed', label: 'Completed', icon: '✅' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
];

export function Navigation() {
  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-bg-raised z-30">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 text-xs transition-colors ${
                  isActive ? 'text-accent-amber' : 'text-text-muted hover:text-text-primary'
                }`
              }
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-bg-surface border-r border-bg-raised z-30">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-accent-amber mb-8">Valhalla V3</h2>
          
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent-amber text-bg-base font-semibold'
                      : 'text-text-muted hover:bg-bg-raised hover:text-text-primary'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
