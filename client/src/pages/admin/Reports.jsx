import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, RefreshCw, Calendar, TrendingUp, Package, AlertTriangle, Building2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees, paiseToRupees } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

const REPORT_TABS = [
  { id: 'sales', label: 'Sales Report', icon: TrendingUp },
  { id: 'valuation', label: 'Stock Valuation', icon: Package },
  { id: 'low-stock', label: 'Low Stock Report', icon: AlertTriangle },
  { id: 'company-sales', label: 'Company-wise Sales', icon: Building2 },
  { id: 'profit', label: 'Gross Profit Report', icon: DollarSign },
];

export default function Reports() {
  const { shopSettings } = useAuth();
  const getGodownName = (code) => {
    return shopSettings?.godowns?.find((g) => g.code === code)?.name || (code === 'G1' ? 'Godown 1' : 'Godown 2');
  };

  const [activeTab, setActiveTab] = useState('sales');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/reports/${activeTab}`, {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading(`Preparing ${activeTab} CSV download...`, { id: 'csv-export' });
      const res = await api.get(`/admin/reports/${activeTab}/export`, {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hind_tyres_${activeTab}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Successfully exported ${activeTab} CSV!`, { id: 'csv-export' });
    } catch (err) {
      toast.error('Failed to export CSV report', { id: 'csv-export' });
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h1 className="page-title">Business Reports & Data Exports</h1>
            <p className="page-subtitle">
              Comprehensive valuation, company performance, profit margins & streaming CSV exports
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-accent btn-sm d-flex align-items-center gap-1.5" onClick={handleExportCSV}>
              <Download size={15} /> Export Streaming CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Date Filter Bar */}
      <div className="filter-bar-card">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Tabs */}
          <div className="btn-group p-1 rounded-pill bg-light border flex-wrap">
            {REPORT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`btn btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 ${
                    isActive ? 'btn-accent' : 'btn-link text-muted text-decoration-none'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date Filter */}
          <div className="d-flex align-items-center gap-2">
            <input
              type="date"
              className="form-control form-control-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From"
            />
            <span className="text-muted small">to</span>
            <input
              type="date"
              className="form-control form-control-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To"
            />
            <button className="btn btn-outline-dark-custom btn-sm" onClick={fetchReport}>
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Report Content Panels */}
      <div className="card-clean bg-white overflow-hidden mb-4">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : !reportData ? (
          <div className="p-5 text-center text-muted">No data returned for this report.</div>
        ) : (
          <>
            {/* 1. SALES REPORT */}
            {activeTab === 'sales' && Array.isArray(reportData) && (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Payment</th>
                      <th className="text-end">Subtotal</th>
                      <th className="text-end">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((s) => (
                      <tr key={s._id}>
                        <td className="text-dark font-monospace fw-bold">{s.invoiceNo}</td>
                        <td className="text-muted small font-monospace">{formatIST(s.createdAt)}</td>
                        <td>
                          <div className="text-dark small fw-semibold">{s.customerSnapshot.name}</div>
                          <div className="text-muted extra-small font-monospace">{s.customerSnapshot.phone}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border extra-small">{s.paymentMode}</span>
                        </td>
                        <td className="text-end font-monospace text-muted small">{formatRupees(s.subtotalPaise)}</td>
                        <td className="text-end font-monospace text-dark fw-bold">{formatRupees(s.totalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. VALUATION REPORT */}
            {activeTab === 'valuation' && (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Brand / Description</th>
                      <th>Size / SKU</th>
                      <th className="text-center">{getGodownName('G1')}</th>
                      <th className="text-center">{getGodownName('G2')}</th>
                      <th className="text-center">Total Stock</th>
                      <th className="text-end">Cost Rate</th>
                      <th className="text-end">Retail Rate</th>
                      <th className="text-end">Purchase Valuation</th>
                      <th className="text-end">Retail Valuation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.tyres?.map((t) => (
                      <tr key={t._id}>
                        <td><span className="badge badge-pill-info extra-small">Tyre</span></td>
                        <td>
                          <div className="text-dark fw-semibold small">{t.modelName}</div>
                          <div className="text-muted extra-small">{t.companyId?.name}</div>
                        </td>
                        <td className="text-dark font-monospace small">{t.size}</td>
                        <td className="text-center font-monospace">{t.godownStock?.G1 ?? 0}</td>
                        <td className="text-center font-monospace">{t.godownStock?.G2 ?? 0}</td>
                        <td className="text-center text-dark fw-bold font-monospace">{t.quantity}</td>
                        <td className="text-end font-monospace text-muted small">{formatRupees(t.purchasePricePaise)}</td>
                        <td className="text-end font-monospace text-dark small">{formatRupees(t.sellingPricePaise)}</td>
                        <td className="text-end font-monospace text-muted fw-semibold">
                          {formatRupees(t.quantity * t.purchasePricePaise)}
                        </td>
                        <td className="text-end font-monospace text-success fw-bold">
                          {formatRupees(t.quantity * t.sellingPricePaise)}
                        </td>
                      </tr>
                    ))}
                    {reportData.accessories?.map((a) => (
                      <tr key={a._id}>
                        <td><span className="badge badge-pill-warning extra-small">Accessory</span></td>
                        <td>
                          <div className="text-dark fw-semibold small">{a.name}</div>
                          <div className="text-muted extra-small">{a.category}</div>
                        </td>
                        <td className="text-dark font-monospace small">{a.sku}</td>
                        <td className="text-center font-monospace">{a.godownStock?.G1 ?? 0}</td>
                        <td className="text-center font-monospace">{a.godownStock?.G2 ?? 0}</td>
                        <td className="text-center text-dark fw-bold font-monospace">{a.quantity}</td>
                        <td className="text-end font-monospace text-muted small">{formatRupees(a.purchasePricePaise)}</td>
                        <td className="text-end font-monospace text-dark small">{formatRupees(a.sellingPricePaise)}</td>
                        <td className="text-end font-monospace text-muted fw-semibold">
                          {formatRupees(a.quantity * a.purchasePricePaise)}
                        </td>
                        <td className="text-end font-monospace text-success fw-bold">
                          {formatRupees(a.quantity * a.sellingPricePaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. LOW STOCK REPORT */}
            {activeTab === 'low-stock' && (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Item Specification</th>
                      <th>Size / SKU</th>
                      <th className="text-center">{getGodownName('G1')}</th>
                      <th className="text-center">{getGodownName('G2')}</th>
                      <th className="text-center">Total Stock</th>
                      <th className="text-center">Threshold</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.tyres?.map((t) => (
                      <tr key={t._id}>
                        <td><span className="badge badge-pill-info extra-small">Tyre</span></td>
                        <td>
                          <div className="text-dark fw-semibold small">{t.modelName}</div>
                          <div className="text-muted extra-small">{t.companyId?.name}</div>
                        </td>
                        <td className="text-dark font-monospace small">{t.size}</td>
                        <td className="text-center font-monospace">{t.godownStock?.G1 ?? 0}</td>
                        <td className="text-center font-monospace">{t.godownStock?.G2 ?? 0}</td>
                        <td className="text-center font-monospace fw-bold text-dark">{t.quantity}</td>
                        <td className="text-center text-muted small">{t.lowStockThreshold}</td>
                        <td>
                          <span className={`badge ${t.quantity <= 0 ? 'badge-pill-danger' : 'badge-pill-warning'} extra-small`}>
                            {t.quantity <= 0 ? 'Out of Stock' : 'Low Stock Alert'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {reportData.accessories?.map((a) => (
                      <tr key={a._id}>
                        <td><span className="badge badge-pill-warning extra-small">Accessory</span></td>
                        <td>
                          <div className="text-dark fw-semibold small">{a.name}</div>
                          <div className="text-muted extra-small">{a.category}</div>
                        </td>
                        <td className="text-dark font-monospace small">{a.sku}</td>
                        <td className="text-center font-monospace">{a.godownStock?.G1 ?? 0}</td>
                        <td className="text-center font-monospace">{a.godownStock?.G2 ?? 0}</td>
                        <td className="text-center font-monospace fw-bold text-dark">{a.quantity}</td>
                        <td className="text-center text-muted small">{a.lowStockThreshold}</td>
                        <td>
                          <span className={`badge ${a.quantity <= 0 ? 'badge-pill-danger' : 'badge-pill-warning'} extra-small`}>
                            {a.quantity <= 0 ? 'Out of Stock' : 'Low Stock Alert'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. COMPANY-WISE SALES REPORT */}
            {activeTab === 'company-sales' && Array.isArray(reportData) && (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Tyre Manufacturer</th>
                      <th className="text-center">Total Invoices</th>
                      <th className="text-center">Units Sold</th>
                      <th className="text-end">Total Gross Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((c, idx) => (
                      <tr key={idx}>
                        <td className="text-dark fw-bold fs-6">{c.company || 'Other'}</td>
                        <td className="text-center text-muted">{c.invoices} bills</td>
                        <td className="text-center text-dark fw-bold">{c.totalQty} tyres</td>
                        <td className="text-end font-monospace text-dark fw-bold fs-6">
                          {formatRupees(c.revenuePaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. PROFIT REPORT */}
            {activeTab === 'profit' && Array.isArray(reportData) && (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Item Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Cost Price</th>
                      <th className="text-end">Selling Price</th>
                      <th className="text-end">Gross Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((p, idx) => {
                      const isProfit = (p.grossProfitPaise || 0) >= 0;
                      return (
                        <tr key={idx}>
                          <td className="text-dark font-monospace small">{p.invoiceNo}</td>
                          <td>
                            <div className="text-dark fw-semibold small">{p.itemName}</div>
                            <div className="text-muted extra-small font-monospace">{p.size}</div>
                          </td>
                          <td className="text-center text-dark fw-bold">{p.qty}</td>
                          <td className="text-end font-monospace text-muted small">
                            {formatRupees(p.unitPurchasePricePaise)}
                          </td>
                          <td className="text-end font-monospace text-dark small">
                            {formatRupees(p.unitSellingPricePaise)}
                          </td>
                          <td className={`text-end font-monospace fw-bold ${isProfit ? 'text-success' : 'text-danger'}`}>
                            {formatRupees(p.grossProfitPaise)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
