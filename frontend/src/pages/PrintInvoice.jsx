import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft, MessageSquare, Download, CheckCircle2 } from 'lucide-react';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:5000/api';

export default function PrintInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState({ isConnected: false });
  const [sendingPdf, setSendingPdf] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invRes = await axios.get(`${API_URL}/invoices/${id}`);
        setInvoice(invRes.data);
        const setRes = await axios.get(`${API_URL}/settings`);
        setSettings(setRes.data);
        const waRes = await axios.get(`${API_URL}/whatsapp/status`);
        setWhatsappStatus(waRes.data);
      } catch (err) {
        console.error('Error loading invoice:', err);
      }
    };
    fetchData();
  }, [id]);

  if (!invoice || !settings) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs font-semibold">Loading Invoice...</p>
      </div>
    );
  }

  const currency = settings.currency || '₹';
  const taxLabel = settings.taxLabel || 'GST';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    downloadInvoicePDF(invoice, settings);
  };

  const handleSendWhatsAppPDF = async () => {
    const cust = invoice.customer || {};
    const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // If local WhatsApp Bot is linked, send real PDF document directly through bot
    if (whatsappStatus.isConnected) {
      setSendingPdf(true);
      try {
        const res = await axios.post(`${API_URL}/invoices/${invoice.id || invoice._id}/send-whatsapp-pdf`);
        if (res.data.success) {
          setSentSuccess(true);
          setTimeout(() => setSentSuccess(false), 4000);
          return;
        }
      } catch (err) {
        console.warn('Bot PDF send failed, falling back to manual download:', err);
      } finally {
        setSendingPdf(false);
      }
    }

    // Fallback: Download PDF and open WhatsApp Web
    downloadInvoicePDF(invoice, settings);

    let itemListText = '';
    invoice.items.forEach((item, idx) => {
      const lineTotal = item.qty * item.unitPrice;
      itemListText += `${idx + 1}. ${item.partName} (x${item.qty}) - ${currency}${lineTotal}\n`;
    });

    const msg = `*TAX INVOICE — ${settings.shopName.toUpperCase()}*\n\n` +
      `Invoice No: #${invoice.invoiceNo || invoice.id.slice(-6).toUpperCase()}\n` +
      `Date: ${new Date(invoice.createdAt).toLocaleDateString()}\n\n` +
      `Customer: ${cust.name}\n` +
      `Vehicle: ${cust.bikeModel} (${cust.regNo || 'Bespoke'})\n\n` +
      `*Breakdown:*\n${itemListText}\n` +
      `*Grand Total:* ${currency}${invoice.grandTotal}\n` +
      (invoice.advancePaid > 0 ? `*Advance Paid:* ${currency}${invoice.advancePaid}\n*Balance Due:* ${currency}${invoice.balanceDue}\n` : '') +
      (settings.upiId ? `*UPI ID:* ${settings.upiId}\n` : '') +
      `\n_PDF Invoice downloaded to your computer. Please attach and send._\n` +
      `Thank you for choosing ${settings.shopName}.`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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
            {settings.gstin && (
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {taxLabel} No: {settings.gstin}
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-mono font-bold uppercase tracking-wider mb-1.5">
              TAX INVOICE
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
              Reg / Chassis: <span className="font-mono font-bold uppercase text-slate-950">{cust.regNo || 'Bespoke / No Reg'}</span>
            </p>
            {invoice.buildType && (
              <p className="text-slate-600 mt-0.5 font-medium">
                Job Type: <span className="font-bold text-slate-900">{invoice.buildType}</span>
              </p>
            )}
            {invoice.currentKm > 0 && (
              <p className="text-slate-600 mt-0.5 font-medium">
                Odometer: <span className="font-mono font-bold text-slate-900">{invoice.currentKm} KM</span>
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
              <th className="py-2 px-2 text-right w-16">{taxLabel} %</th>
              <th className="py-2 px-2 text-right w-28">Amount ({currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => {
              const lineBase = item.qty * item.unitPrice;
              const lineGst = lineBase * (item.gstRate / 100);
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
                  <td className="py-2 px-2 text-right font-mono text-slate-700">{item.gstRate}%</td>
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
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total {taxLabel}:</span>
                <span className="font-mono font-bold text-slate-900">{currency}{invoice.totalGst.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Discount:</span>
                  <span className="font-mono">- {currency}{invoice.discount}</span>
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

            <div className="text-center mt-8 pt-1.5 border-t border-slate-300 text-[11px] font-bold text-slate-600">
              Authorized Signatory
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-400 font-medium">
          <p>Thank you for choosing {settings.shopName}.</p>
        </div>

      </div>

    </div>
  );
}
