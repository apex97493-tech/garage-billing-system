import PDFDocument from 'pdfkit';

/**
 * Generate a clean, professional A4 Tax / Pre-Invoice / Estimate PDF Buffer on the backend
 */
export async function generateInvoicePdfBuffer(invoice, settings) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      const shopName = (settings?.shopName || 'ROYAL ENFIELD WORKSHOP & SERVICE STUDIO').toUpperCase();
      const tagline = settings?.tagline || 'Motorcycle Service, Spares & Modifications';
      const address = settings?.address || '';
      const phone = settings?.contactNumber || '';
      const gstin = settings?.gstin || '';
      const upiId = settings?.upiId || '';
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

      // Top Header Background
      doc.rect(36, 36, 523, 75).fillAndStroke('#f8fafc', '#cbd5e1');

      // Shop Name & Details
      doc.fillColor('#0f172a').fontSize(15).font('Helvetica-Bold').text(shopName, 48, 48);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(tagline, 48, 68);
      doc.fontSize(8).text(`${address}  |  Phone: ${phone}` + (isGst && gstin ? `  |  ${taxLabel}: ${gstin}` : ''), 48, 80, { width: 320 });

      // Invoice Details (Right Side)
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(billHeaderTitle, 380, 48, { align: 'right', width: 165 });
      doc.fontSize(10).text(invoiceNo, 380, 64, { align: 'right', width: 165 });
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(`Date: ${invDate}`, 380, 78, { align: 'right', width: 165 });
      doc.text(`Mode: ${invoice.paymentMethod || 'UPI'}`, 380, 90, { align: 'right', width: 165 });

      if (invoice.balanceDue > 0) {
        doc.fillColor('#b45309').font('Helvetica-Bold').text(`Balance: ${currency} ${invoice.balanceDue}`, 380, 100, { align: 'right', width: 165 });
      } else {
        doc.fillColor('#15803d').font('Helvetica-Bold').text('Status: FULLY PAID', 380, 100, { align: 'right', width: 165 });
      }

      // Customer & Vehicle Box
      doc.rect(36, 120, 523, 55).fillAndStroke('#ffffff', '#cbd5e1');

      // Customer Info
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('CUSTOMER DETAILS', 48, 128);
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(cust.name, 48, 140);
      doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(`Phone: ${cust.phone}`, 48, 154);

      // Vehicle Info
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('MOTORCYCLE & SERVICE SPECS', 300, 128);
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(cust.bikeModel, 300, 140);
      doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(`Reg / Chassis: ${cust.regNo || 'Bespoke'}` + (invoice.buildType ? `  |  Job: ${invoice.buildType}` : ''), 300, 154);
      if (invoice.currentKm > 0) {
        doc.text(`Kilometre: ${invoice.currentKm} KM`, 300, 164);
      }

      // Items Table Header
      let tableY = 185;
      doc.rect(36, tableY, 523, 20).fillAndStroke('#0f172a', '#0f172a');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 44, tableY + 6);
      doc.text('Description of Parts & Services', 70, tableY + 6);
      doc.text('Qty', 350, tableY + 6, { width: 30, align: 'center' });
      doc.text(`Rate (${currency})`, 390, tableY + 6, { width: 50, align: 'right' });
      if (isGst) {
        doc.text(`${taxLabel}%`, 450, tableY + 6, { width: 30, align: 'right' });
      }
      doc.text(`Total (${currency})`, 490, tableY + 6, { width: 60, align: 'right' });

      tableY += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(8).fillColor('#0f172a');
      (invoice.items || []).forEach((item, idx) => {
        const lineBase = (item.qty || 1) * (item.unitPrice || 0);
        const lineGst = isGst ? lineBase * ((item.gstRate || 0) / 100) : 0;
        const lineTotal = lineBase + lineGst;

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, tableY, 523, 18).fillAndStroke(rowBg, '#e2e8f0');

        doc.fillColor('#64748b').text(String(idx + 1), 44, tableY + 5);
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(item.partName + (item.isLabour ? ' (Service)' : ''), 70, tableY + 5, { width: 270 });
        doc.font('Helvetica').text(String(item.qty || 1), 350, tableY + 5, { width: 30, align: 'center' });
        doc.text((item.unitPrice || 0).toFixed(2), 390, tableY + 5, { width: 50, align: 'right' });
        if (isGst) {
          doc.text(`${item.gstRate || 0}%`, 450, tableY + 5, { width: 30, align: 'right' });
        }
        doc.font('Helvetica-Bold').text(lineTotal.toFixed(2), 490, tableY + 5, { width: 60, align: 'right' });

        tableY += 18;
      });

      tableY += 10;

      // Summary Box (Right)
      const sumBoxX = 350;
      const sumBoxWidth = 209;
      const boxHeight = (isGst && invoice.totalGst > 0) ? 75 : 62;
      doc.rect(sumBoxX, tableY, sumBoxWidth, boxHeight).fillAndStroke('#f8fafc', '#cbd5e1');

      doc.fontSize(8.5).font('Helvetica').fillColor('#475569');
      let currSumY = tableY + 8;
      doc.text('Subtotal:', sumBoxX + 10, currSumY);
      doc.text(`${currency} ${(invoice.subtotal || 0).toFixed(2)}`, sumBoxX + 100, currSumY, { width: 95, align: 'right' });

      if (isGst && invoice.totalGst > 0) {
        currSumY += 12;
        doc.text(`Total ${taxLabel}:`, sumBoxX + 10, currSumY);
        doc.text(`${currency} ${(invoice.totalGst || 0).toFixed(2)}`, sumBoxX + 100, currSumY, { width: 95, align: 'right' });
      }

      currSumY += 14;
      doc.moveTo(sumBoxX + 8, currSumY).lineTo(sumBoxX + sumBoxWidth - 8, currSumY).stroke('#cbd5e1');

      currSumY += 6;
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
      doc.text('Grand Total:', sumBoxX + 10, currSumY);
      doc.text(`${currency} ${invoice.grandTotal || 0}`, sumBoxX + 100, currSumY, { width: 95, align: 'right' });

      if (invoice.advancePaid > 0) {
        currSumY += 12;
        doc.font('Helvetica').fontSize(8.5).fillColor('#15803d');
        doc.text('Advance Paid:', sumBoxX + 10, currSumY);
        doc.text(`- ${currency} ${invoice.advancePaid}`, sumBoxX + 100, currSumY, { width: 95, align: 'right' });

        currSumY += 10;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#b45309');
        doc.text('Balance Due:', sumBoxX + 10, currSumY);
        doc.text(`${currency} ${invoice.balanceDue || 0}`, sumBoxX + 100, currSumY, { width: 95, align: 'right' });
      }

      // Terms & Conditions (Left)
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('TERMS & WARRANTY CONDITIONS:', 36, tableY + 10);
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(terms, 36, tableY + 22, { width: 290 });

      if (upiId) {
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(`Pay via UPI: ${upiId}`, 36, tableY + 55);
      }

      // Authorized Signatory
      doc.fillColor('#64748b').fontSize(7.5).text('Authorized Signatory / Workshop Manager', sumBoxX + 10, tableY + boxHeight + 25);
      doc.moveTo(sumBoxX + 10, tableY + boxHeight + 20).lineTo(sumBoxX + sumBoxWidth - 10, tableY + boxHeight + 20).stroke('#cbd5e1');

      // Footer
      doc.fillColor('#94a3b8').fontSize(7.5).text(`Thank you for choosing ${shopName}. Ride Safe!`, 36, 780, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
