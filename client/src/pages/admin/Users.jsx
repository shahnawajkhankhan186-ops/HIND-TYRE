import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Shield, User, Lock, Mail, Phone, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatIST } from '../../lib/ist-date';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function Users() {
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
          <div>
            <h1 className="page-title">Administrators & Staff Accounts</h1>
            <p className="page-subtitle">
              Add new shop admins with Gmail & phone, manage counter cashiers, and control portal privileges
            </p>
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
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="p-2 rounded-circle bg-light border text-dark">
                          {u.role === 'ADMIN' ? <Shield size={16} /> : <User size={16} />}
                        </div>
                        <div>
                          <div className="text-dark fw-bold small">{u.name}</div>
                          {u.email === 'prolemda@gmail.com' && (
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
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'} extra-small`}
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.isActive ? 'Disable Access' : 'Enable Access'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--radius-md)', background: '#FFFFFF' }}>
              <div className="modal-header border-bottom pb-3">
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

              <form onSubmit={handleCreate}>
                <div className="modal-body py-3">
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

                <div className="modal-footer border-top pt-3">
                  <button type="button" className="btn btn-outline-dark-custom" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-accent" disabled={saving}>
                    {saving ? 'Creating...' : formData.role === 'ADMIN' ? '+ Create Administrator' : '+ Create Cashier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
