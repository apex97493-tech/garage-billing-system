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

  const shopName = (settings?.shopName || 'ROYAL ENFIELD WORKSHOP & SERVICE STUDIO').toUpperCase();
  const tagline = settings?.tagline || 'Motorcycle Service, Spares & Modifications';
  const address = settings?.address || '';
  const phone = settings?.contactNumber || '';
  const gstin = settings?.gstin || '';
  const upiId = settings?.upiId || '';
  const bankDetails = settings?.bankDetails || '';
  const currency = settings?.currency || 'Rs.';
  const taxLabel = settings?.taxLabel || 'GST';
  const terms = settings?.terms || 'Goods once sold cannot be returned. Workmanship guaranteed for 30 days.';

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

  // Shop Name, Logo & Details
  let textStartX = 18;
  if (settings?.logo) {
    try {
      doc.addImage(settings.logo, 18, 15, 18, 18);
      textStartX = 40;
    } catch (e) {
      textStartX = 18;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(shopName, textStartX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(tagline, textStartX, 25);

  const maxAddrWidth = textStartX === 40 ? 88 : 110;
  const addressLines = doc.splitTextToSize(`${address} | Phone: ${phone}` + (isGst && gstin ? ` | ${taxLabel} No: ${gstin}` : ''), maxAddrWidth);
  doc.text(addressLines, textStartX, 30);

  // Invoice Number & Status on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(billHeaderTitle, 192, 20, { align: 'right' });

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
    doc.text(`Kilometre: ${invoice.currentKm} KM`, 110, 75);
  }

  // Items Table
  const tableHeaders = isGst 
    ? ['#', 'Description of Parts & Services', 'Qty', `Rate (${currency})`, `${taxLabel} %`, `Total (${currency})`]
    : ['#', 'Description of Parts & Services', 'Qty', `Rate (${currency})`, `Total (${currency})`];

  const tableData = (invoice.items || []).map((item, idx) => {
    const lineBase = (item.qty || 1) * (item.unitPrice || 0);
    const lineGst = isGst ? lineBase * ((item.gstRate || 0) / 100) : 0;
    const lineTotal = lineBase + lineGst;
    
    if (isGst) {
      return [
        idx + 1,
        item.partName + (item.isLabour ? ' (Labor/Service)' : ''),
        item.qty || 1,
        `${currency} ${(item.unitPrice || 0).toFixed(2)}`,
        `${item.gstRate || 0}%`,
        `${currency} ${lineTotal.toFixed(2)}`
      ];
    } else {
      return [
        idx + 1,
        item.partName + (item.isLabour ? ' (Labor/Service)' : ''),
        item.qty || 1,
        `${currency} ${(item.unitPrice || 0).toFixed(2)}`,
        `${currency} ${lineTotal.toFixed(2)}`
      ];
    }
  });

  autoTable(doc, {
    startY: 82,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 2.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: isGst ? {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
    } : {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 95 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 29, fontStyle: 'bold' }
    }
  });

  const finalY = (doc).lastAutoTable.finalY || 150;

  // Financial Breakdown Block (Right)
  const calcBoxX = 120;
  let calcBoxY = finalY + 6;

  doc.setFillColor(248, 250, 252);
  doc.rect(calcBoxX, calcBoxY, 76, 42, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(calcBoxX, calcBoxY, 76, 42, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', calcBoxX + 4, calcBoxY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${currency} ${(invoice.subtotal || 0).toFixed(2)}`, calcBoxX + 72, calcBoxY + 7, { align: 'right' });

  let offset = 14;
  if (isGst && invoice.totalGst > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Total ${taxLabel}:`, calcBoxX + 4, calcBoxY + offset);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${currency} ${(invoice.totalGst || 0).toFixed(2)}`, calcBoxX + 72, calcBoxY + offset, { align: 'right' });
    offset += 7;
  }

  // Grand Total Line
  doc.setDrawColor(203, 213, 225);
  doc.line(calcBoxX + 2, calcBoxY + offset, calcBoxX + 74, calcBoxY + offset);
  offset += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', calcBoxX + 4, calcBoxY + offset);
  doc.text(`${currency} ${invoice.grandTotal || 0}`, calcBoxX + 72, calcBoxY + offset, { align: 'right' });

  if (invoice.advancePaid > 0) {
    offset += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(21, 128, 61);
    doc.text('Advance Paid:', calcBoxX + 4, calcBoxY + offset);
    doc.text(`- ${currency} ${invoice.advancePaid}`, calcBoxX + 72, calcBoxY + offset, { align: 'right' });

    offset += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('Balance Due:', calcBoxX + 4, calcBoxY + offset);
    doc.text(`${currency} ${invoice.balanceDue || 0}`, calcBoxX + 72, calcBoxY + offset, { align: 'right' });
  }

  // Terms & Conditions and Bank Details (Left)
  const termsX = 14;
  const termsY = finalY + 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TERMS & CONDITIONS', termsX, termsY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const splitTerms = doc.splitTextToSize(terms, 95);
  doc.text(splitTerms, termsX, termsY + 11);

  if (bankDetails) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Bank Account: ${bankDetails}`, termsX, termsY + 28);
  }

  if (upiId) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`UPI Payment: ${upiId}`, termsX, termsY + 34);
  }

  // Bottom Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `This is a computer-generated ${billHeaderTitle.toLowerCase()}. Authorized signature required.`,
    105,
    285,
    { align: 'center' }
  );

  const cleanFilename = `${(invoice.customer?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}_${invoiceNo.replace('#', '')}.pdf`;
  doc.save(cleanFilename);
}
