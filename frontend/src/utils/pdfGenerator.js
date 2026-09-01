import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a crisp, professional A4 Tax Invoice PDF
 * Supports custom multi-brand workshops, dynamic currency and tax labels.
 */
export function downloadInvoicePDF(invoice, settings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const shopName = (settings?.shopName || 'MOTO WORKSHOP & SERVICE STUDIO').toUpperCase();
  const tagline = settings?.tagline || 'Multi-Brand Motorcycle Service, Modifications & Tuning';
  const address = settings?.address || '';
  const phone = settings?.contactNumber || '';
  const gstin = settings?.gstin || '';
  const upiId = settings?.upiId || '';
  const bankDetails = settings?.bankDetails || '';
  const currency = settings?.currency || 'Rs.';
  const taxLabel = settings?.taxLabel || 'GST';
  const terms = settings?.terms || 'Goods once sold cannot be returned. Workmanship guaranteed for 30 days.';

  const cust = invoice.customer || {
    name: invoice.customerName || 'Customer',
    phone: invoice.customerPhone || '',
    bikeModel: invoice.bikeModel || '',
    regNo: invoice.regNo || ''
  };

  const invoiceNo = invoice.invoiceNo || `#${invoice.id?.slice(-6).toUpperCase() || 'INV-001'}`;
  const invDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Header Background Bar (Subtle light slate)
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 12, 182, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 12, 182, 36, 'S');

  // Shop Name & Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(shopName, 18, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(tagline, 18, 25);

  const addressLines = doc.splitTextToSize(`${address} | Phone: ${phone}` + (gstin ? ` | ${taxLabel} No: ${gstin}` : ''), 110);
  doc.text(addressLines, 18, 30);

  // Invoice Number & Status on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE', 192, 20, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceNo, 192, 26, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${invDate}`, 192, 31, { align: 'right' });
  doc.text(`Mode: ${invoice.paymentMethod || 'UPI'}`, 192, 36, { align: 'right' });

  if (invoice.balanceDue > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`Balance Due: ${currency} ${invoice.balanceDue}`, 192, 42, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text('Status: FULLY PAID', 192, 42, { align: 'right' });
  }

  // Two Column Customer & Motorcycle Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 52, 182, 26, 2, 2, 'S');

  // Customer Details (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CUSTOMER DETAILS', 18, 58);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(cust.name, 18, 64);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Phone: ${cust.phone}`, 18, 70);

  // Vehicle Details (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('MOTORCYCLE & SERVICE SPECS', 110, 58);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(cust.bikeModel, 110, 64);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Reg / Chassis: ${cust.regNo || 'Bespoke'}` + (invoice.buildType ? `  |  Job: ${invoice.buildType}` : ''), 110, 70);
  if (invoice.currentKm > 0) {
    doc.text(`Odometer: ${invoice.currentKm} KM`, 110, 75);
  }

  // Items Table
  const tableData = (invoice.items || []).map((item, idx) => {
    const lineBase = (item.qty || 1) * (item.unitPrice || 0);
    const lineGst = lineBase * ((item.gstRate || 0) / 100);
    const lineTotal = lineBase + lineGst;
    return [
      idx + 1,
      item.partName + (item.isLabour ? ' (Labor/Service)' : ''),
      item.qty || 1,
      `${currency} ${(item.unitPrice || 0).toFixed(2)}`,
      `${item.gstRate || 0}%`,
      `${currency} ${lineTotal.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: 82,
    head: [['#', 'Description of Parts & Services', 'Qty', 'Unit Rate', `${taxLabel} %`, 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  // Bottom Summary Box (Right) & Terms (Left)
  const summaryX = 120;
  const summaryWidth = 76;

  // Calculation Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(summaryX, finalY, summaryWidth, 42, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal (Base):', summaryX + 4, finalY + 6);
  doc.text(`${currency} ${(invoice.subtotal || 0).toFixed(2)}`, summaryX + summaryWidth - 4, finalY + 6, { align: 'right' });

  doc.text(`Total ${taxLabel} Tax:`, summaryX + 4, finalY + 12);
  doc.text(`${currency} ${(invoice.totalGst || 0).toFixed(2)}`, summaryX + summaryWidth - 4, finalY + 12, { align: 'right' });

  if (invoice.discount > 0) {
    doc.setTextColor(21, 128, 61);
    doc.text('Discount:', summaryX + 4, finalY + 18);
    doc.text(`- ${currency} ${invoice.discount}`, summaryX + summaryWidth - 4, finalY + 18, { align: 'right' });
  }

  // Divider inside summary
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 4, finalY + 22, summaryX + summaryWidth - 4, finalY + 22);

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', summaryX + 4, finalY + 28);
  doc.text(`${currency} ${invoice.grandTotal || 0}`, summaryX + summaryWidth - 4, finalY + 28, { align: 'right' });

  if (invoice.advancePaid > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61);
    doc.text('Advance Paid:', summaryX + 4, finalY + 34);
    doc.text(`- ${currency} ${invoice.advancePaid}`, summaryX + summaryWidth - 4, finalY + 34, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text('Balance Due:', summaryX + 4, finalY + 39);
    doc.text(`${currency} ${invoice.balanceDue || 0}`, summaryX + summaryWidth - 4, finalY + 39, { align: 'right' });
  }

  // Left Column: Terms, UPI & Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('TERMS & WARRANTY CONDITIONS:', 14, finalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const termLines = doc.splitTextToSize(terms, 98);
  doc.text(termLines, 14, finalY + 10);

  let curY = finalY + 12 + (termLines.length * 3.5);

  if (upiId) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Pay via UPI: ${upiId}`, 14, curY);
    curY += 4.5;
  }

  if (bankDetails) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(bankDetails, 14, curY);
    curY += 4.5;
  }

  // Authorized Signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory / Workshop Manager', summaryX + 6, finalY + 62);
  doc.line(summaryX + 4, finalY + 58, summaryX + summaryWidth - 4, finalY + 58);

  // Footer Note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Thank you for trusting ${shopName}. Ride Safe!`, 105, 285, { align: 'center' });

  // Save the PDF
  const filename = `Invoice_${invoiceNo.replace(/[^a-zA-Z0-9-_]/g, '')}_${cust.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
