import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Players', path: '/players' },
  { name: 'Matches', path: '/matches' },
  { name: 'Add Match', path: '/add-match' },
  { name: 'CSV Import', path: '/csv-import' },
];

const Navigation: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav className="bg-white shadow mb-6">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-primary-700">Sport Dashboard</div>
        {/* Desktop menu */}
        <ul className="hidden md:flex space-x-6">
          {navItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`text-gray-700 hover:text-primary-600 font-medium transition-colors ${location.pathname === item.path ? 'text-primary-600 underline' : ''}`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        {/* Hamburger icon for mobile */}
        <button
          className="md:hidden text-2xl text-primary-700 focus:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Open menu"
        >
          <FaBars />
        </button>
      </div>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white shadow-lg absolute top-16 left-0 w-full z-50 animate-slide-down">
          <ul className="flex flex-col space-y-2 px-6 py-4">
            {navItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`block py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors ${location.pathname === item.path ? 'text-primary-600 underline' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navigation; 