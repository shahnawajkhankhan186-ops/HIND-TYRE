import React from 'react';
import { Link } from 'react-router-dom';
import { Disc3, ArrowLeft, Home, Wrench, PhoneCall } from 'lucide-react';
import SEO from '../../components/common/SEO';

export default function NotFound() {
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg-black)', color: '#FFFFFF' }}>
      <SEO
        title="404 - Page Not Found"
        description="The page you are looking for does not exist or has been moved."
        noindex={true}
      />

      {/* Header Bar */}
      <header className="p-3 p-md-4 border-bottom border-dark border-opacity-40">
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center gap-2.5 text-decoration-none">
            <div
              className="p-1.5 rounded-circle d-flex align-items-center justify-content-center"
              style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', color: 'var(--accent)' }}
            >
              <Disc3 size={24} className="animate-spin-slow" />
            </div>
            <div className="d-flex flex-column text-start">
              <span className="fw-black text-white fs-5 lh-1 font-monospace" style={{ letterSpacing: '0.03em' }}>
                HIND TYRES & ACCESSORIES
              </span>
              <span className="extra-small text-muted mt-0.5 fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                DRIVE SAFE · DRIVE FAR
              </span>
            </div>
          </Link>

          <Link to="/" className="btn btn-outline-light btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3">
            <Home size={15} />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Main 404 Body */}
      <main className="container my-auto py-5 text-center" style={{ maxWidth: '640px' }}>
        <div className="mb-4">
          <span
            className="display-1 fw-black"
            style={{
              color: 'var(--accent)',
              textShadow: '0 0 40px rgba(255, 193, 7, 0.3)',
              letterSpacing: '-0.04em',
            }}
          >
            404
          </span>
          <h1 className="fw-bold text-white fs-2 mb-2">Page Not Found</h1>
          <p className="text-secondary small mb-4" style={{ lineHeight: '1.6' }}>
            The page you requested could not be found. It may have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap align-items-center justify-content-center gap-2.5 mb-5">
          <Link
            to="/"
            className="btn btn-accent fw-bold px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2 shadow"
            style={{ fontSize: '0.92rem' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Homepage</span>
          </Link>
          <a
            href="tel:+919693734121"
            className="btn btn-outline-secondary px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2 text-white"
            style={{ fontSize: '0.92rem' }}
          >
            <PhoneCall size={16} style={{ color: 'var(--accent)' }} />
            <span>Call Workshop Support</span>
          </a>
        </div>

        {/* Helpful Shortcuts */}
        <div className="p-3.5 rounded-4 border border-dark border-opacity-50 text-start" style={{ backgroundColor: 'var(--bg-card-dark)' }}>
          <div className="fw-bold text-white small mb-2 d-flex align-items-center gap-1.5">
            <Wrench size={16} style={{ color: 'var(--accent)' }} />
            <span>Popular Destinations</span>
          </div>
          <div className="row g-2 extra-small text-secondary">
            <div className="col-6">
              <Link to="/#vehicle-types" className="text-secondary text-decoration-none hover-white d-block p-1">
                → Car & Bike Tyres
              </Link>
              <Link to="/#services" className="text-secondary text-decoration-none hover-white d-block p-1">
                → 3D Wheel Alignment
              </Link>
            </div>
            <div className="col-6">
              <Link to="/#brands" className="text-secondary text-decoration-none hover-white d-block p-1">
                → Top Brands (MRF, Apollo)
              </Link>
              <Link to="/#contact" className="text-secondary text-decoration-none hover-white d-block p-1">
                → Workshop Location & Hours
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 text-center border-top border-dark border-opacity-40 text-muted extra-small">
        © {new Date().getFullYear()} HIND TYRES AND ACCESSORIES. All rights reserved.
      </footer>
    </div>
  );
}

