import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Printer, ArrowLeft, Download, MessageSquare, 
  CheckCircle2, AlertCircle, FileText 
} from 'lucide-react';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:5000/api';

export default function PrintInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingPdf, setSendingPdf] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    fetchInvoiceAndSettings();
  }, [id]);

  const fetchInvoiceAndSettings = async () => {
    try {
      const [invRes, setRes] = await Promise.all([
        axios.get(`${API_URL}/invoices/${id}`),
        axios.get(`${API_URL}/settings`)
      ]);
      setInvoice(invRes.data);
      setSettings(setRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      // Fallback
      try {
        const inv = await axios.get(`${API_URL}/invoices/${id}`);
        setInvoice(inv.data);
        const set = await axios.get(`${API_URL}/settings`);
        setSettings(set.data);
      } catch (e) {
        console.error('Final fallback error:', e);
      }
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!invoice || !settings) return;
    downloadInvoicePDF(invoice, settings);
  };

  const handleSendWhatsAppPDF = async () => {
    if (!invoice?.customer?.phone) {
      alert('No customer phone number found on this invoice.');
      return;
    }

    setSendingPdf(true);
    setSentSuccess(false);

    try {
      const res = await axios.post(`${API_URL}/invoices/${id}/send-whatsapp-pdf`, {
        phone: invoice.customer.phone
      });

      if (res.data.success) {
        setSentSuccess(true);
        setTimeout(() => setSentSuccess(false), 5000);
      } else {
        alert(res.data.error || 'Could not send WhatsApp PDF.');
      }
    } catch (err) {
      console.error('Error dispatching WhatsApp PDF:', err);
      alert('Failed to send WhatsApp document. Please ensure WhatsApp is connected in Settings.');
    } finally {
      setSendingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500 font-bold text-sm">
        Loading invoice preview...
      </div>
    );
  }

  if (!invoice || !settings) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-xs max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Invoice Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The invoice you requested could not be loaded.</p>
        <button
          onClick={() => navigate('/invoices')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
        >
          Return to Sales & Invoices
        </button>
      </div>
    );
  }

  const currency = settings.currency || '₹';
  const taxLabel = settings.taxLabel || 'GST';
  const billType = invoice.billType || 'Tax Invoice';
  const isGst = billType === 'Tax Invoice';
  const billHeaderTitle = billType === 'Pre-Invoice'
    ? 'PRE-INVOICE'
    : (billType === 'Estimate' ? 'ESTIMATE / QUOTATION' : 'TAX INVOICE');

  const cust = invoice.customer || {
    name: invoice.customerName || 'Customer',
    phone: invoice.customerPhone || '',
    bikeModel: invoice.bikeModel || '',
    regNo: invoice.regNo || ''
  };

  const upiPayUrl = settings.upiId
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.shopName)}&am=${invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal}&cu=INR`
    : '';
  const qrCodeUrl = upiPayUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiPayUrl)}`
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Top Action Bar (Hidden on Print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-slate-700 hover:text-slate-900 font-bold text-xs px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to POS Billing
        </button>

        <div className="flex items-center space-x-2">
          {sentSuccess && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              PDF Invoice Sent to WhatsApp!
            </span>
          )}

          <button
            onClick={handleDownloadPDF}
            className="flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-colors"
            title="Download PDF file"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-700" /> Download PDF
          </button>

          <button
            onClick={handleSendWhatsAppPDF}
            disabled={sendingPdf}
            className="flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-1.5" /> 
            {sendingPdf ? 'Sending PDF File...' : 'Send WhatsApp PDF Bill'}
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print Invoice
          </button>
        </div>
      </div>

      {/* A4 Printable Invoice Sheet */}
      <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-xl shadow-xs border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
        
        {/* Header Branding */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
          <div>
            {settings.logo && (
              <img 
                src={settings.logo} 
                alt="Workshop Logo" 
                className="h-14 w-auto max-w-[180px] object-contain mb-2 rounded" 
              />
            )}
            <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
              {settings.shopName}
            </h1>
            {settings.tagline && (
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                {settings.tagline}
              </p>
            )}
            <p className="text-xs text-slate-600 mt-1.5 max-w-sm whitespace-pre-line leading-relaxed font-medium">
              {settings.address}
            </p>
            <p className="text-xs font-bold text-slate-700 mt-1">
              Phone: {settings.contactNumber}
            </p>
            {isGst && settings.gstin && (
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {taxLabel} No: {settings.gstin}
              </p>
            )}
          </div>

          <div className="text-right">
            <div className={`inline-block px-2.5 py-1 text-white rounded text-xs font-mono font-bold uppercase tracking-wider mb-1.5 ${
              billType === 'Pre-Invoice' ? 'bg-blue-600' : (billType === 'Estimate' ? 'bg-amber-700' : 'bg-slate-900')
            }`}>
              {billHeaderTitle}
            </div>
            <p className="text-xs font-black text-slate-950 font-mono">
              #{invoice.invoiceNo || invoice.id.slice(-6).toUpperCase()}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Date: <span className="font-bold text-slate-900">{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Mode: <span className="font-bold text-slate-900">{invoice.paymentMethod || 'UPI'}</span>
            </p>
            {invoice.balanceDue > 0 ? (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded text-[11px] font-bold">
                Balance Due: {currency}{invoice.balanceDue}
              </span>
            ) : (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded text-[11px] font-bold">
                Fully Paid
              </span>
            )}
          </div>
        </div>

        {/* Customer & Vehicle Specs */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-5 text-xs">
          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-0.5">
              Customer Details
            </h3>
            <p className="text-xs font-black text-slate-950">{cust.name}</p>
            <p className="text-slate-600 mt-0.5 font-medium">Phone: <span className="font-bold text-slate-900">{cust.phone}</span></p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-0.5">
              Vehicle & Service Details
            </h3>
            <p className="text-xs font-black text-slate-950">{cust.bikeModel}</p>
            <p className="text-slate-600 mt-0.5 font-medium">
              Reg No: <span className="font-mono font-bold uppercase text-slate-950">{cust.regNo || 'Bespoke / No Reg'}</span>
            </p>
            {invoice.currentKm > 0 && (
              <p className="text-slate-600 mt-0.5 font-medium">
                Kilometre: <span className="font-mono font-bold text-slate-900">{invoice.currentKm} KM</span>
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-xs mb-5 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300 font-bold text-slate-800">
              <th className="py-2 px-2 text-left w-10">#</th>
              <th className="py-2 px-2 text-left">Description / Work Done</th>
              <th className="py-2 px-2 text-center w-14">Qty</th>
              <th className="py-2 px-2 text-right w-24">Rate ({currency})</th>
              {isGst && <th className="py-2 px-2 text-right w-16">{taxLabel} %</th>}
              <th className="py-2 px-2 text-right w-28">Amount ({currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => {
              const lineBase = item.qty * item.unitPrice;
              const lineGst = isGst ? lineBase * (item.gstRate / 100) : 0;
              const lineTotal = lineBase + lineGst;

              return (
                <tr key={idx}>
                  <td className="py-2 px-2 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="py-2 px-2 font-bold text-slate-900">
                    {item.partName}
                    {item.isLabour && <span className="ml-2 text-[10px] text-purple-800 bg-purple-50 border border-purple-200 px-1 py-0.2 rounded font-bold">Labor</span>}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-medium">{item.qty}</td>
                  <td className="py-2 px-2 text-right font-mono font-medium">{item.unitPrice.toFixed(2)}</td>
                  {isGst && <td className="py-2 px-2 text-right font-mono text-slate-700">{item.gstRate}%</td>}
                  <td className="py-2 px-2 text-right font-mono font-black text-slate-950">
                    {lineTotal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Financial Summary & Terms */}
        <div className="grid grid-cols-12 gap-6 pt-3 border-t-2 border-slate-900">
          
          {/* Left: Terms & UPI QR */}
          <div className="col-span-7 space-y-3 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 uppercase mb-1">Terms & Conditions</h4>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed text-[11px] font-medium">
                {settings.terms}
              </p>
            </div>

            {settings.bankDetails && (
              <p className="text-[11px] font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                {settings.bankDetails}
              </p>
            )}

            {/* UPI QR Payment Block */}
            {qrCodeUrl && (
              <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-lg border border-slate-200 inline-flex">
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-14 h-14 rounded border border-slate-300" />
                <div>
                  <p className="text-[11px] font-bold text-slate-900">Instant UPI Payment</p>
                  <p className="text-[10px] text-slate-700 font-mono font-bold">{settings.upiId}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Calculations Box */}
          <div className="col-span-5">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">{currency}{invoice.subtotal.toFixed(2)}</span>
              </div>
              {isGst && invoice.totalGst > 0 && (
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Total {taxLabel}:</span>
                  <span className="font-mono font-bold text-slate-900">{currency}{invoice.totalGst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black text-slate-950 pt-1.5 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="font-mono text-sm font-black">{currency}{invoice.grandTotal}</span>
              </div>
              {invoice.advancePaid > 0 && (
                <>
                  <div className="flex justify-between text-slate-700 pt-0.5 font-medium">
                    <span>Advance Paid:</span>
                    <span className="font-mono font-bold text-emerald-800">- {currency}{invoice.advancePaid}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-amber-900 pt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span className="font-mono font-black">{currency}{invoice.balanceDue}</span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
