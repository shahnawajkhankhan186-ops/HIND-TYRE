import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  X,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Disc3,
  Coins
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';
import ReceiptModal from '../../components/common/ReceiptModal';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

export default function Finance() {
  const { shopSettings } = useAuth();

  // Overview stats & cashiers
  const [overview, setOverview] = useState({
    totalRevenuePaise: 0,
    totalCostPaise: 0,
    totalProfitPaise: 0,
    totalInvoicesCount: 0,
    totalMarginPercent: 0,
    todayRevenuePaise: 0,
    todayCostPaise: 0,
    todayProfitPaise: 0,
    todayInvoicesCount: 0,
    todayMarginPercent: 0,
    cashiers: [],
  });
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Transactions list & pagination
  const [transactions, setTransactions] = useState([]);
  const [filteredSummary, setFilteredSummary] = useState({
    revenuePaise: 0,
    costPaise: 0,
    profitPaise: 0,
    marginPercent: 0,
    completedCount: 0,
    totalCount: 0,
  });
  const [tableLoading, setTableLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [status, setStatus] = useState('');

  // Receipt Modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, selectedCashier, dateFilter, paymentMode, status]);

  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await api.get('/admin/finance/overview');
      if (res.data.success) {
        setOverview(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load finance overview');
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchTransactions = async (targetPage = page, targetSearch = search) => {
    try {
      setTableLoading(true);
      const res = await api.get('/admin/finance/transactions', {
        params: {
          page: targetPage,
          limit: 15,
          search: targetSearch?.trim() || undefined,
          cashierId: selectedCashier || undefined,
          date: dateFilter,
          startDate: dateFilter === 'custom' ? startDate : undefined,
          endDate: dateFilter === 'custom' ? endDate : undefined,
          paymentMode: paymentMode || undefined,
          status: status || undefined,
        },
      });
      if (res.data.success) {
        setTransactions(res.data.data.transactions);
        setFilteredSummary(res.data.data.filteredSummary);
        setTotalPages(res.data.data.pagination.pages);
        setTotalCount(res.data.data.pagination.total);
      }
    } catch (err) {
      toast.error('Failed to load financial transactions');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchTransactions(1, search);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    fetchTransactions(1, '');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCashier('');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setPaymentMode('');
    setStatus('');
    setPage(1);
    (async () => {
      try {
        setTableLoading(true);
        const res = await api.get('/admin/finance/transactions', {
          params: { page: 1, limit: 15 },
        });
        if (res.data.success) {
          setTransactions(res.data.data.transactions);
          setFilteredSummary(res.data.data.filteredSummary);
          setTotalPages(res.data.data.pagination.pages);
          setTotalCount(res.data.data.pagination.total);
        }
      } catch (_) {} finally {
        setTableLoading(false);
      }
    })();
  };

  const handleRefreshAll = () => {
    fetchOverview();
    fetchTransactions();
  };

  const handleViewReceipt = (sale) => {
    setSelectedSale(sale);
    setShowReceiptModal(true);
  };

  const isFiltered = Boolean(
    search || selectedCashier || dateFilter !== 'all' || startDate || endDate || paymentMode || status
  );

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-card mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="page-title m-0">Finance & Profit Analytics</h1>
              <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25 extra-small">
                Owner Access Only
              </span>
            </div>
            <p className="page-subtitle m-0">
              Cashier revenue intelligence, invoice records & profit calculations (Selling Price − Actual Cost)
            </p>
          </div>
          <button
            className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5"
            onClick={handleRefreshAll}
            disabled={overviewLoading || tableLoading}
            title="Refresh finance data"
          >
            <RefreshCw size={14} className={overviewLoading || tableLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="row g-3 mb-4">
        {/* Total Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-clean p-3 bg-white h-100 border-start border-4" style={{ borderColor: 'var(--accent) !important' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted extra-small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Total Revenue
              </span>
              <div className="p-2 rounded-2" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-dark)' }}>
                <Coins size={18} />
              </div>
            </div>
            <div className="fw-bold font-monospace fs-4 text-dark mb-1">
              {formatRupees(overview.totalRevenuePaise)}
            </div>
            <div className="text-muted extra-small d-flex align-items-center gap-1">
              <span>{overview.totalInvoicesCount || 0} lifetime completed invoices</span>
            </div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-clean p-3 bg-white h-100 border-start border-4" style={{ borderColor: '#3b82f6 !important' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted extra-small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Today's Revenue
              </span>
              <div className="p-2 rounded-2" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                <Calendar size={18} />
              </div>
            </div>
            <div className="fw-bold font-monospace fs-4 text-dark mb-1">
              {formatRupees(overview.todayRevenuePaise)}
            </div>
            <div className="text-muted extra-small d-flex align-items-center gap-1">
              <span>{overview.todayInvoicesCount || 0} invoices generated today</span>
            </div>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-clean p-3 bg-white h-100 border-start border-4" style={{ borderColor: '#10b981 !important' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted extra-small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Today's Profit
              </span>
              <span className="badge bg-success bg-opacity-10 text-success fw-bold extra-small">
                +{overview.todayMarginPercent}%
              </span>
            </div>
            <div className="fw-bold font-monospace fs-4 text-success mb-1">
              {formatRupees(overview.todayProfitPaise)}
            </div>
            <div className="text-muted extra-small">
              Cost: <strong className="text-secondary font-monospace">{formatRupees(overview.todayCostPaise)}</strong>
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-clean p-3 bg-white h-100 border-start border-4" style={{ borderColor: '#059669 !important' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted extra-small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Total Profit
              </span>
              <span className="badge bg-success bg-opacity-10 text-success fw-bold extra-small">
                +{overview.totalMarginPercent}%
              </span>
            </div>
            <div className="fw-bold font-monospace fs-4 text-success mb-1">
              {formatRupees(overview.totalProfitPaise)}
            </div>
            <div className="text-muted extra-small">
              Lifetime Cost: <strong className="text-secondary font-monospace">{formatRupees(overview.totalCostPaise)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Cashier-Wise Sales & Profit Performance Card */}
      <div className="card-clean p-3 mb-4 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <UserCheck size={18} className="text-warning" />
            <h5 className="m-0 fw-bold fs-6 text-dark">Cashier Performance Breakdown</h5>
          </div>
          <small className="text-muted">
            Individual sales & profit generated by each cashier / staff member
          </small>
        </div>

        {overviewLoading ? (
          <div className="py-4 text-center text-muted">Loading cashier metrics...</div>
        ) : overview.cashiers.length === 0 ? (
          <div className="py-4 text-center text-muted">No cashier activity recorded yet.</div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="d-flex flex-column gap-2 d-md-none">
              {overview.cashiers.map((c) => {
                const isSelected = selectedCashier === String(c.userId);
                return (
                  <div
                    key={String(c.userId)}
                    className={`p-3 rounded-3 border ${isSelected ? 'border-warning bg-warning bg-opacity-10' : 'bg-light'}`}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <div className="fw-bold text-dark">{c.name}</div>
                        <small className="text-muted font-monospace">{c.email}</small>
                      </div>
                      <span className={`badge ${c.role === 'ADMIN' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-secondary bg-opacity-10 text-secondary'} extra-small`}>
                        {c.role}
                      </span>
                    </div>

                    <div className="row g-2 mb-2 pt-2 border-top extra-small">
                      <div className="col-6">
                        <span className="text-muted">Today Rev:</span>
                        <div className="font-monospace fw-bold text-dark">{formatRupees(c.todayRevenuePaise)}</div>
                        <span className="text-success fw-semibold">+{formatRupees(c.todayProfitPaise)} profit</span>
                      </div>
                      <div className="col-6 text-end">
                        <span className="text-muted">Total Rev:</span>
                        <div className="font-monospace fw-bold text-dark">{formatRupees(c.totalRevenuePaise)}</div>
                        <span className="text-success fw-semibold">+{formatRupees(c.totalProfitPaise)} (+{c.marginPercent}%)</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted extra-small">Invoices: {c.todayInvoices} today / {c.totalInvoices} all</span>
                      <button
                        type="button"
                        className={`btn btn-sm ${isSelected ? 'btn-dark-solid' : 'btn-outline-dark-custom'} py-1 px-2.5 extra-small`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCashier('');
                          } else {
                            setSelectedCashier(String(c.userId));
                            setPage(1);
                          }
                        }}
                      >
                        {isSelected ? 'Clear Filter' : 'View Sales'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover table-custom mb-0 text-nowrap">
                <thead>
                  <tr>
                    <th>Cashier / Staff</th>
                    <th>Role</th>
                    <th className="text-center">Today Invoices</th>
                    <th className="text-end">Today's Revenue</th>
                    <th className="text-end">Today's Profit</th>
                    <th className="text-center">Total Invoices</th>
                    <th className="text-end">Total Revenue</th>
                    <th className="text-end">Total Profit</th>
                    <th className="text-center">Profit Margin</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.cashiers.map((c) => {
                    const isSelected = selectedCashier === String(c.userId);
                    return (
                      <tr key={String(c.userId)} className={isSelected ? 'table-warning' : ''}>
                        <td>
                          <div className="fw-bold text-dark">{c.name}</div>
                          <small className="text-muted font-monospace">{c.email}</small>
                        </td>
                        <td>
                          <span className={`badge ${c.role === 'ADMIN' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-secondary bg-opacity-10 text-secondary'} extra-small`}>
                            {c.role}
                          </span>
                        </td>
                        <td className="text-center fw-bold">{c.todayInvoices}</td>
                        <td className="text-end font-monospace fw-semibold">{formatRupees(c.todayRevenuePaise)}</td>
                        <td className="text-end font-monospace fw-bold text-success">
                          {formatRupees(c.todayProfitPaise)}
                        </td>
                        <td className="text-center fw-bold">{c.totalInvoices}</td>
                        <td className="text-end font-monospace fw-semibold">{formatRupees(c.totalRevenuePaise)}</td>
                        <td className="text-end font-monospace fw-bold text-success">
                          {formatRupees(c.totalProfitPaise)}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-success bg-opacity-10 text-success fw-bold extra-small">
                            +{c.marginPercent}%
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className={`btn btn-sm ${isSelected ? 'btn-dark-solid' : 'btn-outline-dark-custom'} py-1 px-2.5 extra-small`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCashier('');
                              } else {
                                setSelectedCashier(String(c.userId));
                                setPage(1);
                              }
                            }}
                          >
                            {isSelected ? 'Clear Filter' : 'View Sales'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar for Transactions */}
      <div className="filter-bar-card mb-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          {/* Search Input with integrated Search Button */}
          <div className="col-12 col-lg-4 col-md-6">
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
                placeholder="Search invoice, customer, phone, item..."
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
                title="Search finance ledger"
              >
                <Search size={14} />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Cashier Filter */}
          <div className="col-6 col-lg-2 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedCashier}
              onChange={(e) => {
                setSelectedCashier(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Cashiers</option>
              {overview.cashiers.map((c) => (
                <option key={String(c.userId)} value={String(c.userId)}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="col-6 col-lg-2 col-md-3">
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
              <div className="col-6 col-lg-1.5 col-md-3">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-6 col-lg-1.5 col-md-3">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Payment Mode */}
          <div className="col-6 col-lg-1.5 col-md-3">
            <select
              className="form-select form-select-sm"
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Payments</option>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="CARD">CARD</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </div>

          {/* Status */}
          <div className="col-6 col-lg-1.5 col-md-3">
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

          {/* Reset button */}
          {isFiltered && (
            <div className="col-auto">
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

      {/* Filtered Summary Ribbon */}
      <div className="card-clean p-2.5 px-3 bg-white mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2 gap-sm-3 border" style={{ borderColor: 'var(--border-light)' }}>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-dark extra-small">Filtered Results</span>
          <small className="text-muted">
            Showing <strong className="text-dark">{totalCount}</strong> matching transactions ({filteredSummary.completedCount} completed)
          </small>
        </div>
        <div className="d-flex align-items-center gap-2 gap-sm-4 flex-wrap">
          <div>
            <span className="text-muted extra-small text-uppercase">Selling Revenue: </span>
            <strong className="font-monospace text-dark">{formatRupees(filteredSummary.revenuePaise)}</strong>
          </div>
          <div>
            <span className="text-muted extra-small text-uppercase">Actual Cost: </span>
            <strong className="font-monospace text-secondary">{formatRupees(filteredSummary.costPaise)}</strong>
          </div>
          <div>
            <span className="text-muted extra-small text-uppercase">Net Profit: </span>
            <strong className="font-monospace text-success">{formatRupees(filteredSummary.profitPaise)}</strong>
            <span className="badge bg-success bg-opacity-10 text-success ms-1 extra-small">
              +{filteredSummary.marginPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Financial Transactions & Profit Table */}
      <div className="table-container-card">
        {tableLoading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : transactions.length === 0 ? (
          <div className="p-5 text-center text-muted">
            No financial transactions found matching the selected criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0 text-nowrap">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date & Time</th>
                  <th>Cashier (Sold By)</th>
                  <th>Customer</th>
                  <th>Items Sold</th>
                  <th className="text-end">Selling Price</th>
                  <th className="text-end">Actual Cost</th>
                  <th className="text-end">Net Profit</th>
                  <th className="text-center">Payment</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCancelled = tx.status === 'CANCELLED';
                  return (
                    <tr key={tx._id} className={isCancelled ? 'opacity-50' : ''}>
                      <td>
                        <div className="fw-bold font-monospace text-dark">{tx.invoiceNo}</div>
                        {isCancelled && (
                          <span className="badge badge-pill-danger extra-small">Cancelled</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted font-monospace">{formatIST(tx.createdAt)}</small>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark extra-small">{tx.soldBy?.name || 'Counter Staff'}</div>
                        <small className="text-muted extra-small font-monospace">{tx.soldBy?.email}</small>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{tx.customer?.name}</div>
                        <small className="text-muted font-monospace">{tx.customer?.phone}</small>
                      </td>
                      <td>
                        <div className="extra-small">
                          {(tx.items || []).map((it, idx) => (
                            <div key={idx} className="text-truncate" style={{ maxWidth: '240px' }} title={`${it.name} (${it.size}) × ${it.qty}`}>
                              • {it.name} <span className="text-muted">({it.size})</span> × <strong>{it.qty}</strong>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="text-end font-monospace fw-bold text-dark">
                        {formatRupees(tx.totalPaise)}
                      </td>
                      <td className="text-end font-monospace text-secondary">
                        {formatRupees(tx.costPaise)}
                      </td>
                      <td className="text-end font-monospace">
                        {isCancelled ? (
                          <span className="text-muted">-</span>
                        ) : (
                          <div>
                            <div className="fw-bold text-success">{formatRupees(tx.profitPaise)}</div>
                            <small className="text-success extra-small">+{tx.marginPercent}%</small>
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${tx.paymentMode === 'CASH' ? 'bg-success bg-opacity-10 text-success' : tx.paymentMode === 'UPI' ? 'bg-info bg-opacity-10 text-info' : 'bg-warning bg-opacity-10 text-warning'} extra-small`}>
                          {tx.paymentMode}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark-custom p-1.5"
                          onClick={() => handleViewReceipt(tx)}
                          title="View Invoice Receipt"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center card-clean bg-white p-2 px-3 mt-3">
          <small className="text-muted">
            Showing Page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong> ({totalCount} total records)
          </small>
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-dark-custom"
              disabled={page <= 1}
              onClick={() => {
                const prev = page - 1;
                setPage(prev);
                fetchTransactions(prev);
              }}
            >
              Previous
            </button>
            <button
              className="btn btn-outline-dark-custom"
              disabled={page >= totalPages}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchTransactions(next);
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedSale && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          sale={selectedSale}
          shopSettings={shopSettings}
        />
      )}
    </div>
  );
}

