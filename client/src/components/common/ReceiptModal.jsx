import React, { useState } from 'react';
import { X, Download, Printer, Mail, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees, paiseToWordsINR } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';

export default function ReceiptModal({ isOpen, onClose, sale, shopSettings }) {
  const [resending, setResending] = useState(false);

  if (!isOpen || !sale) return null;

  const handleDownloadPDF = () => {
    const token = localStorage.getItem('token');
    const url = `/api/sales/${sale._id}/receipt.pdf`;
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${sale.invoiceNo}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Downloading official GST Tax Invoice PDF...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    try {
      setResending(true);
      const res = await api.post(`/api/sales/${sale._id}/resend-email`);
      if (res.data.success) {
        toast.success(res.data.message || 'Invoice email dispatched!');
      } else {
        toast.error('Failed to dispatch email.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Email dispatch failed');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content glass-modal border-0 shadow-2xl">
          {/* Header */}
          <div className="modal-header border-bottom border-secondary border-opacity-25 py-3">
            <div className="d-flex align-items-center gap-2">
              <ShieldCheck className="text-info" size={22} />
              <div>
                <h5 className="modal-title m-0 text-white fw-bold">GST Tax Invoice & Warranty</h5>
                <small className="text-secondary">{sale.invoiceNo}</small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-primary-glass d-flex align-items-center gap-1"
                onClick={handleDownloadPDF}
              >
                <Download size={15} /> Download PDF
              </button>
              <button
                className="btn btn-sm btn-secondary-glass d-flex align-items-center gap-1"
                onClick={handlePrint}
              >
                <Printer size={15} /> Print
              </button>
              <button
                className="btn btn-sm btn-secondary-glass d-flex align-items-center gap-1"
                onClick={handleResendEmail}
                disabled={resending}
              >
                <Mail size={15} /> {resending ? 'Sending...' : 'Resend Email'}
              </button>
              <button className="btn btn-sm text-secondary p-1" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body / Printable Receipt Canvas */}
          <div className="modal-body p-4 bg-dark bg-opacity-50" id="printable-receipt-canvas">
            {/* Shop Brand Header */}
            <div className="p-4 rounded-3 mb-3 bg-slate-900 border border-secondary border-opacity-25" style={{ background: '#0a0f1d' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <h3 className="fw-bold text-info m-0 brand-font">
                    {shopSettings?.shopName || 'HIND TYRES AND ACCESSORIES'}
                  </h3>
                  <p className="text-secondary small m-0 mt-1">
                    {shopSettings?.address || 'Shop No. 12-14, GT Road Bypass, Transport Nagar, Kanpur'}
                  </p>
                  <p className="text-secondary small m-0">
                    Phone: <span className="text-light">{shopSettings?.phone || '+91 98765 43210'}</span> | Email: <span className="text-light">{shopSettings?.email || 'contact@hindtyres.com'}</span>
                  </p>
                  <p className="text-secondary small m-0">
                    GSTIN: <span className="text-warning fw-bold">{shopSettings?.gstin || '09AAACH7409R1ZZ'}</span>
                  </p>
                </div>
                <div className="text-end">
                  <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-50 px-3 py-2 mb-2">
                    TAX INVOICE
                  </span>
                  <div className="text-white fw-bold">{sale.invoiceNo}</div>
                  <div className="text-secondary small">{formatIST(sale.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Billed To and Meta Box */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <div className="glass-panel p-3 h-100">
                  <div className="text-secondary small text-uppercase fw-bold mb-2">Billed To (Customer)</div>
                  <div className="text-white fw-bold fs-6">{sale.customerSnapshot.name}</div>
                  <div className="text-secondary small">Phone: <span className="text-light">{sale.customerSnapshot.phone}</span></div>
                  <div className="text-secondary small">Email: <span className="text-light">{sale.customerSnapshot.email}</span></div>
                  <div className="text-secondary small">Address: <span className="text-light">{sale.customerSnapshot.address}</span></div>
                  {sale.customerSnapshot.vehicleNumber && (
                    <div className="text-secondary small mt-1">
                      Vehicle: <span className="badge bg-secondary text-white">{sale.customerSnapshot.vehicleNumber}</span> {sale.customerSnapshot.vehicleModel && `(${sale.customerSnapshot.vehicleModel})`}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="glass-panel p-3 h-100">
                  <div className="text-secondary small text-uppercase fw-bold mb-2">Payment & Cashier Info</div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                    <span className="text-secondary">Payment Mode:</span>
                    <span className="badge bg-success bg-opacity-20 text-success fw-bold">{sale.paymentMode}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                    <span className="text-secondary">Payment Status:</span>
                    <span className="text-white fw-semibold">{sale.paymentStatus}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10 small">
                    <span className="text-secondary">Invoice Status:</span>
                    <span className={sale.status === 'COMPLETED' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                      {sale.status}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-secondary">Billed By:</span>
                    <span className="text-light">{sale.soldBy?.name || 'Counter Staff'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="glass-panel overflow-hidden mb-3">
              <table className="table table-glass mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item Description</th>
                    <th>Size</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Unit Rate</th>
                    <th className="text-end">GST %</th>
                    <th className="text-end">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-secondary">{idx + 1}</td>
                      <td>
                        <span className="text-white fw-semibold">{item.name}</span>
                        {item.company && <div className="text-secondary small">{item.company}</div>}
                      </td>
                      <td className="text-secondary font-monospace small">{item.size || '-'}</td>
                      <td className="text-center text-white fw-bold">{item.qty}</td>
                      <td className="text-end font-monospace">{formatRupees(item.unitPricePaise)}</td>
                      <td className="text-end font-monospace text-secondary">{item.gstPercent}%</td>
                      <td className="text-end font-monospace text-white fw-bold">{formatRupees(item.lineTotalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Words Breakdown */}
            <div className="row g-3">
              <div className="col-12 col-md-7">
                <div className="glass-panel p-3 h-100">
                  <div className="text-secondary small text-uppercase fw-bold mb-2">Amount in Words</div>
                  <div className="text-white fw-semibold small mb-3">
                    {paiseToWordsINR(sale.totalPaise)}
                  </div>
                  <div className="text-secondary small text-uppercase fw-bold mb-1">Warranty & Terms</div>
                  <p className="text-secondary extra-small m-0" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                    {shopSettings?.termsAndConditions ||
                      '1. Genuine manufacturer warranty applies. Retain invoice for warranty claims.'}
                  </p>
                </div>
              </div>

              <div className="col-12 col-md-5">
                <div className="glass-panel p-3">
                  <div className="d-flex justify-content-between py-1 small border-bottom border-secondary border-opacity-10">
                    <span className="text-secondary">Taxable Subtotal:</span>
                    <span className="font-monospace text-light">{formatRupees(sale.subtotalPaise)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 small border-bottom border-secondary border-opacity-10">
                    <span className="text-secondary">GST Total:</span>
                    <span className="font-monospace text-light">+ {formatRupees(sale.gstPaise)}</span>
                  </div>
                  {sale.discountPaise > 0 && (
                    <div className="d-flex justify-content-between py-1 small border-bottom border-secondary border-opacity-10 text-danger">
                      <span>Discount Applied:</span>
                      <span className="font-monospace">- {formatRupees(sale.discountPaise)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between py-2 mt-1">
                    <span className="text-white fw-bold fs-6">Grand Total:</span>
                    <span className="font-monospace text-info fw-bold fs-5">{formatRupees(sale.totalPaise)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top border-secondary border-opacity-25 py-2">
            <button className="btn btn-secondary-glass btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
