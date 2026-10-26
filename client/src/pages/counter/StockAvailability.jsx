import React, { useState, useEffect } from 'react';
import { Search, Disc3, Layers, Filter, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees } from '../../lib/currency';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function StockAvailability() {
  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCompanies();
    fetchStock();
  }, [companyId, vehicleType]);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/counter/companies');
      if (res.data.success) setCompanies(res.data.data);
    } catch (_) {
      try {
        const fallback = await api.get('/admin/companies');
        if (fallback.data.success) setCompanies(fallback.data.data);
      } catch (_) {}
    }
  };

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.get('/counter/catalog', {
        params: {
          limit: 100,
          search,
          companyId,
          vehicleType,
        },
      });
      if (res.data.success) {
        setTyres(res.data.data.tyres);
      }
    } catch (err) {
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStock();
  };

  return (
    <div className="container-fluid p-3 p-md-4" style={{ minHeight: 'calc(100vh - 120px)', background: 'var(--bg-light)' }}>
      <div className="card-clean p-4 mb-4 bg-white">
        <h4 className="fw-bold m-0" style={{ color: 'var(--text-on-light)', fontFamily: 'Montserrat, sans-serif' }}>Live Inventory & Stock Lookup</h4>
        <p className="text-muted small m-0 mt-1">
          Instant stock check for customer queries on size, brand, price & quantity
        </p>
      </div>

      {/* Filters */}
      <div className="card-clean p-3 mb-3 bg-white">
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><Search size={15} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search size (185/65 R15), model name, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="">All Vehicle Types</option>
              {['Bike', 'Scooter', 'Car', 'SUV', 'Truck', 'Tractor', 'Auto'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-1">
            <button type="submit" className="btn btn-accent btn-sm w-100 fw-bold">Find</button>
          </div>
        </form>
      </div>

      {/* Grid of Results */}
      <div className="card-clean overflow-hidden bg-white">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : tyres.length === 0 ? (
          <div className="p-5 text-center text-muted">
            No tyres matching the search criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Model Name</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Tube Type</th>
                  <th className="text-end">Selling Price</th>
                  <th className="text-center">Live Stock</th>
                </tr>
              </thead>
              <tbody>
                {tyres.map((t) => {
                  const isLow = t.quantity <= t.lowStockThreshold && t.quantity > 0;
                  const isOut = t.quantity <= 0;
                  return (
                    <tr key={t._id}>
                      <td className="fw-bold text-dark">{t.companyId?.name || 'Tyre'}</td>
                      <td className="text-dark fw-medium">{t.modelName}</td>
                      <td className="font-monospace fw-bold text-dark">{t.size}</td>
                      <td>
                        <span className="badge bg-light text-muted border extra-small">
                          {t.vehicleType}
                        </span>
                      </td>
                      <td className="text-muted small">{t.tubeType}</td>
                      <td className="text-end text-dark font-monospace fw-bold">
                        {formatRupees(t.sellingPricePaise)}
                      </td>
                      <td className="text-center">
                        {isOut ? (
                          <span className="badge-pill-danger">
                            <XCircle size={13} className="me-1 inline" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="badge-pill-warning">
                            <AlertTriangle size={13} className="me-1 inline" /> {t.quantity} Left (Low)
                          </span>
                        ) : (
                          <span className="badge-pill-success">
                            <CheckCircle2 size={13} className="me-1 inline" /> {t.quantity} Available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
