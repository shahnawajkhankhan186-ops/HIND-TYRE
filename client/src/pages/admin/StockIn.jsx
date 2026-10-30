import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, Package, Check, Disc3, Layers, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees, rupeesToPaise } from '../../lib/currency';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/common/BackButton';

export default function StockIn() {
  const { shopSettings } = useAuth();
  const getGodownName = (code) => {
    return shopSettings?.godowns?.find((g) => g.code === code)?.name || (code === 'G1' ? 'Godown 1' : 'Godown 2');
  };

  const [itemType, setItemType] = useState('Tyre');
  const [tyres, setTyres] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [godown, setGodown] = useState('G1');
  const [quantity, setQuantity] = useState('');
  const [purchasePriceRupees, setPurchasePriceRupees] = useState('');
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const [tyresRes, accRes] = await Promise.all([
        api.get('/admin/tyres', { params: { limit: 200 } }),
        api.get('/admin/accessories', { params: { limit: 200 } }),
      ]);
      if (tyresRes.data.success) {
        setTyres(tyresRes.data.data.tyres);
      }
      if (accRes.data.success) {
        setAccessories(accRes.data.data.accessories);
      }
    } catch (err) {
      toast.error('Failed to load item lists');
    } finally {
      setLoading(false);
    }
  };

  const selectedItem =
    itemType === 'Tyre'
      ? tyres.find((t) => t._id === selectedItemId)
      : accessories.find((a) => a._id === selectedItemId);

  // When item selected, pre-fill current purchase price
  const handleItemSelect = (id) => {
    setSelectedItemId(id);
    const item =
      itemType === 'Tyre'
        ? tyres.find((t) => t._id === id)
        : accessories.find((a) => a._id === id);

    if (item && item.purchasePricePaise) {
      setPurchasePriceRupees((item.purchasePricePaise / 100).toString());
    } else {
      setPurchasePriceRupees('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      return toast.error('Please select an item to stock in');
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return toast.error('Quantity must be greater than zero');
    }

    try {
      setSubmitting(true);
      const payload = {
        itemType,
        itemId: selectedItemId,
        godown,
        quantity: qty,
        purchasePricePaise: purchasePriceRupees ? rupeesToPaise(purchasePriceRupees) : undefined,
        supplier: supplier.trim(),
        note: note.trim(),
      };

      const res = await api.post('/admin/stock-in', payload);
      if (res.data.success) {
        toast.success(`Successfully added ${qty} units into ${getGodownName(godown)}! New godown stock: ${res.data.data.godownAfter}`);
        setQuantity('');
        setNote('');
        fetchItems(); // refresh current stock quantities
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete stock-in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-card">
        <div className="d-flex align-items-center gap-2.5">
          <BackButton fallback="/admin/dashboard" />
          <div>
            <h1 className="page-title mb-0">Stock In (Purchase Entry)</h1>
            <p className="page-subtitle mb-0">
              Record received tyre shipments & supplier purchases with ledger updates
            </p>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card-clean bg-white p-3 p-sm-4 p-md-5">
            <form onSubmit={handleSubmit}>
              {/* Item Type Switcher */}
              <div className="mb-4">
                <label className="form-label text-dark small fw-semibold">Item Category *</label>
                <div className="btn-group w-100 p-1 rounded-pill bg-light border">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill py-2 ${itemType === 'Tyre' ? 'btn-accent' : 'btn-link text-muted text-decoration-none'}`}
                    onClick={() => {
                      setItemType('Tyre');
                      setSelectedItemId('');
                      setPurchasePriceRupees('');
                    }}
                  >
                    <Disc3 size={16} className="me-1.5" /> Tyre Shipment
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill py-2 ${itemType === 'Accessory' ? 'btn-accent' : 'btn-link text-muted text-decoration-none'}`}
                    onClick={() => {
                      setItemType('Accessory');
                      setSelectedItemId('');
                      setPurchasePriceRupees('');
                    }}
                  >
                    <Layers size={16} className="me-1.5" /> Accessories / Tubes / Parts
                  </button>
                </div>
              </div>

              {/* Select Item */}
              <div className="mb-3">
                <label className="form-label text-dark small fw-semibold">
                  Select {itemType === 'Tyre' ? 'Tyre Specification' : 'Accessory'} *
                </label>
                <select
                  className="form-select form-select-lg fs-6"
                  value={selectedItemId}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  required
                >
                  <option value="">-- Choose {itemType} from catalog --</option>
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

              {/* Current Item Live Info Badge */}
              {selectedItem && (
                <div className="p-3 mb-4 rounded-3 bg-light border d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <span className="text-muted extra-small text-uppercase">Current On-Hand Stock:</span>
                    <div className="text-dark fw-bold fs-6">
                      Total: {selectedItem.quantity} units ({getGodownName('G1')}: {selectedItem.godownStock?.G1 ?? 0} · {getGodownName('G2')}: {selectedItem.godownStock?.G2 ?? 0})
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-muted extra-small text-uppercase">Standard Cost Price:</span>
                    <div className="text-dark font-monospace fw-bold fs-6">
                      {formatRupees(selectedItem.purchasePricePaise)}
                    </div>
                  </div>
                </div>
              )}

              <div className="row g-3 mb-3">
                {/* Target Warehouse */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-bold">Target Warehouse (Godown) *</label>
                  <select
                    className="form-select form-select-lg fs-6"
                    value={godown}
                    onChange={(e) => setGodown(e.target.value)}
                    required
                  >
                    <option value="G1">{getGodownName('G1')} (G1)</option>
                    <option value="G2">{getGodownName('G2')} (G2)</option>
                  </select>
                </div>

                {/* Quantity Received */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-bold">Quantity Received *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control form-control-lg fs-6"
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                {/* Purchase Cost per unit */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">
                    Purchase Price per Unit (₹)
                  </label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text fs-6">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control fs-6"
                      placeholder="0.00"
                      value={purchasePriceRupees}
                      onChange={(e) => setPurchasePriceRupees(e.target.value)}
                    />
                  </div>
                </div>

                {/* Supplier */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">Supplier / Distributor Name</label>
                  <div className="input-group">
                    <span className="input-group-text"><Truck size={16} /></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MRF Regional Depot, Apollo Central"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                    />
                  </div>
                </div>

                {/* PO / Invoice Reference / Note */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">PO / Invoice / Batch Note</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Batch #2026-OCT-12"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3 border-top d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-accent px-4 py-2.5 d-flex align-items-center gap-2"
                  disabled={submitting || !selectedItemId || !quantity}
                >
                  <ArrowDownToLine size={18} />
                  {submitting ? 'Recording Stock-In...' : 'Record Purchase & Increase Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
