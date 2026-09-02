import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Wrench, Package, Settings, Calculator, 
  HardDrive, Users, FileText, BellRing 
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Navbar() {
  const location = useLocation();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    fetchDueCount();
    const interval = setInterval(fetchDueCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchDueCount = async () => {
    try {
      const res = await axios.get(`${API_URL}/reminders/due`);
      setDueCount((res.data || []).length);
    } catch (err) {
      // Backend starting
    }
  };

  const navItems = [
    { name: 'POS Billing', path: '/', icon: <Calculator className="w-4 h-4 mr-1.5" /> },
    { name: 'Invoices & Sales', path: '/invoices', icon: <FileText className="w-4 h-4 mr-1.5" /> },
    { 
      name: 'Service Reminders', 
      path: '/reminders', 
      icon: <BellRing className="w-4 h-4 mr-1.5" />,
      badge: dueCount > 0 ? dueCount : null 
    },
    { name: 'Customers & CRM', path: '/customers', icon: <Users className="w-4 h-4 mr-1.5" /> },
    { name: 'Parts & Rates', path: '/inventory', icon: <Package className="w-4 h-4 mr-1.5" /> },
    { name: 'Settings & WhatsApp', path: '/settings', icon: <Settings className="w-4 h-4 mr-1.5" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 print:hidden shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand & Identity */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base tracking-tight text-slate-900">
                  Royal Enfield Workshop Studio
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  POS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Service, Spares & Billing Management</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors relative ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* USB Offline Status Badge */}
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-850 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <HardDrive className="w-3.5 h-3.5" />
            <span>100% Offline</span>
          </div>

        </div>
      </div>
    </header>
  );
}
