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
      style={{ backgroundColor: 'rgba(5, 8, 15, 0.82)', backdropFilter: 'blur(10px)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content glass-modal border-0 shadow-lg">
          <div className="modal-header border-bottom border-secondary border-opacity-25 pb-3">
            <div className="d-flex align-items-center gap-2">
              <div
                className={`p-2 rounded-circle ${
                  variant === 'danger'
                    ? 'bg-danger bg-opacity-25 text-danger'
                    : 'bg-warning bg-opacity-25 text-warning'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <h5 className="modal-title m-0 text-white fw-bold">{title}</h5>
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
                  <label className="form-label text-light small fw-semibold">
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

            <div className="modal-footer border-top border-secondary border-opacity-25 pt-3">
              <button
                type="button"
                className="btn btn-secondary-glass"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelText}
              </button>
              <button
                type="submit"
                className={`btn ${
                  variant === 'danger'
                    ? 'btn-danger-glass'
                    : 'btn-primary-glass'
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
