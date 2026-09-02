import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Generate a clean, professional, high-end A4 Tax / Pre-Invoice / Estimate PDF Buffer on the backend for WhatsApp delivery
 */
export async function generateInvoicePdfBuffer(invoice, settings) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
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
      const address = settings?.address || 'Industrial Area, Auto Market';
      const phone = settings?.contactNumber || '';
      const gstin = settings?.gstin || '';
      const upiId = settings?.upiId || '';
      
      // Fix: PDFKit standard fonts do not support unicode ₹ and print as "¹". Use "Rs." safely.
      const rawCurrency = settings?.currency || 'Rs.';
      const currency = (rawCurrency === '₹' || rawCurrency.includes('₹')) ? 'Rs.' : rawCurrency;
      const taxLabel = settings?.taxLabel || 'GST';
      const terms = settings?.terms || '1. Goods once sold cannot be returned.\n2. Workmanship guaranteed for 30 days.\n3. All replaced old parts must be claimed at delivery.';

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

      // --- 1. Top Header Box ---
      const headerY = 36;
      const headerHeight = 78;
      doc.roundedRect(36, headerY, 523, headerHeight, 4).fillAndStroke('#f8fafc', '#cbd5e1');

      // Logo rendering (if uploaded)
      let textLeft = 48;
      let textMaxWidth = 310;
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
            const cx = 74;
            const cy = headerY + 39;
            const r = 26;

            // Circular clipping mask for logo
            doc.save();
            doc.circle(cx, cy, r).clip();
            doc.image(logoBuffer, cx - r, cy - r, { width: r * 2, height: r * 2, fit: [r * 2, r * 2], align: 'center', valign: 'center' });
            doc.restore();

            // Circular subtle border
            doc.circle(cx, cy, r).lineWidth(1).stroke('#cbd5e1');
            textLeft = 112;
            textMaxWidth = 250;
          }
        } catch (e) {
          console.warn('[PDF Logo Embed]:', e.message);
        }
      }

      // Shop Name & Details (Dynamic Flow)
      let currentHeaderY = headerY + 10;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(shopName, textLeft, currentHeaderY, { width: textMaxWidth });
      currentHeaderY = doc.y + 2;
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(tagline, textLeft, currentHeaderY, { width: textMaxWidth });
      currentHeaderY = doc.y + 2;
      doc.fontSize(7).fillColor('#64748b').text(address, textLeft, currentHeaderY, { width: textMaxWidth, height: 16 });
      currentHeaderY = doc.y + 2;
      doc.fontSize(7).fillColor('#475569').text(`Phone: ${phone}` + (isGst && gstin ? `  |  ${taxLabel}: ${gstin}` : ''), textLeft, currentHeaderY, { width: textMaxWidth });

      // Invoice Details & Title Pill (Right Side)
      const badgeWidth = Math.max(90, billHeaderTitle.length * 6.5 + 16);
      const badgeX = 559 - badgeWidth - 10;
      const badgeBg = billType === 'Pre-Invoice' ? '#1e3a8a' : (billType === 'Estimate' ? '#334155' : '#0f172a');
      doc.roundedRect(badgeX, headerY + 10, badgeWidth, 16, 3).fill(badgeBg);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold').text(billHeaderTitle, badgeX, headerY + 14, { width: badgeWidth, align: 'center' });

      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(invoiceNo, 370, headerY + 32, { align: 'right', width: 175 });
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(`Date: ${invDate}`, 370, headerY + 47, { align: 'right', width: 175 });
      doc.text(`Mode: ${invoice.paymentMethod || 'UPI'}`, 370, headerY + 59, { align: 'right', width: 175 });

      // --- 2. Customer & Vehicle Box ---
      const infoBoxY = headerY + headerHeight + 8;
      doc.roundedRect(36, infoBoxY, 523, 48, 4).fillAndStroke('#ffffff', '#cbd5e1');

      // Customer Info (Left)
      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('CUSTOMER DETAILS', 48, infoBoxY + 8);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(cust.name || 'Valued Client', 48, infoBoxY + 18, { width: 230, ellipsis: true });
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(`Phone: ${cust.phone || 'N/A'}`, 48, infoBoxY + 31);

      // Vehicle Info (Right)
      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('MOTORCYCLE & SERVICE SPECS', 300, infoBoxY + 8);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(cust.bikeModel || 'Royal Enfield', 300, infoBoxY + 18, { width: 245, ellipsis: true });
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(`Reg No: ${cust.regNo || 'Bespoke'}` + (invoice.currentKm > 0 ? `  |  Kilometre: ${invoice.currentKm} KM` : ''), 300, infoBoxY + 31);

      // --- 3. Items Table ---
      let tableY = infoBoxY + 56;
      doc.roundedRect(36, tableY, 523, 18, 2).fillAndStroke('#0f172a', '#0f172a');
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('#', 44, tableY + 5);
      doc.text('Description of Parts & Services', 68, tableY + 5);
      doc.text('Qty', 345, tableY + 5, { width: 30, align: 'center' });
      doc.text(`Rate (${currency})`, 380, tableY + 5, { width: 55, align: 'right' });
      if (isGst) {
        doc.text(`${taxLabel}%`, 440, tableY + 5, { width: 35, align: 'right' });
      }
      doc.text(`Total (${currency})`, 480, tableY + 5, { width: 70, align: 'right' });

      tableY += 18;

      // Table Rows
      (invoice.items || []).forEach((item, idx) => {
        const lineBase = (item.qty || 1) * (item.unitPrice || 0);
        const lineGst = isGst ? lineBase * ((item.gstRate || 0) / 100) : 0;
        const lineTotal = lineBase + lineGst;

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, tableY, 523, 16).fillAndStroke(rowBg, '#e2e8f0');

        doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text(String(idx + 1), 44, tableY + 4);
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(item.partName + (item.isLabour ? ' (Service)' : ''), 68, tableY + 4, { width: 270, ellipsis: true });
        doc.font('Helvetica').text(String(item.qty || 1), 345, tableY + 4, { width: 30, align: 'center' });
        doc.text((item.unitPrice || 0).toFixed(2), 380, tableY + 4, { width: 55, align: 'right' });
        if (isGst) {
          doc.text(`${item.gstRate || 0}%`, 440, tableY + 4, { width: 35, align: 'right' });
        }
        doc.font('Helvetica-Bold').text(lineTotal.toFixed(2), 480, tableY + 4, { width: 70, align: 'right' });

        tableY += 16;
      });

      tableY += 10;

      // --- 4. Summary Box & Terms ---
      const sumBoxX = 350;
      const sumBoxWidth = 209;
      const boxHeight = (isGst && invoice.totalGst > 0) ? 68 : 56;
      doc.roundedRect(sumBoxX, tableY, sumBoxWidth, boxHeight, 4).fillAndStroke('#f8fafc', '#cbd5e1');

      doc.fontSize(8).font('Helvetica').fillColor('#475569');
      let currSumY = tableY + 6;
      doc.text('Subtotal:', sumBoxX + 10, currSumY);
      doc.text(`${currency} ${(invoice.subtotal || 0).toFixed(2)}`, sumBoxX + 80, currSumY, { width: 115, align: 'right' });

      if (isGst && invoice.totalGst > 0) {
        currSumY += 11;
        doc.text(`Total ${taxLabel}:`, sumBoxX + 10, currSumY);
        doc.text(`${currency} ${(invoice.totalGst || 0).toFixed(2)}`, sumBoxX + 80, currSumY, { width: 115, align: 'right' });
      }

      currSumY += 12;
      doc.moveTo(sumBoxX + 8, currSumY).lineTo(sumBoxX + sumBoxWidth - 8, currSumY).stroke('#cbd5e1');

      currSumY += 5;
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
      doc.text('Grand Total:', sumBoxX + 10, currSumY);
      doc.text(`${currency} ${invoice.grandTotal || 0}`, sumBoxX + 80, currSumY, { width: 115, align: 'right' });

      if (invoice.advancePaid > 0) {
        currSumY += 11;
        doc.font('Helvetica').fontSize(7.5).fillColor('#166534');
        doc.text('Advance Paid:', sumBoxX + 10, currSumY);
        doc.text(`- ${currency} ${invoice.advancePaid}`, sumBoxX + 80, currSumY, { width: 115, align: 'right' });

        currSumY += 9;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#9a3412');
        doc.text('Balance Due:', sumBoxX + 10, currSumY);
        doc.text(`${currency} ${invoice.balanceDue || 0}`, sumBoxX + 80, currSumY, { width: 115, align: 'right' });
      }

      // Terms & Conditions (Left side)
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('TERMS & WARRANTY CONDITIONS:', 36, tableY + 4);
      doc.fillColor('#475569').fontSize(6.8).font('Helvetica').text(terms, 36, tableY + 15, { width: 290, height: 40 });

      if (upiId) {
        doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(`Instant UPI Payment ID: ${upiId}`, 36, tableY + 58);
      }

      // Authorized Signatory
      const signY = tableY + boxHeight + 24;
      doc.moveTo(sumBoxX + 10, signY).lineTo(sumBoxX + sumBoxWidth - 10, signY).stroke('#94a3b8');
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('Authorized Signatory / Workshop Manager', sumBoxX + 10, signY + 4, { width: sumBoxWidth - 20, align: 'center' });

      // Footer
      doc.fillColor('#94a3b8').fontSize(7).text(`Thank you for choosing ${shopName}. Safe Riding!`, 36, 785, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
