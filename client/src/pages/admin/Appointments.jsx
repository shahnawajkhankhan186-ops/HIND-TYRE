import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Search,
  Filter,
  RefreshCw,
  Phone,
  MessageSquare,
  MapPin,
  Truck,
  Building,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  Disc3,
  Calendar,
  DollarSign,
  Wrench,
  Trash2,
  Edit,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatRupees, paiseToRupees, rupeesToPaise } from '../../lib/currency';
import BackButton from '../../components/common/BackButton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    all: 0,
    PENDING: 0,
    CONFIRMED: 0,
    OUT_FOR_DELIVERY: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  });

  // Filter States
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit / Status Modal State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusFormData, setStatusFormData] = useState({
    status: '',
    deliveryChargeRupees: '',
    adminNotes: '',
    assignedStaff: '',
    cancelledReason: '',
  });
  const [updating, setUpdating] = useState(false);

  // Delete Confirm Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    bookingNumber: '',
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 15,
        status: activeStatus,
        search,
      });
      if (serviceTypeFilter) params.append('serviceType', serviceTypeFilter);

      const res = await api.get(`/admin/appointments?${params.toString()}`);
      if (res.data.success) {
        setAppointments(res.data.data.appointments);
        setTotalPages(res.data.data.pagination.pages);
        setTotalCount(res.data.data.pagination.total);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [page, activeStatus, serviceTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAppointments();
  };

  // Open Edit Status Modal
  const openStatusModal = (apt) => {
    setSelectedAppointment(apt);
    setStatusFormData({
      status: apt.status,
      deliveryChargeRupees: paiseToRupees(apt.estimatedDeliveryChargePaise || 0),
      adminNotes: apt.adminNotes || '',
      assignedStaff: apt.assignedStaff || '',
      cancelledReason: apt.cancelledReason || '',
    });
    setShowStatusModal(true);
  };

  // Submit Status Update
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setUpdating(true);
      const payload = {
        status: statusFormData.status,
        estimatedDeliveryChargePaise: rupeesToPaise(Number(statusFormData.deliveryChargeRupees || 0)),
        adminNotes: statusFormData.adminNotes,
        assignedStaff: statusFormData.assignedStaff,
        cancelledReason: statusFormData.cancelledReason,
      };

      const res = await api.patch(`/admin/appointments/${selectedAppointment._id}/status`, payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Appointment updated successfully');
        setShowStatusModal(false);
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update appointment');
    } finally {
      setUpdating(false);
    }
  };

  // Handle Delete
  const handleDeleteAppointment = async () => {
    if (!deleteConfirm.id) return;
    try {
      const res = await api.delete(`/admin/appointments/${deleteConfirm.id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Appointment deleted');
        setDeleteConfirm({ isOpen: false, id: null, bookingNumber: '' });
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete appointment');
    }
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="badge-pill-warning">
            <Clock size={12} /> Pending
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="badge-pill-info">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="badge-pill-yellow">
            <Truck size={12} /> Out for Delivery
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge-pill-success">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge-pill-danger">
            <XCircle size={12} /> Cancelled
          </span>
        );
      default:
        return <span className="badge-pill-neutral">{status}</span>;
    }
  };

  return (
    <div className="page-container" style={{ padding: '10px' }}>
      {/* Header Card */}
      <div className="page-header-card" style={{ padding: '10px 14px', marginBottom: '10px' }}>
        <div className="back-nav-container mb-2">
          <BackButton fallback="/admin/dashboard" desktopLabel="Back to Dashboard" label="Back" />
        </div>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h1
              className="page-title d-flex align-items-center gap-2"
              style={{ color: '#0f172a', fontWeight: '800', fontSize: '1.4rem' }}
            >
              <CalendarClock className="text-warning" size={26} />
              Appointments & Doorstep Delivery
            </h1>
            <p className="page-subtitle mb-0" style={{ color: '#64748b', fontSize: '0.84rem' }}>
              Manage customer tyre home deliveries & workshop fitting bookings in real-time.
            </p>
          </div>

          <button
            onClick={fetchAppointments}
            className="btn btn-sm btn-outline-dark-custom d-flex align-items-center gap-1.5"
            disabled={loading}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (10px spacing) */}
      <div className="row g-2" style={{ marginBottom: '10px' }}>
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card bg-white shadow-sm cursor-pointer h-100"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: activeStatus === 'all' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setActiveStatus('all');
              setPage(1);
            }}
          >
            <div className="text-secondary extra-small text-uppercase fw-bold" style={{ fontSize: '0.67rem', letterSpacing: '0.04em' }}>
              TOTAL BOOKINGS
            </div>
            <div className="h4 fw-bold text-dark mb-0 mt-1" style={{ fontWeight: '800' }}>
              {stats.all}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card bg-white shadow-sm cursor-pointer h-100"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: activeStatus === 'PENDING' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setActiveStatus('PENDING');
              setPage(1);
            }}
          >
            <div className="text-warning extra-small text-uppercase fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.67rem', letterSpacing: '0.04em' }}>
              <Clock size={11} /> PENDING
            </div>
            <div className="h4 fw-bold text-warning mb-0 mt-1" style={{ fontWeight: '800' }}>
              {stats.PENDING}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card bg-white shadow-sm cursor-pointer h-100"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: activeStatus === 'CONFIRMED' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setActiveStatus('CONFIRMED');
              setPage(1);
            }}
          >
            <div className="text-info extra-small text-uppercase fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.67rem', letterSpacing: '0.04em' }}>
              <CheckCircle2 size={11} /> CONFIRMED
            </div>
            <div className="h4 fw-bold text-info mb-0 mt-1" style={{ fontWeight: '800' }}>
              {stats.CONFIRMED}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card bg-white shadow-sm cursor-pointer h-100"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: activeStatus === 'OUT_FOR_DELIVERY' ? '2px solid #854d0e' : '1px solid #e2e8f0',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setActiveStatus('OUT_FOR_DELIVERY');
              setPage(1);
            }}
          >
            <div className="text-warning extra-small text-uppercase fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.67rem', letterSpacing: '0.04em' }}>
              <Truck size={11} /> OUT FOR DELIVERY
            </div>
            <div className="h4 fw-bold text-dark mb-0 mt-1" style={{ fontWeight: '800' }}>
              {stats.OUT_FOR_DELIVERY}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card bg-white shadow-sm cursor-pointer h-100"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: activeStatus === 'COMPLETED' ? '2px solid #16a34a' : '1px solid #e2e8f0',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setActiveStatus('COMPLETED');
              setPage(1);
            }}
          >
            <div className="text-success extra-small text-uppercase fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.67rem', letterSpacing: '0.04em' }}>
              <CheckCircle2 size={11} /> COMPLETED
            </div>
            <div className="h4 fw-bold text-success mb-0 mt-1" style={{ fontWeight: '800' }}>
              {stats.COMPLETED}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card bg-white shadow-sm cursor-pointer h-100"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: activeStatus === 'CANCELLED' ? '2px solid #dc2626' : '1px solid #e2e8f0',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              setActiveStatus('CANCELLED');
              setPage(1);
            }}
          >
            <div className="text-danger extra-small text-uppercase fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.67rem', letterSpacing: '0.04em' }}>
              <XCircle size={11} /> CANCELLED
            </div>
            <div className="h4 fw-bold text-danger mb-0 mt-1" style={{ fontWeight: '800' }}>
              {stats.CANCELLED}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (10px padding & margin) */}
      <div
        className="card bg-white shadow-sm mb-2"
        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}
      >
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-secondary">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search booking #, customer, phone, address, tyre size..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '0.84rem' }}
              />
              <button type="submit" className="btn btn-warning fw-bold px-3">
                Search
              </button>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={serviceTypeFilter}
              onChange={(e) => {
                setServiceTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{ fontSize: '0.84rem' }}
            >
              <option value="">All Service Modes</option>
              <option value="HOME_DELIVERY">🚚 Doorstep Home Delivery</option>
              <option value="WORKSHOP_VISIT">🏬 Workshop Visit</option>
            </select>
          </div>

          <div className="col-6 col-md-4 d-flex justify-content-end align-items-center gap-2">
            {search && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary py-1 px-2"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  fetchAppointments();
                }}
                style={{ fontSize: '0.8rem' }}
              >
                Clear Search
              </button>
            )}
            <span className="text-secondary small">
              Total: <strong className="text-dark">{totalCount}</strong>
            </span>
          </div>
        </form>
      </div>

      {/* Appointments List / Table */}
      <div className="table-container-card" style={{ borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
        {loading ? (
          <div className="p-3">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-5">
            <CalendarClock size={40} className="text-secondary mb-2 opacity-50" />
            <h5 className="text-dark fw-bold mb-1">No Appointments Found</h5>
            <p className="text-secondary small mb-0">
              {search || activeStatus !== 'all' || serviceTypeFilter
                ? 'Try clearing your search or filters.'
                : 'Customer tyre appointment requests from the website will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th scope="col" style={{ padding: '10px 12px' }}>Booking # / Date</th>
                  <th scope="col" style={{ padding: '10px 12px' }}>Customer Contact</th>
                  <th scope="col" style={{ padding: '10px 12px' }}>Delivery / Service</th>
                  <th scope="col" style={{ padding: '10px 12px' }}>Tyre Ordered</th>
                  <th scope="col" style={{ padding: '10px 12px' }}>Price & Charges</th>
                  <th scope="col" style={{ padding: '10px 12px' }}>Status</th>
                  <th scope="col" className="text-end" style={{ padding: '10px 12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const rawPhone = apt.customerPhone.replace(/[^0-9]/g, '');
                  const formattedPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : apt.customerPhone;
                  const waNumber = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
                  const waMessage = encodeURIComponent(
                    `Hello ${apt.customerName},\nThis is Hind Tyres & Accessories Ramgarh Cantt regarding your Booking #${apt.bookingNumber} for ${apt.quantity}x ${apt.tyreDetails?.brandName} ${apt.tyreDetails?.modelName} (${apt.tyreDetails?.size}).\nWe are reaching out to confirm your doorstep delivery appointment.`
                  );

                  return (
                    <tr key={apt._id}>
                      {/* Booking # & Date */}
                      <td style={{ padding: '10px 12px' }}>
                        <div className="font-monospace fw-bold text-dark small">
                          {apt.bookingNumber}
                        </div>
                        <div className="text-secondary extra-small d-flex align-items-center gap-1 mt-0.5">
                          <Calendar size={11} className="text-muted" />
                          {new Date(apt.appointmentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-muted extra-small">
                          {apt.timeSlot.split(' ')[0]}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '10px 12px' }}>
                        <div className="fw-bold text-dark small">{apt.customerName}</div>
                        <div className="d-flex align-items-center gap-1.5 mt-1">
                          <a
                            href={`tel:${apt.customerPhone}`}
                            className="btn btn-xs btn-outline-secondary py-0.5 px-1.5 d-inline-flex align-items-center gap-1 text-decoration-none"
                            style={{ fontSize: '0.72rem' }}
                            title="Call customer"
                          >
                            <Phone size={10} />
                            {formattedPhone}
                          </a>
                          <a
                            href={`https://wa.me/${waNumber}?text=${waMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-success py-0.5 px-1.5 d-inline-flex align-items-center gap-1 text-decoration-none text-white"
                            style={{ fontSize: '0.72rem' }}
                            title="Message on WhatsApp"
                          >
                            <MessageSquare size={10} />
                            WhatsApp
                          </a>
                        </div>
                        {apt.vehicleModel && (
                          <div className="text-secondary extra-small mt-0.5">
                            Vehicle: <strong className="text-dark">{apt.vehicleModel}</strong>
                          </div>
                        )}
                      </td>

                      {/* Delivery Mode & Address */}
                      <td style={{ padding: '10px 12px', maxWidth: '230px' }}>
                        {apt.serviceType === 'HOME_DELIVERY' ? (
                          <>
                            <span className="badge-pill-warning extra-small mb-1" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                              <Truck size={10} /> Doorstep Delivery
                            </span>
                            <div className="small text-dark text-truncate fw-semibold" title={apt.deliveryAddress}>
                              {apt.deliveryAddress}
                            </div>
                            {apt.landmark && (
                              <div className="text-muted extra-small">
                                Near: {apt.landmark}
                              </div>
                            )}
                            <div className="text-muted extra-small">
                              {apt.city} - {apt.pincode}
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="badge-pill-neutral extra-small mb-1" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                              <Building size={10} /> Workshop Visit
                            </span>
                            <div className="text-muted extra-small">
                              Cantonment Market Shop #03, Ramgarh Cantt
                            </div>
                          </>
                        )}
                      </td>

                      {/* Tyre Ordered */}
                      <td style={{ padding: '10px 12px' }}>
                        <div className="fw-bold text-dark small">
                          {apt.tyreDetails?.brandName} {apt.tyreDetails?.modelName}
                        </div>
                        <div className="text-muted extra-small">
                          Size: <strong className="text-dark">{apt.tyreDetails?.size}</strong> ({apt.tyreDetails?.vehicleType})
                        </div>
                        <div className="badge bg-light text-dark border extra-small mt-0.5" style={{ fontSize: '0.7rem' }}>
                          Qty: {apt.quantity} {apt.quantity > 1 ? 'Tyres' : 'Tyre'}
                        </div>
                      </td>

                      {/* Price & Delivery Charge */}
                      <td style={{ padding: '10px 12px' }}>
                        <div className="text-dark small fw-bold">
                          {formatRupees(apt.totalAmountPaise)}
                        </div>
                        <div className="text-muted extra-small">
                          Tyres: {formatRupees(apt.tyreTotalPaise)}
                        </div>
                        <div className="text-info extra-small">
                          Delivery: {apt.estimatedDeliveryChargePaise > 0 ? formatRupees(apt.estimatedDeliveryChargePaise) : 'Free / Distance TBD'}
                        </div>
                        <div className="text-success extra-small fw-bold">
                          Fitting: FREE (₹0)
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 12px' }}>{renderStatusBadge(apt.status)}</td>

                      {/* Actions */}
                      <td className="text-end" style={{ padding: '10px 12px' }}>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-dark-custom btn-sm py-1 px-2 d-inline-flex align-items-center gap-1"
                            onClick={() => openStatusModal(apt)}
                            style={{ fontSize: '0.78rem' }}
                          >
                            <Edit size={12} />
                            Manage
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm py-1 px-2"
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: apt._id,
                                bookingNumber: apt.bookingNumber,
                              })
                            }
                            title="Delete booking"
                            style={{ fontSize: '0.78rem' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="pagination-container d-flex justify-content-between align-items-center"
            style={{ padding: '10px 14px' }}
          >
            <span className="text-secondary small">
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* UPDATE STATUS & DELIVERY CHARGE MODAL */}
      {/* ================================================================ */}
      {showStatusModal && selectedAppointment && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '10px', backgroundColor: '#FFFFFF', color: '#0F172A' }}>
              <div className="modal-header border-bottom py-2.5 px-3">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '1.05rem' }}>
                  <CalendarClock className="text-warning" size={18} />
                  Manage Booking: {selectedAppointment.bookingNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowStatusModal(false)}
                />
              </div>

              <form onSubmit={handleStatusSubmit}>
                <div className="modal-body p-3">
                  {/* Customer Quick Summary */}
                  <div
                    className="p-2.5 rounded-2 bg-light border mb-2.5"
                    style={{ fontSize: '0.84rem' }}
                  >
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong className="text-dark">{selectedAppointment.customerName}</strong>
                        <div className="text-muted small">{selectedAppointment.customerPhone}</div>
                      </div>
                      <div className="text-end">
                        <span className="text-muted extra-small">Tyre:</span>
                        <div className="text-dark small fw-bold">
                          {selectedAppointment.quantity}x {selectedAppointment.tyreDetails?.brandName} {selectedAppointment.tyreDetails?.size}
                        </div>
                      </div>
                    </div>
                    {selectedAppointment.serviceType === 'HOME_DELIVERY' && (
                      <div className="text-muted extra-small mt-2 pt-1.5 border-top">
                        <MapPin size={11} className="inline me-1 text-primary" />
                        {selectedAppointment.deliveryAddress}, {selectedAppointment.city}
                      </div>
                    )}
                  </div>

                  {/* Status Selector */}
                  <div className="mb-2.5">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                      Appointment Status *
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={statusFormData.status}
                      onChange={(e) =>
                        setStatusFormData({ ...statusFormData, status: e.target.value })
                      }
                      required
                    >
                      <option value="PENDING">🟡 PENDING (Awaiting Confirmation)</option>
                      <option value="CONFIRMED">🔵 CONFIRMED (Accepted & Scheduled)</option>
                      <option value="OUT_FOR_DELIVERY">🟣 OUT FOR DELIVERY (Van Dispatched)</option>
                      <option value="COMPLETED">🟢 COMPLETED (Tyres Delivered & Fitted)</option>
                      <option value="CANCELLED">🔴 CANCELLED</option>
                    </select>
                  </div>

                  {/* Distance-based Delivery Charge */}
                  <div className="mb-2.5">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                      Distance-Based Delivery Charge (₹)
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        className="form-control"
                        placeholder="0 (Free in Ramgarh Cantt)"
                        value={statusFormData.deliveryChargeRupees}
                        onChange={(e) =>
                          setStatusFormData({
                            ...statusFormData,
                            deliveryChargeRupees: e.target.value,
                          })
                        }
                      />
                    </div>
                    <span className="extra-small text-muted">
                      Distance ke hisab se delivery charge set karein (Tyre fitting hamesha Free rahegi).
                    </span>
                  </div>

                  {/* Assigned Technician / Staff */}
                  <div className="mb-2.5">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                      Assigned Delivery Technician / Staff
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Istiyak / Suresh (Driver)"
                      value={statusFormData.assignedStaff}
                      onChange={(e) =>
                        setStatusFormData({ ...statusFormData, assignedStaff: e.target.value })
                      }
                    />
                  </div>

                  {/* Admin Notes */}
                  <div className="mb-2.5">
                    <label className="form-label extra-small text-muted fw-bold text-uppercase mb-1">
                      Internal Admin Notes
                    </label>
                    <textarea
                      rows="2"
                      className="form-control form-control-sm"
                      placeholder="e.g. Customer requested fitting at 11:30 AM, near Old Bus Stand..."
                      value={statusFormData.adminNotes}
                      onChange={(e) =>
                        setStatusFormData({ ...statusFormData, adminNotes: e.target.value })
                      }
                    />
                  </div>

                  {/* Cancelled Reason (only visible if CANCELLED) */}
                  {statusFormData.status === 'CANCELLED' && (
                    <div className="mb-2.5">
                      <label className="form-label extra-small text-danger fw-bold text-uppercase mb-1">
                        Cancellation Reason
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-danger"
                        placeholder="e.g. Customer cancelled order / Tyre size changed"
                        value={statusFormData.cancelledReason}
                        onChange={(e) =>
                          setStatusFormData({
                            ...statusFormData,
                            cancelledReason: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top py-2 px-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowStatusModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-warning fw-bold px-3"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Appointment Record"
        message={`Are you sure you want to delete booking ${deleteConfirm.bookingNumber}? This action cannot be undone.`}
        confirmText="Delete Booking"
        confirmVariant="danger"
        onConfirm={handleDeleteAppointment}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, bookingNumber: '' })}
      />
    </div>
  );
}
