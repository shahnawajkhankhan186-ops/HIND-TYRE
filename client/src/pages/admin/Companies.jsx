import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Archive, CheckCircle2, XCircle, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({ name: '', logoUrl: '', isActive: true });
  const [saving, setSaving] = useState(false);

  // Archive dialog
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/companies', { params: { includeArchived: 'true' } });
      if (res.data.success) {
        setCompanies(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData({ name: '', logoUrl: '', isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (comp) => {
    setEditingCompany(comp);
    setFormData({ name: comp.name, logoUrl: comp.logoUrl || '', isActive: comp.isActive });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error('Company name is required');
    }

    try {
      setSaving(true);
      if (editingCompany) {
        const res = await api.put(`/admin/companies/${editingCompany._id}`, formData);
        if (res.data.success) {
          toast.success(`Updated ${res.data.data.name}`);
        }
      } else {
        const res = await api.post('/admin/companies', formData);
        if (res.data.success) {
          toast.success(`Added ${res.data.data.name}`);
        }
      }
      setShowModal(false);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      setArchiving(true);
      const res = await api.delete(`/admin/companies/${archiveTarget._id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Company archived successfully');
        setArchiveTarget(null);
        fetchCompanies();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to archive company');
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
            <h3 className="text-white fw-bold m-0 brand-font">Tyre Companies & Brands</h3>
            <p className="text-secondary small m-0 mt-0.5">Manage partner manufacturers and brand status</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-secondary-glass btn-sm" onClick={fetchCompanies}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-primary-glass btn-sm d-flex align-items-center gap-1.5" onClick={handleOpenAdd}>
              <Plus size={16} /> Add Company
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : (
          <div className="table-responsive">
            <table className="table table-glass mb-0">
              <thead>
                <tr>
                  <th>Brand / Company Name</th>
                  <th>Status</th>
                  <th>Archived</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((comp) => (
                  <tr key={comp._id} className={comp.isArchived ? 'opacity-50' : ''}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-circle bg-slate-900 border border-secondary border-opacity-25 text-info">
                          <Building2 size={18} />
                        </div>
                        <span className="text-white fw-bold fs-6">{comp.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${comp.isActive ? 'badge-glass-emerald' : 'badge-glass-rose'}`}>
                        {comp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {comp.isArchived ? (
                        <span className="badge bg-secondary text-light">Archived</span>
                      ) : (
                        <span className="text-secondary small">No</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1.5">
                        <button
                          className="btn btn-sm btn-secondary-glass p-1.5"
                          title="Edit Company"
                          onClick={() => handleOpenEdit(comp)}
                          disabled={comp.isArchived}
                        >
                          <Edit2 size={14} />
                        </button>
                        {!comp.isArchived && (
                          <button
                            className="btn btn-sm btn-danger-glass p-1.5"
                            title="Archive Company"
                            onClick={() => setArchiveTarget(comp)}
                          >
                            <Archive size={14} />
                          </button>
                        )}
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
                  {editingCompany ? 'Edit Tyre Company' : 'Add Tyre Company'}
                </h5>
                <button type="button" className="btn btn-sm text-secondary" onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label className="form-label text-light small fw-semibold">
                      Company / Brand Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MRF, CEAT, Michelin"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="compActiveSwitch"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label className="form-check-label text-light small ms-1" htmlFor="compActiveSwitch">
                      Active for sales and billing
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 pt-3">
                  <button type="button" className="btn btn-secondary-glass" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-glass" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom ConfirmDialog for Archiving */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        title={`Archive ${archiveTarget?.name}?`}
        message={`Are you sure you want to archive "${archiveTarget?.name}"? In accordance with auditing and billing compliance (Rule 7), this soft-deletes the company and prevents new stock entries, while completely preserving all historical sales records and warranties.`}
        confirmText="Archive Company"
        variant="danger"
        isLoading={archiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
