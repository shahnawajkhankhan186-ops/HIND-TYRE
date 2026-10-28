import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Archive, Search, RefreshCw, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees, rupeesToPaise } from '../../lib/currency';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Tube', 'Valve', 'Alloy wheel', 'Wheel cover', 'Balancing weight', 'Puncture kit', 'Other'];

export default function Accessories() {
  const { shopSettings } = useAuth();
  const getGodownName = (code) => {
    return shopSettings?.godowns?.find((g) => g.code === code)?.name || (code === 'G1' ? 'Godown 1' : 'Godown 2');
  };

  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inStockGodown, setInStockGodown] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tube',
    sku: '',
    purchasePriceRupees: '',
    sellingPriceRupees: '',
    gstPercent: 0,
    g1Stock: 5,
    g2Stock: 5,
    quantity: 10,
    lowStockThreshold: 5,
  });
  const [saving, setSaving] = useState(false);

  // Archive Target
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    fetchAccessories();
  }, [selectedCategory, inStockGodown]);

  const fetchAccessories = async (targetSearch = search) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/accessories', {
        params: {
          search: targetSearch?.trim() || undefined,
          category: selectedCategory || undefined,
          inStockGodown: inStockGodown || undefined,
          limit: 100,
        },
      });
      if (res.data.success) {
        setAccessories(res.data.data.accessories);
      }
    } catch (err) {
      toast.error('Failed to load accessories');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchAccessories(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchAccessories('');
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Tube',
      sku: `ACC-${Date.now().toString().slice(-6)}`,
      purchasePriceRupees: '',
      sellingPriceRupees: '',
      gstPercent: 0,
      g1Stock: 5,
      g2Stock: 5,
      quantity: 10,
      lowStockThreshold: 5,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      purchasePriceRupees: (item.purchasePricePaise / 100).toString(),
      sellingPriceRupees: (item.sellingPricePaise / 100).toString(),
      gstPercent: 0,
      g1Stock: item.godownStock?.G1 ?? 0,
      g2Stock: item.godownStock?.G2 ?? 0,
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sellingPriceRupees) {
      return toast.error('Please enter accessory name and selling price');
    }

    try {
      setSaving(true);
      const g1Stock = Math.max(0, parseInt(formData.g1Stock || 0, 10));
      const g2Stock = Math.max(0, parseInt(formData.g2Stock || 0, 10));
      const totalQty = g1Stock + g2Stock;

      const payload = {
        name: formData.name,
        category: formData.category,
        sku: formData.sku.toUpperCase(),
        purchasePricePaise: rupeesToPaise(formData.purchasePriceRupees),
        sellingPricePaise: rupeesToPaise(formData.sellingPriceRupees),
        gstPercent: 0,
        godownStock: {
          G1: g1Stock,
          G2: g2Stock,
        },
        quantity: totalQty,
        lowStockThreshold: parseInt(formData.lowStockThreshold || 5, 10),
      };

      if (editingItem) {
        await api.put(`/admin/accessories/${editingItem._id}`, payload);
        toast.success(`Updated ${payload.name}`);
      } else {
        await api.post('/admin/accessories', payload);
        toast.success(`Created ${payload.name}`);
      }

      setShowModal(false);
      fetchAccessories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save accessory');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      setArchiving(true);
      const res = await api.delete(`/admin/accessories/${archiveTarget._id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Accessory archived');
        setArchiveTarget(null);
        fetchAccessories();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to archive');
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
            <h1 className="page-title">Accessories & Parts Catalog</h1>
            <p className="page-subtitle">Tubes, valves, wheel weights, alloy covers & repair kits</p>
          </div>
          <button className="btn btn-accent btn-sm d-flex align-items-center gap-1.5" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Accessory
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-card">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
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
                placeholder="Search accessories by name or SKU..."
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
                title="Search accessories"
              >
                <Search size={14} />
                <span>Search</span>
              </button>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={inStockGodown}
              onChange={(e) => setInStockGodown(e.target.value)}
            >
              <option value="">All Warehouses</option>
              <option value="G1">In Stock in {getGodownName('G1')}</option>
              <option value="G2">In Stock in {getGodownName('G2')}</option>
            </select>
          </div>
          {(search || selectedCategory || inStockGodown) && (
            <div className="col-12 col-md-2">
              <button
                type="button"
                className="btn btn-outline-dark-custom btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setInStockGodown('');
                  (async () => {
                    try {
                      setLoading(true);
                      const res = await api.get('/admin/accessories', { params: { limit: 100 } });
                      if (res.data.success) setAccessories(res.data.data.accessories);
                    } catch (_) {} finally { setLoading(false); }
                  })();
                }}
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
          <TableSkeleton rows={6} cols={8} />
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th className="text-end">Selling Rate</th>
                  <th className="text-center">{getGodownName('G1')}</th>
                  <th className="text-center">{getGodownName('G2')}</th>
                  <th className="text-center">Total Stock</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessories.map((item) => (
                  <tr key={item._id}>
                    <td className="text-dark fw-semibold">{item.name}</td>
                    <td>
                      <span className="badge bg-light text-dark border extra-small">
                        {item.category}
                      </span>
                    </td>
                    <td className="text-muted font-monospace extra-small">{item.sku}</td>
                    <td className="text-end font-monospace text-dark fw-bold">
                      {formatRupees(item.sellingPricePaise)}
                    </td>
                    <td className="text-center font-monospace">
                      <span className={`badge ${item.godownStock?.G1 > 0 ? 'bg-light text-dark border' : 'bg-light text-muted opacity-50 border'} px-2 py-1`}>
                        {item.godownStock?.G1 ?? 0}
                      </span>
                    </td>
                    <td className="text-center font-monospace">
                      <span className={`badge ${item.godownStock?.G2 > 0 ? 'bg-light text-dark border' : 'bg-light text-muted opacity-50 border'} px-2 py-1`}>
                        {item.godownStock?.G2 ?? 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${item.quantity <= 0 ? 'badge-pill-danger' : item.quantity <= item.lowStockThreshold ? 'badge-pill-warning' : 'badge-pill-success'} extra-small`}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1.5">
                        <button
                          className="btn btn-sm btn-outline-dark-custom p-1.5"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger p-1.5"
                          onClick={() => setArchiveTarget(item)}
                        >
                          <Archive size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF' }}>
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title text-dark fw-bold m-0">
                  {editingItem ? 'Edit Accessory' : 'Add Accessory'}
                </h5>
                <button type="button" className="btn btn-sm text-muted" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label text-dark small fw-semibold">Item Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Butyl Car Tube 15 inch"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label text-dark small fw-semibold">Category</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label text-dark small fw-semibold">SKU *</label>
                      <input
                        type="text"
                        className="form-control font-monospace text-uppercase"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label text-muted small fw-semibold">Cost Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={formData.purchasePriceRupees}
                        onChange={(e) => setFormData({ ...formData, purchasePriceRupees: e.target.value })}
                      />
                    </div>

                    <div className="col-6">
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
                        Total Stock
                      </label>
                      <input
                        type="number"
                        className="form-control font-monospace bg-light fw-bold"
                        value={parseInt(formData.g1Stock || 0, 10) + parseInt(formData.g2Stock || 0, 10)}
                        readOnly
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label text-dark small fw-semibold">Threshold (Total)</label>
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

                <div className="modal-footer border-top pt-3">
                  <button type="button" className="btn btn-outline-dark-custom" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-accent fw-bold" disabled={saving}>
                    {saving ? 'Saving...' : editingItem ? 'Confirm Edit' : 'Save Accessory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Archive ConfirmDialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        title={`Archive ${archiveTarget?.name}?`}
        message={`Are you sure you want to archive "${archiveTarget?.name}"? Rule 7 requires soft-deleting items so invoices referencing this accessory remain valid.`}
        confirmText="Archive Accessory"
        variant="danger"
        isLoading={archiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
