import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ background: 'var(--bg-light)' }}>
          <div className="card-clean p-5 text-center shadow-lg bg-white" style={{ maxWidth: '520px' }}>
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex mb-3">
              <AlertTriangle size={36} />
            </div>
            <h4 className="text-dark fw-bold mb-2">Something went wrong</h4>
            <p className="text-muted small mb-4">
              An unexpected application error occurred: {this.state.error?.message || 'Unknown error'}
            </p>
            <button className="btn btn-accent d-inline-flex align-items-center gap-2 fw-bold" onClick={this.handleReload}>
              <RefreshCw size={16} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
