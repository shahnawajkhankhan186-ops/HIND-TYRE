import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Store,
  Mail,
  Phone,
  MapPin,
  Percent,
  FileText,
  Send,
  Key,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { user, refreshSettings, setShopSettings } = useAuth();
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
    brevoApiKey: '',
    brevoSenderEmail: '',
    brevoSenderName: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data.success && res.data.data) {
        setFormData((prev) => ({
          ...prev,
          ...res.data.data,
          brevoApiKey: res.data.data.brevoApiKey || '',
          brevoSenderEmail: res.data.data.brevoSenderEmail || '',
          brevoSenderName: res.data.data.brevoSenderName || '',
        }));
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

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      const target = user?.email || formData.adminReceiptEmail;
      const res = await api.post('/admin/settings/test-email', { email: target });
      if (res.data.success) {
        toast.success(res.data.message || `Test receipt sent to ${target}!`);
      } else {
        toast.error('Failed to send test email');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to dispatch test email. Check Brevo settings.');
    } finally {
      setTestingEmail(false);
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
        <h1 className="page-title">Shop Settings & Brevo Email Configuration</h1>
        <p className="page-subtitle">
          Configure business details, GSTIN, Brevo receipt dispatch & automated notifications
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

              {/* Brevo Transactional Email Integration */}
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <h5 className="text-dark fw-bold m-0 d-flex align-items-center gap-2">
                  <Mail size={18} style={{ color: 'var(--accent-dark)' }} /> Brevo Email Dispatch Configuration
                </h5>
                <span className="badge bg-warning text-dark font-monospace px-2 py-1">
                  Buyer + Seller Automatic Receipt
                </span>
              </div>

              <div className="p-3 mb-4 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="small text-muted mb-2">
                  <CheckCircle size={14} className="text-success me-1 inline" />
                  <strong>Auto Dispatch Feature:</strong> Jab bhi koi tyre ya accessory sell hoga, uska official GST Tax Invoice PDF
                  <strong> Seller ke Gmail ID</strong> (jis admin/staff ne sale ki hai) aur <strong>Buyer ke Gmail ID</strong> dono par instant send hoga.
                </p>
                <p className="extra-small text-muted m-0">
                  Aap Brevo API credentials yahan enter kar sakte hain ya fir server ke <code>.env</code> file me <code>BREVO_API_KEY</code> set kar sakte hain.
                </p>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold d-flex align-items-center gap-1">
                    <Key size={14} /> Brevo API Key
                  </label>
                  <input
                    type="password"
                    className="form-control font-monospace"
                    placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxx"
                    value={formData.brevoApiKey}
                    onChange={(e) => setFormData({ ...formData, brevoApiKey: e.target.value })}
                  />
                  <small className="text-muted extra-small">
                    Brevo Dashboard &gt; SMTP &amp; API &gt; API Keys se generate karein.
                  </small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">
                    Brevo Verified Sender Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. shahnawaj@gmail.com"
                    value={formData.brevoSenderEmail}
                    onChange={(e) => setFormData({ ...formData, brevoSenderEmail: e.target.value })}
                  />
                  <small className="text-muted extra-small">
                    Ye email Brevo Dashboard ke "Senders &amp; IP" section me verified hona zaroori hai.
                  </small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="HIND TYRES & ACCESSORIES"
                    value={formData.brevoSenderName}
                    onChange={(e) => setFormData({ ...formData, brevoSenderName: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md-6 d-flex align-items-end">
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="btn btn-outline-dark w-100 py-2 d-flex align-items-center justify-center gap-2"
                  >
                    <Send size={16} /> {testingEmail ? 'Sending Test Receipt...' : `Test Dispatch to ${user?.email || 'My Gmail'}`}
                  </button>
                </div>
              </div>

              <h5 className="text-dark fw-bold mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <Percent size={18} style={{ color: 'var(--accent-dark)' }} /> Billing Policies &amp; Store Admin Copy
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-dark small fw-semibold">Central Admin Receipt Email (Fallback / Store Copy) *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.adminReceiptEmail}
                    onChange={(e) => setFormData({ ...formData, adminReceiptEmail: e.target.value })}
                    required
                  />
                  <small className="text-muted extra-small">
                    Seller aur Buyer ke alawa agar central store admin copy chahiye to ye address use hoga.
                  </small>
                </div>

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

              <div className="d-flex justify-content-end pt-3 border-top gap-3">
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
