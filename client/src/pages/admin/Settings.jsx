import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Store,
  Phone,
  MapPin,
  Percent,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { refreshSettings, setShopSettings } = useAuth();
  const [formData, setFormData] = useState({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    logoUrl: '',
    invoiceFooter: '',
    termsAndConditions: '',
    defaultGstPercent: 28,
    maxDiscountPercent: 15,
    adminReceiptEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data.success && res.data.data) {
        setFormData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load shop settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/admin/settings', formData);
      if (res.data.success) {
        toast.success('Shop settings updated successfully!');
        if (res.data.data) {
          setShopSettings(res.data.data);
        }
        await refreshSettings();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="card-clean p-5 text-center text-secondary">Loading shop settings...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-card">
        <h1 className="page-title">Shop Settings & GST Invoice Configuration</h1>
        <p className="page-subtitle">
          Configure business details, GSTIN, receipt terms & store information
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="card-clean bg-white p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              <h5 className="text-dark fw-bold mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <Store size={18} style={{ color: 'var(--accent-dark)' }} /> Business Identity
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">Shop Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-bold">GSTIN Registration Number *</label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">Business Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">Public Support Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-dark small fw-semibold">Physical Shop Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
              </div>

              <h5 className="text-dark fw-bold mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <Percent size={18} style={{ color: 'var(--accent-dark)' }} /> Billing Policies & GST Configuration
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">
                    Maximum Allowed Counter Discount (%)
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="form-control"
                      value={formData.maxDiscountPercent}
                      onChange={(e) => setFormData({ ...formData, maxDiscountPercent: Number(e.target.value) })}
                      required
                    />
                    <span className="input-group-text">%</span>
                  </div>
                  <small className="text-muted extra-small">
                    Enforces strict server cap on discounts applied by counter cashiers.
                  </small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">Default GST Rate (%)</label>
                  <div className="input-group">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.defaultGstPercent}
                      onChange={(e) => setFormData({ ...formData, defaultGstPercent: Number(e.target.value) })}
                      required
                    />
                    <span className="input-group-text">%</span>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label text-dark small fw-semibold">Invoice Footer Text</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.invoiceFooter}
                    onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-dark small fw-semibold">Terms &amp; Tyre Warranty Notice</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end pt-3 border-top">
                <button
                  type="submit"
                  className="btn btn-accent px-4 py-2.5 d-flex align-items-center gap-2"
                  disabled={saving}
                >
                  <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
