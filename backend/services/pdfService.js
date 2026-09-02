import PDFDocument from 'pdfkit';
import fs from 'fs';
import QRCode from 'qrcode';

/**
 * Convert number into standard Indian Currency words (e.g. "Thirty Two Thousand Three Hundred Ninety Four Rupees Only")
 */
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
 * Generate official Indian GST & Workshop Invoice A4 PDF Buffer matching dealership standard
 */
export async function generateInvoicePdfBuffer(invoice, settings) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 28,
        autoFirstPage: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
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

      const pageWidth = 539; // 595 - 28*2
      const leftMargin = 28;

      // --- Top Title Badge ---
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(billHeaderTitle, leftMargin, 16);
      doc.rect(leftMargin + billHeaderTitle.length * 6.5 + 10, 14, 130, 13).lineWidth(0.6).stroke('#94a3b8');
      doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold').text('ORIGINAL FOR RECIPIENT', leftMargin + billHeaderTitle.length * 6.5 + 14, 17);

      // --- 1. Main Workshop & Invoice Header Box ---
      const headerBoxY = 30;
      const headerBoxH = 82;
      doc.rect(leftMargin, headerBoxY, pageWidth, headerBoxH).lineWidth(0.8).stroke('#0f172a');
      
      // Vertical separator inside header box (X: 350)
      const splitX = 350;
      doc.moveTo(splitX, headerBoxY).lineTo(splitX, headerBoxY + headerBoxH).stroke('#0f172a');

      // Workshop Logo & Details (Left side)
      let textLeft = leftMargin + 10;
      let textMaxWidth = splitX - leftMargin - 18;
      
      if (settings?.logo) {
        try {
          let logoBuffer = null;
          if (settings.logo.startsWith('data:image/')) {
            const base64Data = settings.logo.split(';base64,').pop();
            logoBuffer = Buffer.from(base64Data, 'base64');
          } else if (fs.existsSync(settings.logo)) {
            logoBuffer = fs.readFileSync(settings.logo);
          }

          if (logoBuffer) {
            const cx = leftMargin + 32;
            const cy = headerBoxY + 41;
            const r = 24;

            doc.save();
            doc.circle(cx, cy, r).clip();
            doc.image(logoBuffer, cx - r, cy - r, { width: r * 2, height: r * 2, fit: [r * 2, r * 2], align: 'center', valign: 'center' });
            doc.restore();

            doc.circle(cx, cy, r).lineWidth(0.8).stroke('#cbd5e1');
            textLeft = leftMargin + 65;
            textMaxWidth = splitX - textLeft - 10;
          }
        } catch (e) {
          console.warn('[PDF Logo Embed]:', e.message);
        }
      }

      // Shop Text
      let curY = headerBoxY + 8;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(shopName, textLeft, curY, { width: textMaxWidth });
      curY = doc.y + 1;
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(tagline, textLeft, curY, { width: textMaxWidth });
      curY = doc.y + 1;
      doc.fontSize(7).fillColor('#64748b').text(address, textLeft, curY, { width: textMaxWidth, height: 16 });
      curY = doc.y + 1;
      doc.fontSize(7.5).fillColor('#0f172a').font('Helvetica-Bold');
      doc.text(`Mobile: ${phone}` + (isGst && gstin ? `    GSTIN: ${gstin}` : ''), textLeft, curY, { width: textMaxWidth });

      // Invoice Details (Right side of Header Box)
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('Invoice No.', splitX + 12, headerBoxY + 12);
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(invoiceNo, splitX + 12, headerBoxY + 22);

      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('Invoice Date', splitX + 105, headerBoxY + 12);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(invDate, splitX + 105, headerBoxY + 22);

      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('Payment Mode:', splitX + 12, headerBoxY + 48);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(invoice.paymentMethod || 'UPI', splitX + 80, headerBoxY + 48);

      // --- 2. Customer & Vehicle Details Box (BILL TO) ---
      const billToY = headerBoxY + headerBoxH + 4;
      const billToH = 46;
      doc.rect(leftMargin, billToY, pageWidth, billToH).lineWidth(0.8).stroke('#0f172a');

      // Gray Header Strip for BILL TO
      doc.rect(leftMargin, billToY, pageWidth, 13).fillAndStroke('#f1f5f9', '#0f172a');
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold');
      doc.text('BILL TO / CUSTOMER DETAILS', leftMargin + 8, billToY + 3.5);
      doc.text('VEHICLE & SERVICE SPECS', splitX + 12, billToY + 3.5);

      // Vertical separator
      doc.moveTo(splitX, billToY).lineTo(splitX, billToY + billToH).stroke('#0f172a');

      // Customer Info (Left)
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(cust.name || 'Valued Client', leftMargin + 8, billToY + 18);
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(`Mobile: ${cust.phone || 'N/A'}`, leftMargin + 8, billToY + 30);

      // Vehicle Info (Right)
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(cust.bikeModel || 'Royal Enfield Motorcycle', splitX + 12, billToY + 18);
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(`Reg No: ${cust.regNo || 'Bespoke'}` + (invoice.currentKm > 0 ? `    Kilometre: ${invoice.currentKm} KM` : ''), splitX + 12, billToY + 30);

      // --- 3. Items Table ---
      const tableY = billToY + billToH + 4;
      const colSNoW = 28;
      const colQtyW = 40;
      const colRateW = 62;
      const colGstW = isGst ? 48 : 0;
      const colAmountW = isGst ? 75 : 85;
      const colItemW = pageWidth - (colSNoW + colQtyW + colRateW + colGstW + colAmountW);

      const xSNo = leftMargin;
      const xItem = xSNo + colSNoW;
      const xQty = xItem + colItemW;
      const xRate = xQty + colQtyW;
      const xGst = xRate + colRateW;
      const xAmount = isGst ? (xGst + colGstW) : (xRate + colRateW);

      // Table Header Row
      const tableHeaderH = 16;
      doc.rect(leftMargin, tableY, pageWidth, tableHeaderH).fillAndStroke('#f1f5f9', '#0f172a');
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold');
      doc.text('S.NO.', xSNo, tableY + 4.5, { width: colSNoW, align: 'center' });
      doc.text('ITEMS / DESCRIPTION OF WORK', xItem + 6, tableY + 4.5, { width: colItemW - 12 });
      doc.text('QTY.', xQty, tableY + 4.5, { width: colQtyW, align: 'center' });
      doc.text(`RATE (${currency})`, xRate, tableY + 4.5, { width: colRateW - 6, align: 'right' });
      if (isGst) {
        doc.text('TAX %', xGst, tableY + 4.5, { width: colGstW, align: 'center' });
      }
      doc.text(`AMOUNT (${currency})`, xAmount, tableY + 4.5, { width: colAmountW - 8, align: 'right' });

      // Table Grid Verticals Header
      doc.moveTo(xItem, tableY).lineTo(xItem, tableY + tableHeaderH).stroke('#0f172a');
      doc.moveTo(xQty, tableY).lineTo(xQty, tableY + tableHeaderH).stroke('#0f172a');
      doc.moveTo(xRate, tableY).lineTo(xRate, tableY + tableHeaderH).stroke('#0f172a');
      if (isGst) {
        doc.moveTo(xGst, tableY).lineTo(xGst, tableY + tableHeaderH).stroke('#0f172a');
      }
      doc.moveTo(xAmount, tableY).lineTo(xAmount, tableY + tableHeaderH).stroke('#0f172a');

      let currentY = tableY + tableHeaderH;
      let totalQtyCount = 0;

      // Table Data Rows
      (invoice.items || []).forEach((item, idx) => {
        const rowH = 16;
        const q = Number(item.qty) || 1;
        totalQtyCount += q;
        const lineBase = q * (Number(item.unitPrice) || 0);
        const lineGst = isGst ? lineBase * ((Number(item.gstRate) || 0) / 100) : 0;
        const lineTotal = lineBase + lineGst;

        doc.rect(leftMargin, currentY, pageWidth, rowH).lineWidth(0.5).stroke('#0f172a');

        // Column vertical lines
        doc.moveTo(xItem, currentY).lineTo(xItem, currentY + rowH).stroke('#0f172a');
        doc.moveTo(xQty, currentY).lineTo(xQty, currentY + rowH).stroke('#0f172a');
        doc.moveTo(xRate, currentY).lineTo(xRate, currentY + rowH).stroke('#0f172a');
        if (isGst) {
          doc.moveTo(xGst, currentY).lineTo(xGst, currentY + rowH).stroke('#0f172a');
        }
        doc.moveTo(xAmount, currentY).lineTo(xAmount, currentY + rowH).stroke('#0f172a');

        // Cell Data
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(String(idx + 1), xSNo, currentY + 4, { width: colSNoW, align: 'center' });
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(item.partName + (item.isLabour ? ' (Labor)' : ''), xItem + 6, currentY + 4, { width: colItemW - 12, ellipsis: true });
        doc.font('Helvetica').text(String(q), xQty, currentY + 4, { width: colQtyW, align: 'center' });
        doc.text((Number(item.unitPrice) || 0).toFixed(2), xRate, currentY + 4, { width: colRateW - 6, align: 'right' });
        if (isGst) {
          doc.text(`${item.gstRate || 0}%`, xGst, currentY + 4, { width: colGstW, align: 'center' });
        }
        doc.font('Helvetica-Bold').text(lineTotal.toFixed(2), xAmount, currentY + 4, { width: colAmountW - 8, align: 'right' });

        currentY += rowH;
      });

      // --- 4. Bottom Table Totals (TOTAL, RECEIVED AMOUNT, BALANCE DUE) ---
      const sumRowH = 15;

      // 4A. TOTAL Row
      doc.rect(leftMargin, currentY, pageWidth, sumRowH).fillAndStroke('#f8fafc', '#0f172a');
      doc.moveTo(xQty, currentY).lineTo(xQty, currentY + sumRowH).stroke('#0f172a');
      doc.moveTo(xAmount, currentY).lineTo(xAmount, currentY + sumRowH).stroke('#0f172a');
      if (isGst) {
        doc.moveTo(xGst, currentY).lineTo(xGst, currentY + sumRowH).stroke('#0f172a');
      }

      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
      doc.text('TOTAL', xSNo, currentY + 4, { width: xQty - xSNo - 8, align: 'right' });
      doc.text(String(totalQtyCount), xQty, currentY + 4, { width: colQtyW, align: 'center' });
      if (isGst) {
        doc.text(`${currency} ${(invoice.totalGst || 0).toFixed(2)}`, xGst, currentY + 4, { width: colGstW - 4, align: 'right' });
      }
      doc.text(`${currency} ${(invoice.grandTotal || 0).toFixed(2)}`, xAmount, currentY + 4, { width: colAmountW - 8, align: 'right' });
      currentY += sumRowH;

      // 4B. RECEIVED AMOUNT Row
      const receivedAmt = invoice.advancePaid > 0 ? invoice.advancePaid : (invoice.balanceDue === 0 ? invoice.grandTotal : 0);
      doc.rect(leftMargin, currentY, pageWidth, sumRowH).lineWidth(0.5).stroke('#0f172a');
      doc.moveTo(xAmount, currentY).lineTo(xAmount, currentY + sumRowH).stroke('#0f172a');
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold');
      doc.text('RECEIVED AMOUNT', xSNo, currentY + 4, { width: xAmount - xSNo - 8, align: 'right' });
      doc.text(`${currency} ${(Number(receivedAmt) || 0).toFixed(2)}`, xAmount, currentY + 4, { width: colAmountW - 8, align: 'right' });
      currentY += sumRowH;

      // 4C. BALANCE DUE Row (if balance > 0)
      if (invoice.balanceDue > 0) {
        doc.rect(leftMargin, currentY, pageWidth, sumRowH).lineWidth(0.5).stroke('#0f172a');
        doc.moveTo(xAmount, currentY).lineTo(xAmount, currentY + sumRowH).stroke('#0f172a');
        doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold');
        doc.text('CURRENT BALANCE DUE', xSNo, currentY + 4, { width: xAmount - xSNo - 8, align: 'right' });
        doc.text(`${currency} ${(Number(invoice.balanceDue) || 0).toFixed(2)}`, xAmount, currentY + 4, { width: colAmountW - 8, align: 'right' });
        currentY += sumRowH;
      }

      // --- 5. CGST / SGST Tax Breakdown Table (Only for Tax Invoice) ---
      if (isGst && invoice.totalGst > 0) {
        currentY += 4;
        const taxBoxH = 26;
        doc.rect(leftMargin, currentY, pageWidth, taxBoxH).lineWidth(0.8).stroke('#0f172a');

        const taxCol1W = 120;
        const taxCol2W = 130;
        const taxCol3W = 130;
        const taxCol4W = pageWidth - (taxCol1W + taxCol2W + taxCol3W);

        const tX1 = leftMargin;
        const tX2 = tX1 + taxCol1W;
        const tX3 = tX2 + taxCol2W;
        const tX4 = tX3 + taxCol3W;

        // Header
        doc.rect(leftMargin, currentY, pageWidth, 12).fillAndStroke('#f1f5f9', '#0f172a');
        doc.moveTo(tX2, currentY).lineTo(tX2, currentY + taxBoxH).stroke('#0f172a');
        doc.moveTo(tX3, currentY).lineTo(tX3, currentY + taxBoxH).stroke('#0f172a');
        doc.moveTo(tX4, currentY).lineTo(tX4, currentY + taxBoxH).stroke('#0f172a');

        doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold');
        doc.text('Taxable Value', tX1, currentY + 3, { width: taxCol1W, align: 'center' });
        doc.text('CGST (Rate % / Amount)', tX2, currentY + 3, { width: taxCol2W, align: 'center' });
        doc.text('SGST (Rate % / Amount)', tX3, currentY + 3, { width: taxCol3W, align: 'center' });
        doc.text('Total Tax Amount', tX4, currentY + 3, { width: taxCol4W, align: 'center' });

        // Values
        const halfGst = (Number(invoice.totalGst) || 0) / 2;
        doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica');
        doc.text(`${currency} ${(invoice.subtotal || 0).toFixed(2)}`, tX1, currentY + 15, { width: taxCol1W, align: 'center' });
        doc.text(`9%  (${currency} ${halfGst.toFixed(2)})`, tX2, currentY + 15, { width: taxCol2W, align: 'center' });
        doc.text(`9%  (${currency} ${halfGst.toFixed(2)})`, tX3, currentY + 15, { width: taxCol3W, align: 'center' });
        doc.font('Helvetica-Bold').text(`${currency} ${(invoice.totalGst || 0).toFixed(2)}`, tX4, currentY + 15, { width: taxCol4W, align: 'center' });

        currentY += taxBoxH;
      }

      // --- 6. Total Amount in Words Box ---
      currentY += 4;
      const wordsBoxH = 22;
      doc.rect(leftMargin, currentY, pageWidth, wordsBoxH).lineWidth(0.8).stroke('#0f172a');
      doc.fillColor('#475569').fontSize(7).font('Helvetica').text('Total Amount (in words)', leftMargin + 8, currentY + 4);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(numberToWordsINR(invoice.grandTotal), leftMargin + 8, currentY + 12, { width: pageWidth - 16 });
      currentY += wordsBoxH;

      // --- 7. Bank Details, Terms, UPI QR & Signatory Box ---
      currentY += 4;
      const bottomBoxH = 76;
      doc.rect(leftMargin, currentY, pageWidth, bottomBoxH).lineWidth(0.8).stroke('#0f172a');

      const bSplitX = 330;
      doc.moveTo(bSplitX, currentY).lineTo(bSplitX, currentY + bottomBoxH).stroke('#0f172a');

      // Left: Bank Details & Terms
      let bY = currentY + 6;
      if (bankDetails) {
        doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('Bank Details:', leftMargin + 8, bY);
        doc.fillColor('#334155').fontSize(7).font('Helvetica').text(bankDetails, leftMargin + 8, bY + 9, { width: bSplitX - leftMargin - 16 });
        bY += 20;
      }

      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('Terms & Conditions:', leftMargin + 8, bY);
      doc.fillColor('#475569').fontSize(6.5).font('Helvetica').text(terms, leftMargin + 8, bY + 9, { width: bSplitX - leftMargin - 16, height: 36 });

      // Right: Dynamic Payment QR & Authorized Signatory
      let upiQrBuffer = null;
      if (upiId) {
        try {
          const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${encodeURIComponent(invoice.grandTotal)}&cu=INR`;
          upiQrBuffer = await QRCode.toBuffer(upiUri, { width: 48, margin: 1 });
        } catch (e) {}
      }

      if (upiQrBuffer) {
        doc.image(upiQrBuffer, bSplitX + 12, currentY + 8, { width: 46, height: 46 });
        doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold').text('Scan to Pay', bSplitX + 64, currentY + 12);
        doc.fillColor('#475569').fontSize(6.5).font('Helvetica').text(`UPI ID: ${upiId}`, bSplitX + 64, currentY + 22, { width: pageWidth - (bSplitX + 64 - leftMargin) });
      }

      // Authorized Signatory Line
      const sigLineY = currentY + bottomBoxH - 18;
      doc.moveTo(bSplitX + 30, sigLineY).lineTo(leftMargin + pageWidth - 16, sigLineY).stroke('#94a3b8');
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('Authorized Signatory / Workshop Manager', bSplitX + 16, sigLineY + 4, { width: pageWidth - (bSplitX - leftMargin) - 24, align: 'center' });

      // Clean footer
      doc.fillColor('#94a3b8').fontSize(6.8).text(`Thank you for choosing ${shopName}. Ride Safe!`, leftMargin, 816, { align: 'center', width: pageWidth });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
