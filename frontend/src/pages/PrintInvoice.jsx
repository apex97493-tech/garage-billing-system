import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function PrintInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invRes = await axios.get(`${API_URL}/invoices/${id}`);
        setInvoice(invRes.data);
        const setRes = await axios.get(`${API_URL}/settings`);
        setSettings(setRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [id]);

  if (!invoice || !settings) return <div className="p-8 text-center">Loading...</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="print:hidden mb-4 flex justify-between">
        <button onClick={() => navigate('/')} className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft className="w-5 h-5 mr-1" /> Back to POS
        </button>
        <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 font-medium">
          <Printer className="w-5 h-5 mr-2" /> Print Invoice
        </button>
      </div>

      {/* A4 Format Container */}
      <div className="bg-white p-8 shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-wider uppercase">{settings.shopName}</h1>
          <p className="text-gray-600 mt-1 whitespace-pre-line">{settings.address}</p>
          <p className="text-gray-600 mt-1">Phone: {settings.contactNumber}</p>
          {settings.gstin && <p className="text-gray-600 font-medium">GSTIN: {settings.gstin}</p>}
        </div>

        <div className="flex justify-between mb-8 text-sm">
          <div className="space-y-1">
            <h3 className="font-bold text-gray-800 border-b pb-1 mb-2">Customer Details</h3>
            <p><span className="font-medium text-gray-600">Name:</span> {invoice.customer.name}</p>
            <p><span className="font-medium text-gray-600">Phone:</span> {invoice.customer.phone}</p>
            <p><span className="font-medium text-gray-600">Vehicle:</span> {invoice.customer.bikeModel}</p>
            <p><span className="font-medium text-gray-600">Reg No:</span> <span className="uppercase">{invoice.customer.regNo}</span></p>
          </div>
          <div className="space-y-1 text-right">
            <h3 className="font-bold text-gray-800 border-b pb-1 mb-2 text-left">Invoice Details</h3>
            <p><span className="font-medium text-gray-600">Invoice No:</span> #{invoice._id.slice(-6).toUpperCase()}</p>
            <p><span className="font-medium text-gray-600">Date:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p><span className="font-medium text-gray-600">Current Odo:</span> {invoice.currentKm} KM</p>
            <p><span className="font-medium text-gray-600">Next Service In:</span> {invoice.nextServiceKm} KM</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y-2 border-gray-800">
              <th className="py-2 px-1 text-left">S.No</th>
              <th className="py-2 px-1 text-left">Description</th>
              <th className="py-2 px-1 text-center">Qty</th>
              <th className="py-2 px-1 text-right">Price</th>
              <th className="py-2 px-1 text-right">GST</th>
              <th className="py-2 px-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoice.items.map((item, idx) => {
              const lineTotal = item.qty * item.unitPrice;
              const gstAmt = lineTotal * (item.gstRate / 100);
              return (
                <tr key={idx}>
                  <td className="py-2 px-1 text-gray-600">{idx + 1}</td>
                  <td className="py-2 px-1 font-medium text-gray-800">{item.partName}</td>
                  <td className="py-2 px-1 text-center">{item.qty}</td>
                  <td className="py-2 px-1 text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2 px-1 text-right">{item.gstRate}%</td>
                  <td className="py-2 px-1 text-right font-medium">{(lineTotal + gstAmt).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Summary & Footer */}
        <div className="flex justify-between items-end border-t-2 border-gray-800 pt-4">
          <div className="w-1/2 text-sm text-gray-600">
            <h4 className="font-bold text-gray-800 mb-1">Terms & Conditions</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Goods once sold will not be taken back.</li>
              <li>Warranty subject to manufacturer's terms.</li>
            </ul>
            {settings.upiId && (
              <div className="mt-4 p-3 border border-gray-200 rounded inline-block">
                <p className="font-medium text-gray-800">Pay via UPI:</p>
                <p className="text-gray-600">{settings.upiId}</p>
              </div>
            )}
          </div>
          
          <div className="w-1/3">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Subtotal</td>
                  <td className="py-1 text-right font-medium text-gray-800">₹{invoice.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600 border-b border-gray-200">Total GST</td>
                  <td className="py-1 text-right font-medium text-gray-800 border-b border-gray-200">₹{invoice.totalGst.toFixed(2)}</td>
                </tr>
                <tr className="text-lg">
                  <td className="py-2 font-bold text-gray-900">Grand Total</td>
                  <td className="py-2 text-right font-bold text-gray-900">₹{invoice.grandTotal}</td>
                </tr>
              </tbody>
            </table>
            <div className="text-center mt-12 pt-2 border-t border-gray-300 text-xs text-gray-500">
              Authorized Signatory
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-gray-400">
          <p>Thank you for choosing {settings.shopName}. Ride Safe!</p>
          <p>Powered by NextGen Workshop System</p>
        </div>
      </div>
      
      {/* Print Styles for thermal (optional/future) can be added to index.css */}
    </div>
  );
}
