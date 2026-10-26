import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Download, Mail, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';
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
  const { shopSettings } = useAuth();

  useEffect(() => {
    fetchTodaySales();
  }, []);

  const fetchTodaySales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/counter/sales', {
        params: {
          date: 'today',
          search,
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
    e.preventDefault();
    fetchTodaySales();
  };

  const totalTodayPaise = sales
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.totalPaise, 0);

  const completedCount = sales.filter((s) => s.status === 'COMPLETED').length;

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Header & Metrics */}
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h4 className="text-white fw-bold m-0 brand-font">Today's Counter Invoices</h4>
            <p className="text-secondary small m-0 mt-0.5">Live transactions recorded during the current shift</p>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 px-3 rounded-3 bg-slate-900 border border-secondary border-opacity-25 text-end">
              <div className="text-secondary extra-small text-uppercase">Today's Revenue</div>
              <div className="text-info fw-bold font-monospace fs-5">{formatRupees(totalTodayPaise)}</div>
            </div>
            <div className="p-2.5 px-3 rounded-3 bg-slate-900 border border-secondary border-opacity-25 text-end">
              <div className="text-secondary extra-small text-uppercase">Invoices</div>
              <div className="text-white fw-bold fs-5">{completedCount}</div>
            </div>
            <button className="btn btn-secondary-glass btn-sm p-2" onClick={fetchTodaySales} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-3 mb-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><Search size={15} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search invoice number, customer phone or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-auto">
            <button type="submit" className="btn btn-primary-glass btn-sm">Search</button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
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
            <table className="table table-glass mb-0">
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
                      <span className="text-info fw-bold font-monospace">{sale.invoiceNo}</span>
                      {sale.status === 'CANCELLED' && (
                        <span className="badge bg-danger ms-2 extra-small">Cancelled</span>
                      )}
                    </td>
                    <td>
                      <div className="text-white fw-semibold small">{sale.customerSnapshot.name}</div>
                      <div className="text-secondary extra-small font-monospace">{sale.customerSnapshot.phone}</div>
                    </td>
                    <td>
                      <span className="badge bg-slate-800 text-light border border-secondary border-opacity-25 small">
                        {sale.items.reduce((acc, i) => acc + i.qty, 0)} units ({sale.items.length} items)
                      </span>
                    </td>
                    <td className="text-secondary small">{formatIST(sale.createdAt)}</td>
                    <td>
                      <span className="badge bg-success bg-opacity-10 text-success small">
                        {sale.paymentMode}
                      </span>
                    </td>
                    <td className="text-end text-white fw-bold font-monospace">
                      {formatRupees(sale.totalPaise)}
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1.5">
                        <button
                          className="btn btn-sm btn-secondary-glass p-1.5"
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
                          className="btn btn-sm btn-primary-glass p-1.5"
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
