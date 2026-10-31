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
  ChevronDown,
  Crosshair,
  Timer,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/common/SEO';

const FAQS = [
  {
    q: 'Which tyre brands are available at Hind Tyres in Ramgarh Cantt, Jharkhand?',
    a: 'Hind Tyres is an authorized multi-brand retailer offering 100% genuine tyres from MRF, Apollo, Bridgestone, Michelin, Goodyear, CEAT, JK Tyre, and TVS Eurogrip with official manufacturer warranty and computerized GST invoicing.'
  },
  {
    q: 'How do I know when my vehicle needs new tyres?',
    a: 'You should replace your tyres if tread depth is below 1.6mm (reaching tread wear indicators), if you see visible cracks or sidewall bulges, if the tyres are older than 5 years, or if your vehicle frequently slips during wet braking.'
  },
  {
    q: 'What is the difference between 3D Wheel Alignment and Wheel Balancing?',
    a: 'Wheel Alignment adjusts the precision angles (camber, caster, and toe) so all wheels point straight and tyre wear is even. Wheel Balancing eliminates high-speed steering wobble by distributing weight evenly across the wheel rim and tyre.'
  },
  {
    q: 'Do you provide manufacturer warranty with new tyres?',
    a: 'Yes! Every tyre purchased at Hind Tyres comes with 100% genuine company warranty ranging from 3 to 5 years, complete with authorized warranty registration and digital receipt.'
  },
  {
    q: 'How can I book an appointment for tyre fitting or alignment?',
    a: 'You can book instantly online by clicking the "Book Service" button above, or by calling our workshop directly at +91 9693734121. Instant confirmation with zero advance fee required.'
  },
  {
    q: 'Is Nitrogen gas inflation better than regular compressed air?',
    a: 'Yes, Nitrogen has larger molecules that leak through rubber much slower than regular air, ensuring steady tyre pressure, lower tyre temperatures on highways, and improved fuel economy.'
  }
];

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

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#FFFFFF', color: 'var(--text-on-light)' }}>
      {/* Dynamic SEO Meta & Schema Manager */}
      <SEO
        title="HIND TYRES AND ACCESSORIES – Top Brands | Best Prices | Expert Fitting"
        description="Authorized dealer for MRF, Apollo, Bridgestone, Michelin, Goodyear, CEAT & JK Tyre in Ramgarh Cantt, Jharkhand. 100% genuine tyres, 5-year warranty, 3D laser wheel alignment & express fitting."
        canonicalUrl="https://hind-tyre.vercel.app/"
        structuredData={faqSchema}
      />
      {/* ========================================================== */}
      {/* 1. STICKY WHITE NAVBAR (Exact Mockup Match: Logo + Links + Phone + Sign In) */}
      {/* ========================================================== */}
      <header className="landing-header sticky-top py-2 py-md-2.5 px-2 px-sm-3 px-xl-0">
        <div className="container d-flex align-items-center justify-content-between">
          
          {/* Left Action Group: [ ≡ Hamburger Button on Mobile ] + [ Brand Logo & Name ] */}
          <div className="d-flex align-items-center gap-1.5 gap-sm-2.5">
            {/* Mobile Hamburger Menu Toggle positioned on the LEFT */}
            <button
              className="btn d-lg-none p-1.5 border-0 text-dark d-flex align-items-center justify-content-center me-0.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              style={{
                width: '38px',
                height: '38px',
                backgroundColor: mobileMenuOpen ? 'rgba(0,0,0,0.06)' : 'transparent',
                borderRadius: '8px',
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo with Detailed Alloy Wheel & Tyre Vector */}
            <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
              <div className="flex-shrink-0 d-flex align-items-center justify-content-center">
                <svg width="36" height="36" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      <span className="brand-word-1">
                        {firstWord}
                      </span>
                      <span className="brand-word-2 ms-1">
                        {remaining}
                      </span>
                    </div>
                  );
                })()}
                <div className="brand-tagline mt-0.5">
                  DRIVE SAFE · DRIVE FAR
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links (with Yellow Indicator on Active) */}
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
          <div className="d-flex align-items-center gap-2 gap-sm-2.5">
            {/* Phone Chip (desktop only) */}
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

            {/* Sign In Button */}
            {!user ? (
              <Link
                to="/login"
                className="landing-signin-btn"
              >
                <User size={15} strokeWidth={2.5} />
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
                  <UserCheck size={15} strokeWidth={2.5} />
                  <span>
                    {isAdmin ? 'Admin' : 'POS'}
                  </span>
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center"
                  onClick={logout}
                  title="Sign Out"
                  style={{ width: '32px', height: '32px', borderColor: 'var(--border-light)' }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu (Smooth Animated Drawer) */}
        {mobileMenuOpen && (
          <div className="d-lg-none bg-white border-top px-3 py-3 shadow-lg animate-fade-in" style={{ borderColor: 'var(--border-light)' }}>
            <div className="d-flex flex-column gap-1 pb-3 border-bottom" style={{ borderColor: 'var(--border-light)' }}>
              <a
                href="#hero"
                className={`py-2 px-2.5 rounded-2 text-decoration-none d-flex align-items-center justify-content-between ${
                  activeSection === 'home' ? 'bg-warning bg-opacity-10 text-dark fw-bold' : 'text-dark fw-semibold'
                }`}
                onClick={() => {
                  setActiveSection('home');
                  setMobileMenuOpen(false);
                }}
              >
                <span>Home</span>
                <ChevronRight size={16} className="text-muted" />
              </a>
              <a
                href="#vehicle-types"
                className="py-2 px-2.5 rounded-2 text-decoration-none text-dark fw-semibold d-flex align-items-center justify-content-between"
                onClick={() => {
                  setActiveSection('tyres');
                  setMobileMenuOpen(false);
                }}
              >
                <span>Tyres by Vehicle</span>
                <ChevronRight size={16} className="text-muted" />
              </a>
              <a
                href="#services"
                className="py-2 px-2.5 rounded-2 text-decoration-none text-dark fw-semibold d-flex align-items-center justify-content-between"
                onClick={() => {
                  setActiveSection('services');
                  setMobileMenuOpen(false);
                }}
              >
                <span>Workshop Services</span>
                <ChevronRight size={16} className="text-muted" />
              </a>
              <a
                href="#brands"
                className="py-2 px-2.5 rounded-2 text-decoration-none text-dark fw-semibold d-flex align-items-center justify-content-between"
                onClick={() => {
                  setActiveSection('brands');
                  setMobileMenuOpen(false);
                }}
              >
                <span>Top Tyre Brands</span>
                <ChevronRight size={16} className="text-muted" />
              </a>
              <a
                href="#about"
                className="py-2 px-2.5 rounded-2 text-decoration-none text-dark fw-semibold d-flex align-items-center justify-content-between"
                onClick={() => {
                  setActiveSection('about');
                  setMobileMenuOpen(false);
                }}
              >
                <span>About Us</span>
                <ChevronRight size={16} className="text-muted" />
              </a>
              <a
                href="#contact"
                className="py-2 px-2.5 rounded-2 text-decoration-none text-dark fw-semibold d-flex align-items-center justify-content-between"
                onClick={() => {
                  setActiveSection('contact');
                  setMobileMenuOpen(false);
                }}
              >
                <span>Contact & Location</span>
                <ChevronRight size={16} className="text-muted" />
              </a>
            </div>

            {/* Mobile Call Now & Quick Sign In */}
            <div className="pt-3 d-flex flex-column gap-2">
              <a
                href={`tel:${(shopSettings?.phone || '+919693734121').replace(/[^0-9+]/g, '')}`}
                className="d-flex align-items-center justify-content-center gap-2 py-2 px-3 rounded-pill bg-light border text-dark fw-bold text-decoration-none"
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
        className="position-relative text-white py-4 py-md-5 py-lg-6"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 10, 12, 0.95) 0%, rgba(10, 10, 12, 0.88) 45%, rgba(10, 10, 12, 0.4) 100%), url('/images/hero_tyre_workshop.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: 'var(--bg-black)',
          minHeight: '480px',
        }}
      >
        <div className="container py-2 py-md-4">
          <div className="row align-items-center">
            <div className="col-12 col-lg-7">
              {/* Eyebrow */}
              <div className="hero-eyebrow text-light mb-2 opacity-90" style={{ fontSize: '0.82rem', letterSpacing: '0.12em' }}>
                PREMIUM TYRES FOR A
              </div>

              {/* Big Italic Headline with yellow keyword */}
              <h1 className="hero-headline display-3 mb-2 mb-md-3 text-white">
                SAFER<br />
                <span style={{ color: 'var(--accent)' }}>SMOOTHER</span><br />
                JOURNEY
              </h1>

              {/* Subline */}
              <p className="fs-6 fs-md-5 text-light fw-medium mb-3 mb-md-4 opacity-90">
                Top Brands &nbsp;|&nbsp; Best Prices &nbsp;|&nbsp; Expert Fitting
              </p>

              {/* Two buttons */}
              <div className="d-flex flex-wrap align-items-center gap-2.5 gap-sm-3 mb-4 mb-md-5">
                <a
                  href="#vehicle-types"
                  className="btn-accent px-3.5 px-sm-4 py-2.5 rounded-3 fw-bold shadow-lg d-inline-flex align-items-center gap-1.5"
                  style={{ fontSize: '0.92rem' }}
                >
                  <span>Explore Tyres</span>
                  <ArrowRight size={16} />
                </a>

                <button
                  className="btn-outline-light-custom px-3.5 px-sm-4 py-2.5 rounded-3 d-inline-flex align-items-center gap-1.5"
                  style={{ fontSize: '0.92rem' }}
                  onClick={() => openServiceModal('Tyre Fitting')}
                >
                  <Calendar size={16} />
                  <span>Book Service</span>
                </button>
              </div>

              {/* Trust Strip (5 Yellow Accent Trust Badges) */}
              <div className="pt-3 border-top" style={{ borderColor: 'var(--border-dark)' }}>
                <div className="row g-2 g-sm-3">
                  <div className="col-6 col-sm-auto">
                    <div className="trust-strip-card d-flex align-items-center gap-2 p-2 px-2.5 rounded-3 h-100">
                      <ShieldCheck size={18} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
                      <div className="lh-1">
                        <div className="fw-bold small text-white text-nowrap">100% Genuine</div>
                        <div className="extra-small text-secondary mt-0.5" style={{ fontSize: '0.66rem', color: '#9CA3AF' }}>Certified Tyres</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-sm-auto">
                    <div className="trust-strip-card d-flex align-items-center gap-2 p-2 px-2.5 rounded-3 h-100">
                      <Truck size={18} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
                      <div className="lh-1">
                        <div className="fw-bold small text-white text-nowrap">Wide Range</div>
                        <div className="extra-small text-secondary mt-0.5" style={{ fontSize: '0.66rem', color: '#9CA3AF' }}>8 Top Brands</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-sm-auto">
                    <div className="trust-strip-card d-flex align-items-center gap-2 p-2 px-2.5 rounded-3 h-100">
                      <Wrench size={18} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
                      <div className="lh-1">
                        <div className="fw-bold small text-white text-nowrap">Professional</div>
                        <div className="extra-small text-secondary mt-0.5" style={{ fontSize: '0.66rem', color: '#9CA3AF' }}>Laser Alignment</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-sm-auto">
                    <div className="trust-strip-card d-flex align-items-center gap-2 p-2 px-2.5 rounded-3 h-100">
                      <span className="fw-bold fs-5 lh-1 flex-shrink-0" style={{ color: 'var(--accent)' }}>₹</span>
                      <div className="lh-1">
                        <div className="fw-bold small text-white text-nowrap">Best Prices</div>
                        <div className="extra-small text-secondary mt-0.5" style={{ fontSize: '0.66rem', color: '#9CA3AF' }}>Direct Wholesale</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-auto">
                    <div className="trust-strip-card d-flex align-items-center gap-2 p-2 px-2.5 rounded-3 h-100">
                      <Headphones size={18} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
                      <div className="lh-1">
                        <div className="fw-bold small text-white text-nowrap">Expert Support</div>
                        <div className="extra-small text-secondary mt-0.5" style={{ fontSize: '0.66rem', color: '#9CA3AF' }}>Warranty Claim Hub</div>
                      </div>
                    </div>
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
                    alt="Car Tyres - Tubeless & Radial Tyres for Hatchback, Sedan, SUV | Hind Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="175"
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
                    alt="Bike Tyres - Commuter, Sports & Cruiser Two-Wheeler Tyres | Hind Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="175"
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
                    alt="SUV Tyres - All-Terrain & Highway Radial Tyres | Hind Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="175"
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
                    alt="Commercial Tyres - Heavy Duty Truck, Tractor & Fleet Tyres | Hind Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="175"
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
                    alt="Pneumatic Tyre Fitting & Scratchless Wheel Installation | Hind Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="160"
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
                    alt="Dynamic Wheel Balancing & Vibration Control Service | Hind Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="160"
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
                    alt="3D Laser Computerized Wheel Alignment in Ramgarh Cantt, Jharkhand | Hind Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="160"
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
                    alt="Tubeless Tyre Puncture Repair & Nitrogen Gas Inflation | Hind Tyres"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="160"
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
            className="col-12 col-lg-5 p-3.5 p-sm-4 p-md-5 d-flex flex-column justify-content-center text-dark cta-yellow-slice"
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
                className="btn-dark-solid px-4 py-2.5 rounded-3 shadow d-inline-flex align-items-center gap-1.5"
                style={{ fontSize: '0.95rem' }}
              >
                <span>View Brands</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Right Highway Tyre Photo & Benefits Box */}
          <div
            className="col-12 col-lg-7 position-relative d-flex align-items-center justify-content-center justify-content-lg-end p-4 p-md-5"
            style={{
              backgroundImage: `url('/images/highway_tyre_promo.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '260px',
            }}
          >
            <div
              className="p-3.5 rounded-4 d-flex flex-column gap-3 text-white shadow-2xl w-100"
              style={{
                backgroundColor: 'rgba(10, 10, 12, 0.88)',
                backdropFilter: 'blur(10px)',
                maxWidth: '320px',
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
      {/* 6.5 FREQUENTLY ASKED QUESTIONS (FAQ Section) */}
      {/* ========================================================== */}
      <section id="faq" className="py-5" style={{ backgroundColor: 'var(--bg-light)', borderTop: '1px solid var(--border-light)' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill mb-2" style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', color: '#b45309', fontSize: '0.8rem', fontWeight: 600 }}>
              <HelpCircle size={15} />
              <span>Got Questions? We Have Answers</span>
            </div>
            <h2 className="fw-black text-dark mb-1" style={{ letterSpacing: '-0.01em' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-muted mb-0">
              Everything you need to know about purchasing tyres, warranties, and vehicle maintenance
            </p>
          </div>

          <div className="d-flex flex-column gap-2.5">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="card-clean border overflow-hidden transition-all"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: isOpen ? 'var(--accent)' : 'var(--border-light)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <button
                    type="button"
                    className="w-100 p-3.5 text-start bg-transparent border-0 d-flex align-items-center justify-content-between gap-3 text-dark fw-bold"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    style={{ fontSize: '0.96rem' }}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      className="text-secondary flex-shrink-0"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-0 text-secondary small border-top pt-3" style={{ lineHeight: '1.65', borderColor: 'var(--border-light)' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
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
                <li><a href="#faq" className="text-secondary text-decoration-none hover-white">FAQs</a></li>
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
                  <span className="text-light">{shopSettings?.address || 'Cantonment Market Shop No:03 Near Football Ground Bus Stand Ramgarh Cantt ,Jharkhand 829122'}</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <Phone size={16} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
                  <a href={`tel:${(shopSettings?.phone || '+917991189048').replace(/[^0-9+]/g, '')}`} className="text-secondary text-decoration-none hover-white">
                    {shopSettings?.phone || '+91 79911 89048'}
                  </a>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <Mail size={16} style={{ color: 'var(--accent)' }} className="flex-shrink-0" />
                  <a href={`mailto:${shopSettings?.email || 'hindtyre01@gmail.com'}`} className="text-secondary text-decoration-none hover-white">
                    {shopSettings?.email || 'hindtyre01@gmail.com'}
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
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-2 mx-sm-auto" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF', color: 'var(--text-on-light)' }}>
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
