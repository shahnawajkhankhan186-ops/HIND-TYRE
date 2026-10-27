import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Settings,
  Users,
  X,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfileModal({ show, onClose }) {
  const { user, shopSettings } = useAuth();
  const navigate = useNavigate();

  if (!show || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75"
        style={{ zIndex: 1070, backdropFilter: 'blur(5px)' }}
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="position-fixed top-50 start-50 translate-middle w-100 p-3"
        style={{ maxWidth: '520px', zIndex: 1075 }}
      >
        <div
          className="rounded-4 border shadow-2xl overflow-hidden animate-fadeIn"
          style={{
            backgroundColor: 'var(--bg-card-dark, #131418)',
            borderColor: 'rgba(245, 158, 11, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Header Banner */}
          <div
            className="p-4 position-relative"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(10, 14, 26, 0.95) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              type="button"
              className="btn btn-sm text-secondary p-1.5 rounded-circle hover-glass position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center"
              onClick={onClose}
              aria-label="Close"
              style={{ width: '32px', height: '32px' }}
            >
              <X size={18} className="text-white" />
            </button>

            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle p-1 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)'
                }}
              >
                <div
                  className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center bg-black"
                >
                  {user.role === 'ADMIN' ? (
                    <Shield size={30} style={{ color: '#f59e0b' }} />
                  ) : (
                    <User size={30} style={{ color: '#f59e0b' }} />
                  )}
                </div>
              </div>

              <div>
                <div className="d-flex align-items-center gap-2">
                  <h4 className="fw-bold text-white m-0 font-monospace">{user.name}</h4>
                  <span
                    className="badge rounded-pill fw-semibold px-2 py-0.5"
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.18)',
                      color: '#f59e0b',
                      fontSize: '0.72rem',
                      border: '1px solid rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    {user.role === 'ADMIN' ? 'Super Admin' : 'Staff'}
                  </span>
                </div>
                <div className="text-secondary small mt-0.5 d-flex align-items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>Verified Shop Administrator</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Details */}
          <div className="p-4 d-flex flex-column gap-3 text-light">
            <div className="row g-2.5">
              {/* Email */}
              <div className="col-12 col-sm-6">
                <div className="p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-15">
                  <div className="extra-small text-secondary d-flex align-items-center gap-1.5 mb-1">
                    <Mail size={13} style={{ color: '#f59e0b' }} />
                    <span>Email Address</span>
                  </div>
                  <div className="small fw-semibold text-white text-truncate">{user.email}</div>
                </div>
              </div>

              {/* Phone */}
              <div className="col-12 col-sm-6">
                <div className="p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-15">
                  <div className="extra-small text-secondary d-flex align-items-center gap-1.5 mb-1">
                    <Phone size={13} style={{ color: '#f59e0b' }} />
                    <span>Phone Number</span>
                  </div>
                  <div className="small fw-semibold text-white">{user.phone || shopSettings?.phone || '+91 98765 43210'}</div>
                </div>
              </div>

              {/* Shop Affiliation */}
              <div className="col-12">
                <div className="p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-15">
                  <div className="extra-small text-secondary d-flex align-items-center gap-1.5 mb-1">
                    <Building2 size={13} style={{ color: '#f59e0b' }} />
                    <span>Shop Name</span>
                  </div>
                  <div className="small fw-semibold text-white text-truncate">
                    {shopSettings?.shopName || 'HIND TYRES AND ACCESSORIES'}
                  </div>
                </div>
              </div>

              {/* Shop Address */}
              <div className="col-12">
                <div className="p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-15">
                  <div className="extra-small text-secondary d-flex align-items-center gap-1.5 mb-1">
                    <MapPin size={13} style={{ color: '#f59e0b' }} />
                    <span>Shop Address</span>
                  </div>
                  <div className="small text-white opacity-90">
                    {shopSettings?.address || 'Shop No. 12-14, GT Road Bypass, Transport Nagar, Kanpur, UP'}
                  </div>
                </div>
              </div>

              {/* Cloud Database Connected */}
              <div className="col-12">
                <div className="p-2.5 rounded-3 bg-slate-900 bg-opacity-60 border border-secondary border-opacity-20 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Database size={15} className="text-success" />
                    <div>
                      <div className="extra-small text-secondary">Active Database</div>
                      <div className="small fw-semibold text-success">MongoDB Atlas (Cloud Production)</div>
                    </div>
                  </div>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-30 extra-small">
                    ACID Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="d-flex flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-20 mt-1">
              {user.role === 'ADMIN' && (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1.5 flex-grow-1 justify-content-center py-2"
                    onClick={() => {
                      onClose();
                      navigate('/admin/settings');
                    }}
                  >
                    <Settings size={15} />
                    <span>Shop Settings</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5 flex-grow-1 justify-content-center py-2"
                    onClick={() => {
                      onClose();
                      navigate('/admin/users');
                    }}
                  >
                    <Users size={15} />
                    <span>Staff Management</span>
                  </button>
                </>
              )}

              <button
                type="button"
                className="btn btn-sm btn-secondary-glass py-2 px-3"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
