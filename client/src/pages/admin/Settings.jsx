import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, Mail, Phone, MapPin, Percent, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { refreshSettings } = useAuth();
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
        refreshSettings();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-3 p-md-4">
        <div className="glass-panel p-5 text-center text-secondary">Loading shop settings...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-3 p-md-4">
      <div className="glass-panel p-4 mb-4">
        <h3 className="text-white fw-bold m-0 brand-font">Shop Settings & GST Invoice Configuration</h3>
        <p className="text-secondary small m-0 mt-0.5">
          Configure business details, GSTIN, receipt terms & automated admin notification emails
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="glass-panel p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              <h5 className="text-white fw-bold mb-3 pb-2 border-bottom border-secondary border-opacity-25 d-flex align-items-center gap-2">
                <Store size={18} className="text-info" /> Business Identity
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-light small fw-semibold">Shop Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-warning small fw-bold">GSTIN Registration Number *</label>
                  <input
                    type="text"
                    className="form-control font-monospace border-warning"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-light small fw-semibold">Business Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-light small fw-semibold">Public Support Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-light small fw-semibold">Physical Shop Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
              </div>

              <h5 className="text-white fw-bold mb-3 pb-2 border-bottom border-secondary border-opacity-25 d-flex align-items-center gap-2">
                <Percent size={18} className="text-warning" /> Billing Policies & Email
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-light small fw-semibold">Admin Receipt Email (Bcc Copies) *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.adminReceiptEmail}
                    onChange={(e) => setFormData({ ...formData, adminReceiptEmail: e.target.value })}
                    required
                  />
                  <small className="text-secondary extra-small">
                    Every generated invoice PDF is automatically emailed to this administrator address.
                  </small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-light small fw-semibold">
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
                  <small className="text-secondary extra-small">
                    Enforces strict server cap on discounts applied by counter cashiers.
                  </small>
                </div>

                <div className="col-12">
                  <label className="form-label text-light small fw-semibold">Invoice Footer Text</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.invoiceFooter}
                    onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-light small fw-semibold">Terms & Tyre Warranty Notice</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end pt-3 border-top border-secondary border-opacity-20">
                <button
                  type="submit"
                  className="btn btn-primary-glass px-4 py-2.5 d-flex align-items-center gap-2"
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
