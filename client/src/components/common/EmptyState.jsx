import React from 'react';
import { Disc3, FolderOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  message = 'There are no items matching your criteria at this moment.',
  actionText,
  onAction,
  icon: Icon = Disc3,
}) {
  return (
    <div className="card-clean p-5 text-center my-4 bg-white">
      <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ background: 'var(--accent-soft)', color: '#B45309' }}>
        <Icon size={36} />
      </div>
      <h5 className="text-dark fw-bold mb-1">{title}</h5>
      <p className="text-muted small mx-auto mb-3" style={{ maxWidth: '380px' }}>
        {message}
      </p>
      {actionText && onAction && (
        <button className="btn btn-accent btn-sm fw-bold" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
