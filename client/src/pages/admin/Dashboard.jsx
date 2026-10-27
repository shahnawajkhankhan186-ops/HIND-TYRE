import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
  DollarSign,
  ArrowUpRight,
  Disc3,
  Calendar,
  RefreshCw,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatRupees, paiseToRupees } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

const PIE_COLORS = ['#FFC107', '#111318', '#6B7280', '#F59E0B', '#374151', '#FDE68A', '#9CA3AF', '#D97706'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'area'
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title mb-4">Executive Shop Dashboard</h1>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const { today, thisMonth, stockValue, lowStockItems, outOfStockItems, charts, recentSales } = data || {};
  const last10DaysTotalPaise = charts?.dailyTrend?.reduce((sum, d) => sum + (d.salesPaise || 0), 0) || 0;

  const formatYAxisPaise = (val) => {
    if (!val || val === 0) return '₹0';
    const rupees = val / 100;
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)}L`;
    }
    if (rupees >= 1000) {
      return `₹${(rupees / 1000).toFixed(0)}k`;
    }
    return `₹${rupees}`;
  };

  const CustomDailyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div
          className="p-2.5 bg-white shadow-lg border rounded-3"
          style={{ borderColor: 'var(--accent)', minWidth: '170px' }}
        >
          <div className="fw-bold text-dark small mb-1">
            {point.label || point.displayDate}
          </div>
          <div className="d-flex align-items-center justify-content-between gap-3 text-muted extra-small">
            <span>Sales Revenue:</span>
            <span className="fw-bold text-dark" style={{ color: '#0A0A0C' }}>
              {formatRupees(point.salesPaise || 0)}
            </span>
          </div>
          <div className="d-flex align-items-center justify-content-between gap-3 text-muted extra-small mt-0.5">
            <span>Invoices Billed:</span>
            <span className="fw-semibold text-secondary">
              {point.invoices || 0} {point.invoices === 1 ? 'bill' : 'bills'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      {/* Title & Action */}
      <div className="page-header-card">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div>
            <h1 className="page-title">Executive Shop Dashboard</h1>
            <p className="page-subtitle">Real-time revenue, live stock valuation & sales intelligence</p>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5" onClick={fetchStats}>
              <RefreshCw size={14} /> Refresh Data
            </button>
            <button className="btn btn-accent btn-sm d-flex align-items-center gap-1.5 fw-bold" onClick={() => navigate('/counter/new-sale')}>
              <ShoppingBag size={14} /> Open Counter POS
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="row g-3 mb-4">
        {/* Today's Sales */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-clean p-3.5 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Today's Sales</span>
              <div className="p-2 rounded-circle" style={{ background: 'var(--accent-soft)', color: '#B45309' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="fw-bold fs-4 font-monospace text-dark">{formatRupees(today?.totalSalesPaise || 0)}</div>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top text-muted extra-small" style={{ borderColor: 'var(--border-light)' }}>
              <span>{today?.invoiceCount || 0} Invoices</span>
              <span className="fw-bold text-dark">{today?.tyresSoldCount || 0} Tyres Sold</span>
            </div>
          </div>
        </div>

        {/* This Month's Sales */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-clean p-3.5 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold text-uppercase">This Month</span>
              <div className="p-2 rounded-circle" style={{ background: 'var(--accent-soft)', color: '#B45309' }}>
                <Calendar size={18} />
              </div>
            </div>
            <div className="fw-bold fs-4 font-monospace text-dark">{formatRupees(thisMonth?.totalSalesPaise || 0)}</div>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top text-muted extra-small" style={{ borderColor: 'var(--border-light)' }}>
              <span>{thisMonth?.invoiceCount || 0} Total Bills</span>
              <span className="fw-bold text-dark">{thisMonth?.tyresSoldCount || 0} Tyres</span>
            </div>
          </div>
        </div>

        {/* Stock Valuation (Selling Value) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-clean p-3.5 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Stock Value (Retail)</span>
              <div className="p-2 rounded-circle" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                <Package size={18} />
              </div>
            </div>
            <div className="text-success fw-bold fs-4 font-monospace">{formatRupees(stockValue?.sellingValuationPaise || 0)}</div>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top text-muted extra-small" style={{ borderColor: 'var(--border-light)' }}>
              <span>Purchase: {formatRupees(stockValue?.purchaseValuationPaise || 0)}</span>
              <span className="text-dark fw-bold">{stockValue?.totalQuantity || 0} Units</span>
            </div>
          </div>
        </div>

        {/* Inventory Health Alerts */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-clean p-3.5 h-100" style={{ background: (stockValue?.outOfStockCount || 0) > 0 ? '#FEF2F2' : '#FFFBEB', border: (stockValue?.outOfStockCount || 0) > 0 ? '1px solid #FCA5A5' : '1px solid #FDE68A' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small fw-semibold text-uppercase" style={{ color: (stockValue?.outOfStockCount || 0) > 0 ? '#991B1B' : '#92400E' }}>Stock Alerts</span>
              <div className="p-2 rounded-circle" style={{ background: (stockValue?.outOfStockCount || 0) > 0 ? '#FEE2E2' : '#FEF3C7', color: (stockValue?.outOfStockCount || 0) > 0 ? '#DC2626' : '#D97706' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="fw-bold fs-4 font-monospace" style={{ color: (stockValue?.outOfStockCount || 0) > 0 ? '#DC2626' : '#B45309' }}>
              {stockValue?.lowStockCount || 0} <span className="fs-6 fw-normal text-muted">Low</span>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top extra-small" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <span className="fw-semibold text-danger">{stockValue?.outOfStockCount || 0} Out of Stock</span>
              <button className="btn btn-link p-0 extra-small fw-semibold text-decoration-none" style={{ color: 'var(--link-blue)' }} onClick={() => navigate('/admin/tyres?lowStock=true')}>
                View items →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: 10-Day Revenue Graph & Top Brands Pie Chart */}
      <div className="row g-3 mb-4">
        {/* 10-Day Daily Revenue Graph */}
        <div className="col-12 col-xl-8">
          <div className="card-clean p-4 h-100 bg-white">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h5 className="fw-bold m-0 text-dark">Daily Revenue Graph (Last 10 Days)</h5>
                <small className="text-muted">Day-by-day sales revenue & billing performance</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="d-none d-sm-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-light border text-dark extra-small">
                  <span className="text-muted">10-Day Total:</span>
                  <span className="fw-bold text-dark">{formatRupees(last10DaysTotalPaise)}</span>
                </div>
                <div className="btn-group btn-group-sm p-0.5 rounded-2 bg-light border">
                  <button
                    type="button"
                    className={`btn btn-sm py-0.5 px-2.5 rounded-1 extra-small fw-semibold ${
                      chartType === 'bar' ? 'btn-accent text-dark shadow-xs' : 'btn-link text-muted text-decoration-none'
                    }`}
                    onClick={() => setChartType('bar')}
                  >
                    Bars
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm py-0.5 px-2.5 rounded-1 extra-small fw-semibold ${
                      chartType === 'area' ? 'btn-accent text-dark shadow-xs' : 'btn-link text-muted text-decoration-none'
                    }`}
                    onClick={() => setChartType('area')}
                  >
                    Trend
                  </button>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              {charts?.dailyTrend && charts.dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart
                      data={charts.dailyTrend}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="displayDate"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisPaise}
                      />
                      <Tooltip content={<CustomDailyTooltip />} cursor={{ fill: 'rgba(255, 193, 7, 0.08)' }} />
                      <Bar
                        dataKey="salesPaise"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={42}
                      >
                        {charts.dailyTrend.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={
                              entry.salesPaise > 0
                                ? entry.dayName === 'Today'
                                  ? '#FFB300'
                                  : '#FFC107'
                                : '#E2E8F0'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={charts.dailyTrend}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFC107" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#FFC107" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="displayDate"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisPaise}
                      />
                      <Tooltip content={<CustomDailyTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="salesPaise"
                        stroke="#FFB300"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#revenueGrad)"
                        dot={{ r: 4, fill: '#FFB300', strokeWidth: 2, stroke: '#FFFFFF' }}
                        activeDot={{ r: 6, fill: '#FF8F00', stroke: '#FFFFFF', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                  No sales trend data available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Selling Brands Pie Chart */}
        <div className="col-12 col-xl-4">
          <div className="card-clean p-4 h-100 bg-white">
            <h5 className="fw-bold mb-1 text-dark">Top Selling Brands</h5>
            <small className="text-muted d-block mb-3">Revenue share by manufacturer</small>

            <div style={{ width: '100%', height: 260 }}>
              {charts?.topBrands && charts.topBrands.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.topBrands}
                      dataKey="revenuePaise"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {charts.topBrands.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: 'var(--accent)', color: '#111318', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                      formatter={(val) => [formatRupees(val), 'Revenue']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                  Complete sales to populate brand share.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Low Stock Table & Recent Invoices */}
      <div className="row g-3">
        {/* Critical Low Stock Warning Table */}
        <div className="col-12 col-xl-6">
          <div className="card-clean p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={18} style={{ color: '#B45309' }} />
                <h5 className="fw-bold m-0 text-dark">Inventory Reorder Attention</h5>
              </div>
              <button
                className="btn btn-sm btn-outline-dark-custom extra-small"
                onClick={() => navigate('/admin/stock-in')}
              >
                + Purchase Stock
              </button>
            </div>

            {lowStockItems?.length === 0 && outOfStockItems?.length === 0 ? (
              <div className="p-4 text-center text-muted small">
                All inventory items are currently above safety thresholds.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Tyre Model</th>
                      <th>Size</th>
                      <th className="text-center">Stock</th>
                      <th className="text-end">Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(outOfStockItems || []), ...(lowStockItems || [])].slice(0, 6).map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="text-dark fw-semibold small">{item.modelName}</div>
                          <div className="text-muted extra-small">{item.companyId?.name}</div>
                        </td>
                        <td className="font-monospace text-dark fw-bold small">{item.size}</td>
                        <td className="text-center">
                          <span className={item.quantity <= 0 ? 'badge-pill-danger' : 'badge-pill-warning'}>
                            {item.quantity <= 0 ? 'Out of Stock' : `${item.quantity} left`}
                          </span>
                        </td>
                        <td className="text-end text-muted small">{item.lowStockThreshold} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices Feed */}
        <div className="col-12 col-xl-6">
          <div className="card-clean p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <Receipt size={18} style={{ color: 'var(--accent-dark)' }} />
                <h5 className="fw-bold m-0 text-dark">Recent Shop Invoices</h5>
              </div>
              <button
                className="btn btn-sm btn-outline-dark-custom extra-small"
                onClick={() => navigate('/admin/sales')}
              >
                View All Ledger →
              </button>
            </div>

            {recentSales?.length === 0 ? (
              <div className="p-4 text-center text-muted small">
                No invoices recorded yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th className="text-end">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales?.slice(0, 6).map((sale) => (
                      <tr key={sale._id}>
                        <td>
                          <span className="font-monospace fw-bold small text-dark">{sale.invoiceNo}</span>
                        </td>
                        <td>
                          <div className="text-dark fw-semibold small">{sale.customerSnapshot.name}</div>
                          <div className="text-muted extra-small font-monospace">{sale.customerSnapshot.phone}</div>
                        </td>
                        <td className="text-muted small">{formatIST(sale.createdAt)}</td>
                        <td className="text-end font-monospace text-dark fw-bold small">
                          {formatRupees(sale.totalPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
