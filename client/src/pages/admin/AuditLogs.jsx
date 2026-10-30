import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatIST } from '../../lib/ist-date';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import BackButton from '../../components/common/BackButton';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Snapshot Inspection Modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, action, entity]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs', {
        params: {
          page,
          limit: 25,
          action: action || undefined,
          entity: entity || undefined,
        },
      });
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.pages);
        setTotalCount(res.data.data.total);
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2.5">
            <BackButton fallback="/admin/dashboard" />
            <div>
              <h1 className="page-title mb-0">System Audit Logs & Compliance Ledger</h1>
              <p className="page-subtitle mb-0">
                Rule 8: Immutable trace of every user action, state mutations & IP address logs
              </p>
            </div>
          </div>
          <button className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5" onClick={fetchLogs}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar-card">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Entities</option>
              <option value="Tyre">Tyre</option>
              <option value="Company">Company</option>
              <option value="Accessory">Accessory</option>
              <option value="Sale">Sale</option>
              <option value="User">User</option>
              <option value="ShopSettings">ShopSettings</option>
            </select>
          </div>

          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="ARCHIVE">ARCHIVE</option>
              <option value="BULK_PRICE_UPDATE">BULK_PRICE_UPDATE</option>
              <option value="STOCK_IN">STOCK_IN</option>
              <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
              <option value="SALE">SALE</option>
              <option value="SALE_CANCEL">SALE_CANCEL</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container-card">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : logs.length === 0 ? (
          <div className="p-5 text-center text-muted">No audit logs found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Timestamp (IST)</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>IP Address</th>
                  <th className="text-end">Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="text-muted small font-monospace">{formatIST(log.createdAt)}</td>
                    <td>
                      <span className="badge badge-pill-info extra-small">{log.action}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border extra-small">
                        {log.entity}
                      </span>
                    </td>
                    <td>
                      <span className="text-dark small fw-semibold">{log.userName}</span>
                    </td>
                    <td className="text-muted font-monospace extra-small">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="text-end">
                      {(log.beforeSnapshot || log.afterSnapshot) && (
                        <button
                          className="btn btn-sm btn-outline-dark-custom p-1 px-2 extra-small d-inline-flex align-items-center gap-1"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye size={12} /> View Diff
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container card-clean bg-white mb-3">
          <small className="text-muted">
            Page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong> ({totalCount} total events)
          </small>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-dark-custom" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn btn-outline-dark-custom" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Snapshot Diff Modal */}
      {selectedLog && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF' }}>
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title text-dark fw-bold m-0">
                  Audit Snapshot: {selectedLog.action} on {selectedLog.entity}
                </h5>
                <button type="button" className="btn btn-sm text-muted" onClick={() => setSelectedLog(null)}>✕</button>
              </div>

              <div className="modal-body py-3">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="text-dark small fw-bold mb-1">State Before</label>
                    <pre className="p-3 rounded-2 bg-light border text-dark font-monospace extra-small overflow-auto" style={{ maxHeight: '300px' }}>
                      {selectedLog.beforeSnapshot ? JSON.stringify(selectedLog.beforeSnapshot, null, 2) : 'None (New Record)'}
                    </pre>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="text-dark small fw-bold mb-1">State After</label>
                    <pre className="p-3 rounded-2 bg-light border text-dark font-monospace extra-small overflow-auto" style={{ maxHeight: '300px' }}>
                      {selectedLog.afterSnapshot ? JSON.stringify(selectedLog.afterSnapshot, null, 2) : 'None'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top py-2">
                <button className="btn btn-outline-dark-custom btn-sm" onClick={() => setSelectedLog(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
