import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, AlertTriangle, Disc3, Layers, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function StockAdjust() {
  const [itemType, setItemType] = useState('Tyre');
  const [tyres, setTyres] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const [tRes, aRes] = await Promise.all([
        api.get('/admin/tyres', { params: { limit: 200 } }),
        api.get('/admin/accessories', { params: { limit: 200 } }),
      ]);
      if (tRes.data.success) setTyres(tRes.data.data.tyres);
      if (aRes.data.success) setAccessories(aRes.data.data.accessories);
    } catch (_) {}
  };

  const selectedItem =
    itemType === 'Tyre'
      ? tyres.find((t) => t._id === selectedItemId)
      : accessories.find((a) => a._id === selectedItemId);

  const handleItemSelect = (id) => {
    setSelectedItemId(id);
    const item =
      itemType === 'Tyre'
        ? tyres.find((t) => t._id === id)
        : accessories.find((a) => a._id === id);
    if (item) {
      setNewQuantity(item.quantity.toString());
    } else {
      setNewQuantity('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) return toast.error('Please choose an item');
    if (!reason.trim()) return toast.error('A mandatory reason is required for manual stock adjustments');

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 0) return toast.error('Stock quantity cannot be negative');

    try {
      setSubmitting(true);
      const res = await api.post('/admin/stock-adjust', {
        itemType,
        itemId: selectedItemId,
        newQuantity: qty,
        note: reason.trim(),
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Stock adjusted successfully');
        setReason('');
        fetchItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-card">
        <h1 className="page-title">Manual Stock Adjustment</h1>
        <p className="page-subtitle">
          Audited inventory corrections (physical audit recount, damaged goods, or showroom display)
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card-clean bg-white p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              {/* Type Switcher */}
              <div className="mb-4">
                <label className="form-label text-dark small fw-semibold">Item Category *</label>
                <div className="btn-group w-100 p-1 rounded-pill bg-light border">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill py-2 ${itemType === 'Tyre' ? 'btn-accent' : 'btn-link text-muted text-decoration-none'}`}
                    onClick={() => {
                      setItemType('Tyre');
                      setSelectedItemId('');
                      setNewQuantity('');
                    }}
                  >
                    <Disc3 size={16} className="me-1.5" /> Adjust Tyre
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill py-2 ${itemType === 'Accessory' ? 'btn-accent' : 'btn-link text-muted text-decoration-none'}`}
                    onClick={() => {
                      setItemType('Accessory');
                      setSelectedItemId('');
                      setNewQuantity('');
                    }}
                  >
                    <Layers size={16} className="me-1.5" /> Adjust Accessory
                  </button>
                </div>
              </div>

              {/* Select Item */}
              <div className="mb-3">
                <label className="form-label text-dark small fw-semibold">Select Item to Correct *</label>
                <select
                  className="form-select form-select-lg fs-6"
                  value={selectedItemId}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  required
                >
                  <option value="">-- Choose item --</option>
                  {itemType === 'Tyre'
                    ? tyres.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.companyId?.name} {t.modelName} ({t.size}){t.materialNumber ? ` [Mat: ${t.materialNumber}]` : ''} – Current Stock: {t.quantity}
                        </option>
                      ))
                    : accessories.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.category}) – Current Stock: {a.quantity}
                        </option>
                      ))}
                </select>
              </div>

              {selectedItem && (
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <div className="p-3 rounded-2 bg-light border text-center">
                      <span className="text-muted extra-small text-uppercase">Recorded System Stock</span>
                      <div className="text-dark fw-bold fs-5">{selectedItem.quantity} units</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded-2 bg-light border text-center">
                      <span className="text-muted extra-small text-uppercase">Delta Correction</span>
                      <div className={`fw-bold fs-5 ${Number(newQuantity) - selectedItem.quantity >= 0 ? 'text-success' : 'text-danger'}`}>
                        {Number(newQuantity) - selectedItem.quantity >= 0 ? `+${Number(newQuantity) - selectedItem.quantity}` : Number(newQuantity) - selectedItem.quantity} units
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New Actual Count */}
              <div className="mb-3">
                <label className="form-label text-dark small fw-bold">Actual Physical Count (New Quantity) *</label>
                <input
                  type="number"
                  min="0"
                  className="form-control form-control-lg fs-6"
                  placeholder="e.g. 12"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  required
                />
              </div>

              {/* Mandatory Reason (Rule 4) */}
              <div className="mb-4">
                <label className="form-label text-dark small fw-semibold">
                  Mandatory Audit Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Annual physical inventory audit reconciliation / damaged sidewall written off"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
                <small className="text-muted extra-small">
                  This note will be logged in the permanent StockMovement audit ledger.
                </small>
              </div>

              <div className="pt-3 border-top d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-accent px-4 py-2.5 d-flex align-items-center gap-2"
                  disabled={submitting || !selectedItemId || !reason.trim()}
                >
                  <SlidersHorizontal size={18} />
                  {submitting ? 'Updating Ledger...' : 'Commit Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
