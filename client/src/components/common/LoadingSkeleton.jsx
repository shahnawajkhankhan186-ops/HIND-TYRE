import React from 'react';

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="p-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="d-flex align-items-center gap-3 py-3 border-bottom border-secondary border-opacity-10">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="skeleton-box"
              style={{
                height: '18px',
                width: c === 0 ? '40px' : c === 1 ? '160px' : '100px',
                flexGrow: c === 1 ? 1 : 0,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-12 col-sm-6 col-lg-3">
          <div className="card-clean p-4 h-100 bg-white">
            <div className="skeleton-box mb-3" style={{ height: '24px', width: '50%' }} />
            <div className="skeleton-box mb-2" style={{ height: '36px', width: '80%' }} />
            <div className="skeleton-box" style={{ height: '16px', width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
