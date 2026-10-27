import React, { useState, useEffect } from 'react';
import {
  Disc3,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Edit2,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Eye,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees, rupeesToPaise, paiseToRupees } from '../../lib/currency';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function Tyres() {
  const [tyres, setTyres] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTyre, setEditingTyre] = useState(null);
  const [formData, setFormData] = useState({
    companyId: '',
    modelName: '',
    size: '',
    vehicleType: 'Car',
    tubeType: 'Tubeless',
    sku: '',
    purchasePriceRupees: '',
    sellingPriceRupees: '',
    mrpRupees: '',
    gstPercent: 28,
    quantity: 0,
    lowStockThreshold: 5,
  });
  const [saving, setSaving] = useState(false);

  // Bulk Price Update Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFilter, setBulkFilter] = useState({
    companyId: '',
    vehicleType: '',
    percentageDelta: 5, // e.g. +5%
  });
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Archive Target
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchTyres();
  }, [page, companyId, vehicleType, lowStock]);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/admin/companies');
      if (res.data.success) setCompanies(res.data.data);
    } catch (_) {}
  };

  const fetchTyres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tyres', {
        params: {
          page,
          limit: 15,
          search,
          companyId,
          vehicleType,
          lowStock: lowStock ? 'true' : 'false',
        },
      });
      if (res.data.success) {
        setTyres(res.data.data.tyres);
        setTotalPages(res.data.data.pages);
        setTotalCount(res.data.data.total);
      }
    } catch (err) {
      toast.error('Failed to load tyres catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTyres();
  };

  const handleOpenAdd = () => {
    setEditingTyre(null);
    setFormData({
      companyId: companies[0]?._id || '',
      modelName: '',
      size: '',
      vehicleType: 'Car',
      tubeType: 'Tubeless',
      sku: `TYRE-${Date.now().toString().slice(-6)}`,
      purchasePriceRupees: '',
      sellingPriceRupees: '',
      mrpRupees: '',
      gstPercent: 28,
      quantity: 10,
      lowStockThreshold: 5,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTyre(t);
    setFormData({
      companyId: t.companyId?._id || t.companyId,
      modelName: t.modelName,
      size: t.size,
      vehicleType: t.vehicleType,
      tubeType: t.tubeType,
      sku: t.sku,
      purchasePriceRupees: (t.purchasePricePaise / 100).toString(),
      sellingPriceRupees: (t.sellingPricePaise / 100).toString(),
      mrpRupees: (t.mrpPaise / 100).toString(),
      gstPercent: t.gstPercent,
      quantity: t.quantity,
      lowStockThreshold: t.lowStockThreshold,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.companyId || !formData.modelName || !formData.size) {
      return toast.error('Please complete all mandatory tyre specifications');
    }

    try {
      setSaving(true);
      const payload = {
        companyId: formData.companyId,
        modelName: formData.modelName,
        size: formData.size,
        vehicleType: formData.vehicleType,
        tubeType: formData.tubeType,
        sku: formData.sku.toUpperCase(),
        purchasePricePaise: rupeesToPaise(formData.purchasePriceRupees),
        sellingPricePaise: rupeesToPaise(formData.sellingPriceRupees),
        mrpPaise: rupeesToPaise(formData.mrpRupees || formData.sellingPriceRupees),
        gstPercent: Number(formData.gstPercent || 28),
        quantity: parseInt(formData.quantity || 0, 10),
        lowStockThreshold: parseInt(formData.lowStockThreshold || 5, 10),
      };

      if (editingTyre) {
        const res = await api.put(`/admin/tyres/${editingTyre._id}`, payload);
        if (res.data.success) {
          toast.success(`Updated ${res.data.data.modelName}`);
        }
      } else {
        const res = await api.post('/admin/tyres', payload);
        if (res.data.success) {
          toast.success(`Created ${res.data.data.modelName}`);
        }
      }

      setShowModal(false);
      fetchTyres();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save tyre');
    } finally {
      setSaving(false);
    }
  };

  // Bulk Price Update Preview & Apply
  const handleBulkPreview = async (e) => {
    e.preventDefault();
    try {
      setBulkLoading(true);
      const res = await api.post('/admin/tyres/bulk-price-update', {
        companyId: bulkFilter.companyId || undefined,
        vehicleType: bulkFilter.vehicleType || undefined,
        percentageDelta: Number(bulkFilter.percentageDelta),
        preview: true,
      });
      if (res.data.success) {
        setBulkPreview(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to preview bulk price update');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkApply = async () => {
    try {
      setBulkLoading(true);
      const res = await api.post('/admin/tyres/bulk-price-update', {
        companyId: bulkFilter.companyId || undefined,
        vehicleType: bulkFilter.vehicleType || undefined,
        percentageDelta: Number(bulkFilter.percentageDelta),
        preview: false,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Bulk prices updated successfully!');
        setShowBulkModal(false);
        setBulkPreview(null);
        fetchTyres();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply bulk update');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      setArchiving(true);
      const res = await api.delete(`/admin/tyres/${archiveTarget._id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Tyre archived successfully');
        setArchiveTarget(null);
        fetchTyres();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to archive tyre');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h1 className="page-title">Tyre Catalog & Stock Manager</h1>
            <p className="page-subtitle">
              Multi-company inventory, sizes, selling rates, GST & bulk price adjustment
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5"
              onClick={() => {
                setBulkPreview(null);
                setShowBulkModal(true);
              }}
            >
              <TrendingUp size={15} style={{ color: 'var(--accent-dark)' }} /> Bulk Price Update
            </button>
            <button className="btn btn-accent btn-sm d-flex align-items-center gap-1.5" onClick={handleOpenAdd}>
              <Plus size={16} /> Add New Tyre
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="filter-bar-card">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><Search size={15} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search model, size (e.g. 185/65), or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-2.5">
            <select
              className="form-select form-select-sm"
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2.5">
            <select
              className="form-select form-select-sm"
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Vehicle Types</option>
              {['Bike', 'Scooter', 'Car', 'SUV', 'Truck', 'Tractor', 'Auto'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2 d-flex align-items-center">
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="lowStockToggle"
                checked={lowStock}
                onChange={(e) => {
                  setLowStock(e.target.checked);
                  setPage(1);
                }}
              />
              <label className="form-check-label text-dark small fw-semibold ms-1" htmlFor="lowStockToggle">
                Low Stock Only
              </label>
            </div>
          </div>
          <div className="col-6 col-md-1">
            <button type="submit" className="btn btn-outline-dark-custom btn-sm w-100">Filter</button>
          </div>
        </form>
      </div>

      {/* Catalog Table */}
      <div className="table-container-card">
        {loading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : tyres.length === 0 ? (
          <div className="p-5 text-center text-muted">
            No tyres found matching the criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Model Name</th>
                  <th>Size</th>
                  <th>Vehicle</th>
                  <th className="text-end">Cost Price</th>
                  <th className="text-end">Selling Price</th>
                  <th className="text-center">GST %</th>
                  <th className="text-center">Stock</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tyres.map((t) => {
                  const isLow = t.quantity <= t.lowStockThreshold && t.quantity > 0;
                  const isOut = t.quantity <= 0;
                  return (
                    <tr key={t._id}>
                      <td className="text-dark fw-bold">{t.companyId?.name || 'Tyre'}</td>
                      <td>
                        <div className="text-dark fw-semibold small">{t.modelName}</div>
                        <div className="text-muted extra-small font-monospace">SKU: {t.sku}</div>
                      </td>
                      <td className="text-dark font-monospace fw-semibold">{t.size}</td>
                      <td>
                        <span className="badge bg-light text-dark border extra-small">
                          {t.vehicleType} ({t.tubeType})
                        </span>
                      </td>
                      <td className="text-end text-muted font-monospace small">
                        {formatRupees(t.purchasePricePaise)}
                      </td>
                      <td className="text-end text-dark font-monospace fw-bold fs-6">
                        {formatRupees(t.sellingPricePaise)}
                      </td>
                      <td className="text-center text-muted small">{t.gstPercent}%</td>
                      <td className="text-center">
                        <span className={`badge ${isOut ? 'badge-pill-danger' : isLow ? 'badge-pill-warning' : 'badge-pill-success'} extra-small`}>
                          {t.quantity} units
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          <button
                            className="btn btn-sm btn-outline-dark-custom p-1.5"
                            title="Edit Tyre & Pricing"
                            onClick={() => handleOpenEdit(t)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger p-1.5"
                            title="Archive Tyre"
                            onClick={() => setArchiveTarget(t)}
                          >
                            <Archive size={14} />
                          </button>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center card-clean bg-white p-2 px-3">
          <small className="text-muted">
            Showing Page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong> ({totalCount} total tyres)
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

      {/* Add / Edit Tyre Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF' }}>
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title text-dark fw-bold m-0">
                  {editingTyre ? 'Edit Tyre & Price' : 'Add New Tyre to Inventory'}
                </h5>
                <button type="button" className="btn btn-sm text-muted" onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-dark small fw-semibold">Company / Brand *</label>
                      <select
                        className="form-select"
                        value={formData.companyId}
                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                        required
                      >
                        <option value="">Select Company</option>
                        {companies.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-dark small fw-semibold">Model Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Zapper-C, Amazer 4G, SecuraDrive"
                        value={formData.modelName}
                        onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-dark small fw-semibold">Tyre Size *</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. 185/65 R15, 90/90-12"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-dark small fw-semibold">Unique SKU *</label>
                      <input
                        type="text"
                        className="form-control font-monospace text-uppercase"
                        placeholder="e.g. MRF-ZAP-1856515"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label text-dark small fw-semibold">Vehicle Category</label>
                      <select
                        className="form-select"
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      >
                        {['Bike', 'Scooter', 'Car', 'SUV', 'Truck', 'Tractor', 'Auto'].map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label text-dark small fw-semibold">Tube Type</label>
                      <select
                        className="form-select"
                        value={formData.tubeType}
                        onChange={(e) => setFormData({ ...formData, tubeType: e.target.value })}
                      >
                        <option value="Tubeless">Tubeless</option>
                        <option value="Tube-type">Tube-type</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-dark small fw-semibold">GST Rate (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.gstPercent}
                        onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                        required
                      />
                    </div>

                    {/* Pricing in Rupees */}
                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted small fw-semibold">Purchase Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={formData.purchasePriceRupees}
                        onChange={(e) => setFormData({ ...formData, purchasePriceRupees: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-dark small fw-bold">Selling Price Ex-GST (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={formData.sellingPriceRupees}
                        onChange={(e) => setFormData({ ...formData, sellingPriceRupees: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted small fw-semibold">Printed MRP (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={formData.mrpRupees}
                        onChange={(e) => setFormData({ ...formData, mrpRupees: e.target.value })}
                      />
                    </div>

                    {/* Quantity & Threshold */}
                    <div className="col-6">
                      <label className="form-label text-dark small fw-semibold">Current Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label text-dark small fw-semibold">Low Stock Alert Threshold</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-3">
                  <button type="button" className="btn btn-outline-dark-custom" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-accent" disabled={saving}>
                    {saving ? 'Saving Tyre...' : 'Save Tyre Specification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BULK PRICE UPDATE MODAL (Spec Requirement 5) */}
      {showBulkModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF' }}>
              <div className="modal-header border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <TrendingUp style={{ color: 'var(--accent-dark)' }} size={20} />
                  <h5 className="modal-title text-dark fw-bold m-0">Bulk Selling Price Adjustment</h5>
                </div>
                <button type="button" className="btn btn-sm text-muted" onClick={() => setShowBulkModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body py-4">
                <p className="text-muted small mb-3">
                  Adjust selling rates company-wide or across a vehicle category (e.g., "+5% for all MRF tyres").
                  Preview all changes before committing to the database.
                </p>

                <form onSubmit={handleBulkPreview} className="row g-3 mb-4 p-3 rounded-3 bg-light border">
                  <div className="col-12 col-md-4">
                    <label className="form-label text-dark small fw-semibold">Target Company</label>
                    <select
                      className="form-select"
                      value={bulkFilter.companyId}
                      onChange={(e) => setBulkFilter({ ...bulkFilter, companyId: e.target.value })}
                    >
                      <option value="">All Companies</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-dark small fw-semibold">Target Vehicle Type</label>
                    <select
                      className="form-select"
                      value={bulkFilter.vehicleType}
                      onChange={(e) => setBulkFilter({ ...bulkFilter, vehicleType: e.target.value })}
                    >
                      <option value="">All Vehicle Types</option>
                      {['Bike', 'Scooter', 'Car', 'SUV', 'Truck', 'Tractor', 'Auto'].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-dark small fw-bold">Percentage Delta (%)</label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.5"
                        className="form-control"
                        placeholder="e.g. 5 or -3"
                        value={bulkFilter.percentageDelta}
                        onChange={(e) => setBulkFilter({ ...bulkFilter, percentageDelta: e.target.value })}
                        required
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </div>

                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-outline-dark-custom btn-sm" disabled={bulkLoading}>
                      {bulkLoading ? 'Calculating Preview...' : 'Calculate Preview'}
                    </button>
                  </div>
                </form>

                {/* Preview Results Table */}
                {bulkPreview && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-dark fw-bold small">
                        Preview: {bulkPreview.count} Tyres Will Be Updated
                      </span>
                      <span className="badge-pill-warning">
                        Delta: {bulkFilter.percentageDelta > 0 ? `+${bulkFilter.percentageDelta}%` : `${bulkFilter.percentageDelta}%`}
                      </span>
                    </div>

                    <div className="table-responsive overflow-y-auto mb-3" style={{ maxHeight: '280px' }}>
                      <table className="table table-custom table-sm mb-0">
                        <thead>
                          <tr>
                            <th>Tyre Description</th>
                            <th>Size</th>
                            <th className="text-end">Current Price</th>
                            <th className="text-end">New Price</th>
                            <th className="text-end">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkPreview.items.map((item) => (
                            <tr key={item._id}>
                              <td className="text-dark small">{item.companyName} {item.modelName}</td>
                              <td className="text-dark font-monospace extra-small">{item.size}</td>
                              <td className="text-end font-monospace text-muted small">
                                {formatRupees(item.currentSellingPricePaise)}
                              </td>
                              <td className="text-end font-monospace text-dark fw-bold small">
                                {formatRupees(item.newSellingPricePaise)}
                              </td>
                              <td className={`text-end font-monospace extra-small ${item.differencePaise >= 0 ? 'text-success' : 'text-danger'}`}>
                                {item.differencePaise >= 0 ? `+${formatRupees(item.differencePaise)}` : formatRupees(item.differencePaise)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top py-3">
                <button type="button" className="btn btn-outline-dark-custom" onClick={() => setShowBulkModal(false)}>
                  Cancel
                </button>
                {bulkPreview && (
                  <button
                    type="button"
                    className="btn btn-accent d-flex align-items-center gap-2"
                    onClick={handleBulkApply}
                    disabled={bulkLoading}
                  >
                    <Check size={16} /> Commit & Apply New Prices
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        title={`Archive Tyre ${archiveTarget?.modelName}?`}
        message={`Are you sure you want to archive "${archiveTarget?.modelName} ${archiveTarget?.size}"? Per Rule 7, historical sales referencing this tyre will remain intact for warranty queries, but it will be hidden from new billing.`}
        confirmText="Archive Tyre"
        variant="danger"
        isLoading={archiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
