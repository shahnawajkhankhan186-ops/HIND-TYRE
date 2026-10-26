import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Car, Eye, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Customer History Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customerSales, setCustomerSales] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers', {
        params: { page, limit: 15, search },
      });
      if (res.data.success) {
        setCustomers(res.data.data.customers);
        setTotalPages(res.data.data.pages);
        setTotalCount(res.data.data.total);
      }
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleViewHistory = async (cust) => {
    try {
      setSelectedCustomer(cust);
      setShowHistoryModal(true);
      setHistoryLoading(true);
      const res = await api.get(`/admin/customers/${cust._id}`);
      if (res.data.success) {
        setCustomerSales(res.data.data.sales);
      }
    } catch (err) {
      toast.error('Failed to load customer purchase history');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Header */}
      <div className="card-clean bg-white p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-dark fw-bold m-0 brand-font">Customer Directory & Purchase Ledger</h3>
            <p className="text-muted small m-0 mt-0.5">
              Registered vehicle owners, lifetime invoice history & warranty profiles
            </p>
          </div>
          <button className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5" onClick={fetchCustomers}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-clean bg-white p-3 mb-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><Search size={15} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by customer name, 10-digit phone, or vehicle number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-2">
            <button type="submit" className="btn btn-outline-dark-custom btn-sm w-100">Search</button>
          </div>
        </form>
      </div>

      {/* Customers Table */}
      <div className="card-clean bg-white overflow-hidden mb-3">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : customers.length === 0 ? (
          <div className="p-5 text-center text-muted">No customer records found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Email & Address</th>
                  <th>Vehicle Details</th>
                  <th className="text-center">Invoices</th>
                  <th className="text-end">Lifetime Purchases</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span className="text-dark fw-bold">{c.name}</span>
                    </td>
                    <td className="text-dark font-monospace">{c.phone}</td>
                    <td>
                      <div className="text-muted small">{c.email}</div>
                      <div className="text-muted extra-small truncate" style={{ maxWidth: '220px' }}>
                        {c.address}
                      </div>
                    </td>
                    <td>
                      {c.vehicleNumber ? (
                        <div>
                          <span className="badge bg-light text-dark border font-monospace extra-small">
                            {c.vehicleNumber}
                          </span>
                          {c.vehicleModel && (
                            <div className="text-muted extra-small">{c.vehicleModel}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted extra-small">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border extra-small">{c.totalInvoicesCount} bills</span>
                    </td>
                    <td className="text-end font-monospace text-dark fw-bold">
                      {formatRupees(c.totalPurchasesPaise)}
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-dark-custom p-1.5"
                        title="View Purchase History"
                        onClick={() => handleViewHistory(c)}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center card-clean bg-white p-2 px-3">
          <small className="text-muted">
            Page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong> ({totalCount} customers)
          </small>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-dark-custom" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn btn-outline-dark-custom" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Customer Invoices History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF' }}>
              <div className="modal-header border-bottom py-3">
                <div>
                  <h5 className="modal-title text-dark fw-bold m-0">{selectedCustomer.name}'s Invoices</h5>
                  <small className="text-muted font-monospace">{selectedCustomer.phone}</small>
                </div>
                <button type="button" className="btn btn-sm text-muted" onClick={() => setShowHistoryModal(false)}>✕</button>
              </div>

              <div className="modal-body py-3">
                {historyLoading ? (
                  <TableSkeleton rows={4} cols={5} />
                ) : customerSales.length === 0 ? (
                  <div className="p-4 text-center text-muted">No invoices found for this customer.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-custom table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Invoice No</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Status</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerSales.map((s) => (
                          <tr key={s._id}>
                            <td className="text-dark font-monospace fw-bold">{s.invoiceNo}</td>
                            <td className="text-muted small">{formatIST(s.createdAt)}</td>
                            <td>
                              <span className="badge bg-light text-dark border extra-small">
                                {s.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${s.status === 'COMPLETED' ? 'badge-pill-success' : 'badge-pill-danger'} extra-small`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="text-end font-monospace text-dark fw-bold">
                              {formatRupees(s.totalPaise)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top py-2">
                <button className="btn btn-outline-dark-custom btn-sm" onClick={() => setShowHistoryModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
