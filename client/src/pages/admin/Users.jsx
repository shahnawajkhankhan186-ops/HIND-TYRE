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
    <div className="container-fluid p-3 p-md-4">
      {/* Header */}
      <div className="glass-panel p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-white fw-bold m-0 brand-font">Administrators & Staff Accounts</h3>
            <p className="text-secondary small m-0 mt-0.5">
              Add new shop admins with Gmail & phone, manage counter cashiers, and control portal privileges
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-secondary-glass btn-sm d-flex align-items-center gap-1.5" onClick={fetchUsers}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-secondary-glass btn-sm d-flex align-items-center gap-1.5" onClick={() => handleOpenModal('COUNTER')}>
              <User size={15} className="text-emerald" /> + Add Cashier
            </button>
            <button className="btn btn-primary-glass btn-sm d-flex align-items-center gap-1.5" onClick={() => handleOpenModal('ADMIN')}>
              <Shield size={15} /> + Add New Admin
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : users.length === 0 ? (
          <div className="p-5 text-center text-secondary">No user accounts found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-glass mb-0">
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
                        <div className={`p-2 rounded-circle ${u.role === 'ADMIN' ? 'bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30' : 'bg-success bg-opacity-20 text-success border border-success border-opacity-30'}`}>
                          {u.role === 'ADMIN' ? <Shield size={16} /> : <User size={16} />}
                        </div>
                        <div>
                          <div className="text-white fw-bold small">{u.name}</div>
                          {u.email === 'prolemda@gmail.com' && (
                            <span className="badge bg-primary bg-opacity-25 text-info extra-small border border-info border-opacity-20">
                              Primary Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-info small font-monospace">{u.email}</td>
                    <td>
                      {u.phone ? (
                        <div className="d-flex align-items-center gap-1.5 text-secondary small font-monospace">
                          <Phone size={13} className="text-info" /> {u.phone}
                        </div>
                      ) : (
                        <span className="text-secondary extra-small">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-glass-cyan' : 'badge-glass-emerald'} extra-small`}>
                        {u.role === 'ADMIN' ? 'Administrator (Full Access)' : 'Counter Cashier (POS)'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-glass-emerald' : 'badge-glass-rose'} extra-small`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="text-secondary small">{formatIST(u.createdAt)}</td>
                    <td className="text-end">
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-secondary-glass text-rose' : 'btn-success-glass'} extra-small`}
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
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal border-0 shadow-2xl">
              <div className="modal-header border-bottom border-secondary border-opacity-25 pb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className={`p-2 rounded-3 ${formData.role === 'ADMIN' ? 'bg-primary bg-opacity-20 text-primary' : 'bg-success bg-opacity-20 text-success'}`}>
                    {formData.role === 'ADMIN' ? <Shield size={18} /> : <User size={18} />}
                  </div>
                  <div>
                    <h5 className="modal-title text-white fw-bold m-0">
                      {formData.role === 'ADMIN' ? 'Add New Administrator' : 'Add Cashier Staff'}
                    </h5>
                    <small className="text-secondary">
                      {formData.role === 'ADMIN' ? 'Full access to stock, reports, settings & pricing' : 'POS counter sales and receipt generation'}
                    </small>
                  </div>
                </div>
                <button type="button" className="btn btn-sm text-secondary" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body py-3">
                  {/* Role Selector Card */}
                  <div className="mb-3">
                    <label className="form-label text-light small fw-semibold">Account Role *</label>
                    <div className="row g-2">
                      <div className="col-6">
                        <div
                          className={`p-2.5 rounded-3 border text-center cursor-pointer transition-all ${
                            formData.role === 'ADMIN'
                              ? 'bg-primary bg-opacity-20 border-info text-white shadow-sm'
                              : 'bg-slate-900 bg-opacity-60 border-secondary border-opacity-30 text-secondary'
                          }`}
                          onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                          style={{ cursor: 'pointer' }}
                        >
                          <Shield size={18} className={formData.role === 'ADMIN' ? 'text-info mb-1' : 'mb-1'} />
                          <div className="fw-bold small">Administrator</div>
                          <div className="extra-small opacity-75" style={{ fontSize: '0.68rem' }}>Full Portal Control</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div
                          className={`p-2.5 rounded-3 border text-center cursor-pointer transition-all ${
                            formData.role === 'COUNTER'
                              ? 'bg-success bg-opacity-20 border-success text-white shadow-sm'
                              : 'bg-slate-900 bg-opacity-60 border-secondary border-opacity-30 text-secondary'
                          }`}
                          onClick={() => setFormData({ ...formData, role: 'COUNTER' })}
                          style={{ cursor: 'pointer' }}
                        >
                          <User size={18} className={formData.role === 'COUNTER' ? 'text-success mb-1' : 'mb-1'} />
                          <div className="fw-bold small">Counter Staff</div>
                          <div className="extra-small opacity-75" style={{ fontSize: '0.68rem' }}>POS Billing Only</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label text-light small fw-semibold">Full Name *</label>
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
                    <label className="form-label text-light small fw-semibold">Gmail / Email Address *</label>
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
                    <small className="text-secondary extra-small mt-1 d-block">
                      💡 This user can directly log in using <strong>"Sign in with Google"</strong> button on login page.
                    </small>
                  </div>

                  {/* Contact Number */}
                  <div className="mb-3">
                    <label className="form-label text-light small fw-semibold">Contact Phone Number</label>
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

                  {/* Password (Optional for Google Login) */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label text-light small fw-semibold m-0">Password</label>
                      <span className="text-secondary extra-small">Optional if using Google Sign-in</span>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text"><Lock size={15} /></span>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Leave blank for Google Sign-in or enter 6+ chars"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 pt-3">
                  <button type="button" className="btn btn-secondary-glass" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-glass" disabled={saving}>
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
