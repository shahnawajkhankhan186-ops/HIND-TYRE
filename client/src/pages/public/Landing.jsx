import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Disc3,
  ShieldCheck,
  Award,
  Wrench,
  Gauge,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Landing() {
  const { user, isAdmin, isCounter, shopSettings } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 bg-dark text-light d-flex flex-column" style={{ background: '#080d19' }}>
      {/* ======================================================== */}
      {/* HEADER: Sign In on Left Side, Brand & Portal Link on Right */}
      {/* ======================================================== */}
      <header
        className="border-bottom border-secondary border-opacity-25 py-2.5 px-3 px-md-4 sticky-top"
        style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(12px)', zIndex: 1040 }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between">
          {/* LEFT SIDE: Prominent Sign In Button */}
          <div className="d-flex align-items-center gap-2">
            {!user ? (
              <Link
                to="/login"
                className="btn btn-sm btn-info text-dark fw-bold px-3 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5 shadow-sm"
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
            ) : (
              <button
                className="btn btn-sm btn-success text-dark fw-bold px-3 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5 shadow-sm"
                onClick={() => {
                  if (isAdmin) navigate('/admin/dashboard');
                  else if (isCounter) navigate('/counter/new-sale');
                  else navigate('/portal');
                }}
              >
                <UserCheck size={16} />
                <span>
                  {isAdmin ? 'Admin Portal' : isCounter ? 'Counter POS' : 'My User Portal'}
                </span>
              </button>
            )}

            {!user && (
              <Link
                to="/register"
                className="btn btn-sm btn-outline-secondary text-light px-2.5 py-1.5 rounded-3 d-none d-sm-inline-flex align-items-center gap-1"
              >
                <span>Register</span>
              </Link>
            )}
          </div>

          {/* RIGHT SIDE: Brand Logo & Customer Portal Link */}
          <div className="d-flex align-items-center gap-3">
            <Link
              to="/portal"
              className="btn btn-sm btn-outline-info d-none d-md-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3"
            >
              <Disc3 size={15} />
              <span>View Tyres & Prices</span>
            </Link>

            <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
              <div className="p-1.5 rounded-2 bg-info bg-opacity-10 text-info border border-info border-opacity-40 d-flex align-items-center justify-content-center">
                <Disc3 size={22} className="animate-spin-slow" />
              </div>
              <div className="text-end text-sm-start">
                <div className="fw-bold text-white small brand-font lh-1" style={{ letterSpacing: '0.02em' }}>
                  {shopSettings?.shopName || 'HIND TYRES'}
                </div>
                <small className="text-info extra-small fw-semibold" style={{ fontSize: '0.65rem' }}>
                  SHOWROOM
                </small>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* HERO SECTION: Simple, Clean & Professional */}
      {/* ======================================================== */}
      <section className="py-5 px-3 my-auto">
        <div className="container" style={{ maxWidth: '920px' }}>
          <div className="text-center">
            {/* Badge */}
            <div className="d-inline-flex align-items-center gap-2 bg-info bg-opacity-10 border border-info border-opacity-30 text-info px-3 py-1.5 rounded-pill mb-3">
              <Sparkles size={15} />
              <span className="small fw-semibold">Authorized Multi-Brand Tyre Dealer</span>
            </div>

            {/* Main Title */}
            <h1 className="display-5 fw-extrabold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
              Welcome to <span className="text-info">{shopSettings?.shopName || 'HIND TYRES & ACCESSORIES'}</span>
            </h1>

            {/* Subtitle */}
            <p className="lead text-secondary mb-4 mx-auto" style={{ maxWidth: '680px' }}>
              High-durability tyres for Cars, SUVs, Bikes & Commercial vehicles with verified lifespan (65,000–85,000 KM), 5-year warranty, and free 3D laser wheel alignment.
            </p>

            {/* Call to Actions */}
            <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
              <Link
                to="/portal"
                className="btn btn-info text-dark fw-bold px-4 py-2.5 rounded-3 d-inline-flex align-items-center gap-2 shadow-lg"
              >
                <Disc3 size={18} />
                <span>Explore Tyres, Features & Prices</span>
                <ArrowRight size={16} />
              </Link>

              {!user ? (
                <Link
                  to="/login"
                  className="btn btn-outline-secondary text-light px-4 py-2.5 rounded-3 d-inline-flex align-items-center gap-2"
                >
                  <LogIn size={16} className="text-info" />
                  <span>Sign In to Portal</span>
                </Link>
              ) : (
                <button
                  className="btn btn-outline-info px-4 py-2.5 rounded-3 d-inline-flex align-items-center gap-2"
                  onClick={() => {
                    if (isAdmin) navigate('/admin/dashboard');
                    else if (isCounter) navigate('/counter/new-sale');
                    else navigate('/portal');
                  }}
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 4 Simple Feature Highlight Cards */}
          <div className="row g-3 text-start">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100 bg-dark bg-opacity-60 border border-secondary border-opacity-25 p-3 rounded-3">
                <div className="p-2 rounded-2 bg-success bg-opacity-10 text-success d-inline-block mb-2 border border-success border-opacity-20" style={{ width: 'fit-content' }}>
                  <ShieldCheck size={22} />
                </div>
                <h6 className="fw-bold text-white mb-1">5-Year Warranty</h6>
                <p className="extra-small text-secondary mb-0">
                  100% original tyres directly from MRF, CEAT, Apollo with certified warranty.
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100 bg-dark bg-opacity-60 border border-secondary border-opacity-25 p-3 rounded-3">
                <div className="p-2 rounded-2 bg-info bg-opacity-10 text-info d-inline-block mb-2 border border-info border-opacity-20" style={{ width: 'fit-content' }}>
                  <Gauge size={22} />
                </div>
                <h6 className="fw-bold text-white mb-1">Extended Lifespan</h6>
                <p className="extra-small text-secondary mb-0">
                  Tested tread compounds offering 65,000 to 85,000+ KM road endurance.
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100 bg-dark bg-opacity-60 border border-secondary border-opacity-25 p-3 rounded-3">
                <div className="p-2 rounded-2 bg-warning bg-opacity-10 text-warning d-inline-block mb-2 border border-warning border-opacity-20" style={{ width: 'fit-content' }}>
                  <Wrench size={22} />
                </div>
                <h6 className="fw-bold text-white mb-1">Free Showroom Care</h6>
                <p className="extra-small text-secondary mb-0">
                  Free 3D laser wheel alignment, dynamic balancing & pure nitrogen gas inflation.
                </p>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card h-100 bg-dark bg-opacity-60 border border-secondary border-opacity-25 p-3 rounded-3">
                <div className="p-2 rounded-2 bg-primary bg-opacity-10 text-primary d-inline-block mb-2 border border-primary border-opacity-20" style={{ width: 'fit-content' }}>
                  <Award size={22} />
                </div>
                <h6 className="fw-bold text-white mb-1">Genuine GST Invoicing</h6>
                <p className="extra-small text-secondary mb-0">
                  Transparent wholesale showroom pricing with official computer tax invoices.
                </p>
              </div>
            </div>
          </div>

          {/* Popular Brands Strip */}
          <div className="mt-4 pt-3 border-top border-secondary border-opacity-20 text-center">
            <div className="extra-small text-secondary text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.08em' }}>
              Authorized Stockist For Top Brands
            </div>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {['MRF', 'CEAT', 'Apollo', 'Bridgestone', 'Michelin', 'JK Tyre', 'Goodyear', 'TVS Eurogrip'].map((brand) => (
                <span
                  key={brand}
                  className="badge bg-dark border border-secondary border-opacity-30 text-light px-2.5 py-1.5 extra-small"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CLEAN FOOTER: Contact & Showroom Address */}
      {/* ======================================================== */}
      <footer className="border-top border-secondary border-opacity-20 py-3 px-3 mt-auto bg-dark bg-opacity-80">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2 small text-secondary">
          <div className="d-flex align-items-center gap-2">
            <MapPin size={15} className="text-info" />
            <span>{shopSettings?.address || 'Authorized Tyre Showroom & Laser Alignment Center, NH Bypass'}</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-1">
              <Phone size={14} className="text-success" />
              <span className="text-white fw-semibold">{shopSettings?.phone || '+91 98765 43210'}</span>
            </span>
            <span className="d-flex align-items-center gap-1 text-warning">
              <Clock size={14} /> Open 7 Days: 9 AM – 9 PM
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
