import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Download,
  Printer,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Disc3,
  Layers,
  Percent,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees, paiseToRupees } from '../../lib/currency';
import { formatIST } from '../../lib/ist-date';
import ReceiptModal from '../../components/common/ReceiptModal';
import { useAuth } from '../../context/AuthContext';

export default function NewSale() {
  const { shopSettings } = useAuth();

  // Current Step: 1 (Customer), 2 (Select Items), 3 (Review & Bill), 4 (Success Screen)
  const [step, setStep] = useState(1);

  // Step 1: Customer Details
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    vehicleNumber: '',
    vehicleModel: '',
  });
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [foundExistingCustomer, setFoundExistingCustomer] = useState(false);

  // Step 2: Catalog & Selection
  const [tab, setTab] = useState('tyres'); // 'tyres' | 'accessories'
  const [tyres, setTyres] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Filters for catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Cart: [{ itemType, itemId, name, company, size, unitPricePaise, gstPercent, quantity, stockQuantity }]
  const [cart, setCart] = useState([]);

  // Step 3: Billing & Review
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [discountRupees, setDiscountRupees] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success State
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Load companies & catalog on mount
  useEffect(() => {
    fetchCompanies();
    fetchCatalog();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/counter/companies');
      if (res.data.success) {
        setCompanies(res.data.data);
      }
    } catch (_) {
      try {
        const fallback = await api.get('/admin/companies');
        if (fallback.data.success) setCompanies(fallback.data.data);
      } catch (_) {}
    }
  };

  const fetchCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const [tyresRes, accRes] = await Promise.all([
        api.get('/counter/catalog', { params: { limit: 100 } }),
        api.get('/counter/accessories', { params: { limit: 100 } }),
      ]);
      if (tyresRes.data.success) {
        setTyres(tyresRes.data.data.tyres);
      }
      if (accRes.data.success) {
        setAccessories(accRes.data.data.accessories);
      }
    } catch (err) {
      toast.error('Failed to load item catalog');
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Step 1: Auto lookup by phone number
  const handlePhoneChange = async (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setCustomer((prev) => ({ ...prev, phone: cleaned }));

    if (cleaned.length === 10) {
      try {
        setPhoneLookupLoading(true);
        const res = await api.get('/counter/customers/lookup', { params: { phone: cleaned } });
        if (res.data.success && res.data.data) {
          const cust = res.data.data;
          setCustomer({
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            address: cust.address,
            vehicleNumber: cust.vehicleNumber || '',
            vehicleModel: cust.vehicleModel || '',
          });
          setFoundExistingCustomer(true);
          toast.success(`Found existing customer: ${cust.name}! Auto-filled.`);
        }
      } catch (err) {
        // Customer not found is normal for walk-ins
        setFoundExistingCustomer(false);
      } finally {
        setPhoneLookupLoading(false);
      }
    } else {
      setFoundExistingCustomer(false);
    }
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!customer.name.trim()) return toast.error('Please enter customer name');
    if (customer.phone.length !== 10) return toast.error('Please enter a valid 10-digit phone number');
    if (!customer.email.trim()) return toast.error('Please enter customer email for sending invoice');
    if (!customer.address.trim()) return toast.error('Please enter customer address');

    setStep(2);
  };

  // Add Item to Cart
  const addToCart = (item, type = 'Tyre') => {
    const existingIndex = cart.findIndex((c) => c.itemId === item._id && c.itemType === type);
    const availableStock = item.quantity;

    if (availableStock <= 0) {
      toast.error('This item is currently out of stock!');
      return;
    }

    if (existingIndex > -1) {
      const currentCartQty = cart[existingIndex].quantity;
      if (currentCartQty + 1 > availableStock) {
        toast.error(`Cannot add more than available stock (${availableStock} units)`);
        return;
      }

      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
      toast.success(`Updated quantity for ${updated[existingIndex].name}`);
    } else {
      const newItem = {
        itemType: type,
        itemId: item._id,
        name: type === 'Tyre' ? `${item.companyId?.name || ''} ${item.modelName}` : item.name,
        company: type === 'Tyre' ? item.companyId?.name : item.category,
        size: type === 'Tyre' ? item.size : '-',
        unitPricePaise: item.sellingPricePaise,
        gstPercent: item.gstPercent,
        quantity: 1,
        stockQuantity: availableStock,
      };
      setCart([...cart, newItem]);
      toast.success(`Added ${newItem.name} to bill`);
    }
  };

  // Update Cart Quantity
  const updateCartQty = (index, delta) => {
    const item = cart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    if (newQty > item.stockQuantity) {
      toast.error(`Only ${item.stockQuantity} units available in stock!`);
      return;
    }

    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const removeFromCart = (index) => {
    const removedName = cart[index].name;
    setCart(cart.filter((_, i) => i !== index));
    toast.success(`Removed ${removedName} from cart`);
  };

  // Client-side visual calculations (authoritative calculation happens strictly on the server!)
  const subtotalPaise = cart.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
  const gstPaise = cart.reduce(
    (sum, item) => sum + Math.round((item.unitPricePaise * item.quantity * item.gstPercent) / 100),
    0
  );
  const maxDiscountPercent = shopSettings?.maxDiscountPercent || 15;
  const maxDiscountAllowedPaise = Math.floor((subtotalPaise * maxDiscountPercent) / 100);

  const discountPaise = Math.min(
    maxDiscountAllowedPaise,
    Math.max(0, Math.round(Number(discountRupees || 0) * 100))
  );

  const grandTotalPaise = Math.max(0, subtotalPaise + gstPaise - discountPaise);

  // Step 3: Confirm Sale (Triggers ACID MongoDB Transaction on Server)
  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customer,
        items: cart.map((item) => ({
          itemId: item.itemId,
          itemType: item.itemType,
          quantity: item.quantity,
        })),
        paymentMode,
        discountPaise,
      };

      const res = await api.post('/counter/sales', payload);
      if (res.data.success) {
        setCompletedSale(res.data.data);
        setStep(4); // Move to Success Screen
        toast.success(`Invoice #${res.data.data.invoiceNo} generated successfully!`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to complete sale';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset to New Sale
  const handleStartNewSale = () => {
    setCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      vehicleNumber: '',
      vehicleModel: '',
    });
    setCart([]);
    setDiscountRupees('');
    setPaymentMode('CASH');
    setCompletedSale(null);
    setFoundExistingCustomer(false);
    setStep(1);
    fetchCatalog(); // Refresh live stock
  };

  // Filtering Tyres Catalog
  const filteredTyres = tyres.filter((t) => {
    const tyreCompanyId = t.companyId?._id || t.companyId?.toString() || t.companyId;
    if (selectedCompany && tyreCompanyId !== selectedCompany) return false;
    if (selectedVehicleType && t.vehicleType !== selectedVehicleType) return false;
    if (selectedSize && !t.size.toLowerCase().includes(selectedSize.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchModel = t.modelName.toLowerCase().includes(q);
      const matchSize = t.size.toLowerCase().includes(q);
      const matchBrand = t.companyId?.name?.toLowerCase().includes(q);
      const matchSku = t.sku.toLowerCase().includes(q);
      if (!matchModel && !matchSize && !matchBrand && !matchSku) return false;
    }
    return true;
  });

  const filteredAccessories = accessories.filter((a) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Top Breadcrumb Steps */}
      <div className="glass-panel p-3 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-info bg-opacity-20 text-info rounded-3">
              <ShoppingCart size={22} />
            </div>
            <div>
              <h4 className="text-white fw-bold m-0 brand-font">Counter POS Billing</h4>
              <p className="text-secondary extra-small m-0">Walk-in customer checkout & live stock deduction</p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="d-flex align-items-center gap-2 small">
            <span className={`badge px-3 py-2 rounded-pill ${step === 1 ? 'bg-info text-dark fw-bold' : step > 1 ? 'bg-success text-white' : 'bg-secondary text-secondary bg-opacity-20'}`}>
              1. Customer
            </span>
            <span className="text-secondary">→</span>
            <span className={`badge px-3 py-2 rounded-pill ${step === 2 ? 'bg-info text-dark fw-bold' : step > 2 ? 'bg-success text-white' : 'bg-secondary text-secondary bg-opacity-20'}`}>
              2. Tyres & Cart ({cart.length})
            </span>
            <span className="text-secondary">→</span>
            <span className={`badge px-3 py-2 rounded-pill ${step === 3 ? 'bg-info text-dark fw-bold' : step > 3 ? 'bg-success text-white' : 'bg-secondary text-secondary bg-opacity-20'}`}>
              3. Review & Bill
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: CUSTOMER DETAILS FORM */}
      {step === 1 && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="glass-panel p-4 p-md-5">
              <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-secondary border-opacity-20">
                <div>
                  <h4 className="text-white fw-bold m-0">Step 1: Customer Information</h4>
                  <p className="text-secondary small m-0 mt-1">
                    Enter mobile number to auto-fill repeat customers
                  </p>
                </div>
                {foundExistingCustomer && (
                  <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 px-3 py-1.5">
                    Repeat Customer Found
                  </span>
                )}
              </div>

              <form onSubmit={handleStep1Submit}>
                <div className="row g-3 mb-4">
                  {/* Phone with Auto-Lookup */}
                  <div className="col-12 col-md-6">
                    <label className="form-label text-light small fw-semibold">
                      Mobile Number <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><Phone size={16} /></span>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="10-digit mobile number"
                        value={customer.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        required
                        autoFocus
                      />
                      {phoneLookupLoading && (
                        <span className="input-group-text">
                          <span className="spinner-border spinner-border-sm text-info" />
                        </span>
                      )}
                    </div>
                    <small className="text-secondary extra-small">Auto-fetches details if already in system</small>
                  </div>

                  {/* Customer Name */}
                  <div className="col-12 col-md-6">
                    <label className="form-label text-light small fw-semibold">
                      Customer Name <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><User size={16} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Full Name"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-12 col-md-6">
                    <label className="form-label text-light small fw-semibold">
                      Email Address (for Receipt PDF) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><Mail size={16} /></span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="customer@email.com"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="col-12 col-md-6">
                    <label className="form-label text-light small fw-semibold">
                      Customer Address <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><MapPin size={16} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="City, Area, Landmark"
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Vehicle Number (Optional) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold">
                      Vehicle Registration No. (Optional)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><Car size={16} /></span>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        placeholder="e.g. UP 78 BK 1234"
                        value={customer.vehicleNumber}
                        onChange={(e) => setCustomer({ ...customer, vehicleNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  {/* Vehicle Model (Optional) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold">
                      Vehicle Make / Model (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Swift Dzire, Pulsar 150"
                      value={customer.vehicleModel}
                      onChange={(e) => setCustomer({ ...customer, vehicleModel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary-glass px-4 py-2.5 d-flex align-items-center gap-2">
                    Next: Select Tyres & Items <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT TYRES & ACCESSORIES */}
      {step === 2 && (
        <div className="row g-3">
          {/* Left Column: Catalog & Search */}
          <div className="col-12 col-lg-8">
            <div className="glass-panel p-3 mb-3">
              {/* Type Switcher & Search Bar */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="btn-group p-1 rounded-pill bg-slate-900 border border-secondary border-opacity-25">
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${tab === 'tyres' ? 'btn-primary-glass' : 'btn-link text-secondary text-decoration-none'}`}
                    onClick={() => setTab('tyres')}
                  >
                    <Disc3 size={15} className="me-1" /> Tyres ({filteredTyres.length})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${tab === 'accessories' ? 'btn-primary-glass' : 'btn-link text-secondary text-decoration-none'}`}
                    onClick={() => setTab('accessories')}
                  >
                    <Layers size={15} className="me-1" /> Accessories ({filteredAccessories.length})
                  </button>
                </div>

                {/* Search */}
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text"><Search size={15} /></span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search size, brand, model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters for Tyres */}
              {tab === 'tyres' && (
                <div className="row g-2 pt-2 border-top border-secondary border-opacity-15">
                  <div className="col-6 col-md-4">
                    <select
                      className="form-select form-select-sm"
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                    >
                      <option value="">All Companies</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6 col-md-4">
                    <select
                      className="form-select form-select-sm"
                      value={selectedVehicleType}
                      onChange={(e) => setSelectedVehicleType(e.target.value)}
                    >
                      <option value="">All Vehicle Types</option>
                      {['Bike', 'Scooter', 'Car', 'SUV', 'Truck', 'Tractor', 'Auto'].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Filter size (e.g. 185/65, 90/90)"
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Catalog Grid */}
            <div className="row g-3" style={{ maxHeight: '650px', overflowY: 'auto' }}>
              {tab === 'tyres' ? (
                filteredTyres.length === 0 ? (
                  <div className="col-12">
                    <div className="glass-panel p-5 text-center text-secondary">
                      No tyres matching filter criteria.
                    </div>
                  </div>
                ) : (
                  filteredTyres.map((tyre) => {
                    const isOutOfStock = tyre.quantity <= 0;
                    return (
                      <div key={tyre._id} className="col-12 col-sm-6 col-xl-4">
                        <div className={`glass-panel p-3 h-100 d-flex flex-column justify-content-between ${isOutOfStock ? 'opacity-50' : 'glass-card-interactive'}`}>
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <span className="badge bg-secondary bg-opacity-30 text-white font-monospace extra-small">
                                {tyre.companyId?.name || 'Tyre'}
                              </span>
                              <span className={`badge ${isOutOfStock ? 'bg-danger' : tyre.quantity <= tyre.lowStockThreshold ? 'badge-glass-amber' : 'badge-glass-emerald'} extra-small`}>
                                {isOutOfStock ? 'Out of stock' : `${tyre.quantity} in stock`}
                              </span>
                            </div>

                            <h6 className="text-white fw-bold mb-1">{tyre.modelName}</h6>
                            <div className="text-info font-monospace fw-semibold fs-6 mb-2">{tyre.size}</div>

                            <div className="d-flex flex-wrap gap-1 mb-2">
                              <span className="badge bg-dark text-secondary border border-secondary border-opacity-25 extra-small">
                                {tyre.vehicleType}
                              </span>
                              <span className="badge bg-dark text-secondary border border-secondary border-opacity-25 extra-small">
                                {tyre.tubeType}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-top border-secondary border-opacity-20 d-flex justify-content-between align-items-center">
                            <div>
                              <div className="text-secondary extra-small">Selling Rate</div>
                              <div className="text-white fw-bold font-monospace fs-6">
                                {formatRupees(tyre.sellingPricePaise)}
                              </div>
                              <div className="text-secondary extra-small">+ {tyre.gstPercent}% GST</div>
                            </div>

                            <button
                              className="btn btn-sm btn-primary-glass d-flex align-items-center gap-1"
                              disabled={isOutOfStock}
                              onClick={() => addToCart(tyre, 'Tyre')}
                            >
                              <Plus size={15} /> Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                filteredAccessories.length === 0 ? (
                  <div className="col-12">
                    <div className="glass-panel p-5 text-center text-secondary">
                      No accessories found.
                    </div>
                  </div>
                ) : (
                  filteredAccessories.map((acc) => {
                    const isOutOfStock = acc.quantity <= 0;
                    return (
                      <div key={acc._id} className="col-12 col-sm-6 col-xl-4">
                        <div className={`glass-panel p-3 h-100 d-flex flex-column justify-content-between ${isOutOfStock ? 'opacity-50' : 'glass-card-interactive'}`}>
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <span className="badge bg-secondary bg-opacity-30 text-white extra-small">
                                {acc.category}
                              </span>
                              <span className={`badge ${isOutOfStock ? 'bg-danger' : acc.quantity <= acc.lowStockThreshold ? 'badge-glass-amber' : 'badge-glass-emerald'} extra-small`}>
                                {isOutOfStock ? 'Out of stock' : `${acc.quantity} in stock`}
                              </span>
                            </div>

                            <h6 className="text-white fw-bold mb-1">{acc.name}</h6>
                            <div className="text-secondary font-monospace extra-small mb-2">SKU: {acc.sku}</div>
                          </div>

                          <div className="pt-2 border-top border-secondary border-opacity-20 d-flex justify-content-between align-items-center">
                            <div>
                              <div className="text-secondary extra-small">Rate</div>
                              <div className="text-white fw-bold font-monospace fs-6">
                                {formatRupees(acc.sellingPricePaise)}
                              </div>
                              <div className="text-secondary extra-small">+ {acc.gstPercent}% GST</div>
                            </div>

                            <button
                              className="btn btn-sm btn-primary-glass d-flex align-items-center gap-1"
                              disabled={isOutOfStock}
                              onClick={() => addToCart(acc, 'Accessory')}
                            >
                              <Plus size={15} /> Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Right Column: Live Billing Cart */}
          <div className="col-12 col-lg-4">
            <div className="glass-panel p-3 h-100 d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <ShoppingCart size={18} className="text-info" />
                  <h5 className="text-white fw-bold m-0">Bill Items ({cart.length})</h5>
                </div>
                {cart.length > 0 && (
                  <button className="btn btn-sm text-danger p-0 extra-small" onClick={() => setCart([])}>
                    Clear all
                  </button>
                )}
              </div>

              {/* Customer quick info */}
              <div className="p-2 mb-3 rounded-2 bg-slate-900 border border-secondary border-opacity-20 small">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Customer:</span>
                  <span className="text-white fw-semibold">{customer.name}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Phone:</span>
                  <span className="text-light font-monospace">{customer.phone}</span>
                </div>
                <button
                  className="btn btn-link extra-small text-info p-0 mt-1 text-decoration-none"
                  onClick={() => setStep(1)}
                >
                  Edit customer details
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-grow-1 overflow-y-auto pe-1 mb-3" style={{ maxHeight: '340px' }}>
                {cart.length === 0 ? (
                  <div className="text-center py-5 text-secondary">
                    <ShoppingCart size={36} className="opacity-30 mb-2" />
                    <p className="small m-0">No items added to bill yet.</p>
                    <small className="extra-small">Select tyres or accessories on the left.</small>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="p-2.5 mb-2 rounded-2 bg-slate-900 bg-opacity-70 border border-secondary border-opacity-15">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="me-2">
                          <div className="text-white fw-semibold small lh-sm">{item.name}</div>
                          <div className="text-secondary extra-small font-monospace">{item.size !== '-' ? item.size : item.company}</div>
                        </div>
                        <button
                          className="btn btn-sm text-secondary hover-text-danger p-0"
                          onClick={() => removeFromCart(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary border-opacity-10">
                        {/* Qty Controls */}
                        <div className="d-flex align-items-center gap-1.5 bg-dark p-1 rounded border border-secondary border-opacity-25">
                          <button
                            className="btn btn-sm text-light p-0 px-1"
                            onClick={() => updateCartQty(idx, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-1 text-white fw-bold small">{item.quantity}</span>
                          <button
                            className="btn btn-sm text-light p-0 px-1"
                            onClick={() => updateCartQty(idx, 1)}
                            disabled={item.quantity >= item.stockQuantity}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-end">
                          <div className="text-white fw-bold font-monospace small">
                            {formatRupees(item.unitPricePaise * item.quantity)}
                          </div>
                          <div className="text-secondary extra-small">+{item.gstPercent}% GST</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Summary */}
              {cart.length > 0 && (
                <div className="pt-2 border-top border-secondary border-opacity-25">
                  <div className="d-flex justify-content-between text-secondary small mb-1">
                    <span>Taxable Subtotal:</span>
                    <span className="font-monospace text-light">{formatRupees(subtotalPaise)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-secondary small mb-2">
                    <span>Estimated GST:</span>
                    <span className="font-monospace text-light">+ {formatRupees(gstPaise)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-top border-secondary border-opacity-15 mb-3">
                    <span className="text-white fw-bold">Est. Total:</span>
                    <span className="text-info fw-bold font-monospace fs-5">{formatRupees(subtotalPaise + gstPaise)}</span>
                  </div>

                  <button
                    className="btn btn-primary-glass w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setStep(3)}
                  >
                    Proceed to Review & Bill <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & BILL */}
      {step === 3 && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9">
            <div className="glass-panel p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-20">
                <div>
                  <h4 className="text-white fw-bold m-0">Step 3: Review Invoice & Confirm Sale</h4>
                  <p className="text-secondary small m-0 mt-1">
                    Zero-trust server calculation will verify stock and generate sequential GST invoice
                  </p>
                </div>
                <button className="btn btn-secondary-glass btn-sm" onClick={() => setStep(2)}>
                  <ArrowLeft size={15} /> Modify Items
                </button>
              </div>

              {/* Customer Snapshot */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="p-3 rounded-2 bg-slate-900 border border-secondary border-opacity-25 h-100">
                    <div className="text-secondary extra-small text-uppercase fw-bold mb-1">Customer</div>
                    <div className="text-white fw-bold fs-6">{customer.name}</div>
                    <div className="text-secondary small">Phone: <span className="text-light">{customer.phone}</span></div>
                    <div className="text-secondary small">Email: <span className="text-light">{customer.email}</span></div>
                    <div className="text-secondary small">Address: <span className="text-light">{customer.address}</span></div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 rounded-2 bg-slate-900 border border-secondary border-opacity-25 h-100">
                    <div className="text-secondary extra-small text-uppercase fw-bold mb-1">Vehicle & Shop</div>
                    <div className="text-secondary small">
                      Vehicle: <span className="text-white fw-semibold">{customer.vehicleNumber || 'Walk-in / None'}</span> {customer.vehicleModel && `(${customer.vehicleModel})`}
                    </div>
                    <div className="text-secondary small mt-1">Shop GSTIN: <span className="text-warning fw-bold">{shopSettings?.gstin || '09AAACH7409R1ZZ'}</span></div>
                    <div className="text-secondary small">Invoice Series: <span className="text-info font-monospace">HT-YYYYMMDD-XXXX</span></div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="table-responsive mb-4">
                <table className="table table-glass mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Description</th>
                      <th>Size</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Rate (₹)</th>
                      <th className="text-end">GST %</th>
                      <th className="text-end">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => {
                      const lineSubtotal = item.unitPricePaise * item.quantity;
                      const lineGst = Math.round((lineSubtotal * item.gstPercent) / 100);
                      return (
                        <tr key={idx}>
                          <td className="text-secondary">{idx + 1}</td>
                          <td className="text-white fw-semibold">{item.name}</td>
                          <td className="text-secondary font-monospace">{item.size}</td>
                          <td className="text-center text-white fw-bold">{item.quantity}</td>
                          <td className="text-end font-monospace">{formatRupees(item.unitPricePaise, false)}</td>
                          <td className="text-end font-monospace text-secondary">{item.gstPercent}%</td>
                          <td className="text-end font-monospace text-white fw-bold">{formatRupees(lineSubtotal + lineGst, false)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Payment Mode Selection & Discount */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-light small fw-semibold">Payment Mode</label>
                  <div className="row g-2">
                    {[
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                      { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                      { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                      { id: 'CREDIT', label: 'Credit (Khata)', icon: ShieldAlert },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = paymentMode === mode.id;
                      return (
                        <div key={mode.id} className="col-6">
                          <button
                            type="button"
                            className={`btn w-100 p-2.5 d-flex align-items-center gap-2 justify-content-center ${
                              isSelected
                                ? 'btn-primary-glass'
                                : 'btn-secondary-glass'
                            }`}
                            onClick={() => setPaymentMode(mode.id)}
                          >
                            <Icon size={16} />
                            <span>{mode.label}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Discount Input */}
                  <div className="mt-3">
                    <label className="form-label text-secondary small fw-semibold">
                      Discount in Rupees (Max {maxDiscountPercent}%: ₹{paiseToRupees(maxDiscountAllowedPaise)})
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={paiseToRupees(maxDiscountAllowedPaise)}
                        className="form-control"
                        placeholder="0.00"
                        value={discountRupees}
                        onChange={(e) => setDiscountRupees(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="col-12 col-md-6">
                  <div className="p-3.5 rounded-3 bg-slate-900 border border-secondary border-opacity-30">
                    <div className="d-flex justify-content-between py-1.5 small border-bottom border-secondary border-opacity-10">
                      <span className="text-secondary">Taxable Subtotal:</span>
                      <span className="font-monospace text-light">{formatRupees(subtotalPaise)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1.5 small border-bottom border-secondary border-opacity-10">
                      <span className="text-secondary">Total GST Output:</span>
                      <span className="font-monospace text-light">+ {formatRupees(gstPaise)}</span>
                    </div>
                    {discountPaise > 0 && (
                      <div className="d-flex justify-content-between py-1.5 small border-bottom border-secondary border-opacity-10 text-danger">
                        <span>Discount Applied:</span>
                        <span className="font-monospace">- {formatRupees(discountPaise)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center py-2.5 mt-2 bg-info bg-opacity-10 p-2 rounded">
                      <span className="text-white fw-bold fs-6">Grand Total:</span>
                      <span className="text-info fw-bold font-monospace fs-4">{formatRupees(grandTotalPaise)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-20">
                <button className="btn btn-secondary-glass" onClick={() => setStep(2)} disabled={submitting}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  className="btn btn-success-glass px-4 py-2.5 d-flex align-items-center gap-2"
                  onClick={handleConfirmSale}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      Committing Sale Transaction...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Confirm Sale & Generate GST Receipt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS SCREEN */}
      {step === 4 && completedSale && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="glass-panel p-4 p-md-5 text-center shadow-2xl">
              <div className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-20 text-success mb-3 shadow-lg">
                <CheckCircle2 size={48} />
              </div>

              <h3 className="text-white fw-bold mb-1 brand-font">Sale Completed Successfully!</h3>
              <p className="text-secondary small mb-4">
                Invoice <strong className="text-info font-monospace">{completedSale.invoiceNo}</strong> committed to database.
                Stock was reduced transactionally.
              </p>

              {/* Summary Card */}
              <div className="glass-panel p-4 text-start mb-4 bg-slate-900" style={{ maxWidth: '520px', margin: '0 auto' }}>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-15 small">
                  <span className="text-secondary">Customer:</span>
                  <span className="text-white fw-bold">{completedSale.customerSnapshot.name}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-15 small">
                  <span className="text-secondary">Phone:</span>
                  <span className="text-light font-monospace">{completedSale.customerSnapshot.phone}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-15 small">
                  <span className="text-secondary">Date & Time:</span>
                  <span className="text-light">{formatIST(completedSale.createdAt)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-15 small">
                  <span className="text-secondary">Payment:</span>
                  <span className="badge bg-success bg-opacity-20 text-success">{completedSale.paymentMode}</span>
                </div>
                <div className="d-flex justify-content-between py-2 mt-2">
                  <span className="text-white fw-bold fs-6">Grand Total:</span>
                  <span className="text-info fw-bold font-monospace fs-5">{formatRupees(completedSale.totalPaise)}</span>
                </div>
              </div>

              {/* Action Buttons (As Specified by Step 3 in Section 6) */}
              <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                <button
                  className="btn btn-primary-glass d-flex align-items-center gap-1.5"
                  onClick={() => setShowReceiptModal(true)}
                >
                  <Printer size={16} /> View & Print Receipt
                </button>
                <a
                  href={`/api/sales/${completedSale._id}/receipt.pdf`}
                  download={`Invoice_${completedSale.invoiceNo}.pdf`}
                  className="btn btn-secondary-glass d-flex align-items-center gap-1.5"
                >
                  <Download size={16} /> Download Receipt (PDF)
                </a>
                <button
                  className="btn btn-success-glass d-flex align-items-center gap-1.5"
                  onClick={handleStartNewSale}
                >
                  <Plus size={16} /> Start New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          sale={completedSale}
          shopSettings={shopSettings}
        />
      )}
    </div>
  );
}
