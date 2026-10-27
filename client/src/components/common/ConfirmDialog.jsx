import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

/**
 * Custom Confirmation Dialog Modal
 * Rule 6: Prohibits native window.confirm() for all destructive actions
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
  showInput = false,
  inputLabel = 'Reason / Note',
  inputValue = '',
  onInputChange,
  inputPlaceholder = 'Enter reason...',
  inputRequired = false,
}) {
  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (showInput && inputRequired && !inputValue.trim()) {
      return;
    }
    onConfirm();
  };

  const isConfirmDisabled = isLoading || (showInput && inputRequired && !inputValue.trim());

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content border-0 shadow-lg" style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div className="modal-header border-bottom py-3" style={{ borderColor: 'var(--border-light)' }}>
            <div className="d-flex align-items-center gap-2">
              <div
                className={`p-2 rounded-circle ${
                  variant === 'danger'
                    ? 'bg-danger bg-opacity-10 text-danger'
                    : 'bg-warning bg-opacity-15 text-dark'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <h5 className="modal-title m-0 fw-bold" style={{ color: 'var(--text-on-light)' }}>{title}</h5>
            </div>
            <button
              type="button"
              className="btn btn-sm text-secondary p-1"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleConfirm}>
            <div className="modal-body py-4">
              <p className="text-secondary mb-3">{message}</p>

              {showInput && (
                <div className="mb-2">
                  <label className="form-label small fw-semibold" style={{ color: 'var(--text-on-light)' }}>
                    {inputLabel} {inputRequired && <span className="text-danger">*</span>}
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={inputValue}
                    onChange={(e) => onInputChange && onInputChange(e.target.value)}
                    placeholder={inputPlaceholder}
                    required={inputRequired}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="modal-footer border-top pt-3" style={{ borderColor: 'var(--border-light)' }}>
              <button
                type="button"
                className="btn btn-outline-dark-custom"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelText}
              </button>
              <button
                type="submit"
                className={`btn ${
                  variant === 'danger'
                    ? 'btn-danger px-3'
                    : 'btn-accent'
                } d-flex align-items-center gap-2`}
                disabled={isConfirmDisabled}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {confirmText}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
