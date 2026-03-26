import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Home', icon: '⌂' },
  { path: '/backlog', label: 'Backlog', icon: '📋' },
  { path: '/pipeline', label: 'Pipeline', icon: '⬡' },
  { path: '/completed', label: 'Completed', icon: '✓' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
];

export function Navigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-bg-surface border-t border-bg-raised z-30">
        <div className="flex justify-around h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 text-xs transition-colors ${
                  isActive ? 'text-accent-amber' : 'text-text-muted'
                }`
              }
            >
              <span className="text-lg mb-0.5">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav 
        className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-bg-surface border-r border-bg-raised z-30 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-48 lg:w-56'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-bg-raised flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-accent-amber truncate">Valhalla</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-bg-raised text-text-muted hover:text-text-primary transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {/* Nav items */}
        <div className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent-amber text-bg-base font-semibold'
                    : 'text-text-muted hover:bg-bg-raised hover:text-text-primary'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-bg-raised">
          {!isCollapsed && (
            <div className="text-xs text-text-muted">
              Valhalla V3
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
