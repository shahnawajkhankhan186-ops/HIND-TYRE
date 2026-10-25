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
    <div className="glass-panel p-5 text-center my-4">
      <div className="d-inline-flex p-3 rounded-circle bg-secondary bg-opacity-10 text-cyan mb-3">
        <Icon size={36} className="text-info opacity-75" />
      </div>
      <h5 className="text-white fw-bold mb-1">{title}</h5>
      <p className="text-secondary small max-w-sm mx-auto mb-3" style={{ maxWidth: '380px' }}>
        {message}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary-glass btn-sm" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
