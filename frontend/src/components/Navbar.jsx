import { Link, useLocation } from 'react-router-dom';
import { Wrench, Package, Settings, Monitor } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: 'POS / Billing', path: '/', icon: <Monitor className="w-5 h-5 mr-2" /> },
    { name: 'Inventory', path: '/inventory', icon: <Package className="w-5 h-5 mr-2" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5 mr-2" /> },
  ];

  return (
    <nav className="bg-red-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Wrench className="w-8 h-8" />
            <span className="font-bold text-xl tracking-wider">RE WORKSHOP</span>
          </div>
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-red-800 text-white font-medium shadow-inner'
                    : 'text-red-100 hover:bg-red-600'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
