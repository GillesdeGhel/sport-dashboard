import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Ajouter', path: '/', emoji: '➕' },
  { name: 'Dashboard', path: '/dashboard', emoji: '📊' },
  { name: 'Matchs', path: '/matches', emoji: '📋' },
  { name: 'Joueurs', path: '/players', emoji: '👤' },
  { name: 'Import', path: '/csv-import', emoji: '📥' },
];

const isActive = (pathname: string, path: string) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);

const Navigation: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200/70">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🏸</span>
            <span className="text-base font-extrabold tracking-tight text-slate-900">Sport Dashboard</span>
          </Link>

          <ul className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = isActive(pathname, item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium transition-colors ${
                      active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Bottom tab bar (mobile) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-5">
          {navItems.map(item => {
            const active = isActive(pathname, item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-semibold transition-colors ${
                    active ? 'text-slate-900' : 'text-slate-400'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={`text-xl leading-none px-3 py-1 rounded-full ${active ? 'bg-slate-100' : ''}`}>{item.emoji}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default Navigation;
