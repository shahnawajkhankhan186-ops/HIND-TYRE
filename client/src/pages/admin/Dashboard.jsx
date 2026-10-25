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

const PIE_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899', '#a855f7'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      <div className="container-fluid p-3 p-md-4">
        <h4 className="text-white fw-bold mb-4 brand-font">Analytics & Shop Dashboard</h4>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const { today, thisMonth, stockValue, lowStockItems, outOfStockItems, charts, recentSales } = data || {};

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Title & Action */}
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-white fw-bold m-0 brand-font">Executive Shop Dashboard</h3>
            <p className="text-secondary small m-0 mt-0.5">Real-time revenue, live stock valuation & sales intelligence</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-secondary-glass btn-sm d-flex align-items-center gap-1.5" onClick={fetchStats}>
              <RefreshCw size={14} /> Refresh Data
            </button>
            <button className="btn btn-primary-glass btn-sm d-flex align-items-center gap-1.5" onClick={() => navigate('/counter/new-sale')}>
              <ShoppingBag size={14} /> Open Counter POS
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="row g-3 mb-4">
        {/* Today's Sales */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="glass-panel p-3.5 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-semibold text-uppercase">Today's Sales</span>
              <div className="p-2 rounded-2 bg-info bg-opacity-10 text-info">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="text-white fw-bold fs-4 font-monospace">{formatRupees(today?.totalSalesPaise || 0)}</div>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary border-opacity-10 text-secondary extra-small">
              <span>{today?.invoiceCount || 0} Invoices</span>
              <span className="text-info fw-semibold">{today?.tyresSoldCount || 0} Tyres Sold</span>
            </div>
          </div>
        </div>

        {/* This Month's Sales */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="glass-panel p-3.5 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-semibold text-uppercase">This Month</span>
              <div className="p-2 rounded-2 bg-primary bg-opacity-10 text-primary">
                <Calendar size={18} />
              </div>
            </div>
            <div className="text-white fw-bold fs-4 font-monospace">{formatRupees(thisMonth?.totalSalesPaise || 0)}</div>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary border-opacity-10 text-secondary extra-small">
              <span>{thisMonth?.invoiceCount || 0} Total Bills</span>
              <span className="text-primary fw-semibold">{thisMonth?.tyresSoldCount || 0} Tyres</span>
            </div>
          </div>
        </div>

        {/* Stock Valuation (Selling Value) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="glass-panel p-3.5 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-semibold text-uppercase">Stock Value (Retail)</span>
              <div className="p-2 rounded-2 bg-success bg-opacity-10 text-success">
                <Package size={18} />
              </div>
            </div>
            <div className="text-success fw-bold fs-4 font-monospace">{formatRupees(stockValue?.sellingValuationPaise || 0)}</div>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary border-opacity-10 text-secondary extra-small">
              <span>Purchase: {formatRupees(stockValue?.purchaseValuationPaise || 0)}</span>
              <span className="text-white fw-bold">{stockValue?.totalQuantity || 0} Units</span>
            </div>
          </div>
        </div>

        {/* Inventory Health Alerts */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="glass-panel p-3.5 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small fw-semibold text-uppercase">Low Stock Alert</span>
              <div className="p-2 rounded-2 bg-warning bg-opacity-10 text-warning">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="text-warning fw-bold fs-4 font-monospace">{stockValue?.lowStockCount || 0} <span className="fs-6 fw-normal text-secondary">Items</span></div>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary border-opacity-15 text-secondary extra-small">
              <span className="text-danger fw-semibold">{stockValue?.outOfStockCount || 0} Out of Stock</span>
              <button className="btn btn-link p-0 extra-small text-info text-decoration-none" onClick={() => navigate('/admin/tyres?lowStock=true')}>
                View items →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: Line Chart (Trend) & Bar Chart (Top Sizes) */}
      <div className="row g-3 mb-4">
        {/* 7-Day Revenue Trend Line Chart */}
        <div className="col-12 col-xl-8">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="text-white fw-bold m-0">Recent Daily Revenue Trend</h5>
                <small className="text-secondary">Gross sales generated over the last 7 active days</small>
              </div>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              {charts?.dailyTrend && charts.dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                      formatter={(val) => [formatRupees(val), 'Sales Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="salesPaise"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#38bdf8' }}
                      activeDot={{ r: 6, fill: '#0284c7' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-secondary">
                  No sales trend data available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Selling Brands Pie Chart */}
        <div className="col-12 col-xl-4">
          <div className="glass-panel p-4 h-100">
            <h5 className="text-white fw-bold mb-1">Top Selling Brands</h5>
            <small className="text-secondary d-block mb-3">Revenue share by manufacturer</small>

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
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                      formatter={(val) => [formatRupees(val), 'Revenue']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-secondary">
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
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={18} className="text-warning" />
                <h5 className="text-white fw-bold m-0">Inventory Reorder Attention</h5>
              </div>
              <button
                className="btn btn-sm btn-secondary-glass extra-small"
                onClick={() => navigate('/admin/stock-in')}
              >
                + Purchase Stock
              </button>
            </div>

            {lowStockItems?.length === 0 && outOfStockItems?.length === 0 ? (
              <div className="p-4 text-center text-secondary small">
                All inventory items are currently above safety thresholds.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-glass mb-0">
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
                          <div className="text-white fw-semibold small">{item.modelName}</div>
                          <div className="text-secondary extra-small">{item.companyId?.name}</div>
                        </td>
                        <td className="font-monospace text-info small">{item.size}</td>
                        <td className="text-center">
                          <span className={`badge ${item.quantity <= 0 ? 'bg-danger' : 'badge-glass-amber'} extra-small`}>
                            {item.quantity <= 0 ? 'Out of Stock' : `${item.quantity} left`}
                          </span>
                        </td>
                        <td className="text-end text-secondary small">{item.lowStockThreshold} units</td>
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
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <Receipt size={18} className="text-info" />
                <h5 className="text-white fw-bold m-0">Recent Shop Invoices</h5>
              </div>
              <button
                className="btn btn-sm btn-secondary-glass extra-small"
                onClick={() => navigate('/admin/sales')}
              >
                View All Ledger →
              </button>
            </div>

            {recentSales?.length === 0 ? (
              <div className="p-4 text-center text-secondary small">
                No invoices recorded yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-glass mb-0">
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
                          <span className="text-info font-monospace fw-bold small">{sale.invoiceNo}</span>
                        </td>
                        <td>
                          <div className="text-white fw-semibold small">{sale.customerSnapshot.name}</div>
                          <div className="text-secondary extra-small font-monospace">{sale.customerSnapshot.phone}</div>
                        </td>
                        <td className="text-secondary small">{formatIST(sale.createdAt)}</td>
                        <td className="text-end font-monospace text-white fw-bold small">
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
