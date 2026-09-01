import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import POS from './pages/POS';
import JobCards from './pages/JobCards';
import Inventory from './pages/Inventory';
import PrintInvoice from './pages/PrintInvoice';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import ServiceReminders from './pages/ServiceReminders';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<POS />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/reminders" element={<ServiceReminders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/job-cards" element={<JobCards />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/print/:id" element={<PrintInvoice />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
