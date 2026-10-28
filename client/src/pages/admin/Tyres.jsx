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
import { useAuth } from '../../context/AuthContext';

export default function Tyres() {
  const { shopSettings } = useAuth();
  const getGodownName = (code) => {
    return shopSettings?.godowns?.find((g) => g.code === code)?.name || (code === 'G1' ? 'Godown 1' : 'Godown 2');
  };

  const [tyres, setTyres] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [inStockGodown, setInStockGodown] = useState('');
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
    materialNumber: '',
    purchasePriceRupees: '',
    actualPriceRupees: '',
    sellingPriceRupees: '',
    gstPercent: 0,
    g1Stock: 0,
    g2Stock: 0,
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
  }, [page, companyId, vehicleType, inStockGodown, lowStock]);

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
          inStockGodown: inStockGodown || undefined,
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
      materialNumber: `MAT-${Date.now().toString().slice(-6)}`,
      purchasePriceRupees: '',
      actualPriceRupees: '',
      sellingPriceRupees: '',
      gstPercent: 0,
      g1Stock: 5,
      g2Stock: 5,
      quantity: 10,
      lowStockThreshold: 5,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    const purchaseRupees = (t.purchasePricePaise / 100).toString();
    const actualRupees = t.actualPricePaise
      ? (t.actualPricePaise / 100).toFixed(2)
      : (Number(purchaseRupees) * 0.97).toFixed(2);

    const g1Stock = t.godownStock?.G1 ?? 0;
    const g2Stock = t.godownStock?.G2 ?? 0;

    setEditingTyre(t);
    setFormData({
      companyId: t.companyId?._id || t.companyId,
      modelName: t.modelName,
      size: t.size,
      vehicleType: t.vehicleType,
      tubeType: t.tubeType,
      sku: t.sku,
      materialNumber: t.materialNumber || '',
      purchasePriceRupees: purchaseRupees,
      actualPriceRupees: actualRupees,
      sellingPriceRupees: (t.sellingPricePaise / 100).toString(),
      gstPercent: 0,
      g1Stock,
      g2Stock,
      quantity: t.quantity,
      lowStockThreshold: t.lowStockThreshold,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.companyId || !formData.modelName || !formData.size || !formData.materialNumber?.trim()) {
      return toast.error('Please complete all mandatory tyre specifications including Material Number');
    }

    try {
      setSaving(true);
      const purchasePricePaise = rupeesToPaise(formData.purchasePriceRupees);
      const actualPricePaise = formData.actualPriceRupees
        ? rupeesToPaise(formData.actualPriceRupees)
        : Math.round(purchasePricePaise * 0.97);

      const g1Stock = Math.max(0, parseInt(formData.g1Stock || 0, 10));
      const g2Stock = Math.max(0, parseInt(formData.g2Stock || 0, 10));
      const totalQty = g1Stock + g2Stock;

      const payload = {
        companyId: formData.companyId,
        modelName: formData.modelName,
        size: formData.size,
        vehicleType: formData.vehicleType,
        tubeType: formData.tubeType,
        sku: formData.sku.toUpperCase(),
        materialNumber: formData.materialNumber.trim().toUpperCase(),
        purchasePricePaise,
        actualPricePaise,
        mrpPaise: actualPricePaise,
        sellingPricePaise: rupeesToPaise(formData.sellingPriceRupees),
        gstPercent: 0,
        godownStock: {
          G1: g1Stock,
          G2: g2Stock,
        },
        quantity: totalQty,
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
              Multi-company inventory, sizes, selling rates & bulk price adjustment
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
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={inStockGodown}
              onChange={(e) => {
                setInStockGodown(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Warehouses</option>
              <option value="G1">In Stock in {getGodownName('G1')}</option>
              <option value="G2">In Stock in {getGodownName('G2')}</option>
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
          <TableSkeleton rows={8} cols={11} />
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
                  <th>Material No</th>
                  <th>Size</th>
                  <th>Vehicle</th>
                  <th className="text-end">Cost Price</th>
                  <th className="text-end">Selling Price</th>
                  <th className="text-center">{getGodownName('G1')}</th>
                  <th className="text-center">{getGodownName('G2')}</th>
                  <th className="text-center">Total Stock</th>
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
                      <td className="font-monospace small">
                        {t.materialNumber ? (
                          <span className="badge bg-light text-dark border font-monospace px-2 py-1">
                            {t.materialNumber}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-dark font-monospace fw-semibold">{t.size}</td>
                      <td>
                        <span className="badge bg-light text-dark border extra-small">
                          {t.vehicleType} ({t.tubeType})
                        </span>
                      </td>
                      <td className="text-end font-monospace small">
                        <div className="text-dark fw-semibold">{formatRupees(t.purchasePricePaise)}</div>
                        <div className="extra-small text-success">
                          Act: {formatRupees(t.actualPricePaise || Math.round(t.purchasePricePaise * 0.97))}
                        </div>
                      </td>
                      <td className="text-end text-dark font-monospace fw-bold fs-6">
                        {formatRupees(t.sellingPricePaise)}
                      </td>
                      <td className="text-center font-monospace">
                        <span className={`badge ${t.godownStock?.G1 > 0 ? 'bg-light text-dark border' : 'bg-light text-muted opacity-50 border'} px-2 py-1`}>
                          {t.godownStock?.G1 ?? 0}
                        </span>
                      </td>
                      <td className="text-center font-monospace">
                        <span className={`badge ${t.godownStock?.G2 > 0 ? 'bg-light text-dark border' : 'bg-light text-muted opacity-50 border'} px-2 py-1`}>
                          {t.godownStock?.G2 ?? 0}
                        </span>
                      </td>
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

                    <div className="col-12 col-md-4">
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

                    <div className="col-12 col-md-4">
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

                    <div className="col-12 col-md-4">
                      <label className="form-label text-dark small fw-bold">Material Number *</label>
                      <input
                        type="text"
                        className="form-control font-monospace text-uppercase"
                        placeholder="e.g. 1004523 or MAT-80100"
                        value={formData.materialNumber}
                        onChange={(e) => setFormData({ ...formData, materialNumber: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
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

                    <div className="col-12 col-md-6">
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

                    {/* Pricing in Rupees */}
                    <div className="col-12 col-md-4">
                      <label className="form-label text-dark small fw-semibold">Purchase Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={formData.purchasePriceRupees}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = parseFloat(val);
                          const autoActual = !isNaN(num) && num > 0 ? (num * 0.97).toFixed(2) : '';
                          setFormData({
                            ...formData,
                            purchasePriceRupees: val,
                            actualPriceRupees: autoActual,
                          });
                        }}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label text-dark small fw-bold m-0">Actual Price (₹)</label>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 extra-small">
                          -3% Less
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control font-monospace"
                        placeholder="0.00"
                        value={formData.actualPriceRupees}
                        onChange={(e) => setFormData({ ...formData, actualPriceRupees: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-dark small fw-bold">Selling Price (₹) *</label>
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

                    {/* Quantity & Threshold */}
                    <div className="col-12 col-md-4">
                      <label className="form-label text-dark small fw-semibold">
                        {getGodownName('G1')} Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control font-monospace"
                        value={formData.g1Stock}
                        onChange={(e) => {
                          const g1 = parseInt(e.target.value || 0, 10);
                          const g2 = parseInt(formData.g2Stock || 0, 10);
                          setFormData({
                            ...formData,
                            g1Stock: e.target.value,
                            quantity: g1 + g2,
                          });
                        }}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-dark small fw-semibold">
                        {getGodownName('G2')} Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control font-monospace"
                        value={formData.g2Stock}
                        onChange={(e) => {
                          const g2 = parseInt(e.target.value || 0, 10);
                          const g1 = parseInt(formData.g1Stock || 0, 10);
                          setFormData({
                            ...formData,
                            g2Stock: e.target.value,
                            quantity: g1 + g2,
                          });
                        }}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-dark small fw-semibold">
                        Total Stock (Auto G1+G2)
                      </label>
                      <input
                        type="number"
                        className="form-control font-monospace bg-light fw-bold"
                        value={parseInt(formData.g1Stock || 0, 10) + parseInt(formData.g2Stock || 0, 10)}
                        readOnly
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label text-dark small fw-semibold">Low Stock Alert Threshold (Total)</label>
                      <input
                        type="number"
                        min="0"
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
