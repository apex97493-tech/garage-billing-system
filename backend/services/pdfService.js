import PDFDocument from 'pdfkit';

/**
 * Generate a clean, professional A4 Tax Invoice PDF Buffer on the backend
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

      const shopName = (settings?.shopName || 'MOTO WORKSHOP STUDIO').toUpperCase();
      const tagline = settings?.tagline || 'Multi-Brand Motorcycle Service, Modifications & Tuning';
      const address = settings?.address || '';
      const phone = settings?.contactNumber || '';
      const gstin = settings?.gstin || '';
      const upiId = settings?.upiId || '';
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

      // Top Header Background
      doc.rect(36, 36, 523, 75).fillAndStroke('#f8fafc', '#cbd5e1');

      // Shop Name & Details
      doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(shopName, 48, 48);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(tagline, 48, 68);
      doc.fontSize(8).text(`${address}  |  Phone: ${phone}` + (gstin ? `  |  ${taxLabel}: ${gstin}` : ''), 48, 80, { width: 320 });

      // Invoice Details (Right Side)
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('TAX INVOICE', 400, 48, { align: 'right', width: 145 });
      doc.fontSize(10).text(invoiceNo, 400, 64, { align: 'right', width: 145 });
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(`Date: ${invDate}`, 400, 78, { align: 'right', width: 145 });
      doc.text(`Mode: ${invoice.paymentMethod || 'UPI'}`, 400, 90, { align: 'right', width: 145 });

      if (invoice.balanceDue > 0) {
        doc.fillColor('#b45309').font('Helvetica-Bold').text(`Balance: ${currency} ${invoice.balanceDue}`, 400, 100, { align: 'right', width: 145 });
      } else {
        doc.fillColor('#15803d').font('Helvetica-Bold').text('Status: FULLY PAID', 400, 100, { align: 'right', width: 145 });
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
        doc.text(`Odometer: ${invoice.currentKm} KM`, 300, 164);
      }

      // Items Table Header
      let tableY = 185;
      doc.rect(36, tableY, 523, 20).fillAndStroke('#0f172a', '#0f172a');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 44, tableY + 6);
      doc.text('Description of Parts & Services', 70, tableY + 6);
      doc.text('Qty', 350, tableY + 6, { width: 30, align: 'center' });
      doc.text(`Rate (${currency})`, 390, tableY + 6, { width: 50, align: 'right' });
      doc.text(`${taxLabel}%`, 450, tableY + 6, { width: 30, align: 'right' });
      doc.text(`Total (${currency})`, 490, tableY + 6, { width: 60, align: 'right' });

      tableY += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(8).fillColor('#0f172a');
      (invoice.items || []).forEach((item, idx) => {
        const lineBase = (item.qty || 1) * (item.unitPrice || 0);
        const lineGst = lineBase * ((item.gstRate || 0) / 100);
        const lineTotal = lineBase + lineGst;

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, tableY, 523, 18).fillAndStroke(rowBg, '#e2e8f0');

        doc.fillColor('#64748b').text(String(idx + 1), 44, tableY + 5);
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(item.partName + (item.isLabour ? ' (Service)' : ''), 70, tableY + 5, { width: 270 });
        doc.font('Helvetica').text(String(item.qty || 1), 350, tableY + 5, { width: 30, align: 'center' });
        doc.text((item.unitPrice || 0).toFixed(2), 390, tableY + 5, { width: 50, align: 'right' });
        doc.text(`${item.gstRate || 0}%`, 450, tableY + 5, { width: 30, align: 'right' });
        doc.font('Helvetica-Bold').text(lineTotal.toFixed(2), 490, tableY + 5, { width: 60, align: 'right' });

        tableY += 18;
      });

      tableY += 10;

      // Summary Box (Right)
      const sumBoxX = 350;
      const sumBoxWidth = 209;
      doc.rect(sumBoxX, tableY, sumBoxWidth, 85).fillAndStroke('#f8fafc', '#cbd5e1');

      doc.fontSize(8.5).font('Helvetica').fillColor('#475569');
      doc.text('Subtotal (Base):', sumBoxX + 10, tableY + 10);
      doc.text(`${currency} ${(invoice.subtotal || 0).toFixed(2)}`, sumBoxX + 100, tableY + 10, { width: 95, align: 'right' });

      doc.text(`Total ${taxLabel} Tax:`, sumBoxX + 10, tableY + 22);
      doc.text(`${currency} ${(invoice.totalGst || 0).toFixed(2)}`, sumBoxX + 100, tableY + 22, { width: 95, align: 'right' });

      if (invoice.discount > 0) {
        doc.fillColor('#15803d').text('Discount:', sumBoxX + 10, tableY + 34);
        doc.text(`- ${currency} ${invoice.discount}`, sumBoxX + 100, tableY + 34, { width: 95, align: 'right' });
      }

      doc.moveTo(sumBoxX + 8, tableY + 45).lineTo(sumBoxX + sumBoxWidth - 8, tableY + 45).stroke('#cbd5e1');

      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
      doc.text('Grand Total:', sumBoxX + 10, tableY + 52);
      doc.text(`${currency} ${invoice.grandTotal || 0}`, sumBoxX + 100, tableY + 52, { width: 95, align: 'right' });

      if (invoice.advancePaid > 0) {
        doc.font('Helvetica').fontSize(8.5).fillColor('#15803d');
        doc.text('Advance Paid:', sumBoxX + 10, tableY + 65);
        doc.text(`- ${currency} ${invoice.advancePaid}`, sumBoxX + 100, tableY + 65, { width: 95, align: 'right' });

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#b45309');
        doc.text('Balance Due:', sumBoxX + 10, tableY + 75);
        doc.text(`${currency} ${invoice.balanceDue || 0}`, sumBoxX + 100, tableY + 75, { width: 95, align: 'right' });
      }

      // Terms & Conditions (Left)
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('TERMS & WARRANTY CONDITIONS:', 36, tableY + 10);
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(terms, 36, tableY + 22, { width: 290 });

      if (upiId) {
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(`Pay via UPI: ${upiId}`, 36, tableY + 70);
      }

      // Authorized Signatory
      doc.fillColor('#64748b').fontSize(7.5).text('Authorized Signatory / Workshop Manager', sumBoxX + 10, tableY + 120);
      doc.moveTo(sumBoxX + 10, tableY + 115).lineTo(sumBoxX + sumBoxWidth - 10, tableY + 115).stroke('#cbd5e1');

      // Footer
      doc.fillColor('#94a3b8').fontSize(7.5).text(`Thank you for choosing ${shopName}. Ride Safe!`, 36, 780, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
