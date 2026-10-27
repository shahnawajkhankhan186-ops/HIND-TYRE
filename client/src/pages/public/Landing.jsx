import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Disc3,
  ShieldCheck,
  Award,
  Wrench,
  Gauge,
  Phone,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  LogIn,
  LogOut,
  User,
  Menu,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Truck,
  Headphones,
  Calendar,
  X,
  Target,
  Fuel,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  ChevronRight,
  Crosshair,
  Timer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// 8 Real Tyre Brands per strict project requirement
const TOP_BRANDS = [
  { name: 'MRF', color: '#e11d48', style: 'fw-black tracking-wider text-danger' },
  { name: 'Apollo', color: '#7c3aed', style: 'fw-bold text-purple' },
  { name: 'Bridgestone', color: '#0f172a', style: 'fw-extrabold uppercase' },
  { name: 'Michelin', color: '#1d4ed8', style: 'fw-black uppercase text-primary' },
  { name: 'Goodyear', color: '#2563eb', style: 'fw-black uppercase text-info' },
  { name: 'CEAT', color: '#0284c7', style: 'fw-extrabold uppercase text-cyan' },
  { name: 'JK Tyre', color: '#dc2626', style: 'fw-black uppercase text-danger' },
  { name: 'TVS Eurogrip', color: '#059669', style: 'fw-bold text-success' },
];

export default function Landing() {
  const { user, isAdmin, isCounter, shopSettings, logout, refreshSettings } = useAuth();
  const navigate = useNavigate();

  // Freshly fetch settings whenever Landing page mounts
  useEffect(() => {
    refreshSettings();
  }, []);

  // Navigation & Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState('Tyre Fitting');
  const [bookingForm, setBookingForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    vehicleModel: user?.vehicleModel || '',
    service: 'Tyre Fitting',
    preferredDate: '',
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.phone) {
      toast.error('Please enter your name and phone number');
      return;
    }
    setSubmittingBooking(true);
    setTimeout(() => {
      setSubmittingBooking(false);
      setShowBookingModal(false);
      toast.success(
        `Service appointment booked for ${bookingForm.service}! Our technician will call you to confirm.`,
        { duration: 5000 }
      );
    }, 600);
  };

  const openServiceModal = (serviceName) => {
    setSelectedService(serviceName);
    setBookingForm((prev) => ({ ...prev, service: serviceName }));
    setShowBookingModal(true);
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#FFFFFF', color: 'var(--text-on-light)' }}>
      {/* ========================================================== */}
      {/* 1. STICKY WHITE NAVBAR (Exact Mockup Match: Logo + Links + Phone + Sign In) */}
      {/* ========================================================== */}
      <header className="landing-header sticky-top py-2.5 px-3 px-xl-0">
        <div className="container d-flex align-items-center justify-content-between">
          {/* Logo with Detailed Alloy Wheel & Tyre Vector */}
          <Link to="/" className="d-flex align-items-center gap-2.5 text-decoration-none">
            <div className="flex-shrink-0 d-flex align-items-center justify-content-center">
              <svg width="44" height="44" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Tyre Rubber Silhouette */}
                <circle cx="27" cy="27" r="25" fill="#111318" stroke="#0A0A0C" strokeWidth="2" />
                {/* Yellow Tyre Tread Notches */}
                <path d="M27 2 L27 6" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M27 48 L27 52" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M2 27 L6 27" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M48 27 L52 27" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M9 9 L12 12" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M42 42 L45 45" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M42 12 L45 9" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M9 45 L12 42" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Inner Rubber Sidewall */}
                <circle cx="27" cy="27" r="19" stroke="#2A2D34" strokeWidth="2.5" />
                
                {/* Alloy Wheel Rim */}
                <circle cx="27" cy="27" r="14.5" fill="#1A1C21" stroke="#FFC107" strokeWidth="2.2" />
                
                {/* Alloy Rim Twin Spokes */}
                <line x1="27" y1="13" x2="27" y2="21" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="27" y1="33" x2="27" y2="41" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="13" y1="27" x2="21" y2="27" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="33" y1="27" x2="41" y2="27" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="17" y1="17" x2="22.5" y2="22.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="31.5" y1="31.5" x2="37" y2="37" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="37" y1="17" x2="31.5" y2="22.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="17" y1="37" x2="22.5" y2="31.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                
                {/* Center Hub */}
                <circle cx="27" cy="27" r="5" fill="#FFC107" stroke="#0A0A0C" strokeWidth="1.5" />
                <circle cx="27" cy="27" r="2.2" fill="#0A0A0C" />
              </svg>
            </div>
            <div className="d-flex flex-column text-start">
              {(() => {
                const name = (shopSettings?.shopName || 'HIND TYRES & ACCESSORIES').toUpperCase();
                const parts = name.split(' ');
                const firstWord = parts[0] || 'HIND';
                const remaining = parts.slice(1).join(' ') || 'TYRES';
                return (
                  <div className="d-flex align-items-center lh-1">
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: '1.38rem', letterSpacing: '-0.02em', color: '#0A0A0C' }}>
                      {firstWord}
                    </span>
                    <span className="ms-1.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: '1.38rem', letterSpacing: '-0.02em', color: '#FFC107' }}>
                      {remaining}
                    </span>
                  </div>
                );
              })()}
              <div className="text-muted fw-bold mt-1" style={{ fontSize: '0.62rem', letterSpacing: '0.18em', color: '#6B7280' }}>
                DRIVE SAFE · DRIVE FAR
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links (with Yellow Indicator on Active) */}
          <nav className="d-none d-lg-flex align-items-center gap-4">
            <a
              href="#hero"
              className={`landing-nav-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => setActiveSection('home')}
            >
              Home
            </a>
            <a
              href="#vehicle-types"
              className={`landing-nav-link ${activeSection === 'tyres' ? 'active' : ''}`}
              onClick={() => setActiveSection('tyres')}
            >
              Tyres
            </a>
            <a
              href="#services"
              className={`landing-nav-link ${activeSection === 'services' ? 'active' : ''}`}
              onClick={() => setActiveSection('services')}
            >
              Services
            </a>
            <a
              href="#brands"
              className={`landing-nav-link ${activeSection === 'brands' ? 'active' : ''}`}
              onClick={() => setActiveSection('brands')}
            >
              Brands
            </a>
            <a
              href="#about"
              className={`landing-nav-link ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => setActiveSection('about')}
            >
              About
            </a>
            <a
              href="#contact"
              className={`landing-nav-link ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveSection('contact')}
            >
              Contact
            </a>
          </nav>

          {/* Right Action: Phone Chip + Yellow Sign In / Portal button */}
          <div className="d-flex align-items-center gap-2.5">
            {/* Phone Chip (as seen in mockup) */}
            <a
              href={`tel:${(shopSettings?.phone || '+919693734121').replace(/[^0-9+]/g, '')}`}
              className="d-none d-md-flex align-items-center gap-2 landing-phone-pill"
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: '28px', height: '28px', backgroundColor: '#0A0A0C', color: '#FFC107' }}
              >
                <PhoneCall size={14} />
              </div>
              <div className="lh-1 text-start">
                <div className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>
                  {shopSettings?.phone || '+91 9693734121'}
                </div>
                <div className="text-muted fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.04em' }}>
                  Call Now
                </div>
              </div>
            </a>

            {/* Sign In Button (Reference Mockup Style) */}
            {!user ? (
              <Link
                to="/login"
                className="landing-signin-btn"
              >
                <User size={16} strokeWidth={2.5} />
                <span>Sign In</span>
              </Link>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <button
                  className="landing-signin-btn"
                  onClick={() => {
                    if (isAdmin) navigate('/admin/dashboard');
                    else navigate('/counter/new-sale');
                  }}
                >
                  <UserCheck size={16} strokeWidth={2.5} />
                  <span>
                    {isAdmin ? 'Admin Portal' : 'Counter POS'}
                  </span>
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-circle p-1.5 d-flex align-items-center justify-content-center"
                  onClick={logout}
                  title="Sign Out"
                  style={{ width: '36px', height: '36px', borderColor: 'var(--border-light)' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              className="btn d-lg-none p-1.5 border-0 text-dark ms-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="d-lg-none bg-white border-top px-3 py-3 shadow-sm animate-fade-in mt-2" style={{ borderColor: 'var(--border-light)' }}>
            <div className="d-flex flex-column gap-2 pb-3 border-bottom" style={{ borderColor: 'var(--border-light)' }}>
              <a
                href="#hero"
                className={`py-1.5 text-decoration-none ${activeSection === 'home' ? 'text-dark fw-bold' : 'text-secondary fw-semibold'}`}
                onClick={() => {
                  setActiveSection('home');
                  setMobileMenuOpen(false);
                }}
              >
                Home
              </a>
              <a
                href="#vehicle-types"
                className="text-secondary fw-semibold py-1.5 text-decoration-none"
                onClick={() => {
                  setActiveSection('tyres');
                  setMobileMenuOpen(false);
                }}
              >
                Tyres
              </a>
              <a
                href="#services"
                className="text-secondary fw-semibold py-1.5 text-decoration-none"
                onClick={() => {
                  setActiveSection('services');
                  setMobileMenuOpen(false);
                }}
              >
                Services
              </a>
              <a
                href="#brands"
                className="text-secondary fw-semibold py-1.5 text-decoration-none"
                onClick={() => {
                  setActiveSection('brands');
                  setMobileMenuOpen(false);
                }}
              >
                Brands
              </a>
              <a
                href="#about"
                className="text-secondary fw-semibold py-1.5 text-decoration-none"
                onClick={() => {
                  setActiveSection('about');
                  setMobileMenuOpen(false);
                }}
              >
                About Us
              </a>
              <a
                href="#contact"
                className="text-secondary fw-semibold py-1.5 text-decoration-none"
                onClick={() => {
                  setActiveSection('contact');
                  setMobileMenuOpen(false);
                }}
              >
                Contact
              </a>
            </div>

            {/* Mobile Call Now & Quick Sign In */}
            <div className="pt-3 d-flex flex-column gap-2">
              <a
                href={`tel:${(shopSettings?.phone || '+919693734121').replace(/[^0-9+]/g, '')}`}
                className="d-flex align-items-center justify-content-center gap-2 py-2 px-3 rounded-pill bg-light text-dark fw-bold text-decoration-none"
              >
                <PhoneCall size={15} className="text-warning" />
                <span>Call: {shopSettings?.phone || '+91 9693734121'}</span>
              </a>
              {!user ? (
                <Link
                  to="/login"
                  className="landing-signin-btn w-100 justify-content-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={16} strokeWidth={2.5} />
                  <span>Sign In</span>
                </Link>
              ) : (
                <button
                  className="landing-signin-btn w-100 justify-content-center"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (isAdmin) navigate('/admin/dashboard');
                    else navigate('/counter/new-sale');
                  }}
                >
                  <UserCheck size={16} strokeWidth={2.5} />
                  <span>
                    {isAdmin ? 'Admin Portal' : 'Counter POS'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================== */}
      {/* 2. HERO SECTION (Dark full-width with tyre workshop background) */}
      {/* ========================================================== */}
      <section
        id="hero"
        className="position-relative text-white py-5 py-lg-6"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 10, 12, 0.95) 0%, rgba(10, 10, 12, 0.85) 45%, rgba(10, 10, 12, 0.35) 100%), url('/images/hero_tyre_workshop.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: 'var(--bg-black)',
          minHeight: '520px',
        }}
      >
        <div className="container py-4">
          <div className="row align-items-center">
            <div className="col-12 col-lg-7">
              {/* Eyebrow */}
              <div className="hero-eyebrow text-light mb-2 opacity-90">
                PREMIUM TYRES FOR A
              </div>

              {/* Big Italic Headline with yellow keyword */}
              <h1 className="hero-headline display-3 mb-3 text-white">
                SAFER<br />
                <span style={{ color: 'var(--accent)' }}>SMOOTHER</span><br />
                JOURNEY
              </h1>

              {/* Subline */}
              <p className="fs-5 text-light fw-medium mb-4 opacity-90">
                Top Brands &nbsp;|&nbsp; Best Prices &nbsp;|&nbsp; Expert Fitting
              </p>

              {/* Two buttons */}
              <div className="d-flex flex-wrap align-items-center gap-3 mb-5">
                <a
                  href="#vehicle-types"
                  className="btn-accent px-4 py-2.5 rounded-3 fw-bold shadow-lg"
                  style={{ fontSize: '0.95rem' }}
                >
                  <span>Explore Tyres</span>
                  <ArrowRight size={17} />
                </a>

                <button
                  className="btn-outline-light-custom px-4 py-2.5 rounded-3"
                  style={{ fontSize: '0.95rem' }}
                  onClick={() => openServiceModal('Tyre Fitting')}
                >
                  <Calendar size={17} />
                  <span>Book Service</span>
                </button>
              </div>

              {/* Trust Strip (5 yellow outline icons + white text) */}
              <div className="row g-3 pt-3 border-top" style={{ borderColor: 'var(--border-dark)' }}>
                <div className="col-6 col-sm-auto d-flex align-items-center gap-2">
                  <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
                  <div className="lh-1">
                    <div className="fw-bold small text-white">100% Genuine</div>
                    <div className="extra-small text-muted" style={{ fontSize: '0.65rem' }}>Tyres</div>
                  </div>
                </div>

                <div className="col-6 col-sm-auto d-flex align-items-center gap-2">
                  <Truck size={20} style={{ color: 'var(--accent)' }} />
                  <div className="lh-1">
                    <div className="fw-bold small text-white">Wide Range</div>
                    <div className="extra-small text-muted" style={{ fontSize: '0.65rem' }}>of Brands</div>
                  </div>
                </div>

                <div className="col-6 col-sm-auto d-flex align-items-center gap-2">
                  <Wrench size={20} style={{ color: 'var(--accent)' }} />
                  <div className="lh-1">
                    <div className="fw-bold small text-white">Professional</div>
                    <div className="extra-small text-muted" style={{ fontSize: '0.65rem' }}>Fitting</div>
                  </div>
                </div>

                <div className="col-6 col-sm-auto d-flex align-items-center gap-2">
                  <span className="fw-bold fs-5 lh-1" style={{ color: 'var(--accent)' }}>₹</span>
                  <div className="lh-1">
                    <div className="fw-bold small text-white">Best Prices</div>
                    <div className="extra-small text-muted" style={{ fontSize: '0.65rem' }}>Guaranteed</div>
                  </div>
                </div>

                <div className="col-6 col-sm-auto d-flex align-items-center gap-2">
                  <Headphones size={20} style={{ color: 'var(--accent)' }} />
                  <div className="lh-1">
                    <div className="fw-bold small text-white">Expert</div>
                    <div className="extra-small text-muted" style={{ fontSize: '0.65rem' }}>Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 3. SHOP BY VEHICLE TYPE (Light Background) */}
      {/* ========================================================== */}
      <section id="vehicle-types" className="py-5" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div className="container">
          <div className="d-flex align-items-end justify-content-between mb-4">
            <div>
              <h2 className="fw-black text-dark mb-1" style={{ letterSpacing: '-0.01em' }}>
                Shop By Vehicle Type
              </h2>
              <p className="text-muted mb-0">Find the perfect tyres for your ride</p>
            </div>
            <a href="#brands" className="text-link-blue d-flex align-items-center gap-1">
              <span>View Brands</span>
              <ArrowRight size={15} />
            </a>
          </div>

          <div className="row g-3">
            {/* 1. Car Tyres */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card-clean h-100 overflow-hidden cursor-pointer hover-lift"
                onClick={() => {
                  setBookingForm((prev) => ({ ...prev, vehicleModel: 'Car' }));
                  openServiceModal('Tyre Fitting');
                }}
              >
                <div style={{ height: '175px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                  <img
                    src="/images/car_tyres_card.jpg"
                    alt="Car Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="fw-bold text-dark mb-0 fs-6">Car Tyres</h5>
                    <div className="text-muted extra-small">Hatchback | Sedan | SUV</div>
                  </div>
                  <div className="btn-round-arrow">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Bike Tyres */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card-clean h-100 overflow-hidden cursor-pointer hover-lift"
                onClick={() => {
                  setBookingForm((prev) => ({ ...prev, vehicleModel: 'Bike / Two Wheeler' }));
                  openServiceModal('Tyre Fitting');
                }}
              >
                <div style={{ height: '175px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                  <img
                    src="/images/bike_tyres_card.jpg"
                    alt="Bike Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="fw-bold text-dark mb-0 fs-6">Bike Tyres</h5>
                    <div className="text-muted extra-small">Commuter | Sports | Cruiser</div>
                  </div>
                  <div className="btn-round-arrow">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SUV Tyres */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card-clean h-100 overflow-hidden cursor-pointer hover-lift"
                onClick={() => {
                  setBookingForm((prev) => ({ ...prev, vehicleModel: 'SUV' }));
                  openServiceModal('Tyre Fitting');
                }}
              >
                <div style={{ height: '175px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                  <img
                    src="/images/suv_tyres_card.jpg"
                    alt="SUV Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="fw-bold text-dark mb-0 fs-6">SUV Tyres</h5>
                    <div className="text-muted extra-small">On-Road | Off-Road</div>
                  </div>
                  <div className="btn-round-arrow">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Commercial Tyres (Truck / Tractor / Auto) */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card-clean h-100 overflow-hidden cursor-pointer hover-lift"
                onClick={() => {
                  setBookingForm((prev) => ({ ...prev, vehicleModel: 'Commercial / Truck' }));
                  openServiceModal('Tyre Fitting');
                }}
              >
                <div style={{ height: '175px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                  <img
                    src="/images/commercial_tyres_card.jpg"
                    alt="Commercial Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="fw-bold text-dark mb-0 fs-6">Commercial Tyres</h5>
                    <div className="text-muted extra-small">Truck | Tractor | Fleet</div>
                  </div>
                  <div className="btn-round-arrow">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 4. OUR SERVICES (Dark Section #0A0A0C) */}
      {/* ========================================================== */}
      <section id="services" className="py-5" style={{ backgroundColor: 'var(--bg-black)', color: '#FFFFFF' }}>
        <div className="container">
          <div className="mb-4">
            <h2 className="fw-black text-white mb-1" style={{ letterSpacing: '-0.01em' }}>
              Our Services
            </h2>
            <p className="text-muted mb-0">
              More than just tyres – complete care for your vehicle
            </p>
          </div>

          <div className="row g-3">
            {/* 1. Tyre Fitting */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card-dark overflow-hidden h-100 cursor-pointer shadow-lg"
                onClick={() => openServiceModal('Tyre Fitting')}
              >
                <div style={{ height: '160px', overflow: 'hidden' }}>
                  <img
                    src="/images/service_tyre_fitting.jpg"
                    alt="Tyre Fitting"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', color: 'var(--accent)' }}
                  >
                    <Wrench size={22} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-white mb-0">Tyre Fitting</h6>
                    <div className="extra-small text-muted">Quick & Professional</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Wheel Balancing */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card-dark overflow-hidden h-100 cursor-pointer shadow-lg"
                onClick={() => openServiceModal('Wheel Balancing')}
              >
                <div style={{ height: '160px', overflow: 'hidden' }}>
                  <img
                    src="/images/service_wheel_balancing.jpg"
                    alt="Wheel Balancing"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', color: 'var(--accent)' }}
                  >
                    <Disc3 size={22} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-white mb-0">Wheel Balancing</h6>
                    <div className="extra-small text-muted">Smooth & Stable Ride</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Wheel Alignment */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card-dark overflow-hidden h-100 cursor-pointer shadow-lg"
                onClick={() => openServiceModal('Wheel Alignment')}
              >
                <div style={{ height: '160px', overflow: 'hidden' }}>
                  <img
                    src="/images/service_wheel_alignment.jpg"
                    alt="Wheel Alignment"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', color: 'var(--accent)' }}
                  >
                    <Crosshair size={22} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-white mb-0">Wheel Alignment</h6>
                    <div className="extra-small text-muted">Better Control & Longer Life</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Puncture Repair */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card-dark overflow-hidden h-100 cursor-pointer shadow-lg"
                onClick={() => openServiceModal('Puncture Repair')}
              >
                <div style={{ height: '160px', overflow: 'hidden' }}>
                  <img
                    src="/images/service_puncture_repair.jpg"
                    alt="Puncture Repair"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-3 d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', color: 'var(--accent)' }}
                  >
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-white mb-0">Puncture Repair</h6>
                    <div className="extra-small text-muted">Fast & Reliable</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 5. TOP TYRE BRANDS (White Section) */}
      {/* ========================================================== */}
      <section id="brands" className="py-5 bg-white border-bottom" style={{ borderColor: 'var(--border-light)' }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="fw-black text-dark mb-1" style={{ letterSpacing: '-0.01em' }}>
              Top Tyre Brands
            </h2>
            <p className="text-muted mb-0">Choose from the most trusted brands</p>
          </div>

          <div className="row g-2 justify-content-center align-items-center text-center">
            {TOP_BRANDS.map((b) => (
              <div key={b.name} className="col-6 col-sm-4 col-md-3 col-lg">
                <div
                  className="card-clean p-3 bg-white h-100 d-flex align-items-center justify-content-center hover-lift cursor-pointer"
                  onClick={() => {
                    setBookingForm((prev) => ({ ...prev, vehicleModel: `${b.name} Tyres` }));
                    openServiceModal('Tyre Fitting');
                  }}
                  style={{ minHeight: '68px' }}
                >
                  <span className={`fs-5 ${b.style}`} style={{ letterSpacing: '0.04em' }}>
                    {b.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 6. YELLOW CTA BANNER */}
      {/* ========================================================== */}
      <section className="position-relative overflow-hidden" style={{ backgroundColor: 'var(--bg-black)' }}>
        <div className="row g-0 align-items-stretch">
          {/* Left Yellow Slice */}
          <div
            className="col-12 col-lg-5 p-4 p-md-5 d-flex flex-column justify-content-center text-dark"
            style={{
              backgroundColor: 'var(--accent)',
              clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)',
              zIndex: 2,
            }}
          >
            <h2 className="display-6 fw-black mb-2 text-dark" style={{ letterSpacing: '-0.02em' }}>
              Get the Best Deals on Premium Tyres
            </h2>
            <p className="fw-medium text-dark mb-4" style={{ opacity: 0.9 }}>
              Drive with confidence. Quality tyres at unbeatable prices.
            </p>
            <div>
              <a
                href="#brands"
                className="btn-dark-solid px-4 py-2.5 rounded-3 shadow"
                style={{ fontSize: '0.95rem' }}
              >
                <span>View Brands</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Right Highway Tyre Photo & Benefits Box */}
          <div
            className="col-12 col-lg-7 position-relative d-flex align-items-center justify-content-end p-4 p-md-5"
            style={{
              backgroundImage: `url('/images/highway_tyre_promo.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '260px',
            }}
          >
            <div
              className="p-3.5 rounded-4 d-flex flex-column gap-3 text-white shadow-2xl"
              style={{
                backgroundColor: 'rgba(10, 10, 12, 0.88)',
                backdropFilter: 'blur(10px)',
                minWidth: '220px',
                border: '1px solid var(--border-dark)',
              }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <Timer size={20} style={{ color: 'var(--accent)' }} />
                <span className="fw-bold small">Longer Life</span>
              </div>
              <div className="d-flex align-items-center gap-2.5">
                <Target size={20} style={{ color: 'var(--accent)' }} />
                <span className="fw-bold small">Better Grip</span>
              </div>
              <div className="d-flex align-items-center gap-2.5">
                <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
                <span className="fw-bold small">Enhanced Safety</span>
              </div>
              <div className="d-flex align-items-center gap-2.5">
                <Fuel size={20} style={{ color: 'var(--accent)' }} />
                <span className="fw-bold small">Fuel Efficiency</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 7. DARK FOOTER */}
      {/* ========================================================== */}
      <footer id="contact" className="py-5" style={{ backgroundColor: 'var(--bg-black)', color: 'var(--text-on-dark-muted)' }}>
        <div className="container">
          <div className="row g-4">
            {/* Column 1: Brand Info */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="d-flex align-items-center gap-2.5 mb-3">
                <div className="flex-shrink-0 d-flex align-items-center justify-content-center">
                  <svg width="38" height="38" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="27" cy="27" r="25" fill="#111318" stroke="#2A2D34" strokeWidth="2" />
                    <path d="M27 2 L27 6" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M27 48 L27 52" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M2 27 L6 27" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M48 27 L52 27" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="27" cy="27" r="19" stroke="#2A2D34" strokeWidth="2.5" />
                    <circle cx="27" cy="27" r="14.5" fill="#1A1C21" stroke="#FFC107" strokeWidth="2.2" />
                    <line x1="27" y1="13" x2="27" y2="21" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="27" y1="33" x2="27" y2="41" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="13" y1="27" x2="21" y2="27" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="33" y1="27" x2="41" y2="27" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="27" cy="27" r="5" fill="#FFC107" stroke="#0A0A0C" strokeWidth="1.5" />
                    <circle cx="27" cy="27" r="2.2" fill="#0A0A0C" />
                  </svg>
                </div>
                <div className="d-flex flex-column text-start">
                  {(() => {
                    const name = (shopSettings?.shopName || 'HIND TYRES & ACCESSORIES').toUpperCase();
                    const parts = name.split(' ');
                    const firstWord = parts[0] || 'HIND';
                    const remaining = parts.slice(1).join(' ') || 'TYRES';
                    return (
                      <div className="d-flex align-items-center lh-1">
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                          {firstWord}
                        </span>
                        <span className="ms-1.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#FFC107' }}>
                          {remaining}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="extra-small text-muted mt-1" style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: '#A9AEB8' }}>
                    DRIVE SAFE · DRIVE FAR
                  </div>
                </div>
              </div>
              <p className="small mb-3" style={{ lineHeight: '1.6' }}>
                Your trusted tyre shop for genuine tyres, expert service, and a safer journey. Quality, performance and customer satisfaction are our top priorities.
              </p>
              {/* Social Icons */}
              <div className="d-flex align-items-center gap-2">
                <a href="#facebook" className="p-2 rounded-circle border border-secondary text-light hover-lift" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Facebook size={16} />
                </a>
                <a href="#instagram" className="p-2 rounded-circle border border-secondary text-light hover-lift" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Instagram size={16} />
                </a>
                <a href="#youtube" className="p-2 rounded-circle border border-secondary text-light hover-lift" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Youtube size={16} />
                </a>
                <a href="#linkedin" className="p-2 rounded-circle border border-secondary text-light hover-lift" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Linkedin size={16} />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className="fw-bold text-white mb-3 text-uppercase small" style={{ letterSpacing: '0.06em' }}>
                Quick Links
              </h6>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li><Link to="/" className="text-secondary text-decoration-none hover-white">Home</Link></li>
                <li><a href="#vehicle-types" className="text-secondary text-decoration-none hover-white">Tyres</a></li>
                <li><a href="#services" className="text-secondary text-decoration-none hover-white">Services</a></li>
                <li><a href="#brands" className="text-secondary text-decoration-none hover-white">Brands</a></li>
                <li><a href="#about" className="text-secondary text-decoration-none hover-white">About Us</a></li>
                <li><a href="#contact" className="text-secondary text-decoration-none hover-white">Contact</a></li>
              </ul>
            </div>

            {/* Column 3: Our Services */}
            <div className="col-6 col-md-3 col-lg-3">
              <h6 className="fw-bold text-white mb-3 text-uppercase small" style={{ letterSpacing: '0.06em' }}>
                Our Services
              </h6>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li><button className="btn btn-link p-0 text-secondary text-decoration-none hover-white" onClick={() => openServiceModal('Tyre Fitting')}>Tyre Fitting</button></li>
                <li><button className="btn btn-link p-0 text-secondary text-decoration-none hover-white" onClick={() => openServiceModal('Wheel Balancing')}>Wheel Balancing</button></li>
                <li><button className="btn btn-link p-0 text-secondary text-decoration-none hover-white" onClick={() => openServiceModal('Wheel Alignment')}>Wheel Alignment</button></li>
                <li><button className="btn btn-link p-0 text-secondary text-decoration-none hover-white" onClick={() => openServiceModal('Puncture Repair')}>Puncture Repair</button></li>
                <li><button className="btn btn-link p-0 text-secondary text-decoration-none hover-white" onClick={() => openServiceModal('Nitrogen Filling')}>Nitrogen Filling</button></li>
                <li><button className="btn btn-link p-0 text-secondary text-decoration-none hover-white" onClick={() => openServiceModal('Tyre Rotation')}>Tyre Rotation</button></li>
              </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div className="col-12 col-md-6 col-lg-3">
              <h6 className="fw-bold text-white mb-3 text-uppercase small" style={{ letterSpacing: '0.06em' }}>
                Contact Us
              </h6>
              <ul className="list-unstyled d-flex flex-column gap-2.5 small">
                <li className="d-flex align-items-start gap-2">
                  <MapPin size={16} style={{ color: 'var(--accent)' }} className="flex-shrink-0 mt-0.5" />
                  <span className="text-light">{shopSettings?.address || 'Shop No. 12-14, GT Road Bypass, Transport Nagar, Kanpur, UP - 208001'}</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <Phone size={16} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
                  <a href={`tel:${(shopSettings?.phone || '+919693734121').replace(/[^0-9+]/g, '')}`} className="text-secondary text-decoration-none hover-white">
                    {shopSettings?.phone || '+91 9693734121'}
                  </a>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <Mail size={16} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
                  <a href={`mailto:${shopSettings?.email || 'contact@hindtyres.com'}`} className="text-secondary text-decoration-none hover-white">
                    {shopSettings?.email || 'contact@hindtyres.com'}
                  </a>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <Clock size={16} style={{ color: 'var(--accent)' }} className="flex-shrink-0 mt-0.5" />
                  <div className="text-secondary">
                    <div>Mon – Sat: 9:00 AM – 8:00 PM</div>
                    <div>Sunday: 10:00 AM – 5:00 PM</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-top mt-4 pt-3 text-center text-muted extra-small" style={{ borderColor: 'var(--border-dark)' }}>
            © {new Date().getFullYear()} {shopSettings?.shopName || 'HIND TYRES & ACCESSORIES'}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ========================================================== */}
      {/* SERVICE BOOKING MODAL */}
      {/* ========================================================== */}
      {showBookingModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={() => setShowBookingModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ backgroundColor: '#FFFFFF', color: 'var(--text-on-light)' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark mb-0">Book Workshop Service</h5>
                <button type="button" className="btn-close" onClick={() => setShowBookingModal(false)} />
              </div>

              <form onSubmit={handleBookingSubmit}>
                <div className="modal-body px-4 py-3">
                  <div className="mb-2">
                    <label className="form-label extra-small text-muted fw-semibold">Select Service</label>
                    <select
                      className="form-select form-select-sm"
                      value={bookingForm.service}
                      onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                    >
                      <option value="Tyre Fitting">Tyre Fitting (Quick & Professional)</option>
                      <option value="Wheel Balancing">Wheel Balancing (Smooth & Stable Ride)</option>
                      <option value="Wheel Alignment">3D Laser Wheel Alignment</option>
                      <option value="Puncture Repair">Tubeless Puncture Repair</option>
                      <option value="Nitrogen Filling">Pure Nitrogen Gas Inflation</option>
                      <option value="Tyre Rotation">Tyre Rotation & Inspection</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label extra-small text-muted fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label extra-small text-muted fw-semibold">Mobile Number *</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        required
                        placeholder="10-digit number"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label extra-small text-muted fw-semibold">Vehicle Model</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Swift / Creta"
                        value={bookingForm.vehicleModel}
                        onChange={(e) => setBookingForm({ ...bookingForm, vehicleModel: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-muted fw-semibold">Preferred Appointment Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={bookingForm.preferredDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    />
                  </div>

                  <div className="p-2.5 rounded-3 bg-light border small text-muted">
                    ⚡ Instant appointment confirmation. No advance payment required!
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowBookingModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-accent px-4 py-1.5" disabled={submittingBooking}>
                    {submittingBooking ? 'Confirming...' : 'Confirm Appointment'}
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
