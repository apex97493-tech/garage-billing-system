import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import PrintInvoice from './pages/PrintInvoice';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/print/:id" element={<PrintInvoice />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
