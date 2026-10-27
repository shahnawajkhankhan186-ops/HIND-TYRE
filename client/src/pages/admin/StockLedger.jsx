import React, { useState, useEffect } from 'react';
import { History, Search, Filter, RefreshCw, ArrowUpRight, ArrowDownLeft, Sliders, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatIST } from '../../lib/ist-date';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function StockLedger() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [itemType, setItemType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLedger();
  }, [page, type, itemType]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stock-ledger', {
        params: {
          page,
          limit: 25,
          type: type || undefined,
          itemType: itemType || undefined,
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
              Immutable audit ledger of all stock additions, sales deductions, returns & adjustments
            </p>
          </div>
          <button className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5" onClick={fetchLedger}>
            <RefreshCw size={14} /> Refresh Ledger
          </button>
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
            </select>
          </div>

          <div className="col-12 col-md-3">
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
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-container-card">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : movements.length === 0 ? (
          <div className="p-5 text-center text-muted">No stock movement records found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Timestamp (IST)</th>
                  <th>Type</th>
                  <th>Item Details</th>
                  <th className="text-center">Quantity Change</th>
                  <th className="text-center">Stock (Before → After)</th>
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
    </div>
  );
}
