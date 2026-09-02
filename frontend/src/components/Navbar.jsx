import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Wrench, Package, Settings, Calculator, 
  Users, FileText, BellRing 
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Navbar() {
  const location = useLocation();
  const [dueCount, setDueCount] = useState(0);
  const [shopInfo, setShopInfo] = useState({
    shopName: 'Royal Enfield Workshop Studio',
    tagline: 'Service, Spares & Billing Management',
    logo: ''
  });

  useEffect(() => {
    fetchDueCount();
    fetchShopInfo();
    const interval = setInterval(() => {
      fetchDueCount();
      fetchShopInfo();
    }, 15000);
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

  const fetchShopInfo = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      if (res.data) {
        setShopInfo({
          shopName: res.data.shopName || 'Royal Enfield Workshop Studio',
          tagline: res.data.tagline || 'Service, Spares & Billing Management',
          logo: res.data.logo || ''
        });
      }
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
          
          {/* Brand & Identity with Round Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            {shopInfo.logo ? (
              <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-white p-0.5 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                <img 
                  src={shopInfo.logo} 
                  alt="Workshop Logo" 
                  className="w-full h-full rounded-full object-cover" 
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                <Wrench className="w-5 h-5 text-amber-400" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base tracking-tight text-slate-900">
                  {shopInfo.shopName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  POS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{shopInfo.tagline}</p>
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
                    <span className="ml-1.5 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Offline/Online Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>100% Offline</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
