import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Shield, User, Lock, Mail, Phone, RefreshCw, KeyRound, CheckCircle2, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatIST } from '../../lib/ist-date';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import BackButton from '../../components/common/BackButton';

export default function Users() {
  const { user: currentUser, isPrimaryAdmin: isCurrentPrimaryAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ADMIN',
  });
  const [saving, setSaving] = useState(false);

  // Permanent Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (roleToSelect = 'ADMIN') => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: roleToSelect,
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.patch(`/admin/users/${user._id}/toggle-status`);
      if (res.data.success) {
        toast.success(res.data.message || 'User status updated');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/admin/users/${deleteTarget._id}`);
      if (res.data.success) {
        toast.success(res.data.message || `Deleted account ${deleteTarget.name}`);
        setDeleteTarget(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user account');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      return toast.error('Please enter name and email');
    }
    if (!formData.password || formData.password.trim().length < 6) {
      return toast.error('Password is compulsory (minimum 6 characters required)');
    }

    try {
      setSaving(true);
      const res = await api.post('/admin/users', formData);
      if (res.data.success) {
        toast.success(`${res.data.data.role === 'ADMIN' ? 'Admin' : 'Staff'} "${res.data.data.name}" added successfully!`);
        setShowModal(false);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2.5">
            <BackButton fallback="/admin/dashboard" />
            <div>
              <h1 className="page-title mb-0">Administrators & Staff Accounts</h1>
              <p className="page-subtitle mb-0">
                Add new shop admins with Gmail & phone, manage counter cashiers, and control portal privileges
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5" onClick={fetchUsers}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1.5" onClick={() => handleOpenModal('COUNTER')}>
              <User size={15} /> + Add Cashier
            </button>
            <button className="btn btn-accent btn-sm d-flex align-items-center gap-1.5" onClick={() => handleOpenModal('ADMIN')}>
              <Shield size={15} /> + Add New Admin
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container-card">
        {loading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : users.length === 0 ? (
          <div className="p-5 text-center text-muted">No user accounts found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Account Member</th>
                  <th>Gmail / Email</th>
                  <th>Contact Info</th>
                  <th>Role & Access</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isUserPrimary = !!(u.isPrimaryAdmin || u.email === 'hindtyre01@gmail.com');
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div className="p-2 rounded-circle bg-light border text-dark">
                            {u.role === 'ADMIN' ? <Shield size={16} /> : <User size={16} />}
                          </div>
                          <div>
                            <div className="text-dark fw-bold small">{u.name}</div>
                            {isUserPrimary && (
                              <span className="badge-pill-yellow extra-small">
                                Primary Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-dark small font-monospace">{u.email}</td>
                      <td>
                        {u.phone ? (
                          <div className="d-flex align-items-center gap-1.5 text-muted small font-monospace">
                            <Phone size={13} /> {u.phone}
                          </div>
                        ) : (
                          <span className="text-muted extra-small">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-pill-yellow' : 'badge-pill-info'} extra-small`}>
                          {u.role === 'ADMIN' ? 'Administrator (Full Access)' : 'Counter Cashier (POS)'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-pill-success' : 'badge-pill-danger'} extra-small`}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="text-muted small font-monospace">{formatIST(u.createdAt)}</td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          <button
                            className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'} extra-small`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isUserPrimary}
                            title={isUserPrimary ? 'Primary Administrator cannot be disabled' : (u.isActive ? 'Disable Access' : 'Enable Access')}
                          >
                            {u.isActive ? 'Disable Access' : 'Enable Access'}
                          </button>
                          {isCurrentPrimaryAdmin && !isUserPrimary && (
                            <button
                              className="btn btn-sm btn-outline-danger p-1.5"
                              title="Permanently Delete Account from Database"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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

      {/* Add User Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: 'calc(100vh - 40px)' }}>
            <div
              className="modal-content border-0 shadow-lg d-flex flex-column"
              style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF', maxHeight: 'calc(100vh - 60px)', overflow: 'hidden' }}
            >
              <div className="modal-header border-bottom py-3 flex-shrink-0">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-3 bg-light border text-dark">
                    {formData.role === 'ADMIN' ? <Shield size={18} /> : <User size={18} />}
                  </div>
                  <div>
                    <h5 className="modal-title text-dark fw-bold m-0">
                      {formData.role === 'ADMIN' ? 'Add New Administrator' : 'Add Cashier Staff'}
                    </h5>
                    <small className="text-muted">
                      {formData.role === 'ADMIN' ? 'Full access to stock, reports, settings & pricing' : 'POS counter sales and receipt generation'}
                    </small>
                  </div>
                </div>
                <button type="button" className="btn btn-sm text-muted" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleCreate} className="d-flex flex-column flex-grow-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                <div className="modal-body py-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                  {/* Role Selector Card */}
                  <div className="mb-3">
                    <label className="form-label text-dark small fw-semibold">Account Role *</label>
                    <div className="row g-2">
                      <div className="col-6">
                        <div
                          className={`p-2.5 rounded-3 border text-center transition-all ${
                            formData.role === 'ADMIN'
                              ? 'bg-warning bg-opacity-10 border-warning text-dark shadow-sm'
                              : 'bg-light border text-muted'
                          }`}
                          onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                          style={{ cursor: 'pointer' }}
                        >
                          <Shield size={18} className="mb-1" style={{ color: formData.role === 'ADMIN' ? 'var(--accent-dark)' : 'inherit' }} />
                          <div className="fw-bold small">Administrator</div>
                          <div className="extra-small opacity-75" style={{ fontSize: '0.68rem' }}>Full Portal Control</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div
                          className={`p-2.5 rounded-3 border text-center transition-all ${
                            formData.role === 'COUNTER'
                              ? 'bg-warning bg-opacity-10 border-warning text-dark shadow-sm'
                              : 'bg-light border text-muted'
                          }`}
                          onClick={() => setFormData({ ...formData, role: 'COUNTER' })}
                          style={{ cursor: 'pointer' }}
                        >
                          <User size={18} className="mb-1" style={{ color: formData.role === 'COUNTER' ? 'var(--accent-dark)' : 'inherit' }} />
                          <div className="fw-bold small">Counter Staff</div>
                          <div className="extra-small opacity-75" style={{ fontSize: '0.68rem' }}>POS Billing Only</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label text-dark small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Gmail / Email */}
                  <div className="mb-3">
                    <label className="form-label text-dark small fw-semibold">Gmail / Email Address *</label>
                    <div className="input-group">
                      <span className="input-group-text"><Mail size={15} /></span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. partner@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <small className="text-muted extra-small mt-1 d-block">
                      💡 This user can directly log in using <strong>"Sign in with Google"</strong> button on login page.
                    </small>
                  </div>

                  {/* Contact Number */}
                  <div className="mb-3">
                    <label className="form-label text-dark small fw-semibold">Contact Phone Number</label>
                    <div className="input-group">
                      <span className="input-group-text"><Phone size={15} /></span>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Password (Compulsory) */}
                  <div className="mb-3">
                    <label className="form-label text-dark small fw-semibold">
                      Account Password * <span className="text-danger fw-bold">(Compulsory)</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><Lock size={15} /></span>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter password (minimum 6 characters)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                    <small className="text-muted extra-small mt-1 d-block">
                      🔑 Staff member will use this Gmail/Email and Password to sign in to the portal.
                    </small>
                  </div>
                </div>

                <div className="modal-footer border-top py-2.5 flex-shrink-0 bg-white d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-dark-custom btn-sm px-3" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-accent btn-sm fw-bold px-3 d-flex align-items-center gap-1.5 shadow-sm"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>{formData.role === 'ADMIN' ? 'Confirm & Create Administrator' : 'Confirm & Create Cashier'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Custom ConfirmDialog for Permanent Hard Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Permanently Delete ${deleteTarget?.name}?`}
        message={`Are you sure you want to permanently delete the account "${deleteTarget?.name}" (${deleteTarget?.email}) from the MongoDB database? This action is irreversible and cannot be undone.`}
        confirmText="Delete Account"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
