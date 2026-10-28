import React, { useState, useEffect } from 'react';
import { Search, Disc3, Layers, Filter, CheckCircle2, AlertTriangle, XCircle, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees } from '../../lib/currency';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

export default function StockAvailability() {
  const { shopSettings } = useAuth();
  const getGodownName = (code) => {
    return shopSettings?.godowns?.find((g) => g.code === code)?.name || (code === 'G1' ? 'Godown 1' : 'Godown 2');
  };

  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [inStockGodown, setInStockGodown] = useState('');
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchStock();
  }, [companyId, vehicleType, inStockGodown]);

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

  const fetchStock = async (targetSearch = search) => {
    try {
      setLoading(true);
      const res = await api.get('/counter/catalog', {
        params: {
          limit: 100,
          search: targetSearch?.trim() || undefined,
          companyId: companyId || undefined,
          vehicleType: vehicleType || undefined,
          inStockGodown: inStockGodown || undefined,
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
    if (e) e.preventDefault();
    fetchStock(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchStock('');
  };

  const handleResetFilters = () => {
    setSearch('');
    setCompanyId('');
    setVehicleType('');
    setInStockGodown('');
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/counter/catalog', { params: { limit: 100 } });
        if (res.data.success) setTyres(res.data.data.tyres);
      } catch (_) {} finally { setLoading(false); }
    })();
  };

  return (
    <div className="page-container">
      <div className="page-header-card">
        <h1 className="page-title">Live Inventory & Stock Lookup</h1>
        <p className="page-subtitle">
          Instant stock check for customer queries on size, brand, price & warehouse quantity
        </p>
      </div>

      {/* Filters */}
      <div className="filter-bar-card">
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-12 col-lg-4 col-md-5">
            <div className="input-group input-group-sm">
              <button
                type="submit"
                className="input-group-text bg-white text-muted border-end-0"
                style={{ cursor: 'pointer' }}
                title="Click to search"
              >
                <Search size={15} />
              </button>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search size (185/65 R15), model name, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-2"
                  onClick={handleClearSearch}
                  title="Clear search text"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="btn btn-accent btn-sm fw-bold d-flex align-items-center gap-1.5 px-3"
                title="Search stock"
              >
                <Search size={14} />
                <span>Search</span>
              </button>
            </div>
          </div>
          <div className="col-6 col-lg-2 col-md-3">
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
          <div className="col-6 col-lg-2 col-md-2">
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
          <div className="col-6 col-lg-2 col-md-2">
            <select
              className="form-select form-select-sm"
              value={inStockGodown}
              onChange={(e) => setInStockGodown(e.target.value)}
            >
              <option value="">All Warehouses</option>
              <option value="G1">In Stock in {getGodownName('G1')}</option>
              <option value="G2">In Stock in {getGodownName('G2')}</option>
            </select>
          </div>
          {(search || companyId || vehicleType || inStockGodown) && (
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-outline-dark-custom btn-sm d-flex align-items-center gap-1"
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                <RefreshCw size={13} /> Reset
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Grid of Results */}
      <div className="table-container-card">
        {loading ? (
          <TableSkeleton rows={8} cols={9} />
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
                  <th className="text-center">{getGodownName('G1')}</th>
                  <th className="text-center">{getGodownName('G2')}</th>
                  <th className="text-center">Total Stock</th>
                </tr>
              </thead>
              <tbody>
                {tyres.map((t) => {
                  const isLow = t.quantity <= t.lowStockThreshold && t.quantity > 0;
                  const isOut = t.quantity <= 0;
                  const g1Stock = t.godownStock?.G1 ?? 0;
                  const g2Stock = t.godownStock?.G2 ?? 0;

                  return (
                    <tr key={t._id}>
                      <td className="fw-bold text-dark">{t.companyId?.name || 'Tyre'}</td>
                      <td className="text-dark fw-medium">
                        <div>{t.modelName}</div>
                        {t.sku && <small className="text-muted extra-small font-monospace">SKU: {t.sku}</small>}
                      </td>
                      <td className="font-monospace fw-bold text-dark">{t.size}</td>
                      <td>
                        <span className="badge bg-light text-muted border extra-small">
                          {t.vehicleType}
                        </span>
                      </td>
                      <td className="text-muted small">{t.tubeType}</td>
                      <td className="text-end font-monospace">
                        <div className="text-dark fw-bold">{formatRupees(t.sellingPricePaise)}</div>
                        <div className="extra-small text-danger fw-semibold" title="Minimum Floor Selling Price">
                          Min: {formatRupees(t.minSellingPricePaise || t.actualPricePaise || t.sellingPricePaise)}
                        </div>
                      </td>
                      <td className="text-center font-monospace">
                        <span className={`badge ${g1Stock > 0 ? 'bg-light text-dark border fw-bold' : 'bg-light text-muted opacity-50 border'} px-2 py-1`}>
                          {g1Stock}
                        </span>
                      </td>
                      <td className="text-center font-monospace">
                        <span className={`badge ${g2Stock > 0 ? 'bg-light text-dark border fw-bold' : 'bg-light text-muted opacity-50 border'} px-2 py-1`}>
                          {g2Stock}
                        </span>
                      </td>
                      <td className="text-center">
                        {isOut ? (
                          <span className="badge-pill-danger extra-small">
                            <XCircle size={13} className="me-1 inline" /> 0 Units (Out of Stock)
                          </span>
                        ) : isLow ? (
                          <span className="badge-pill-warning extra-small">
                            <AlertTriangle size={13} className="me-1 inline" /> {t.quantity} Units (Low)
                          </span>
                        ) : (
                          <span className="badge-pill-success extra-small">
                            <CheckCircle2 size={13} className="me-1 inline" /> {t.quantity} Units
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
