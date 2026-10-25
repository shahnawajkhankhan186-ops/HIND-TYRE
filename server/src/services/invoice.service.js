const Sale = require('../models/Sale');

/**
 * Service to generate sequential invoice numbers in format HT-YYYYMMDD-0001
 */
class InvoiceService {
  /**
   * Generates next invoice number for today in IST
   */
  async getNextInvoiceNumber(session = null) {
    // Current IST date string YYYYMMDD
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (330 * 60000));

    const yyyy = ist.getFullYear();
    const mm = String(ist.getMonth() + 1).padStart(2, '0');
    const dd = String(ist.getDate()).padStart(2, '0');
    const prefix = `HT-${yyyy}${mm}${dd}-`;

    // Find the latest invoice with this prefix
    const latestSale = await Sale.findOne({
      invoiceNo: { $regex: `^${prefix}` },
    })
      .sort({ invoiceNo: -1 })
      .session(session);

    let nextSeq = 1;
    if (latestSale && latestSale.invoiceNo) {
      const parts = latestSale.invoiceNo.split('-');
      const lastSeqStr = parts[parts.length - 1];
      const parsedSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(parsedSeq)) {
        nextSeq = parsedSeq + 1;
      }
    }

    const seqStr = String(nextSeq).padStart(4, '0');
    return `${prefix}${seqStr}`;
  }
}

module.exports = new InvoiceService();
