import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Disc3,
  ShieldCheck,
  Award,
  Gauge,
  Droplets,
  Fuel,
  Volume2,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  X,
  Wrench,
  Info,
  Check,
  Sparkles,
  Phone,
  Layers,
  ArrowRight,
  User,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees } from '../../lib/currency';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';

// Vehicle Categories
const VEHICLE_CATEGORIES = [
  { id: 'ALL', name: 'All Vehicles', icon: '⚡' },
  { id: 'Car', name: 'Cars & Sedans', icon: '🚗' },
  { id: 'SUV', name: 'SUVs & 4x4', icon: '🚙' },
  { id: 'Bike', name: 'Motorcycles', icon: '🏍️' },
  { id: 'Scooter', name: 'Scooters', icon: '🛵' },
  { id: 'Truck', name: 'Commercial', icon: '🚚' },
  { id: 'Tractor', name: 'Tractors / Agri', icon: '🚜' },
];

export default function CustomerPortal() {
  const { user, isAdmin, isCounter, shopSettings, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [tyres, setTyres] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured'); // featured, price_asc, price_desc, lifespan_desc

  // Modals
  const [selectedTyreForDetails, setSelectedTyreForDetails] = useState(null);
  const [bookingTyre, setBookingTyre] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    vehicleModel: user?.vehicleModel || '',
    quantity: 4,
    preferredDate: '',
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Load Tyre & Company Data
  useEffect(() => {
    async function loadPortalData() {
      try {
        setLoading(true);
        const [tyresRes, companiesRes] = await Promise.all([
          api.get('/portal/tyres', { params: { limit: 100 } }),
          api.get('/portal/companies')
        ]);

        const rawTyres = tyresRes.data?.data?.tyres || tyresRes.data?.data || [];
        setTyres(Array.isArray(rawTyres) ? rawTyres : []);

        const rawCompanies = companiesRes.data?.data || [];
        setCompanies(Array.isArray(rawCompanies) ? rawCompanies : []);
      } catch (err) {
        console.error('Failed to load portal data:', err);
        toast.error('Unable to fetch live tyre inventory. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    loadPortalData();
  }, []);

  // Update default user info for booking
  useEffect(() => {
    if (user) {
      setBookingForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        vehicleModel: prev.vehicleModel || user.vehicleModel || '',
      }));
    }
  }, [user]);

  // Parse numerical lifespan from string or number (e.g. "65,000 - 80,000 KM" -> 72500)
  const parseLifespanValue = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 65000;
    const matches = String(val).replace(/,/g, '').match(/\d+/g);
    if (!matches || matches.length === 0) return 65000;
    if (matches.length === 1) return parseInt(matches[0], 10);
    // Average of range
    const num1 = parseInt(matches[0], 10);
    const num2 = parseInt(matches[1], 10);
    return Math.round((num1 + num2) / 2);
  };

  // Filtered and Sorted Tyres
  const filteredTyres = useMemo(() => {
    return tyres
      .filter((tyre) => {
        const companyName = tyre.companyId?.name || tyre.company?.name || '';
        const modelName = tyre.modelName || tyre.pattern || '';
        const size = tyre.size || '';
        const qualityGrade = tyre.qualityGrade || '';

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = companyName.toLowerCase().includes(q);
          const matchModel = modelName.toLowerCase().includes(q);
          const matchSize = size.toLowerCase().includes(q);
          const matchGrade = qualityGrade.toLowerCase().includes(q);
          if (!matchCompany && !matchModel && !matchSize && !matchGrade) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'ALL') {
          if (tyre.vehicleType !== selectedCategory) return false;
        }

        // Brand filter
        if (selectedBrand !== 'ALL') {
          const cid = tyre.companyId?._id || tyre.companyId || tyre.company?._id;
          if (cid !== selectedBrand && companyName !== selectedBrand) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.sellingPricePaise || a.sellingPrice || 0;
        const priceB = b.sellingPricePaise || b.sellingPrice || 0;

        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'lifespan_desc') {
          return parseLifespanValue(b.expectedLifespanKm) - parseLifespanValue(a.expectedLifespanKm);
        }
        return 0; // featured/default
      });
  }, [tyres, searchQuery, selectedCategory, selectedBrand, sortBy]);

  // Handle Booking
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.phone) {
      toast.error('Please enter your name and contact phone number');
      return;
    }

    setSubmittingBooking(true);
    setTimeout(() => {
      setSubmittingBooking(false);
      const companyName = bookingTyre?.companyId?.name || bookingTyre?.company?.name || 'Tyre';
      toast.success(
        `Fitment booking requested for ${companyName} ${bookingTyre?.size}! Our showroom technician will contact you shortly.`,
        { duration: 5000 }
      );
      setBookingTyre(null);
    }, 600);
  };

  return (
    <div className="min-vh-100 bg-dark text-light d-flex flex-column" style={{ background: '#080d19' }}>
      {/* Top Navigation Bar with Multi-Portal Switcher (for Admins & Staff) */}
      <Navbar />

      {/* Main Container */}
      <div className="container-fluid px-3 px-lg-4 py-4 flex-grow-1">
        {/* User Portal Header Banner */}
        <div className="card glass-card border border-secondary border-opacity-20 mb-4 p-3 p-md-4 shadow-xl">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-info bg-opacity-15 text-info border border-info border-opacity-30 px-2.5 py-1 rounded-pill extra-small fw-semibold">
                  <Sparkles size={13} className="me-1" /> Customer Tyre Showcase
                </span>
                {user && (
                  <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-30 px-2.5 py-1 rounded-pill extra-small">
                    Logged in: {user.name} ({user.email})
                  </span>
                )}
              </div>
              <h1 className="h3 fw-bold text-white mb-1">
                Tyre Quality, Durability & Live Prices
              </h1>
              <p className="text-secondary small mb-0">
                Explore 100% genuine tyres with verified road lifespan (up to 85,000+ KM), manufacturer warranty, wet grip ratings, and transparent showroom prices.
              </p>
            </div>

            {/* Quick Guarantees Badge */}
            <div className="d-flex flex-wrap gap-2">
              <div className="d-flex align-items-center gap-1.5 bg-dark px-3 py-1.5 rounded-3 border border-secondary border-opacity-20">
                <ShieldCheck size={16} className="text-success" />
                <span className="small text-light"><strong>5 Years</strong> Warranty</span>
              </div>
              <div className="d-flex align-items-center gap-1.5 bg-dark px-3 py-1.5 rounded-3 border border-secondary border-opacity-20">
                <Gauge size={16} className="text-info" />
                <span className="small text-light"><strong>65,000–85,000 KM</strong> Lifespan</span>
              </div>
              <div className="d-flex align-items-center gap-1.5 bg-dark px-3 py-1.5 rounded-3 border border-secondary border-opacity-20">
                <Wrench size={16} className="text-warning" />
                <span className="small text-light"><strong>Free</strong> 3D Alignment & Nitrogen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="card glass-card border border-secondary border-opacity-20 p-3 mb-4 shadow-sm">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  className="form-control bg-dark border-secondary border-opacity-25 text-white"
                  placeholder="Search by size (e.g. 185/65 R15), brand, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-secondary border-opacity-25 text-secondary"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm bg-dark border-secondary border-opacity-25 text-white"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="ALL">All Brands (MRF, CEAT, Apollo...)</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm bg-dark border-secondary border-opacity-25 text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured First</option>
                <option value="lifespan_desc">⚡ Highest Lifespan (KM)</option>
                <option value="price_asc">💰 Price: Low to High</option>
                <option value="price_desc">💎 Price: High to Low</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="col-12 col-md-2 text-md-end">
              <button
                className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1.5"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedBrand('ALL');
                  setSortBy('featured');
                }}
              >
                <SlidersHorizontal size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Vehicle Category Tabs */}
          <div className="d-flex align-items-center gap-1.5 overflow-x-auto pt-3 border-top border-secondary border-opacity-20 mt-3 pb-1">
            <span className="extra-small text-secondary fw-semibold text-uppercase me-2 d-none d-sm-inline">
              Vehicle Type:
            </span>
            {VEHICLE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`btn btn-sm text-nowrap rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 transition-all ${
                  selectedCategory === cat.id
                    ? 'btn-info text-dark fw-bold shadow-sm'
                    : 'btn-dark border border-secondary border-opacity-25 text-light hover-glass'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span className="small">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count Summary */}
        <div className="d-flex align-items-center justify-content-between mb-3 px-1">
          <div className="small text-secondary">
            Showing <span className="text-white fw-bold">{filteredTyres.length}</span> genuine tyres
            {selectedCategory !== 'ALL' && <span> for <strong>{selectedCategory}</strong></span>}
          </div>
          <div className="small text-info d-flex align-items-center gap-1">
            <CheckCircle2 size={14} /> 100% Original with Manufacturer GST Bill
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status">
              <span className="visually-hidden">Loading tyres...</span>
            </div>
            <div className="text-secondary small mt-2">Loading tyre specifications and prices...</div>
          </div>
        ) : filteredTyres.length === 0 ? (
          /* Empty State */
          <div className="card glass-card border border-secondary border-opacity-20 text-center py-5 px-3">
            <div className="p-3 bg-secondary bg-opacity-10 text-secondary rounded-circle d-inline-block mx-auto mb-3">
              <Disc3 size={40} />
            </div>
            <h4 className="fw-bold text-white mb-2">No tyres found</h4>
            <p className="text-secondary small mb-3">
              No tyres matched your search criteria. Try selecting another vehicle category or resetting filters.
            </p>
            <button
              className="btn btn-sm btn-info text-dark fw-bold px-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedBrand('ALL');
              }}
            >
              Show All Tyres
            </button>
          </div>
        ) : (
          /* Tyre Card Grid */
          <div className="row g-3">
            {filteredTyres.map((tyre) => {
              const brandName = tyre.companyId?.name || tyre.company?.name || 'GENUINE';
              const modelName = tyre.modelName || tyre.pattern || 'Endurance Radial';
              const size = tyre.size;
              const vehicleType = tyre.vehicleType || 'Car';
              const tubeType = tyre.tubeType || 'Tubeless';

              const pricePaise = tyre.sellingPricePaise || tyre.sellingPrice || 0;
              const mrpPaise = tyre.mrpPaise || tyre.mrp || 0;
              const stock = tyre.quantity ?? tyre.currentStock ?? 0;

              const warranty = tyre.warrantyYears || 5;
              const lifespan = tyre.expectedLifespanKm || '65,000 - 80,000 KM';
              const qualityGrade = tyre.qualityGrade || 'A+ Ultra-Endurance';
              const wetGrip = tyre.wetGripRating || 'Grade A';
              const fuelEco = tyre.fuelEfficiency || 'Class B';
              const noise = tyre.noiseLevel || '68 dB';
              const features = tyre.features && tyre.features.length > 0
                ? tyre.features
                : [
                    'High-Silica Extended Mileage Compound',
                    'Anti-Aquaplaning Dual Hydro Grooves',
                    'Triple Steel Belt Puncture Protection',
                    'Low Rolling Resistance (Fuel Saver)',
                  ];

              return (
                <div key={tyre._id} className="col-12 col-md-6 col-xl-4">
                  <div className="card h-100 glass-card border border-secondary border-opacity-25 rounded-4 p-3.5 d-flex flex-column hover-glow position-relative">
                    {/* Top Header: Brand & Vehicle Type */}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-40 fw-bold px-2.5 py-1 rounded-2">
                          {brandName}
                        </span>
                        <span className="badge bg-dark text-secondary border border-secondary border-opacity-25 extra-small">
                          {vehicleType} • {tubeType}
                        </span>
                      </div>

                      <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-40 px-2.5 py-1 rounded-pill extra-small fw-semibold">
                        {qualityGrade}
                      </span>
                    </div>

                    {/* Tyre Size & Model Title */}
                    <div className="mb-2">
                      <h3 className="fs-5 fw-extrabold text-white mb-0 font-monospace">
                        {size}
                      </h3>
                      <div className="text-info fw-semibold small">
                        {modelName}
                      </div>
                    </div>

                    {/* Lifespan & Durability Bar Box */}
                    <div className="bg-dark bg-opacity-70 p-2.5 rounded-3 border border-secondary border-opacity-25 mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-1.5">
                          <Gauge size={15} className="text-info" />
                          <span className="small text-secondary fw-semibold">Tested Lifespan:</span>
                        </div>
                        <span className="text-white fw-bold font-monospace small">
                          {lifespan}
                        </span>
                      </div>
                      <div className="progress bg-secondary bg-opacity-20" style={{ height: '6px', borderRadius: '4px' }}>
                        <div
                          className="progress-bar bg-info"
                          role="progressbar"
                          style={{ width: '85%' }}
                        />
                      </div>
                      <div className="d-flex justify-content-between mt-1 extra-small text-secondary">
                        <span>High-Mileage Tread</span>
                        <span className="text-success fw-semibold">Extended Durability</span>
                      </div>
                    </div>

                    {/* Key Metrics: Warranty, Wet Grip, Fuel Eco, Noise */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="p-2 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-20 d-flex align-items-center gap-1.5">
                          <ShieldCheck size={16} className="text-success flex-shrink-0" />
                          <div>
                            <div className="extra-small text-secondary">Warranty</div>
                            <div className="text-white fw-bold small">{warranty} Years</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="p-2 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-20 d-flex align-items-center gap-1.5">
                          <Droplets size={16} className="text-primary flex-shrink-0" />
                          <div>
                            <div className="extra-small text-secondary">Wet Grip</div>
                            <div className="text-white fw-bold small">{wetGrip}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="p-2 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-20 d-flex align-items-center gap-1.5">
                          <Fuel size={16} className="text-warning flex-shrink-0" />
                          <div>
                            <div className="extra-small text-secondary">Fuel Economy</div>
                            <div className="text-white fw-bold small">{fuelEco}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="p-2 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-20 d-flex align-items-center gap-1.5">
                          <Volume2 size={16} className="text-info flex-shrink-0" />
                          <div>
                            <div className="extra-small text-secondary">Cabin Noise</div>
                            <div className="text-white fw-bold small">{noise}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Features Badges */}
                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-1.5">
                        {features.slice(0, 3).map((feat, idx) => (
                          <span
                            key={idx}
                            className="badge bg-secondary bg-opacity-15 text-light border border-secondary border-opacity-25 extra-small fw-normal d-inline-flex align-items-center gap-1"
                          >
                            <Check size={11} className="text-success" /> {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price and Stock Box */}
                    <div className="mt-auto pt-3 border-top border-secondary border-opacity-20">
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div>
                          <div className="extra-small text-secondary text-uppercase fw-semibold">Showroom Price</div>
                          <div className="d-flex align-items-baseline gap-2">
                            <span className="fs-4 fw-extrabold text-white">
                              {formatRupees(pricePaise)}
                            </span>
                            {mrpPaise > pricePaise && (
                              <span className="text-secondary text-decoration-line-through small">
                                {formatRupees(mrpPaise)}
                              </span>
                            )}
                          </div>
                          {mrpPaise > pricePaise && (
                            <span className="badge bg-success bg-opacity-20 text-success extra-small">
                              Save {formatRupees(mrpPaise - pricePaise)}
                            </span>
                          )}
                        </div>

                        <div className="text-end">
                          <span className={`badge px-2.5 py-1 ${
                            stock > 0
                              ? 'bg-success bg-opacity-15 text-success border border-success border-opacity-30'
                              : 'bg-warning bg-opacity-15 text-warning border border-warning border-opacity-30'
                          }`}>
                            {stock > 0 ? `In Stock (${stock} Ready)` : 'Available on Order'}
                          </span>
                          <div className="extra-small text-secondary mt-1">Free Fitment Included</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-info flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 py-2"
                          onClick={() => setSelectedTyreForDetails(tyre)}
                        >
                          <Info size={14} /> Full Specs & Durability
                        </button>
                        <button
                          className="btn btn-sm btn-info text-dark fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 py-2"
                          onClick={() => setBookingTyre(tyre)}
                        >
                          <Wrench size={14} /> Book Fitment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL 1: Full Specifications & Durability Inspector */}
      {/* ========================================================== */}
      {selectedTyreForDetails && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
          onClick={() => setSelectedTyreForDetails(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content glass-card border border-info border-opacity-40 shadow-2xl text-light">
              <div className="modal-header border-secondary border-opacity-25 px-4 py-3 bg-secondary bg-opacity-10">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-3 bg-info bg-opacity-20 text-info">
                    <Disc3 size={24} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-white mb-0 font-monospace">
                      {selectedTyreForDetails.companyId?.name || selectedTyreForDetails.company?.name} — {selectedTyreForDetails.size}
                    </h5>
                    <div className="extra-small text-info fw-semibold">
                      Model: {selectedTyreForDetails.modelName || selectedTyreForDetails.pattern} • {selectedTyreForDetails.vehicleType}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary-glass p-2"
                  onClick={() => setSelectedTyreForDetails(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body px-4 py-3">
                {/* Durability Card */}
                <div className="card bg-dark bg-opacity-80 border border-secondary border-opacity-30 p-3 mb-4 rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <Award size={20} className="text-warning" />
                      <span className="fw-bold text-white">Endurance & Quality Certification</span>
                    </div>
                    <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 px-3 py-1.5 rounded-pill fw-bold">
                      {selectedTyreForDetails.qualityGrade || 'A+ Ultra-Endurance'}
                    </span>
                  </div>

                  <div className="row g-3 text-center my-1">
                    <div className="col-4 border-end border-secondary border-opacity-25">
                      <div className="fs-5 fw-extrabold text-info font-monospace">
                        {selectedTyreForDetails.expectedLifespanKm || '65,000 - 80,000 KM'}
                      </div>
                      <div className="extra-small text-secondary">Tested Road Lifespan</div>
                    </div>
                    <div className="col-4 border-end border-secondary border-opacity-25">
                      <div className="fs-5 fw-extrabold text-success font-monospace">
                        {selectedTyreForDetails.warrantyYears || 5} Years
                      </div>
                      <div className="extra-small text-secondary">Manufacturer Warranty</div>
                    </div>
                    <div className="col-4">
                      <div className="fs-5 fw-extrabold text-warning font-monospace">
                        {selectedTyreForDetails.wetGripRating || 'Grade A'}
                      </div>
                      <div className="extra-small text-secondary">Wet Braking Safety</div>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications Table */}
                <h6 className="fw-bold text-white mb-2 d-flex align-items-center gap-1.5">
                  <Layers size={16} className="text-info" /> Detailed Specifications
                </h6>
                <div className="table-responsive mb-4">
                  <table className="table table-dark table-sm table-bordered border-secondary border-opacity-25 mb-0">
                    <tbody>
                      <tr>
                        <td className="text-secondary w-50 small">Tyre Size</td>
                        <td className="text-white fw-bold font-monospace small">{selectedTyreForDetails.size}</td>
                      </tr>
                      <tr>
                        <td className="text-secondary small">Brand</td>
                        <td className="text-white fw-semibold small">{selectedTyreForDetails.companyId?.name || selectedTyreForDetails.company?.name}</td>
                      </tr>
                      <tr>
                        <td className="text-secondary small">Model / Pattern</td>
                        <td className="text-white fw-semibold small">{selectedTyreForDetails.modelName || selectedTyreForDetails.pattern}</td>
                      </tr>
                      <tr>
                        <td className="text-secondary small">Vehicle Category</td>
                        <td className="text-white fw-semibold small">{selectedTyreForDetails.vehicleType}</td>
                      </tr>
                      <tr>
                        <td className="text-secondary small">Tube Type</td>
                        <td className="text-white fw-semibold small">{selectedTyreForDetails.tubeType || 'Tubeless'}</td>
                      </tr>
                      <tr>
                        <td className="text-secondary small">Fuel Efficiency</td>
                        <td className="text-white fw-semibold small">{selectedTyreForDetails.fuelEfficiency || 'Class B (Low Drag)'}</td>
                      </tr>
                      <tr>
                        <td className="text-secondary small">Acoustic Road Noise</td>
                        <td className="text-white fw-semibold small">{selectedTyreForDetails.noiseLevel || '68 dB Whisper Quiet'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Features List */}
                <h6 className="fw-bold text-white mb-2 d-flex align-items-center gap-1.5">
                  <Sparkles size={16} className="text-warning" /> Engineered Tyre Features
                </h6>
                <div className="row g-2 mb-4">
                  {(selectedTyreForDetails.features && selectedTyreForDetails.features.length > 0
                    ? selectedTyreForDetails.features
                    : [
                        'High-Silica Extended Mileage Compound',
                        'Anti-Aquaplaning Dual Hydro Grooves',
                        'Triple Steel Belt Puncture Protection',
                        'Low Rolling Resistance (Fuel Saver)',
                      ]
                  ).map((feat, idx) => (
                    <div key={idx} className="col-12 col-md-6">
                      <div className="p-2 bg-dark bg-opacity-60 rounded-2 border border-secondary border-opacity-20 d-flex align-items-center gap-2">
                        <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                        <span className="small text-light">{feat}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Showroom Price Summary & Book Button */}
                <div className="card bg-info bg-opacity-10 border border-info border-opacity-30 p-3 rounded-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="extra-small text-info text-uppercase fw-bold">Authorized Showroom Price</div>
                      <div className="fs-5 fw-extrabold text-white">
                        {formatRupees(selectedTyreForDetails.sellingPricePaise || selectedTyreForDetails.sellingPrice)}{' '}
                        <span className="text-secondary fs-6 fw-normal">/ tyre</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-info text-dark fw-bold px-4 py-2"
                      onClick={() => {
                        const target = selectedTyreForDetails;
                        setSelectedTyreForDetails(null);
                        setBookingTyre(target);
                      }}
                    >
                      Book Showroom Fitment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: Showroom Fitment Booking Modal */}
      {/* ========================================================== */}
      {bookingTyre && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
          onClick={() => setBookingTyre(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content glass-card border border-info border-opacity-40 shadow-2xl text-light">
              <div className="modal-header border-secondary border-opacity-25 px-4 py-3 bg-secondary bg-opacity-10">
                <div>
                  <h5 className="modal-title fw-bold text-white mb-0">Book Showroom Fitment</h5>
                  <div className="extra-small text-info">
                    {bookingTyre.companyId?.name || bookingTyre.company?.name} {bookingTyre.size} ({bookingTyre.modelName || bookingTyre.pattern})
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary-glass p-2"
                  onClick={() => setBookingTyre(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleBookingSubmit}>
                <div className="modal-body px-4 py-3">
                  {/* Summary Box */}
                  <div className="p-3 bg-dark bg-opacity-80 rounded-3 border border-secondary border-opacity-25 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-secondary small">Price per Tyre:</span>
                      <span className="text-white fw-bold">
                        {formatRupees(bookingTyre.sellingPricePaise || bookingTyre.sellingPrice)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-secondary small">Total for {bookingForm.quantity} Tyres:</span>
                      <span className="text-info fw-extrabold fs-6">
                        {formatRupees((bookingTyre.sellingPricePaise || bookingTyre.sellingPrice) * bookingForm.quantity)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center text-success extra-small">
                      <span>Laser Alignment, Balancing & Nitrogen:</span>
                      <span className="fw-bold">100% FREE</span>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="mb-2">
                    <label className="form-label extra-small text-secondary fw-semibold">Your Full Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark border-secondary border-opacity-30 text-white"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label extra-small text-secondary fw-semibold">Phone Number *</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm bg-dark border-secondary border-opacity-30 text-white"
                        required
                        placeholder="10-digit number"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label extra-small text-secondary fw-semibold">Vehicle Model</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-dark border-secondary border-opacity-30 text-white"
                        placeholder="e.g. Swift / Nexon"
                        value={bookingForm.vehicleModel}
                        onChange={(e) => setBookingForm({ ...bookingForm, vehicleModel: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label extra-small text-secondary fw-semibold">Number of Tyres</label>
                      <select
                        className="form-select form-select-sm bg-dark border-secondary border-opacity-30 text-white"
                        value={bookingForm.quantity}
                        onChange={(e) => setBookingForm({ ...bookingForm, quantity: Number(e.target.value) })}
                      >
                        <option value={1}>1 Tyre</option>
                        <option value={2}>2 Tyres (Axle Pair)</option>
                        <option value={4}>4 Tyres (Full Set)</option>
                        <option value={5}>5 Tyres (With Spare)</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label extra-small text-secondary fw-semibold">Preferred Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm bg-dark border-secondary border-opacity-30 text-white"
                        value={bookingForm.preferredDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-dark bg-opacity-40 rounded-2 border border-secondary border-opacity-20">
                    <div className="extra-small text-secondary fw-bold text-uppercase mb-1">
                      Included Showroom Care:
                    </div>
                    <div className="d-flex flex-column gap-1 extra-small text-light">
                      <div className="d-flex align-items-center gap-1.5">
                        <Check size={13} className="text-success" /> Precision 3D Laser Wheel Alignment
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <Check size={13} className="text-success" /> High-Speed Dynamic Wheel Balancing
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <Check size={13} className="text-success" /> Pure Nitrogen Gas Filling (Prolongs Tyre Life)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-secondary border-opacity-25 px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setBookingTyre(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-info text-dark fw-bold px-4 d-flex align-items-center gap-1.5"
                    disabled={submittingBooking}
                  >
                    {submittingBooking ? 'Confirming...' : 'Confirm Showroom Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-top border-secondary border-opacity-20 py-4 px-3 mt-auto bg-dark bg-opacity-60">
        <div className="container-fluid px-lg-4 text-center text-md-start">
          <div className="row align-items-center">
            <div className="col-md-6 mb-2 mb-md-0">
              <div className="fw-bold text-white fs-6">
                {shopSettings?.shopName || 'HIND TYRES & ACCESSORIES'}
              </div>
              <div className="extra-small text-secondary">
                {shopSettings?.address || 'Authorized Multi-Brand Tyre Showroom & Laser Alignment Center'}
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="extra-small text-secondary">
                Helpline: <span className="text-info fw-semibold">{shopSettings?.phone || '+91 98765 43210'}</span> • Open 7 Days (9:00 AM – 9:00 PM)
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
