import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Universal Back Button Component
 * Navigates to previous history state, or falls back to specified route.
 * Renders as an elegant, compact pill at the top of the page-header-card.
 */
export default function BackButton({
  fallback = '/',
  label = 'Back',
  desktopLabel,
  className = '',
  onClick,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  const finalDesktop = desktopLabel || label;

  return (
    <button
      type="button"
      className={`back-nav-btn ${className}`}
      onClick={handleBack}
      title={`Go back (${finalDesktop})`}
      aria-label="Back"
    >
      <ArrowLeft size={14} className="back-nav-icon" />
      {finalDesktop !== label ? (
        <>
          <span className="d-none d-sm-inline">{finalDesktop}</span>
          <span className="d-inline d-sm-none">{label}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
