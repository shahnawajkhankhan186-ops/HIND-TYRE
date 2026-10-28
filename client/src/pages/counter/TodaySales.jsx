import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Download, Mail, RefreshCw, Calendar, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';
import ReceiptModal from '../../components/common/ReceiptModal';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';

export default function TodaySales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { user, shopSettings } = useAuth();

  useEffect(() => {
    fetchTodaySales();
  }, []);

  const fetchTodaySales = async (targetSearch = search) => {
    try {
      setLoading(true);
      const res = await api.get('/counter/sales', {
        params: {
          date: 'today',
          search: targetSearch?.trim() || undefined,
          limit: 50,
        },
      });
      if (res.data.success) {
        setSales(res.data.data.sales);
      }
    } catch (err) {
      toast.error('Failed to load today sales');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchTodaySales(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchTodaySales('');
  };

  const totalTodayPaise = sales
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.totalPaise, 0);

  const completedCount = sales.filter((s) => s.status === 'COMPLETED').length;

  return (
    <div className="page-container">
      {/* Header & Metrics */}
      <div className="page-header-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h1 className="page-title">Today's Counter Invoices</h1>
            <p className="page-subtitle">Live transactions recorded during the current shift</p>
          </div>

          <div className="d-flex align-items-center gap-3">
            {user?.role === 'ADMIN' && (
              <div className="p-2.5 px-3 rounded-3 text-end" style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                <div className="text-muted extra-small text-uppercase fw-semibold">Today's Revenue</div>
                <div className="fw-bold font-monospace fs-5" style={{ color: 'var(--text-on-light)' }}>{formatRupees(totalTodayPaise)}</div>
              </div>
            )}
            <div className="p-2.5 px-3 rounded-3 text-end" style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
              <div className="text-muted extra-small text-uppercase fw-semibold">
                {user?.role === 'ADMIN' ? 'Total Invoices' : 'My Invoices Today'}
              </div>
              <div className="fw-bold fs-5 text-dark">{completedCount}</div>
            </div>
            <button className="btn btn-outline-dark-custom btn-sm p-2 d-flex align-items-center justify-content-center" onClick={fetchTodaySales} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-bar-card">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-6 col-lg-5">
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
                placeholder="Search invoice number, customer phone or name..."
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
                title="Search today sales"
              >
                <Search size={14} />
                <span>Search</span>
              </button>
            </div>
          </div>
          {search && (
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1"
                onClick={handleClearSearch}
                title="Reset search"
              >
                <RefreshCw size={13} /> Reset
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="table-container-card">
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : sales.length === 0 ? (
          <EmptyState
            title="No sales yet today"
            message="Sales processed through Counter POS will appear here instantly."
            actionText="Process New Sale"
            onAction={() => navigate('/counter/new-sale')}
          />
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Date & Time</th>
                  <th>Payment</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>
                      <span className="fw-bold font-monospace text-dark">{sale.invoiceNo}</span>
                      {sale.status === 'CANCELLED' && (
                        <span className="badge-pill-danger ms-2 extra-small">Cancelled</span>
                      )}
                    </td>
                    <td>
                      <div className="text-dark fw-semibold small">{sale.customerSnapshot.name}</div>
                      <div className="text-muted extra-small font-monospace">{sale.customerSnapshot.phone}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border small">
                        {sale.items.reduce((acc, i) => acc + i.qty, 0)} units ({sale.items.length} items)
                      </span>
                    </td>
                    <td className="text-muted small">{formatIST(sale.createdAt)}</td>
                    <td>
                      <span className="badge-pill-yellow">
                        {sale.paymentMode}
                      </span>
                    </td>
                    <td className="text-end text-dark fw-bold font-monospace">
                      {formatRupees(sale.totalPaise)}
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1.5">
                        <button
                          className="btn btn-sm btn-outline-dark-custom p-1.5"
                          title="View Receipt"
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowReceipt(true);
                          }}
                        >
                          <Eye size={15} />
                        </button>
                        <a
                          href={`/api/sales/${sale._id}/receipt.pdf`}
                          download={`Invoice_${sale.invoiceNo}.pdf`}
                          className="btn btn-sm btn-accent p-1.5"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt View Modal */}
      {selectedSale && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          sale={selectedSale}
          shopSettings={shopSettings}
        />
      )}
    </div>
  );
}
