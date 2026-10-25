import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatIST } from '../../lib/ist-date';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

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
    <div className="container-fluid p-3 p-md-4">
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-white fw-bold m-0 brand-font">System Audit Logs & Compliance Ledger</h3>
            <p className="text-secondary small m-0 mt-0.5">
              Rule 8: Immutable trace of every user action, state mutations & IP address logs
            </p>
          </div>
          <button className="btn btn-secondary-glass btn-sm d-flex align-items-center gap-1.5" onClick={fetchLogs}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-3 mb-3">
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
      <div className="glass-panel overflow-hidden mb-3">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : logs.length === 0 ? (
          <div className="p-5 text-center text-secondary">No audit logs found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-glass mb-0">
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
                    <td className="text-secondary small font-monospace">{formatIST(log.createdAt)}</td>
                    <td>
                      <span className="badge badge-glass-cyan extra-small">{log.action}</span>
                    </td>
                    <td>
                      <span className="badge bg-slate-800 text-light border border-secondary border-opacity-25 extra-small">
                        {log.entity}
                      </span>
                    </td>
                    <td>
                      <span className="text-white small fw-semibold">{log.userName}</span>
                    </td>
                    <td className="text-secondary font-monospace extra-small">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="text-end">
                      {(log.beforeSnapshot || log.afterSnapshot) && (
                        <button
                          className="btn btn-sm btn-secondary-glass p-1 px-2 extra-small d-inline-flex align-items-center gap-1"
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
        <div className="d-flex justify-content-between align-items-center glass-panel p-2 px-3">
          <small className="text-secondary">
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount} total events)
          </small>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-secondary-glass" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn btn-secondary-glass" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Snapshot Diff Modal */}
      {selectedLog && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content glass-modal border-0 shadow-2xl">
              <div className="modal-header border-bottom border-secondary border-opacity-25 py-3">
                <h5 className="modal-title text-white fw-bold m-0">
                  Audit Snapshot: {selectedLog.action} on {selectedLog.entity}
                </h5>
                <button type="button" className="btn btn-sm text-secondary" onClick={() => setSelectedLog(null)}>✕</button>
              </div>

              <div className="modal-body py-3">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="text-secondary small fw-bold mb-1">State Before</label>
                    <pre className="p-3 rounded-2 bg-dark border border-secondary border-opacity-25 text-info font-monospace extra-small overflow-auto" style={{ maxHeight: '300px' }}>
                      {selectedLog.beforeSnapshot ? JSON.stringify(selectedLog.beforeSnapshot, null, 2) : 'None (New Record)'}
                    </pre>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="text-success small fw-bold mb-1">State After</label>
                    <pre className="p-3 rounded-2 bg-dark border border-secondary border-opacity-25 text-success font-monospace extra-small overflow-auto" style={{ maxHeight: '300px' }}>
                      {selectedLog.afterSnapshot ? JSON.stringify(selectedLog.afterSnapshot, null, 2) : 'None'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top border-secondary border-opacity-25 py-2">
                <button className="btn btn-secondary-glass btn-sm" onClick={() => setSelectedLog(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
