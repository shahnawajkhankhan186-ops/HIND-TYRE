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
  Clock
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

  // Selected Sale for Receipt Modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Cancel Sale Dialog
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [page, dateFilter, paymentMode, status]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/sales', {
        params: {
          page,
          limit: 20,
          search,
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
    e.preventDefault();
    setPage(1);
    fetchSales();
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
            <h1 className="page-title">Sales & GST Invoices Ledger</h1>
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
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><Search size={15} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search invoice no, customer name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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

          <div className="col-12 col-md-auto ms-auto">
            <button type="submit" className="btn btn-outline-dark-custom btn-sm w-100">Filter</button>
          </div>
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
                          {/* View Receipt */}
                          <button
                            className="btn btn-sm btn-outline-dark-custom p-1.5"
                            title="View Receipt"
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowReceiptModal(true);
                            }}
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

      {/* Receipt Modal */}
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
        message={`Are you sure you want to cancel this invoice? This will run an atomic transaction to mark the invoice as CANCELLED and immediately restore all ${saleToCancel?.items?.reduce((a, b) => a + b.qty, 0)} units back into your live inventory.`}
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
