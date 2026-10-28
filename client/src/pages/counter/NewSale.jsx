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
  ShieldAlert,
  X
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

  const getGodownName = (code) => {
    return shopSettings?.godowns?.find((g) => g.code === code)?.name || (code === 'G1' ? 'Godown 1' : 'Godown 2');
  };

  // Add Item to Cart
  const addToCart = (item, type = 'Tyre') => {
    const g1Stock = item.godownStock?.G1 ?? 0;
    const g2Stock = item.godownStock?.G2 ?? 0;
    const totalStock = item.quantity ?? (g1Stock + g2Stock);

    if (totalStock <= 0 || (g1Stock <= 0 && g2Stock <= 0)) {
      toast.error('This item is currently out of stock!');
      return;
    }

    // Default godown: the one with more stock, but only if it has stock > 0
    let defaultGodown = 'G1';
    if (g2Stock > g1Stock && g2Stock > 0) {
      defaultGodown = 'G2';
    } else if (g1Stock > 0) {
      defaultGodown = 'G1';
    } else if (g2Stock > 0) {
      defaultGodown = 'G2';
    }

    const availableStockInChosen = defaultGodown === 'G1' ? g1Stock : g2Stock;

    // Check if item already exists in cart from the SAME godown
    const existingIndex = cart.findIndex(
      (c) => c.itemId === item._id && c.itemType === type && c.godown === defaultGodown
    );

    if (existingIndex > -1) {
      const currentCartQty = cart[existingIndex].quantity;
      if (currentCartQty + 1 > availableStockInChosen) {
        toast.error(`Cannot add more than available stock in ${getGodownName(defaultGodown)} (${availableStockInChosen} units)`);
        return;
      }

      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
      toast.success(`Updated quantity for ${updated[existingIndex].name} (${getGodownName(defaultGodown)})`);
    } else {
      const newItem = {
        itemType: type,
        itemId: item._id,
        name: type === 'Tyre' ? `${item.companyId?.name || ''} ${item.modelName}` : item.name,
        company: type === 'Tyre' ? item.companyId?.name : item.category,
        size: type === 'Tyre' ? item.size : '-',
        unitPricePaise: item.sellingPricePaise,
        minSellingPricePaise: type === 'Tyre'
          ? (item.minSellingPricePaise || item.actualPricePaise || item.purchasePricePaise || item.sellingPricePaise)
          : (item.purchasePricePaise || item.sellingPricePaise),
        actualPricePaise: item.actualPricePaise || item.purchasePricePaise,
        gstPercent: 0,
        godown: defaultGodown,
        godownStock: {
          G1: g1Stock,
          G2: g2Stock,
        },
        quantity: 1,
      };
      setCart([...cart, newItem]);
      toast.success(`Added ${newItem.name} (${getGodownName(defaultGodown)}) to bill`);
    }
  };

  // Change godown for a cart item
  const handleGodownChange = (index, newGodown) => {
    const item = cart[index];
    if (item.godown === newGodown) return;

    const targetStock = item.godownStock?.[newGodown] ?? 0;
    if (targetStock <= 0) {
      toast.error(`No stock available in ${getGodownName(newGodown)}!`);
      return;
    }

    // Check if another cart line already exists for same item in newGodown
    const duplicateIndex = cart.findIndex(
      (c, i) => i !== index && c.itemId === item.itemId && c.itemType === item.itemType && c.godown === newGodown
    );

    if (duplicateIndex > -1) {
      const mergedQty = Math.min(targetStock, cart[duplicateIndex].quantity + item.quantity);
      const updated = [...cart];
      updated[duplicateIndex].quantity = mergedQty;
      updated.splice(index, 1);
      setCart(updated);
      toast.success(`Merged with existing ${getGodownName(newGodown)} line (Qty: ${mergedQty})`);
      return;
    }

    const clampedQty = Math.min(item.quantity, targetStock);
    const updated = [...cart];
    updated[index] = {
      ...item,
      godown: newGodown,
      quantity: clampedQty,
    };
    setCart(updated);

    if (clampedQty < item.quantity) {
      toast.warning(`Quantity adjusted to available stock (${clampedQty}) in ${getGodownName(newGodown)}`);
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

    const maxStock = item.godownStock?.[item.godown] ?? 0;
    if (newQty > maxStock) {
      toast.error(`Only ${maxStock} units available in ${getGodownName(item.godown)}!`);
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
  const minCartFloorPaise = cart.reduce((sum, item) => {
    const msp = item.minSellingPricePaise !== undefined && item.minSellingPricePaise !== null
      ? item.minSellingPricePaise
      : item.unitPricePaise;
    return sum + (msp * item.quantity);
  }, 0);
  const gstPaise = 0;
  const maxDiscountPercent = shopSettings?.maxDiscountPercent || 15;
  const maxDiscountAllowedByPolicy = Math.floor((subtotalPaise * maxDiscountPercent) / 100);
  const maxDiscountAllowedByMSP = Math.max(0, subtotalPaise - minCartFloorPaise);
  const effectiveMaxDiscountPaise = Math.min(maxDiscountAllowedByPolicy, maxDiscountAllowedByMSP);

  const enteredDiscountPaise = Math.max(0, Math.round(Number(discountRupees || 0) * 100));
  const isViolatingMSP = enteredDiscountPaise > maxDiscountAllowedByMSP;
  const isViolatingPolicy = enteredDiscountPaise > maxDiscountAllowedByPolicy;

  const discountPaise = enteredDiscountPaise;
  const grandTotalPaise = Math.max(0, subtotalPaise - discountPaise);

  // Step 3: Confirm Sale (Triggers ACID MongoDB Transaction on Server)
  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart cannot be empty.');
      return;
    }

    if (isViolatingMSP) {
      toast.error(
        `Discount violates Minimum Selling Price policy! Cannot sell below floor price (₹${paiseToRupees(minCartFloorPaise)}). Maximum discount allowed: ₹${paiseToRupees(maxDiscountAllowedByMSP)}`
      );
      return;
    }

    if (isViolatingPolicy) {
      toast.error(
        `Discount exceeds shop maximum limit of ${maxDiscountPercent}% (₹${paiseToRupees(maxDiscountAllowedByPolicy)})`
      );
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
          godown: item.godown,
        })),
        paymentMode,
        discountPaise,
      };

      const res = await api.post('/counter/sales', payload);
      if (res.data.success) {
        setCompletedSale(res.data.data);
        setStep(4); // Move to Success Screen
        toast.success(`Invoice #${res.data.data.invoiceNo} generated successfully!`);
        fetchCatalog(); // Refresh stock from server
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
      const matchMat = t.materialNumber?.toLowerCase().includes(q);
      if (!matchModel && !matchSize && !matchBrand && !matchSku && !matchMat) return false;
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
    <div className="page-container">
      {/* Top Breadcrumb Steps Header */}
      <div className="page-header-card">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-3" style={{ background: 'var(--accent-soft)', color: '#B45309' }}>
              <ShoppingCart size={22} />
            </div>
            <div>
              <h1 className="page-title">Counter POS Billing</h1>
              <p className="page-subtitle">Walk-in customer checkout & live inventory deduction</p>
            </div>
          </div>

          {/* Stepper Progress (4 states) */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div
              className="d-flex align-items-center px-3 py-1.5 rounded-pill small"
              style={
                step > 1
                  ? { background: 'var(--accent)', color: '#000', fontWeight: '700' }
                  : step === 1
                  ? { border: '2px solid var(--accent)', background: 'var(--accent-soft)', color: '#000', fontWeight: '700' }
                  : { border: '1px solid var(--border-light)', background: '#F1F3F5', color: 'var(--text-muted)' }
              }
            >
              {step > 1 ? <CheckCircle2 size={14} className="me-1.5" /> : null}
              1. Customer
            </div>

            <span className="text-muted">→</span>

            <div
              className="d-flex align-items-center px-3 py-1.5 rounded-pill small"
              style={
                step > 2
                  ? { background: 'var(--accent)', color: '#000', fontWeight: '700' }
                  : step === 2
                  ? { border: '2px solid var(--accent)', background: 'var(--accent-soft)', color: '#000', fontWeight: '700' }
                  : { border: '1px solid var(--border-light)', background: '#F1F3F5', color: 'var(--text-muted)' }
              }
            >
              {step > 2 ? <CheckCircle2 size={14} className="me-1.5" /> : null}
              2. Tyres & Cart ({cart.length})
            </div>

            <span className="text-muted">→</span>

            <div
              className="d-flex align-items-center px-3 py-1.5 rounded-pill small"
              style={
                step > 3
                  ? { background: 'var(--accent)', color: '#000', fontWeight: '700' }
                  : step === 3
                  ? { border: '2px solid var(--accent)', background: 'var(--accent-soft)', color: '#000', fontWeight: '700' }
                  : { border: '1px solid var(--border-light)', background: '#F1F3F5', color: 'var(--text-muted)' }
              }
            >
              {step > 3 ? <CheckCircle2 size={14} className="me-1.5" /> : null}
              3. Review & Bill
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: CUSTOMER DETAILS FORM */}
      {step === 1 && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card-clean p-4 p-md-5 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-light)' }}>
                <div>
                  <h4 className="fw-bold m-0" style={{ color: 'var(--text-on-light)' }}>Step 1: Customer Information</h4>
                  <p className="text-muted small m-0 mt-1">
                    Enter mobile number to auto-fill repeat customers
                  </p>
                </div>
                {foundExistingCustomer && (
                  <span className="badge-pill-yellow">
                    ★ Repeat Customer Found
                  </span>
                )}
              </div>

              <form onSubmit={handleStep1Submit}>
                <div className="row g-3 mb-4">
                  {/* Phone with Auto-Lookup */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold" style={{ color: 'var(--text-on-light)' }}>
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
                          <span className="spinner-border spinner-border-sm" style={{ color: 'var(--accent-dark)' }} />
                        </span>
                      )}
                    </div>
                    <small className="text-muted extra-small">Auto-fetches details if already in system</small>
                  </div>

                  {/* Customer Name */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold" style={{ color: 'var(--text-on-light)' }}>
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
                    <label className="form-label small fw-semibold" style={{ color: 'var(--text-on-light)' }}>
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
                    <label className="form-label small fw-semibold" style={{ color: 'var(--text-on-light)' }}>
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
                    <label className="form-label text-muted small fw-semibold">
                      Vehicle Registration No. (Optional)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><Car size={16} /></span>
                      <input
                        type="text"
                        className="form-control text-uppercase font-monospace"
                        placeholder="e.g. UP 78 BK 1234"
                        value={customer.vehicleNumber}
                        onChange={(e) => setCustomer({ ...customer, vehicleNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  {/* Vehicle Model (Optional) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small fw-semibold">
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
                  <button type="submit" className="btn btn-accent px-4 py-2.5 d-flex align-items-center gap-2">
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
            <div className="card-clean p-3 mb-3 bg-white">
              {/* Type Switcher & Search Bar */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="btn-group p-1 rounded-pill" style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                  <button
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${tab === 'tyres' ? 'btn-dark-solid' : 'btn-link text-muted text-decoration-none'}`}
                    onClick={() => setTab('tyres')}
                  >
                    <Disc3 size={15} className="me-1" /> Tyres ({filteredTyres.length})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${tab === 'accessories' ? 'btn-dark-solid' : 'btn-link text-muted text-decoration-none'}`}
                    onClick={() => setTab('accessories')}
                  >
                    <Layers size={15} className="me-1" /> Accessories ({filteredAccessories.length})
                  </button>
                </div>

                {/* Search */}
                <div className="input-group input-group-sm" style={{ maxWidth: '340px' }}>
                  <span className="input-group-text bg-white text-muted border-end-0">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search size, brand, model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm px-2"
                      onClick={() => setSearchQuery('')}
                      title="Clear search text"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-accent btn-sm fw-bold d-flex align-items-center gap-1 px-3"
                    title="Search"
                  >
                    <Search size={13} />
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Filters for Tyres */}
              {tab === 'tyres' && (
                <div className="row g-2 pt-2 border-top" style={{ borderColor: 'var(--border-light)' }}>
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
                    <div className="card-clean p-5 text-center text-muted bg-white">
                      No tyres matching filter criteria.
                    </div>
                  </div>
                ) : (
                  filteredTyres.map((tyre) => {
                    const isOutOfStock = tyre.quantity <= 0;
                    return (
                      <div key={tyre._id} className="col-12 col-sm-6 col-xl-4">
                        <div className={`card-clean p-3 h-100 d-flex flex-column justify-content-between bg-white ${isOutOfStock ? 'opacity-50' : ''}`}>
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <span className="badge bg-light text-dark border font-monospace extra-small">
                                {tyre.companyId?.name || 'Tyre'}
                              </span>
                              <span className={isOutOfStock ? 'badge-pill-danger' : tyre.quantity <= tyre.lowStockThreshold ? 'badge-pill-warning' : 'badge-pill-success'}>
                                {isOutOfStock ? 'Out of stock' : `${tyre.quantity} in stock`}
                              </span>
                            </div>

                            <h6 className="fw-bold mb-1 text-dark">{tyre.modelName}</h6>
                            <div className="font-monospace fw-bold fs-6 mb-2" style={{ color: 'var(--text-on-light)' }}>{tyre.size}</div>

                            <div className="d-flex flex-wrap gap-1 mb-2">
                              {tyre.materialNumber && (
                                <span className="badge bg-light text-dark border font-monospace extra-small">
                                  Mat: {tyre.materialNumber}
                                </span>
                              )}
                              <span className="badge bg-light text-muted border extra-small">
                                {tyre.vehicleType}
                              </span>
                              <span className="badge bg-light text-muted border extra-small">
                                {tyre.tubeType}
                              </span>
                            </div>

                            {/* Godown-wise stock breakdown */}
                            <div className="d-flex flex-wrap gap-1 mb-2">
                              <span className="badge bg-light text-dark border extra-small font-monospace" title="Total Available Stock">
                                Total: {tyre.quantity}
                              </span>
                              <span className={`badge border extra-small font-monospace ${tyre.godownStock?.G1 > 0 ? 'bg-light text-dark' : 'bg-light text-muted opacity-50'}`}>
                                {getGodownName('G1')}: {tyre.godownStock?.G1 ?? 0}
                              </span>
                              <span className={`badge border extra-small font-monospace ${tyre.godownStock?.G2 > 0 ? 'bg-light text-dark' : 'bg-light text-muted opacity-50'}`}>
                                {getGodownName('G2')}: {tyre.godownStock?.G2 ?? 0}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-top d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-light)' }}>
                            <div>
                              <div className="text-muted extra-small">Selling Rate</div>
                              <div className="fw-bold font-monospace fs-6 text-dark">
                                {formatRupees(tyre.sellingPricePaise)}
                              </div>
                              <div className="extra-small text-danger fw-semibold" title="Minimum Selling Price Floor">
                                Min: {formatRupees(tyre.minSellingPricePaise || tyre.actualPricePaise || tyre.sellingPricePaise)}
                              </div>
                            </div>

                            <button
                              className="btn btn-sm btn-accent d-flex align-items-center gap-1"
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
                    <div className="card-clean p-5 text-center text-muted bg-white">
                      No accessories found.
                    </div>
                  </div>
                ) : (
                  filteredAccessories.map((acc) => {
                    const isOutOfStock = acc.quantity <= 0;
                    return (
                      <div key={acc._id} className="col-12 col-sm-6 col-xl-4">
                        <div className={`card-clean p-3 h-100 d-flex flex-column justify-content-between bg-white ${isOutOfStock ? 'opacity-50' : ''}`}>
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <span className="badge bg-light text-dark border extra-small">
                                {acc.category}
                              </span>
                              <span className={isOutOfStock ? 'badge-pill-danger' : acc.quantity <= acc.lowStockThreshold ? 'badge-pill-warning' : 'badge-pill-success'}>
                                {isOutOfStock ? 'Out of stock' : `${acc.quantity} in stock`}
                              </span>
                            </div>

                            <h6 className="fw-bold mb-1 text-dark">{acc.name}</h6>
                            <div className="text-muted font-monospace extra-small mb-2">SKU: {acc.sku}</div>

                            {/* Godown-wise stock breakdown */}
                            <div className="d-flex flex-wrap gap-1 mb-2">
                              <span className="badge bg-light text-dark border extra-small font-monospace" title="Total Available Stock">
                                Total: {acc.quantity}
                              </span>
                              <span className={`badge border extra-small font-monospace ${acc.godownStock?.G1 > 0 ? 'bg-light text-dark' : 'bg-light text-muted opacity-50'}`}>
                                {getGodownName('G1')}: {acc.godownStock?.G1 ?? 0}
                              </span>
                              <span className={`badge border extra-small font-monospace ${acc.godownStock?.G2 > 0 ? 'bg-light text-dark' : 'bg-light text-muted opacity-50'}`}>
                                {getGodownName('G2')}: {acc.godownStock?.G2 ?? 0}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-top d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-light)' }}>
                            <div>
                              <div className="text-muted extra-small">Rate</div>
                              <div className="fw-bold font-monospace fs-6 text-dark">
                                {formatRupees(acc.sellingPricePaise)}
                              </div>
                            </div>

                            <button
                              className="btn btn-sm btn-accent d-flex align-items-center gap-1"
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
            <div className="card-clean p-3 h-100 d-flex flex-column bg-white">
              <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom" style={{ borderColor: 'var(--border-light)' }}>
                <div className="d-flex align-items-center gap-2">
                  <ShoppingCart size={18} style={{ color: 'var(--accent-dark)' }} />
                  <h5 className="fw-bold m-0 text-dark">Bill Items ({cart.length})</h5>
                </div>
                {cart.length > 0 && (
                  <button className="btn btn-sm text-danger p-0 extra-small fw-semibold" onClick={() => setCart([])}>
                    Clear all
                  </button>
                )}
              </div>

              {/* Customer quick info */}
              <div className="p-2 mb-3 rounded-2 small" style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Customer:</span>
                  <span className="text-dark fw-bold">{customer.name}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Phone:</span>
                  <span className="text-dark font-monospace">{customer.phone}</span>
                </div>
                <button
                  className="btn btn-link extra-small p-0 mt-1 text-decoration-none fw-semibold"
                  style={{ color: 'var(--link-blue)' }}
                  onClick={() => setStep(1)}
                >
                  Edit customer details
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-grow-1 overflow-y-auto pe-1 mb-3" style={{ maxHeight: '340px' }}>
                {cart.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <ShoppingCart size={36} className="opacity-30 mb-2" />
                    <p className="small m-0">No items added to bill yet.</p>
                    <small className="extra-small">Select tyres or accessories on the left.</small>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`${item.itemId}_${item.godown}_${idx}`} className="p-2.5 mb-2 rounded-2" style={{ background: '#FAFBFD', border: '1px solid var(--border-light)' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="me-2">
                          <div className="text-dark fw-semibold small lh-sm">{item.name}</div>
                          <div className="text-muted extra-small font-monospace">{item.size !== '-' ? item.size : item.company}</div>
                        </div>
                        <button
                          className="btn btn-sm text-muted hover-text-danger p-0"
                          onClick={() => removeFromCart(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Godown Selector */}
                      <div className="d-flex align-items-center justify-content-between my-2 p-1.5 rounded" style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                        <span className="extra-small text-muted fw-semibold">Warehouse:</span>
                        <div className="btn-group btn-group-sm" role="group">
                          {['G1', 'G2'].map((gCode) => {
                            const isSelected = item.godown === gCode;
                            const stockInG = item.godownStock?.[gCode] ?? 0;
                            const disabled = stockInG <= 0;
                            return (
                              <button
                                key={gCode}
                                type="button"
                                disabled={disabled}
                                className={`btn btn-sm py-0.5 px-2 extra-small fw-bold ${
                                  isSelected
                                    ? 'btn-dark'
                                    : disabled
                                    ? 'btn-outline-secondary opacity-50 text-muted'
                                    : 'btn-outline-dark'
                                }`}
                                onClick={() => handleGodownChange(idx, gCode)}
                                title={`${getGodownName(gCode)} (${stockInG} in stock)`}
                              >
                                {getGodownName(gCode)} ({stockInG})
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top" style={{ borderColor: 'var(--border-light)' }}>
                        {/* Qty Controls */}
                        <div className="d-flex align-items-center gap-1.5 p-1 rounded" style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                          <button
                            className="btn btn-sm text-dark p-0 px-1"
                            onClick={() => updateCartQty(idx, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-1 text-dark fw-bold small">{item.quantity}</span>
                          <button
                            className="btn btn-sm text-dark p-0 px-1"
                            onClick={() => updateCartQty(idx, 1)}
                            disabled={item.quantity >= (item.godownStock?.[item.godown] ?? 0)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-end">
                          <div className="text-dark fw-bold font-monospace small">
                            {formatRupees(item.unitPricePaise * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Summary */}
              {cart.length > 0 && (
                <div className="pt-2 border-top" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>Subtotal:</span>
                    <span className="font-monospace text-dark fw-semibold">{formatRupees(subtotalPaise)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-top mb-3" style={{ borderColor: 'var(--border-light)' }}>
                    <span className="text-dark fw-bold">Est. Total:</span>
                    <span className="fw-bold font-monospace fs-5 text-dark" style={{ borderBottom: '3.5px solid var(--accent)' }}>
                      {formatRupees(subtotalPaise)}
                    </span>
                  </div>

                  <button
                    className="btn btn-accent w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-bold"
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
            <div className="card-clean p-4 p-md-5 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-light)' }}>
                <div>
                  <h4 className="fw-bold m-0" style={{ color: 'var(--text-on-light)' }}>Step 3: Review Invoice & Confirm Sale</h4>
                  <p className="text-muted small m-0 mt-1">
                    Server calculation will verify stock and generate sequential retail invoice
                  </p>
                </div>
                <button className="btn btn-outline-dark-custom btn-sm" onClick={() => setStep(2)}>
                  <ArrowLeft size={15} /> Modify Items
                </button>
              </div>

              {/* Customer Snapshot */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="p-3 rounded-2 h-100" style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                    <div className="text-muted extra-small text-uppercase fw-bold mb-1">Customer</div>
                    <div className="text-dark fw-bold fs-6">{customer.name}</div>
                    <div className="text-muted small">Phone: <span className="text-dark font-monospace fw-medium">{customer.phone}</span></div>
                    <div className="text-muted small">Email: <span className="text-dark fw-medium">{customer.email}</span></div>
                    <div className="text-muted small">Address: <span className="text-dark">{customer.address}</span></div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 rounded-2 h-100" style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                    <div className="text-muted extra-small text-uppercase fw-bold mb-1">Vehicle & Shop</div>
                    <div className="text-muted small">
                      Vehicle: <span className="badge bg-dark text-white font-monospace">{customer.vehicleNumber || 'Walk-in / None'}</span> {customer.vehicleModel && `(${customer.vehicleModel})`}
                    </div>
                    <div className="text-muted small mt-1">Invoice Series: <span className="text-dark font-monospace fw-semibold">HT-YYYYMMDD-XXXX</span></div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="card-clean overflow-hidden mb-4 bg-white">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Description</th>
                      <th>Size</th>
                      <th>Warehouse</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Rate (₹)</th>
                      <th className="text-end">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => {
                      const lineSubtotal = item.unitPricePaise * item.quantity;
                      return (
                        <tr key={idx}>
                          <td className="text-muted">{idx + 1}</td>
                          <td className="text-dark fw-semibold">{item.name}</td>
                          <td className="text-muted font-monospace">{item.size}</td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace extra-small">
                              {getGodownName(item.godown)}
                            </span>
                          </td>
                          <td className="text-center text-dark fw-bold">{item.quantity}</td>
                          <td className="text-end font-monospace">{formatRupees(item.unitPricePaise, false)}</td>
                          <td className="text-end font-monospace text-dark fw-bold">{formatRupees(lineSubtotal, false)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Payment Mode Selection & Discount */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold" style={{ color: 'var(--text-on-light)' }}>Payment Mode</label>
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
                                ? 'btn-accent'
                                : 'btn-outline-dark-custom'
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

                  {/* Optional Discount Input with MSP Floor Guard */}
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label text-muted small fw-semibold m-0">
                        Discount in Rupees (₹)
                      </label>
                      <span className="badge bg-light text-dark border extra-small font-monospace">
                        Max Allowed: ₹{paiseToRupees(effectiveMaxDiscountPaise)}
                      </span>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        min="0"
                        className={`form-control font-monospace ${isViolatingMSP || isViolatingPolicy ? 'is-invalid border-danger' : ''}`}
                        placeholder="0.00"
                        value={discountRupees}
                        onChange={(e) => setDiscountRupees(e.target.value)}
                      />
                    </div>
                    {isViolatingMSP ? (
                      <div className="text-danger extra-small mt-1 fw-semibold d-flex align-items-center gap-1">
                        <AlertCircle size={13} />
                        Minimum Selling Price violation! Cannot sell below floor total ₹{paiseToRupees(minCartFloorPaise)}.
                      </div>
                    ) : isViolatingPolicy ? (
                      <div className="text-danger extra-small mt-1 fw-semibold d-flex align-items-center gap-1">
                        <AlertCircle size={13} />
                        Exceeds shop maximum discount policy of {maxDiscountPercent}%.
                      </div>
                    ) : (
                      <div className="form-text extra-small text-muted">
                        Floor price protected: Bill cannot be discounted below collective MSP of ₹{paiseToRupees(minCartFloorPaise)}.
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="col-12 col-md-6">
                  <div className="p-3.5 rounded-3 bg-white" style={{ border: '1px solid var(--border-light)' }}>
                    <div className="d-flex justify-content-between py-1.5 small border-bottom" style={{ borderColor: 'var(--border-light)' }}>
                      <span className="text-muted">Subtotal:</span>
                      <span className="font-monospace text-dark fw-semibold">{formatRupees(subtotalPaise)}</span>
                    </div>
                    {discountPaise > 0 && (
                      <div className="d-flex justify-content-between py-1.5 small border-bottom text-danger" style={{ borderColor: 'var(--border-light)' }}>
                        <span>Discount Applied:</span>
                        <span className="font-monospace">- {formatRupees(discountPaise)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center py-2.5 mt-2 px-3 rounded" style={{ background: 'var(--accent-soft)', border: '2px solid var(--accent)' }}>
                      <span className="text-dark fw-bold fs-6">Grand Total:</span>
                      <span className="text-dark fw-bold font-monospace fs-4">{formatRupees(grandTotalPaise)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="d-flex justify-content-between align-items-center pt-3 border-top" style={{ borderColor: 'var(--border-light)' }}>
                <button className="btn btn-outline-dark-custom" onClick={() => setStep(2)} disabled={submitting}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  className="btn btn-accent px-4 py-2.5 d-flex align-items-center gap-2 fw-bold"
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
                      <CheckCircle2 size={18} /> Confirm Sale & Generate Receipt
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
            <div className="card-clean p-4 p-md-5 text-center bg-white shadow-lg">
              <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ background: 'var(--accent-soft)', color: '#16A34A', border: '2px solid var(--accent)' }}>
                <CheckCircle2 size={48} />
              </div>

              <h3 className="fw-bold mb-1 text-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>Sale Completed Successfully!</h3>
              <p className="text-muted small mb-4">
                Invoice <strong className="font-monospace text-dark">{completedSale.invoiceNo}</strong> committed to database.
                Stock was reduced transactionally.
              </p>

              {/* Summary Card */}
              <div className="p-4 text-start mb-4 rounded-3" style={{ maxWidth: '520px', margin: '0 auto', background: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                <div className="d-flex justify-content-between py-1 border-bottom small" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-muted">Customer:</span>
                  <span className="text-dark fw-bold">{completedSale.customerSnapshot.name}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-muted">Phone:</span>
                  <span className="text-dark font-monospace">{completedSale.customerSnapshot.phone}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-muted">Date & Time:</span>
                  <span className="text-dark">{formatIST(completedSale.createdAt)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-muted">Payment:</span>
                  <span className="badge-pill-yellow font-monospace">{completedSale.paymentMode}</span>
                </div>
                <div className="d-flex justify-content-between py-2 mt-2 px-2 rounded" style={{ background: 'var(--accent-soft)' }}>
                  <span className="text-dark fw-bold fs-6">Grand Total:</span>
                  <span className="text-dark fw-bold font-monospace fs-5">{formatRupees(completedSale.totalPaise)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                <button
                  className="btn btn-outline-dark-custom d-flex align-items-center gap-1.5"
                  onClick={() => setShowReceiptModal(true)}
                >
                  <Printer size={16} /> View & Print Receipt
                </button>
                <a
                  href={`/api/sales/${completedSale._id}/receipt.pdf`}
                  download={`Invoice_${completedSale.invoiceNo}.pdf`}
                  className="btn btn-accent d-flex align-items-center gap-1.5"
                >
                  <Download size={16} /> Download Receipt (PDF)
                </a>
                <button
                  className="btn btn-dark-solid d-flex align-items-center gap-1.5"
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
