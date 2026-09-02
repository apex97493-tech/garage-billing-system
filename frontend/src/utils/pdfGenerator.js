import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

/**
 * Generate and download dealership standard Indian GST / Workshop invoice PDF
 */
export function downloadInvoicePDF(invoice, settings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const shopName = (settings?.shopName || 'ROYAL ENFIELD WORKSHOP STUDIO').toUpperCase();
  const tagline = settings?.tagline || 'Motorcycle Service, Spares & Modifications';
  const address = settings?.address || 'Industrial Area, Main Auto Market';
  const phone = settings?.contactNumber || '';
  const gstin = settings?.gstin || '';
  const upiId = settings?.upiId || '';
  const bankDetails = settings?.bankDetails || '';
  const rawCurrency = settings?.currency || 'Rs.';
  const currency = (rawCurrency === '₹' || rawCurrency.includes('₹')) ? 'Rs.' : rawCurrency;
  const terms = settings?.terms || '1. Goods once sold cannot be returned.\n2. Workmanship guaranteed for 30 days.\n3. All replaced old parts must be claimed at delivery.';

  const billType = invoice.billType || 'Tax Invoice';
  const isGst = billType === 'Tax Invoice';
  const billHeaderTitle = billType === 'Pre-Invoice'
    ? 'PRE-INVOICE'
    : (billType === 'Estimate' ? 'ESTIMATE / QUOTATION' : 'TAX INVOICE');

  const cust = invoice.customer || {
    name: invoice.customerName || 'Valued Client',
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

  const pageWidth = 190;
  const marginX = 10;

  // --- Top Badge ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(billHeaderTitle, marginX, 10);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.rect(marginX + billHeaderTitle.length * 2.8 + 4, 6.5, 45, 5);
  doc.text('ORIGINAL FOR RECIPIENT', marginX + billHeaderTitle.length * 2.8 + 6, 10);

  // --- 1. Main Workshop & Invoice Box ---
  const headerBoxY = 13;
  const headerBoxH = 30;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(marginX, headerBoxY, pageWidth, headerBoxH);

  // Split Divider
  const splitX = 125;
  doc.line(splitX, headerBoxY, splitX, headerBoxY + headerBoxH);

  // Logo & Shop Text
  let textLeft = marginX + 4;
  let textWidth = splitX - marginX - 6;

  if (settings?.logo) {
    try {
      doc.addImage(settings.logo, marginX + 3, headerBoxY + 4, 20, 20);
      textLeft = marginX + 26;
      textWidth = splitX - textLeft - 4;
    } catch (e) {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(shopName, textLeft, headerBoxY + 6, { maxWidth: textWidth });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(tagline, textLeft, headerBoxY + 11, { maxWidth: textWidth });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(address, textLeft, headerBoxY + 16, { maxWidth: textWidth });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Mobile: ${phone}` + (isGst && gstin ? `   GSTIN: ${gstin}` : ''), textLeft, headerBoxY + 25, { maxWidth: textWidth });

  // Invoice Details (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Invoice No.', splitX + 4, headerBoxY + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceNo, splitX + 4, headerBoxY + 11);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Invoice Date', splitX + 36, headerBoxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(invDate, splitX + 36, headerBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Payment Mode:', splitX + 4, headerBoxY + 22);
  doc.text(invoice.paymentMethod || 'UPI', splitX + 28, headerBoxY + 22);

  // --- 2. Customer & Vehicle Box (BILL TO) ---
  const billToY = headerBoxY + headerBoxH + 2;
  const billToH = 18;
  doc.rect(marginX, billToY, pageWidth, billToH);
  doc.line(splitX, billToY, splitX, billToY + billToH);

  // Strip Header
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, billToY, pageWidth, 5, 'F');
  doc.line(marginX, billToY + 5, marginX + pageWidth, billToY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('BILL TO / CUSTOMER DETAILS', marginX + 3, billToY + 3.5);
  doc.text('VEHICLE & SERVICE SPECS', splitX + 4, billToY + 3.5);

  // Customer Details (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(cust.name, marginX + 3, billToY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Mobile: ${cust.phone || 'N/A'}`, marginX + 3, billToY + 14);

  // Vehicle Details (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(cust.bikeModel, splitX + 4, billToY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Reg No: ${cust.regNo || 'Bespoke'}` + (invoice.currentKm > 0 ? `   |   ${invoice.currentKm} KM` : ''), splitX + 4, billToY + 14);

  // --- 3. Items Table using AutoTable ---
  const tableHeaders = isGst 
    ? [['S.NO.', 'ITEMS / DESCRIPTION OF WORK', 'QTY.', `RATE (${currency})`, 'TAX %', `AMOUNT (${currency})`]]
    : [['S.NO.', 'ITEMS / DESCRIPTION OF WORK', 'QTY.', `RATE (${currency})`, `AMOUNT (${currency})`]];

  let totalQty = 0;
  const tableRows = (invoice.items || []).map((item, idx) => {
    const q = Number(item.qty) || 1;
    totalQty += q;
    const lineBase = q * (Number(item.unitPrice) || 0);
    const lineGst = isGst ? lineBase * ((Number(item.gstRate) || 0) / 100) : 0;
    const lineTotal = lineBase + lineGst;

    if (isGst) {
      return [
        idx + 1,
        item.partName + (item.isLabour ? ' (Labor)' : ''),
        q,
        (Number(item.unitPrice) || 0).toFixed(2),
        `${item.gstRate || 0}%`,
        lineTotal.toFixed(2)
      ];
    }
    return [
      idx + 1,
      item.partName + (item.isLabour ? ' (Labor)' : ''),
      q,
      (Number(item.unitPrice) || 0).toFixed(2),
      lineTotal.toFixed(2)
    ];
  });

  const receivedAmt = invoice.advancePaid > 0 ? invoice.advancePaid : (invoice.balanceDue === 0 ? invoice.grandTotal : 0);

  // Summary Rows
  if (isGst) {
    tableRows.push([
      { content: 'TOTAL', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(totalQty), styles: { halign: 'center', fontStyle: 'bold' } },
      '',
      { content: `${currency} ${(invoice.totalGst || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${currency} ${(invoice.grandTotal || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
    ]);
    tableRows.push([
      { content: 'RECEIVED AMOUNT', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${currency} ${(Number(receivedAmt) || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
    ]);
    if (invoice.balanceDue > 0) {
      tableRows.push([
        { content: 'CURRENT BALANCE DUE', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', textColor: [154, 52, 18] } },
        { content: `${currency} ${(Number(invoice.balanceDue) || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [154, 52, 18] } }
      ]);
    }
  } else {
    tableRows.push([
      { content: 'TOTAL', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(totalQty), styles: { halign: 'center', fontStyle: 'bold' } },
      '',
      { content: `${currency} ${(invoice.grandTotal || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
    ]);
    tableRows.push([
      { content: 'RECEIVED AMOUNT', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${currency} ${(Number(receivedAmt) || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
    ]);
    if (invoice.balanceDue > 0) {
      tableRows.push([
        { content: 'CURRENT BALANCE DUE', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', textColor: [154, 52, 18] } },
        { content: `${currency} ${(Number(invoice.balanceDue) || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [154, 52, 18] } }
      ]);
    }
  }

  autoTable(doc, {
    startY: billToY + billToH + 2,
    margin: { left: marginX, right: marginX },
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      lineColor: [15, 23, 42],
      lineWidth: 0.25,
      cellPadding: 1.5
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: isGst ? {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 26, halign: 'right' }
    } : {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });

  let curFinalY = doc.lastAutoTable.finalY + 2;

  // --- 4. CGST / SGST Tax Breakdown Table (Only for Tax Invoice) ---
  if (isGst && invoice.totalGst > 0) {
    const halfGst = (Number(invoice.totalGst) || 0) / 2;
    autoTable(doc, {
      startY: curFinalY,
      margin: { left: marginX, right: marginX },
      head: [['Taxable Value', 'CGST (Rate % / Amount)', 'SGST (Rate % / Amount)', 'Total Tax Amount']],
      body: [[
        `${currency} ${(invoice.subtotal || 0).toFixed(2)}`,
        `9% (${currency} ${halfGst.toFixed(2)})`,
        `9% (${currency} ${halfGst.toFixed(2)})`,
        `${currency} ${(invoice.totalGst || 0).toFixed(2)}`
      ]],
      theme: 'grid',
      styles: {
        fontSize: 7,
        textColor: [15, 23, 42],
        lineColor: [15, 23, 42],
        lineWidth: 0.25,
        halign: 'center',
        cellPadding: 1.5
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold'
      }
    });
    curFinalY = doc.lastAutoTable.finalY + 2;
  }

  // --- 5. Total Amount (in words) ---
  doc.rect(marginX, curFinalY, pageWidth, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Amount (in words)', marginX + 3, curFinalY + 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(numberToWordsINR(invoice.grandTotal), marginX + 3, curFinalY + 7);

  curFinalY += 11;

  // --- 6. Bank Details, Terms, UPI & Signatory ---
  const bottomH = 26;
  doc.rect(marginX, curFinalY, pageWidth, bottomH);
  doc.line(splitX, curFinalY, splitX, curFinalY + bottomH);

  // Left: Bank & Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Terms & Conditions:', marginX + 3, curFinalY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(terms, marginX + 3, curFinalY + 8, { maxWidth: splitX - marginX - 6 });

  // Right: UPI & Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  if (upiId) {
    doc.text(`Instant UPI Payment ID: ${upiId}`, splitX + 4, curFinalY + 4);
  }

  doc.line(splitX + 10, curFinalY + bottomH - 6, marginX + pageWidth - 10, curFinalY + bottomH - 6);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory / Workshop Manager', splitX + 10, curFinalY + bottomH - 2, { align: 'center', maxWidth: pageWidth - splitX });

  // Save PDF
  doc.save(`${billHeaderTitle.replace(/\s+/g, '_')}_${invoiceNo}.pdf`);
}
