import React from 'react';
import { X, Download, Printer, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getReceiptPdfUrl } from '../../lib/api';
import { formatRupees, paiseToWordsINR } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';

export default function ReceiptModal({ isOpen, onClose, sale, shopSettings }) {
  if (!isOpen || !sale) return null;

  const handleDownloadPDF = () => {
    const url = getReceiptPdfUrl(sale._id);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${sale.invoiceNo}.pdf`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Downloading Invoice PDF...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-2xl" style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          {/* Header */}
          <div className="modal-header border-bottom py-3" style={{ borderColor: 'var(--border-light)' }}>
            <div className="d-flex align-items-center gap-2">
              <ShieldCheck style={{ color: 'var(--accent)' }} size={24} />
              <div>
                <h5 className="modal-title m-0 fw-bold" style={{ color: 'var(--text-on-light)' }}>Invoice & Warranty Receipt</h5>
                <small className="text-muted font-monospace">{sale.invoiceNo}</small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1.5 gap-sm-2">
              <button
                className="btn btn-sm btn-accent d-flex align-items-center gap-1 px-2 px-sm-3"
                onClick={handleDownloadPDF}
                title="Download Receipt PDF"
              >
                <Download size={15} /> <span className="d-none d-sm-inline">Download PDF</span>
              </button>
              <button
                className="btn btn-sm btn-outline-dark-custom d-flex align-items-center gap-1 px-2 px-sm-3"
                onClick={handlePrint}
                title="Print Receipt"
              >
                <Printer size={15} /> <span className="d-none d-sm-inline">Print</span>
              </button>
              <button className="btn btn-sm text-secondary p-1" onClick={onClose} title="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body / Printable Receipt Canvas */}
          <div className="modal-body p-2.5 p-sm-4" id="printable-receipt-canvas" style={{ background: 'var(--bg-light)' }}>
            {/* Shop Brand Header */}
            <div className="p-3 p-sm-4 rounded-3 mb-3 text-white" style={{ background: 'var(--bg-black)', border: '1px solid var(--border-dark)' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <h3 className="fw-bold m-0" style={{ color: 'var(--accent)', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.5px' }}>
                    {shopSettings?.shopName || 'HIND TYRES & ACCESSORIES'}
                  </h3>
                  <p className="text-secondary small m-0 mt-1" style={{ color: '#A9AEB8' }}>
                    {shopSettings?.address || 'Shop No. 12-14, GT Road Bypass, Transport Nagar, Kanpur'}
                  </p>
                  <p className="text-secondary small m-0" style={{ color: '#A9AEB8' }}>
                    Phone: <span className="text-white">{shopSettings?.phone || '+91 98765 43210'}</span> | Email: <span className="text-white">{shopSettings?.email || 'contact@hindtyres.com'}</span>
                  </p>
                </div>
                <div className="text-end">
                  <span className="badge px-3 py-1.5 mb-2 fw-bold text-dark" style={{ background: 'var(--accent)' }}>
                    RETAIL INVOICE
                  </span>
                  <div className="text-white fw-bold font-monospace">{sale.invoiceNo}</div>
                  <div className="small" style={{ color: '#A9AEB8' }}>{formatIST(sale.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Billed To and Meta Box */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <div className="card-clean p-3 h-100 bg-white">
                  <div className="small text-uppercase fw-bold mb-2" style={{ color: 'var(--text-muted)' }}>Billed To (Customer)</div>
                  <div className="fw-bold fs-6" style={{ color: 'var(--text-on-light)' }}>{sale.customerSnapshot.name}</div>
                  <div className="small text-muted">Phone: <span className="text-dark fw-medium font-monospace">{sale.customerSnapshot.phone}</span></div>
                  <div className="small text-muted">Email: <span className="text-dark fw-medium">{sale.customerSnapshot.email || '-'}</span></div>
                  <div className="small text-muted">Address: <span className="text-dark">{sale.customerSnapshot.address || '-'}</span></div>
                  {sale.customerSnapshot.vehicleNumber && (
                    <div className="small mt-1 text-muted">
                      Vehicle: <span className="badge bg-dark text-white font-monospace">{sale.customerSnapshot.vehicleNumber}</span> {sale.customerSnapshot.vehicleModel && `(${sale.customerSnapshot.vehicleModel})`}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="card-clean p-3 h-100 bg-white">
                  <div className="small text-uppercase fw-bold mb-2" style={{ color: 'var(--text-muted)' }}>Payment & Cashier Info</div>
                  <div className="d-flex justify-content-between py-1 border-bottom small" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="text-muted">Payment Mode:</span>
                    <span className="badge-pill-yellow font-monospace">{sale.paymentMode}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="text-muted">Payment Status:</span>
                    <span className="text-dark fw-semibold">{sale.paymentStatus}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="text-muted">Invoice Status:</span>
                    <span className={sale.status === 'COMPLETED' ? 'badge-pill-success' : 'badge-pill-danger'}>
                      {sale.status}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-muted">Cashier:</span>
                    <span className="text-dark fw-medium">{sale.soldBy?.name || 'Counter Staff'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="card-clean overflow-hidden mb-3 bg-white">
              <div className="table-responsive">
                <table className="table table-custom mb-0 text-nowrap">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Description</th>
                      <th>Size</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Unit Rate</th>
                      <th className="text-end">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <span className="fw-semibold text-dark">{item.name}</span>
                          {item.company && <div className="text-muted small">{item.company}</div>}
                        </td>
                        <td className="text-muted font-monospace small">{item.size || '-'}</td>
                        <td className="text-center fw-bold text-dark">{item.qty}</td>
                        <td className="text-end font-monospace">{formatRupees(item.unitPricePaise)}</td>
                        <td className="text-end font-monospace fw-bold text-dark">{formatRupees(item.lineTotalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Words Breakdown */}
            <div className="row g-3">
              <div className="col-12 col-md-7">
                <div className="card-clean p-3 h-100 bg-white">
                  <div className="small text-uppercase fw-bold mb-1" style={{ color: 'var(--text-muted)' }}>Amount in Words</div>
                  <div className="fw-semibold small mb-3 text-dark">
                    {paiseToWordsINR(sale.totalPaise)}
                  </div>
                  <div className="small text-uppercase fw-bold mb-1" style={{ color: 'var(--text-muted)' }}>Warranty & Terms</div>
                  <p className="text-muted extra-small m-0" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                    {shopSettings?.termsAndConditions ||
                      '1. Genuine manufacturer warranty applies. Retain invoice for warranty claims.'}
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-5">
                <div className="card-clean p-3 bg-white">
                  <div className="d-flex justify-content-between py-1 small border-bottom" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="text-muted">Subtotal:</span>
                    <span className="font-monospace text-dark">{formatRupees(sale.subtotalPaise)}</span>
                  </div>
                  {sale.discountPaise > 0 && (
                    <div className="d-flex justify-content-between py-1 small border-bottom text-danger" style={{ borderColor: 'var(--border-light)' }}>
                      <span>Discount Applied:</span>
                      <span className="font-monospace">- {formatRupees(sale.discountPaise)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between py-2 mt-2 px-2 rounded" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
                    <span className="fw-bold fs-6 text-dark">Grand Total:</span>
                    <span className="font-monospace fw-bold fs-5 text-dark">{formatRupees(sale.totalPaise)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top py-2" style={{ borderColor: 'var(--border-light)' }}>
            <button className="btn btn-outline-dark-custom btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
