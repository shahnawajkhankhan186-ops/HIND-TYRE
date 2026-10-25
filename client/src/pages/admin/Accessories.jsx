import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Archive, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees, rupeesToPaise } from '../../lib/currency';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

const CATEGORIES = ['Tube', 'Valve', 'Alloy wheel', 'Wheel cover', 'Balancing weight', 'Puncture kit', 'Other'];

export default function Accessories() {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tube',
    sku: '',
    purchasePriceRupees: '',
    sellingPriceRupees: '',
    gstPercent: 18,
    quantity: 10,
    lowStockThreshold: 5,
  });
  const [saving, setSaving] = useState(false);

  // Archive Target
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    fetchAccessories();
  }, [selectedCategory]);

  const fetchAccessories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/accessories', {
        params: { search, category: selectedCategory || undefined, limit: 100 },
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

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Tube',
      sku: `ACC-${Date.now().toString().slice(-6)}`,
      purchasePriceRupees: '',
      sellingPriceRupees: '',
      gstPercent: 18,
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
      gstPercent: item.gstPercent,
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
      const payload = {
        name: formData.name,
        category: formData.category,
        sku: formData.sku.toUpperCase(),
        purchasePricePaise: rupeesToPaise(formData.purchasePriceRupees),
        sellingPricePaise: rupeesToPaise(formData.sellingPriceRupees),
        gstPercent: Number(formData.gstPercent || 18),
        quantity: parseInt(formData.quantity || 0, 10),
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
    <div className="container-fluid p-3 p-md-4">
      {/* Header */}
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-white fw-bold m-0 brand-font">Accessories & Parts Catalog</h3>
            <p className="text-secondary small m-0 mt-0.5">Tubes, valves, wheel weights, alloy covers & repair kits</p>
          </div>
          <button className="btn btn-primary-glass btn-sm d-flex align-items-center gap-1.5" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Accessory
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><Search size={15} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search accessories by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
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
          <div className="col-12 col-md-2">
            <button className="btn btn-secondary-glass btn-sm w-100" onClick={fetchAccessories}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="table-responsive">
            <table className="table table-glass mb-0">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th className="text-end">Selling Rate</th>
                  <th className="text-center">GST %</th>
                  <th className="text-center">Stock</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessories.map((item) => (
                  <tr key={item._id}>
                    <td className="text-white fw-semibold">{item.name}</td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-30 text-white extra-small">
                        {item.category}
                      </span>
                    </td>
                    <td className="text-secondary font-monospace extra-small">{item.sku}</td>
                    <td className="text-end font-monospace text-white fw-bold">
                      {formatRupees(item.sellingPricePaise)}
                    </td>
                    <td className="text-center text-secondary">{item.gstPercent}%</td>
                    <td className="text-center">
                      <span className={`badge ${item.quantity <= 0 ? 'bg-danger' : item.quantity <= item.lowStockThreshold ? 'badge-glass-amber' : 'badge-glass-emerald'} extra-small`}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1.5">
                        <button
                          className="btn btn-sm btn-secondary-glass p-1.5"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger-glass p-1.5"
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
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal border-0 shadow-2xl">
              <div className="modal-header border-bottom border-secondary border-opacity-25 pb-3">
                <h5 className="modal-title text-white fw-bold m-0">
                  {editingItem ? 'Edit Accessory' : 'Add Accessory'}
                </h5>
                <button type="button" className="btn btn-sm text-secondary" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label text-light small fw-semibold">Item Name *</label>
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
                      <label className="form-label text-light small fw-semibold">Category</label>
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
                      <label className="form-label text-light small fw-semibold">SKU *</label>
                      <input
                        type="text"
                        className="form-control font-monospace text-uppercase"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label text-secondary small fw-semibold">Cost Price (₹)</label>
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
                      <label className="form-label text-info small fw-bold">Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control border-info"
                        placeholder="0.00"
                        value={formData.sellingPriceRupees}
                        onChange={(e) => setFormData({ ...formData, sellingPriceRupees: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label text-light small fw-semibold">GST Rate (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.gstPercent}
                        onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label text-light small fw-semibold">Stock Qty</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label text-light small fw-semibold">Threshold</label>
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

                <div className="modal-footer border-top border-secondary border-opacity-25 pt-3">
                  <button type="button" className="btn btn-secondary-glass" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-glass" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Accessory'}
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
