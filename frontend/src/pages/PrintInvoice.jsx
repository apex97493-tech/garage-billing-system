import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode';
import { 
  Printer, ArrowLeft, Download, Send, CheckCircle2, 
  Share2, FileText 
} from 'lucide-react';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

const API_URL = 'http://localhost:5000/api';

function numberToWordsINR(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const num = Math.floor(Number(amount));
  if (num === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  }

  function convertThreeDigits(n) {
    let str = '';
    if (Math.floor(n / 100) > 0) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      str += convertTwoDigits(n);
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';
  if (remainder > 0) words += convertThreeDigits(remainder) + ' ';

  return words.trim() + ' Rupees Only';
}

export default function PrintInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({});
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoice();
    fetchSettings();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await axios.get(`${API_URL}/invoices/${id}`);
      setInvoice(res.data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Invoice not found or error loading record.');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      setSettings(res.data || {});
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    if (settings.upiId && invoice?.grandTotal) {
      const upiUri = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.shopName || 'Workshop')}&am=${invoice.grandTotal}&cu=INR`;
      QRCode.toDataURL(upiUri, { width: 120, margin: 1 }, (err, url) => {
        if (!err) setQrCodeUrl(url);
      });
    }
  }, [settings, invoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsAppPDF = async () => {
    if (!invoice?.customer?.phone) {
      alert('No customer phone number available.');
      return;
    }
    setSendingWhatsapp(true);
    try {
      await axios.post(`${API_URL}/invoices/${invoice.id}/send-whatsapp-pdf`);
      setWhatsappSent(true);
      setTimeout(() => setWhatsappSent(false), 4000);
    } catch (err) {
      console.error('Error sending WhatsApp invoice:', err);
      alert(err.response?.data?.error || 'Failed to send WhatsApp message. Please check WhatsApp connection.');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-xl border border-slate-200 mt-10">
        <h2 className="text-lg font-bold text-red-600 mb-2">Notice</h2>
        <p className="text-slate-600 mb-4 text-xs">{error}</p>
        <Link to="/invoices" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold inline-block">
          Return to Sales Records
        </Link>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const cust = invoice.customer || {
    name: invoice.customerName || 'Valued Client',
    phone: invoice.customerPhone || '',
    bikeModel: invoice.bikeModel || 'Royal Enfield',
    regNo: invoice.regNo || ''
  };

  const rawCurrency = settings.currency || 'Rs.';
  const currency = (rawCurrency === '₹' || rawCurrency.includes('₹')) ? 'Rs.' : rawCurrency;
  const billType = invoice.billType || 'Tax Invoice';
  const isGst = billType === 'Tax Invoice';
  const billHeaderTitle = billType === 'Pre-Invoice' 
    ? 'PRE-INVOICE' 
    : (billType === 'Estimate' ? 'ESTIMATE / QUOTATION' : 'TAX INVOICE');

  const totalQty = (invoice.items || []).reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  const receivedAmt = invoice.advancePaid > 0 ? invoice.advancePaid : (invoice.balanceDue === 0 ? invoice.grandTotal : 0);

  return (
    <div className="max-w-4xl mx-auto pb-12">
      
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <Link
          to="/"
          className="flex items-center text-xs font-bold text-slate-700 hover:text-slate-950 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to POS Billing
        </Link>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => downloadInvoicePDF(invoice, settings)}
            className="flex items-center px-3.5 py-2 bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-600" /> Download PDF
          </button>

          <button
            onClick={handleSendWhatsAppPDF}
            disabled={sendingWhatsapp}
            className="flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {whatsappSent ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-300" /> Sent via WhatsApp!
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                {sendingWhatsapp ? 'Sending Document...' : 'Send WhatsApp PDF Bill'}
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print Invoice
          </button>
        </div>
      </div>

      {/* A4 Printable Invoice Sheet (Dealer Indian Standard GST Format) */}
      <div className="bg-white text-slate-950 p-8 sm:p-10 rounded-xl shadow-xs border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
        
        {/* Top Title Badge */}
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-950">{billHeaderTitle}</span>
          <span className="text-[10px] font-bold text-slate-600 border border-slate-400 px-2 py-0.5 rounded">
            ORIGINAL FOR RECIPIENT
          </span>
        </div>

        {/* 1. Main Workshop & Invoice Details Box */}
        <div className="border border-slate-950 grid grid-cols-12 mb-2">
          {/* Workshop Details (Left) */}
          <div className="col-span-8 p-3.5 flex items-start space-x-3 border-r border-slate-950">
            {settings.logo && (
              <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-300 bg-white p-0.5 shrink-0">
                <img src={settings.logo} alt="Logo" className="w-full h-full rounded-full object-cover" />
              </div>
            )}
            <div className="space-y-0.5 flex-1 min-w-0">
              <h1 className="text-sm font-black uppercase text-slate-950 tracking-tight leading-tight">
                {settings.shopName}
              </h1>
              {settings.tagline && (
                <p className="text-[11px] font-medium text-slate-700">{settings.tagline}</p>
              )}
              <p className="text-[10.5px] text-slate-600 leading-tight">{settings.address}</p>
              <div className="text-[11px] font-bold text-slate-900 pt-0.5 flex flex-wrap gap-x-4">
                <span>Mobile: {settings.contactNumber}</span>
                {isGst && settings.gstin && <span>GSTIN: {settings.gstin}</span>}
              </div>
            </div>
          </div>

          {/* Invoice Info (Right) */}
          <div className="col-span-4 p-3.5 bg-slate-50/50 space-y-2 text-xs flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Invoice No.</p>
                <p className="text-xs font-black text-slate-950 font-mono">#{invoice.invoiceNo || invoice.id.slice(-6).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Invoice Date</p>
                <p className="text-[11px] font-medium text-slate-900">{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-200 flex justify-between">
              <span className="text-[10.5px] font-bold text-slate-600">Payment Mode:</span>
              <span className="text-[11px] font-bold text-slate-900 font-mono">{invoice.paymentMethod || 'UPI'}</span>
            </div>
          </div>
        </div>

        {/* 2. Customer & Vehicle Box (BILL TO) */}
        <div className="border border-slate-950 grid grid-cols-12 mb-2">
          {/* Header Row */}
          <div className="col-span-8 bg-slate-100 border-b border-r border-slate-950 px-3 py-1 text-[10.5px] font-bold text-slate-900 uppercase">
            BILL TO / CUSTOMER DETAILS
          </div>
          <div className="col-span-4 bg-slate-100 border-b border-slate-950 px-3 py-1 text-[10.5px] font-bold text-slate-900 uppercase">
            VEHICLE & SERVICE SPECS
          </div>

          {/* Details Content */}
          <div className="col-span-8 p-3 border-r border-slate-950 text-xs space-y-0.5">
            <p className="text-xs font-black text-slate-950">{cust.name}</p>
            <p className="text-[11px] font-medium text-slate-700">Mobile: <strong className="text-slate-950">{cust.phone || 'N/A'}</strong></p>
          </div>
          <div className="col-span-4 p-3 text-xs space-y-0.5">
            <p className="text-xs font-black text-slate-950">{cust.bikeModel}</p>
            <p className="text-[11px] text-slate-700 font-medium">
              Reg No: <strong className="text-slate-950 font-mono">{cust.regNo || 'Bespoke'}</strong>
              {invoice.currentKm > 0 && <span> &nbsp;|&nbsp; {invoice.currentKm} KM</span>}
            </p>
          </div>
        </div>

        {/* 3. Items Table (No HSN, Dealership Grid) */}
        <div className="border border-slate-950 mb-2 overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-950 text-[11px] font-bold text-slate-900">
                <th className="py-2 px-2 text-center w-10 border-r border-slate-950">S.NO.</th>
                <th className="py-2 px-3 text-left border-r border-slate-950">ITEMS / DESCRIPTION OF WORK</th>
                <th className="py-2 px-2 text-center w-14 border-r border-slate-950">QTY.</th>
                <th className="py-2 px-2 text-right w-24 border-r border-slate-950">RATE ({currency})</th>
                {isGst && <th className="py-2 px-2 text-center w-16 border-r border-slate-950">TAX %</th>}
                <th className="py-2 px-3 text-right w-28">AMOUNT ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950">
              {invoice.items.map((item, idx) => {
                const lineBase = item.qty * item.unitPrice;
                const lineGst = isGst ? lineBase * (item.gstRate / 100) : 0;
                const lineTotal = lineBase + lineGst;

                return (
                  <tr key={idx} className="text-xs">
                    <td className="py-1.5 px-2 text-center text-slate-600 font-mono border-r border-slate-950">{idx + 1}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-950 border-r border-slate-950">
                      {item.partName}
                      {item.isLabour && <span className="ml-1.5 text-[10px] text-slate-600 font-normal">(Labor)</span>}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono font-medium border-r border-slate-950">{item.qty}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-medium border-r border-slate-950">{item.unitPrice.toFixed(2)}</td>
                    {isGst && <td className="py-1.5 px-2 text-center font-mono text-slate-700 border-r border-slate-950">{item.gstRate}%</td>}
                    <td className="py-1.5 px-3 text-right font-mono font-black text-slate-950">
                      {lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Table Bottom Totals: TOTAL, RECEIVED AMOUNT, CURRENT BALANCE DUE */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-950 text-xs">
                <td colSpan={2} className="py-2 px-3 text-right uppercase border-r border-slate-950">TOTAL</td>
                <td className="py-2 px-2 text-center font-mono border-r border-slate-950">{totalQty}</td>
                <td className="py-2 px-2 border-r border-slate-950"></td>
                {isGst && <td className="py-2 px-2 text-right font-mono border-r border-slate-950">{currency} {invoice.totalGst.toFixed(2)}</td>}
                <td className="py-2 px-3 text-right font-mono font-black text-sm">{currency} {invoice.grandTotal.toFixed(2)}</td>
              </tr>

              <tr className="font-bold border-t border-slate-950 text-xs">
                <td colSpan={isGst ? 5 : 4} className="py-1.5 px-3 text-right uppercase border-r border-slate-950">RECEIVED AMOUNT</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{currency} {Number(receivedAmt).toFixed(2)}</td>
              </tr>

              {invoice.balanceDue > 0 && (
                <tr className="font-bold border-t border-slate-950 text-xs bg-amber-50/50">
                  <td colSpan={isGst ? 5 : 4} className="py-1.5 px-3 text-right uppercase border-r border-slate-950 text-amber-950">CURRENT BALANCE DUE</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-amber-950">{currency} {Number(invoice.balanceDue).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. CGST / SGST Tax Breakdown Table (Only for Tax Invoice) */}
        {isGst && invoice.totalGst > 0 && (
          <div className="border border-slate-950 mb-2 overflow-hidden text-xs">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-950 text-[10px] font-bold text-slate-900">
                  <th className="py-1.5 px-2 border-r border-slate-950">Taxable Value</th>
                  <th className="py-1.5 px-2 border-r border-slate-950">CGST (Rate % / Amount)</th>
                  <th className="py-1.5 px-2 border-r border-slate-950">SGST (Rate % / Amount)</th>
                  <th className="py-1.5 px-2">Total Tax Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono text-xs">
                  <td className="py-1.5 px-2 border-r border-slate-950">{currency} {invoice.subtotal.toFixed(2)}</td>
                  <td className="py-1.5 px-2 border-r border-slate-950">9% ({currency} {(invoice.totalGst / 2).toFixed(2)})</td>
                  <td className="py-1.5 px-2 border-r border-slate-950">9% ({currency} {(invoice.totalGst / 2).toFixed(2)})</td>
                  <td className="py-1.5 px-2 font-bold">{currency} {invoice.totalGst.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Total Amount (in words) Box */}
        <div className="border border-slate-950 p-2.5 mb-2 text-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total Amount (in words)</p>
          <p className="text-xs font-black text-slate-950 uppercase pt-0.5">{numberToWordsINR(invoice.grandTotal)}</p>
        </div>

        {/* 6. Bank Details, Terms, Dynamic UPI QR Code & Authorized Signatory */}
        <div className="border border-slate-950 grid grid-cols-12 text-xs">
          {/* Left Side: Bank Details & Terms */}
          <div className="col-span-7 p-3 border-r border-slate-950 space-y-2">
            {settings.bankDetails && (
              <div>
                <p className="text-[10.5px] font-bold text-slate-900">Bank Details:</p>
                <p className="text-[11px] font-medium text-slate-700">{settings.bankDetails}</p>
              </div>
            )}
            <div>
              <p className="text-[10.5px] font-bold text-slate-900">Terms & Conditions:</p>
              <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">{settings.terms}</p>
            </div>
          </div>

          {/* Right Side: Dynamic QR & Signatory */}
          <div className="col-span-5 p-3 flex flex-col justify-between">
            {qrCodeUrl && (
              <div className="flex items-center space-x-2.5">
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-12 h-12 border border-slate-300 rounded" />
                <div>
                  <p className="text-[10.5px] font-bold text-slate-950">Scan to Pay</p>
                  <p className="text-[10px] text-slate-700 font-mono">UPI ID: {settings.upiId}</p>
                </div>
              </div>
            )}

            <div className="pt-6 text-center border-t border-slate-300 mt-4">
              <p className="text-[10px] font-bold text-slate-700">Authorized Signatory / Workshop Manager</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 text-[10px] text-slate-500 font-medium">
          Thank you for choosing {settings.shopName || 'our workshop'}. Ride Safe!
        </div>

      </div>

    </div>
  );
}
