import React, { useState, useEffect } from 'react';
import { History, Search, Filter, RefreshCw, ArrowUpRight, ArrowDownLeft, Sliders, RotateCcw, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatIST } from '../../lib/ist-date';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

export default function StockLedger() {
  const { shopSettings } = useAuth();
  const getGodownName = (code) => {
    return shopSettings?.godowns?.find((g) => g.code === code)?.name || (code === 'G1' ? 'Godown 1' : 'Godown 2');
  };

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [itemType, setItemType] = useState('');
  const [godown, setGodown] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Transfer Stock Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [catalogTyres, setCatalogTyres] = useState([]);
  const [catalogAccessories, setCatalogAccessories] = useState([]);
  const [transferForm, setTransferForm] = useState({
    itemType: 'Tyre',
    itemId: '',
    fromGodown: 'G1',
    toGodown: 'G2',
    quantity: '',
    note: '',
  });
  const [confirmTransferOpen, setConfirmTransferOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, [page, type, itemType, godown]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stock-ledger', {
        params: {
          page,
          limit: 25,
          type: type || undefined,
          itemType: itemType || undefined,
          godown: godown || undefined,
        },
      });
      if (res.data.success) {
        setMovements(res.data.data.movements);
        setTotalPages(res.data.data.pages);
        setTotalCount(res.data.data.total);
      }
    } catch (err) {
      toast.error('Failed to load stock ledger');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferCatalog = async () => {
    try {
      const [tRes, aRes] = await Promise.all([
        api.get('/admin/tyres', { params: { limit: 200 } }),
        api.get('/admin/accessories', { params: { limit: 200 } }),
      ]);
      if (tRes.data.success) setCatalogTyres(tRes.data.data.tyres);
      if (aRes.data.success) setCatalogAccessories(aRes.data.data.accessories);
    } catch (_) {}
  };

  const handleOpenTransfer = () => {
    fetchTransferCatalog();
    setTransferForm({
      itemType: 'Tyre',
      itemId: '',
      fromGodown: 'G1',
      toGodown: 'G2',
      quantity: '',
      note: '',
    });
    setShowTransferModal(true);
  };

  const selectedTransferItem =
    transferForm.itemType === 'Tyre'
      ? catalogTyres.find((t) => t._id === transferForm.itemId)
      : catalogAccessories.find((a) => a._id === transferForm.itemId);

  const availableInFromGodown = selectedTransferItem?.godownStock?.[transferForm.fromGodown] ?? 0;

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!transferForm.itemId) return toast.error('Please choose an item to transfer');
    if (transferForm.fromGodown === transferForm.toGodown) {
      return toast.error('Source and Destination godowns must be different');
    }
    const qty = parseInt(transferForm.quantity, 10);
    if (isNaN(qty) || qty <= 0) return toast.error('Quantity must be greater than zero');
    if (qty > availableInFromGodown) {
      return toast.error(`Insufficient stock in ${getGodownName(transferForm.fromGodown)} (${availableInFromGodown} available)`);
    }

    setConfirmTransferOpen(true);
  };

  const handleConfirmExecuteTransfer = async () => {
    try {
      setTransferring(true);
      const res = await api.post('/admin/stock-transfer', {
        itemType: transferForm.itemType,
        itemId: transferForm.itemId,
        fromGodown: transferForm.fromGodown,
        toGodown: transferForm.toGodown,
        quantity: parseInt(transferForm.quantity, 10),
        note: transferForm.note.trim() || undefined,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Stock transferred successfully!');
        setConfirmTransferOpen(false);
        setShowTransferModal(false);
        fetchLedger();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to transfer stock');
    } finally {
      setTransferring(false);
    }
  };

  const getBadgeForType = (movementType) => {
    switch (movementType) {
      case 'STOCK_IN':
        return <span className="badge badge-pill-success">STOCK IN</span>;
      case 'SALE':
        return <span className="badge badge-pill-info">SALE</span>;
      case 'SALE_CANCEL':
        return <span className="badge badge-pill-yellow">CANCEL RESTORE</span>;
      case 'ADJUSTMENT':
        return <span className="badge badge-pill-warning">MANUAL ADJUST</span>;
      case 'TRANSFER_OUT':
        return <span className="badge badge-pill-danger">TRANSFER OUT</span>;
      case 'TRANSFER_IN':
        return <span className="badge badge-pill-success">TRANSFER IN</span>;
      default:
        return <span className="badge bg-secondary">{movementType}</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h1 className="page-title">Inventory Stock Movement Ledger</h1>
            <p className="page-subtitle">
              Immutable audit ledger of all stock additions, transfers, sales deductions & adjustments
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-accent btn-sm d-flex align-items-center gap-1.5" onClick={handleOpenTransfer}>
              <ArrowLeftRight size={15} /> Transfer Between Godowns
            </button>
            <button className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5" onClick={fetchLedger}>
              <RefreshCw size={14} /> Refresh Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filter-bar-card">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Movement Types</option>
              <option value="STOCK_IN">STOCK_IN (Purchase)</option>
              <option value="SALE">SALE (Counter Billing)</option>
              <option value="SALE_CANCEL">SALE_CANCEL (Stock Restored)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Manual Correction)</option>
              <option value="TRANSFER_OUT">TRANSFER_OUT (Moved to other godown)</option>
              <option value="TRANSFER_IN">TRANSFER_IN (Received from other godown)</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Items (Tyres & Accessories)</option>
              <option value="Tyre">Tyres Only</option>
              <option value="Accessory">Accessories Only</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={godown}
              onChange={(e) => {
                setGodown(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Warehouses</option>
              <option value="G1">{getGodownName('G1')} (G1)</option>
              <option value="G2">{getGodownName('G2')} (G2)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-container-card">
        {loading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : movements.length === 0 ? (
          <div className="p-5 text-center text-muted">No stock movement records found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Timestamp (IST)</th>
                  <th>Type</th>
                  <th>Warehouse</th>
                  <th>Item Details</th>
                  <th className="text-center">Qty Delta</th>
                  <th className="text-center">Warehouse Stock</th>
                  <th className="text-center">Total Stock</th>
                  <th>Reference & Note</th>
                  <th className="text-end">Authorized By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const isPositive = m.qty > 0;
                  return (
                    <tr key={m._id}>
                      <td className="text-muted small font-monospace">{formatIST(m.createdAt)}</td>
                      <td>{getBadgeForType(m.type)}</td>
                      <td>
                        {m.godown ? (
                          <span className="badge bg-light text-dark border font-monospace extra-small">
                            {getGodownName(m.godown)} ({m.godown})
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="text-dark fw-semibold small">
                          {m.itemId?.modelName ? `${m.itemId?.modelName} (${m.itemId?.size})` : m.itemId?.name || 'Item'}
                        </div>
                        <div className="text-muted extra-small font-monospace">Type: {m.itemType}</div>
                      </td>
                      <td className="text-center">
                        <span className={`fw-bold font-monospace ${isPositive ? 'text-success' : 'text-danger'}`}>
                          {isPositive ? `+${m.qty}` : m.qty}
                        </span>
                      </td>
                      <td className="text-center font-monospace small">
                        {m.godownBefore !== undefined && m.godownAfter !== undefined ? (
                          <>
                            <span className="text-muted">{m.godownBefore}</span>
                            <span className="text-muted mx-1">→</span>
                            <span className="text-dark fw-bold">{m.godownAfter}</span>
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center font-monospace small">
                        <span className="text-muted">{m.quantityBefore}</span>
                        <span className="text-muted mx-1">→</span>
                        <span className="text-dark fw-bold">{m.quantityAfter}</span>
                      </td>
                      <td>
                        <div className="text-dark small">{m.reference || '-'}</div>
                        {m.note && <div className="text-muted extra-small">{m.note}</div>}
                      </td>
                      <td className="text-end text-muted small">
                        {m.createdBy?.name || 'System / Staff'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center card-clean bg-white p-2 px-3">
          <small className="text-muted">
            Page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong> ({totalCount} total entries)
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

      {/* STOCK TRANSFER MODAL */}
      {showTransferModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF' }}>
              <div className="modal-header border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <ArrowLeftRight style={{ color: 'var(--accent-dark)' }} size={20} />
                  <h5 className="modal-title text-dark fw-bold m-0">Transfer Stock Between Godowns</h5>
                </div>
                <button type="button" className="btn btn-sm text-muted" onClick={() => setShowTransferModal(false)}>✕</button>
              </div>

              <form onSubmit={handleTransferSubmit}>
                <div className="modal-body py-3">
                  <p className="text-muted extra-small mb-3">
                    Move stock atomically from one godown to another. Total inventory remains unchanged.
                  </p>

                  <div className="row g-3">
                    {/* Item Type Switcher */}
                    <div className="col-12">
                      <label className="form-label text-dark small fw-semibold">Item Category *</label>
                      <div className="btn-group w-100 p-1 rounded-pill bg-light border">
                        <button
                          type="button"
                          className={`btn btn-sm rounded-pill py-1.5 ${transferForm.itemType === 'Tyre' ? 'btn-accent' : 'btn-link text-muted text-decoration-none'}`}
                          onClick={() => setTransferForm({ ...transferForm, itemType: 'Tyre', itemId: '', quantity: '' })}
                        >
                          Tyre
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm rounded-pill py-1.5 ${transferForm.itemType === 'Accessory' ? 'btn-accent' : 'btn-link text-muted text-decoration-none'}`}
                          onClick={() => setTransferForm({ ...transferForm, itemType: 'Accessory', itemId: '', quantity: '' })}
                        >
                          Accessory
                        </button>
                      </div>
                    </div>

                    {/* Choose Item */}
                    <div className="col-12">
                      <label className="form-label text-dark small fw-semibold">Select Item *</label>
                      <select
                        className="form-select form-select-sm"
                        value={transferForm.itemId}
                        onChange={(e) => setTransferForm({ ...transferForm, itemId: e.target.value, quantity: '' })}
                        required
                      >
                        <option value="">-- Choose item --</option>
                        {transferForm.itemType === 'Tyre'
                          ? catalogTyres.map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.companyId?.name} {t.modelName} ({t.size}) – {getGodownName('G1')}: {t.godownStock?.G1 ?? 0} | {getGodownName('G2')}: {t.godownStock?.G2 ?? 0} (Total: {t.quantity})
                              </option>
                            ))
                          : catalogAccessories.map((a) => (
                              <option key={a._id} value={a._id}>
                                {a.name} ({a.category}) – {getGodownName('G1')}: {a.godownStock?.G1 ?? 0} | {getGodownName('G2')}: {a.godownStock?.G2 ?? 0} (Total: {a.quantity})
                              </option>
                            ))}
                      </select>
                    </div>

                    {/* From Godown */}
                    <div className="col-6">
                      <label className="form-label text-dark small fw-semibold">From Warehouse *</label>
                      <select
                        className="form-select form-select-sm"
                        value={transferForm.fromGodown}
                        onChange={(e) => {
                          const newFrom = e.target.value;
                          const newTo = newFrom === 'G1' ? 'G2' : 'G1';
                          setTransferForm({ ...transferForm, fromGodown: newFrom, toGodown: newTo, quantity: '' });
                        }}
                        required
                      >
                        <option value="G1">{getGodownName('G1')} (G1)</option>
                        <option value="G2">{getGodownName('G2')} (G2)</option>
                      </select>
                      {selectedTransferItem && (
                        <div className="extra-small text-muted mt-1">
                          Available: <strong className="text-dark font-monospace">{availableInFromGodown}</strong> units
                        </div>
                      )}
                    </div>

                    {/* To Godown */}
                    <div className="col-6">
                      <label className="form-label text-dark small fw-semibold">To Warehouse *</label>
                      <select
                        className="form-select form-select-sm"
                        value={transferForm.toGodown}
                        onChange={(e) => {
                          const newTo = e.target.value;
                          const newFrom = newTo === 'G1' ? 'G2' : 'G1';
                          setTransferForm({ ...transferForm, toGodown: newTo, fromGodown: newFrom });
                        }}
                        required
                      >
                        <option value="G1">{getGodownName('G1')} (G1)</option>
                        <option value="G2">{getGodownName('G2')} (G2)</option>
                      </select>
                      {selectedTransferItem && (
                        <div className="extra-small text-muted mt-1">
                          Current: <strong className="text-dark font-monospace">{selectedTransferItem.godownStock?.[transferForm.toGodown] ?? 0}</strong> units
                        </div>
                      )}
                    </div>

                    {/* Quantity to Transfer */}
                    <div className="col-12">
                      <label className="form-label text-dark small fw-bold">Quantity to Move *</label>
                      <input
                        type="number"
                        min="1"
                        max={availableInFromGodown || 1}
                        className="form-control"
                        placeholder="e.g. 5"
                        value={transferForm.quantity}
                        onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                        required
                      />
                    </div>

                    {/* Note */}
                    <div className="col-12">
                      <label className="form-label text-dark small fw-semibold">Transfer Note (Optional)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Display rebalance / Van transfer"
                        value={transferForm.note}
                        onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-2.5">
                  <button type="button" className="btn btn-outline-dark-custom btn-sm" onClick={() => setShowTransferModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-accent btn-sm d-flex align-items-center gap-1.5 fw-bold"
                    disabled={!transferForm.itemId || !transferForm.quantity || availableInFromGodown <= 0}
                  >
                    Review Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM TRANSFER MODAL using ConfirmDialog (Rule 6) */}
      <ConfirmDialog
        isOpen={confirmTransferOpen}
        title="Confirm Stock Transfer"
        message={`Are you sure you want to transfer ${transferForm.quantity} units of "${selectedTransferItem?.modelName || selectedTransferItem?.name || 'Item'}" from ${getGodownName(transferForm.fromGodown)} to ${getGodownName(transferForm.toGodown)}? Total inventory will remain unchanged.`}
        confirmText="Confirm & Transfer"
        cancelText="Cancel"
        variant="warning"
        isLoading={transferring}
        onConfirm={handleConfirmExecuteTransfer}
        onCancel={() => setConfirmTransferOpen(false)}
      />
    </div>
  );
}
