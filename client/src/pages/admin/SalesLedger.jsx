import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Download,
  Mail,
  Ban,
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';
import ReceiptModal from '../../components/common/ReceiptModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

export default function SalesLedger() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const { shopSettings } = useAuth();

  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Sale for Receipt Modal & Detail Modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [detailSale, setDetailSale] = useState(null);

  // Cancel Sale Dialog
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [page, dateFilter, paymentMode, status]);

  const fetchSales = async (targetPage = page, targetSearch = search) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/sales', {
        params: {
          page: targetPage,
          limit: 20,
          search: targetSearch?.trim() || undefined,
          date: dateFilter,
          startDate: dateFilter === 'custom' ? startDate : undefined,
          endDate: dateFilter === 'custom' ? endDate : undefined,
          paymentMode: paymentMode || undefined,
          status: status || undefined,
        },
      });
      if (res.data.success) {
        setSales(res.data.data.sales);
        setTotalPages(res.data.data.pages);
        setTotalCount(res.data.data.total);
      }
    } catch (err) {
      toast.error('Failed to load sales ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchSales(1, search);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    fetchSales(1, '');
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setPaymentMode('');
    setStatus('');
    setPage(1);
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/sales', { params: { page: 1, limit: 20 } });
        if (res.data.success) {
          setSales(res.data.data.sales);
          setTotalPages(res.data.data.pages);
          setTotalCount(res.data.data.total);
        }
      } catch (_) {} finally { setLoading(false); }
    })();
  };

  const handleConfirmCancel = async () => {
    if (!saleToCancel) return;
    if (!cancelReason.trim()) {
      return toast.error('A cancellation reason is mandatory');
    }

    try {
      setCancelling(true);
      const res = await api.post(`/sales/${saleToCancel._id}/cancel`, {
        reason: cancelReason.trim(),
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Sale cancelled and inventory restored successfully!');
        setSaleToCancel(null);
        setCancelReason('');
        fetchSales();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel sale');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h1 className="page-title">Sales & Invoices Ledger</h1>
            <p className="page-subtitle">
              Complete invoice records, customer details, PDF receipts, and audited cancellation
            </p>
          </div>
          <button className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5" onClick={fetchSales}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-card">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <button
                type="submit"
                className="input-group-text bg-white text-muted border-end-0"
                style={{ cursor: 'pointer' }}
                title="Click to search"
              >
                <Search size={15} />
              </button>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search invoice no, customer name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-2"
                  onClick={handleClearSearch}
                  title="Clear search text"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="btn btn-accent btn-sm fw-bold d-flex align-items-center gap-1.5 px-3"
                title="Search invoices"
              >
                <Search size={14} />
                <span>Search</span>
              </button>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <>
              <div className="col-6 col-md-2">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-6 col-md-2">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Payment Modes</option>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="CARD">CARD</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {(search || dateFilter !== 'all' || paymentMode || status) && (
            <div className="col-auto ms-auto">
              <button
                type="button"
                className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1"
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                <RefreshCw size={13} /> Reset
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Sales Invoices Table */}
      <div className="table-container-card">
        {loading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : sales.length === 0 ? (
          <div className="p-5 text-center text-muted">No invoices matching criteria.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Date & Time (IST)</th>
                  <th>Items Billed</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-end">Total (₹)</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const isCancelled = sale.status === 'CANCELLED';
                  return (
                    <tr key={sale._id} className={isCancelled ? 'opacity-60' : ''}>
                      <td>
                        <span className="text-dark font-monospace fw-bold">{sale.invoiceNo}</span>
                      </td>
                      <td>
                        <div className="text-dark fw-semibold small">{sale.customerSnapshot.name}</div>
                        <div className="text-muted extra-small font-monospace">{sale.customerSnapshot.phone}</div>
                      </td>
                      <td className="text-muted small font-monospace">{formatIST(sale.createdAt)}</td>
                      <td>
                        <span className="badge bg-light text-dark border extra-small">
                          {sale.items.reduce((acc, i) => acc + i.qty, 0)} units ({sale.items.length} items)
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border extra-small">
                          {sale.paymentMode}
                        </span>
                      </td>
                      <td>
                        {isCancelled ? (
                          <span className="badge badge-pill-danger">CANCELLED</span>
                        ) : (
                          <span className="badge badge-pill-success">COMPLETED</span>
                        )}
                      </td>
                      <td className="text-end font-monospace text-dark fw-bold">
                        {formatRupees(sale.totalPaise)}
                      </td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1.5">
                          {/* View Sale Details with Godowns */}
                          <button
                            className="btn btn-sm btn-outline-dark-custom p-1.5"
                            title="View Invoice & Warehouse Details"
                            onClick={() => setDetailSale(sale)}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Download PDF */}
                          <a
                            href={`/api/sales/${sale._id}/receipt.pdf`}
                            download={`Invoice_${sale.invoiceNo}.pdf`}
                            className="btn btn-sm btn-accent p-1.5"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </a>

                          {/* Cancel Sale (if not already cancelled) */}
                          {!isCancelled && (
                            <button
                              className="btn btn-sm btn-outline-danger p-1.5"
                              title="Cancel Sale & Restore Stock"
                              onClick={() => {
                                setSaleToCancel(sale);
                                setCancelReason('');
                              }}
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center card-clean bg-white p-2 px-3">
          <small className="text-muted">
            Page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong> ({totalCount} total invoices)
          </small>
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-dark-custom"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-outline-dark-custom"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Admin Sale Detail Modal showing Godowns of each line item */}
      {detailSale && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF' }}>
              <div className="modal-header border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <Receipt style={{ color: 'var(--accent-dark)' }} size={20} />
                  <div>
                    <h5 className="modal-title text-dark fw-bold m-0">Invoice Detail &amp; Warehouse Allocation</h5>
                    <small className="text-muted font-monospace">{detailSale.invoiceNo}</small>
                  </div>
                </div>
                <button type="button" className="btn btn-sm text-muted" onClick={() => setDetailSale(null)}>✕</button>
              </div>

              <div className="modal-body py-3">
                {/* Meta details */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-2 bg-light border">
                      <div className="extra-small text-muted text-uppercase fw-bold mb-1">Customer</div>
                      <div className="fw-bold text-dark">{detailSale.customerSnapshot.name}</div>
                      <div className="small text-muted">Phone: <span className="font-monospace text-dark">{detailSale.customerSnapshot.phone}</span></div>
                      <div className="small text-muted">Email: <span className="text-dark">{detailSale.customerSnapshot.email || '-'}</span></div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-2 bg-light border">
                      <div className="extra-small text-muted text-uppercase fw-bold mb-1">Billing Summary</div>
                      <div className="d-flex justify-content-between small py-0.5">
                        <span className="text-muted">Date:</span>
                        <span className="text-dark">{formatIST(detailSale.createdAt)}</span>
                      </div>
                      <div className="d-flex justify-content-between small py-0.5">
                        <span className="text-muted">Payment:</span>
                        <span className="badge-pill-yellow font-monospace">{detailSale.paymentMode}</span>
                      </div>
                      <div className="d-flex justify-content-between small py-0.5">
                        <span className="text-muted">Status:</span>
                        <span className={detailSale.status === 'COMPLETED' ? 'badge-pill-success' : 'badge-pill-danger'}>
                          {detailSale.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table showing Godowns */}
                <div className="table-responsive border rounded-2 mb-3">
                  <table className="table table-custom mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Description</th>
                        <th>Size</th>
                        <th>Warehouse Sold From</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Rate (₹)</th>
                        <th className="text-end">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailSale.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="text-muted">{idx + 1}</td>
                          <td className="text-dark fw-semibold">{item.name}</td>
                          <td className="text-muted font-monospace small">{item.size || '-'}</td>
                          <td>
                            <span className="badge bg-dark text-white font-monospace extra-small">
                              {item.godown?.name ? `${item.godown.name} (${item.godown.code})` : item.godown?.code || 'Godown 1 (G1)'}
                            </span>
                          </td>
                          <td className="text-center text-dark fw-bold">{item.qty}</td>
                          <td className="text-end font-monospace">{formatRupees(item.unitPricePaise, false)}</td>
                          <td className="text-end font-monospace text-dark fw-bold">{formatRupees(item.lineTotalPaise, false)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Grand total */}
                <div className="p-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <span className="text-dark fw-bold">Grand Total:</span>
                  <span className="text-dark fw-bold font-monospace fs-5">{formatRupees(detailSale.totalPaise)}</span>
                </div>
              </div>

              <div className="modal-footer border-top py-2.5 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-dark-custom btn-sm"
                  onClick={() => {
                    setSelectedSale(detailSale);
                    setShowReceiptModal(true);
                    setDetailSale(null);
                  }}
                >
                  Print Customer Receipt
                </button>
                <button type="button" className="btn btn-dark-solid btn-sm" onClick={() => setDetailSale(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Receipt Modal */}
      {selectedSale && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          sale={selectedSale}
          shopSettings={shopSettings}
        />
      )}

      {/* Custom ConfirmDialog for Sale Cancellation */}
      <ConfirmDialog
        isOpen={!!saleToCancel}
        title={`Cancel Invoice ${saleToCancel?.invoiceNo}?`}
        message={`Are you sure you want to cancel this invoice? This will run an atomic transaction to mark the invoice as CANCELLED and immediately restore all ${saleToCancel?.items?.reduce((a, b) => a + b.qty, 0)} units back into their respective godowns in your live inventory.`}
        confirmText="Cancel Sale & Restore Stock"
        variant="danger"
        isLoading={cancelling}
        showInput={true}
        inputLabel="Mandatory Reason for Cancellation"
        inputValue={cancelReason}
        onInputChange={setCancelReason}
        inputPlaceholder="e.g. Customer returned items / incorrect size selected by staff"
        inputRequired={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setSaleToCancel(null);
          setCancelReason('');
        }}
      />
    </div>
  );
}
