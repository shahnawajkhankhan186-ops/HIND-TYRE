import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Universal Back Button Component
 * Navigates to previous history state, or falls back to specified route
 */
export default function BackButton({ fallback = '/', label = 'Back', className = '' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-outline-dark-custom btn-sm d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-2 shadow-xs ${className}`}
      onClick={handleBack}
      title="Go back to previous page"
      aria-label="Back"
    >
      <ArrowLeft size={15} />
      <span className="fw-semibold small">{label}</span>
    </button>
  );
}

