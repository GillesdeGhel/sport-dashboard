import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Players', path: '/players' },
  { name: 'Matches', path: '/matches' },
  { name: 'Add Match', path: '/add-match' },
];

const Navigation: React.FC = () => {
  const location = useLocation();
  return (
    <nav className="bg-white shadow mb-6">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-primary-700">Sport Dashboard</div>
        <ul className="flex space-x-6">
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
      </div>
    </nav>
  );
};

export default Navigation; 