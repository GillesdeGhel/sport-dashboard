import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/', emoji: '📊' },
  { name: 'Joueurs', path: '/players', emoji: '👤' },
  { name: 'Matchs', path: '/matches', emoji: '📋' },
  { name: 'Ajouter', path: '/add-match', emoji: '➕' },
  { name: 'Import CSV', path: '/csv-import', emoji: '📥' },
];

const Navigation: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm mb-6">
      <div className="container mx-auto px-4 py-0 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 py-4">
          <span className="text-2xl">🏆</span>
          <span className="text-lg font-bold text-gray-800 hidden sm:block">Sport Dashboard</span>
        </Link>

        {/* Desktop menu */}
        <ul className="hidden md:flex items-center h-full">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-1.5 px-4 py-5 text-sm font-medium transition-colors border-b-2 ${
                    active
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 hover:text-blue-600 border-transparent hover:border-blue-300'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <ul className="px-4 py-2 space-y-1">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
