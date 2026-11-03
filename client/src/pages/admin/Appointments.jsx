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
          <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1">
            <Clock size={12} className="me-1 inline" /> Pending
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1">
            <CheckCircle2 size={12} className="me-1 inline" /> Confirmed
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1">
            <Truck size={12} className="me-1 inline" /> Out for Delivery
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1">
            <CheckCircle2 size={12} className="me-1 inline" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1">
            <XCircle size={12} className="me-1 inline" /> Cancelled
          </span>
        );
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <BackButton />
          <div>
            <h1 className="h3 fw-bold text-white mb-1 d-flex align-items-center gap-2">
              <CalendarClock className="text-warning" size={28} />
              Appointments & Doorstep Delivery
            </h1>
            <p className="text-secondary small mb-0">
              Manage customer tyre home deliveries & workshop fitting bookings in real-time.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAppointments}
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className={`card-clean p-3 cursor-pointer ${
              activeStatus === 'all' ? 'border-warning shadow-sm' : ''
            }`}
            onClick={() => {
              setActiveStatus('all');
              setPage(1);
            }}
          >
            <div className="text-secondary extra-small text-uppercase fw-bold">Total Bookings</div>
            <div className="h4 fw-bold text-white mb-0 mt-1">{stats.all}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className={`card-clean p-3 cursor-pointer ${
              activeStatus === 'PENDING' ? 'border-warning shadow-sm' : ''
            }`}
            onClick={() => {
              setActiveStatus('PENDING');
              setPage(1);
            }}
          >
            <div className="text-warning extra-small text-uppercase fw-bold d-flex align-items-center gap-1">
              <Clock size={12} /> Pending Confirmation
            </div>
            <div className="h4 fw-bold text-warning mb-0 mt-1">{stats.PENDING}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className={`card-clean p-3 cursor-pointer ${
              activeStatus === 'CONFIRMED' ? 'border-info shadow-sm' : ''
            }`}
            onClick={() => {
              setActiveStatus('CONFIRMED');
              setPage(1);
            }}
          >
            <div className="text-info extra-small text-uppercase fw-bold d-flex align-items-center gap-1">
              <CheckCircle2 size={12} /> Confirmed
            </div>
            <div className="h4 fw-bold text-info mb-0 mt-1">{stats.CONFIRMED}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className={`card-clean p-3 cursor-pointer ${
              activeStatus === 'OUT_FOR_DELIVERY' ? 'border-primary shadow-sm' : ''
            }`}
            onClick={() => {
              setActiveStatus('OUT_FOR_DELIVERY');
              setPage(1);
            }}
          >
            <div className="text-primary extra-small text-uppercase fw-bold d-flex align-items-center gap-1">
              <Truck size={12} /> Out for Delivery
            </div>
            <div className="h4 fw-bold text-primary mb-0 mt-1">{stats.OUT_FOR_DELIVERY}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className={`card-clean p-3 cursor-pointer ${
              activeStatus === 'COMPLETED' ? 'border-success shadow-sm' : ''
            }`}
            onClick={() => {
              setActiveStatus('COMPLETED');
              setPage(1);
            }}
          >
            <div className="text-success extra-small text-uppercase fw-bold d-flex align-items-center gap-1">
              <CheckCircle2 size={12} /> Completed
            </div>
            <div className="h4 fw-bold text-success mb-0 mt-1">{stats.COMPLETED}</div>
          </div>
        </div>

        <div className="col-6 col-md-4 col-xl-2">
          <div
            className={`card-clean p-3 cursor-pointer ${
              activeStatus === 'CANCELLED' ? 'border-danger shadow-sm' : ''
            }`}
            onClick={() => {
              setActiveStatus('CANCELLED');
              setPage(1);
            }}
          >
            <div className="text-danger extra-small text-uppercase fw-bold d-flex align-items-center gap-1">
              <XCircle size={12} /> Cancelled
            </div>
            <div className="h4 fw-bold text-danger mb-0 mt-1">{stats.CANCELLED}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-clean p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control bg-dark border-secondary text-white"
                placeholder="Search booking #, customer name, phone, address, tyre size..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-warning px-3">
                Search
              </button>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm bg-dark border-secondary text-white"
              value={serviceTypeFilter}
              onChange={(e) => {
                setServiceTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Service Modes</option>
              <option value="HOME_DELIVERY">🚚 Doorstep Home Delivery</option>
              <option value="WORKSHOP_VISIT">🏬 Workshop Visit</option>
            </select>
          </div>

          <div className="col-6 col-md-4 d-flex justify-content-end gap-2">
            {search && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  fetchAppointments();
                }}
              >
                Clear Search
              </button>
            )}
            <span className="text-secondary small d-flex align-items-center">
              Total Found: <strong className="text-white ms-1">{totalCount}</strong>
            </span>
          </div>
        </form>
      </div>

      {/* Appointments List / Table */}
      <div className="card-clean overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-5">
            <CalendarClock size={48} className="text-secondary mb-3 opacity-50" />
            <h5 className="text-white">No Appointments Found</h5>
            <p className="text-secondary small">
              {search || activeStatus !== 'all' || serviceTypeFilter
                ? 'Try clearing your filters to see more results.'
                : 'Customer appointment requests from the website will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead className="border-bottom border-secondary border-opacity-20 text-secondary extra-small text-uppercase">
                <tr>
                  <th scope="col" className="ps-3 py-3">Booking # / Date</th>
                  <th scope="col">Customer Contact</th>
                  <th scope="col">Delivery / Service</th>
                  <th scope="col">Tyre Ordered</th>
                  <th scope="col">Price & Charges</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end pe-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary divide-opacity-10">
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
                      <td className="ps-3 py-3">
                        <div className="font-monospace fw-bold text-warning small">
                          {apt.bookingNumber}
                        </div>
                        <div className="text-white small d-flex align-items-center gap-1 mt-0.5">
                          <Calendar size={12} className="text-secondary" />
                          {new Date(apt.appointmentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-secondary extra-small">
                          {apt.timeSlot.split(' ')[0]}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td>
                        <div className="fw-semibold text-white">{apt.customerName}</div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <a
                            href={`tel:${apt.customerPhone}`}
                            className="btn btn-xs btn-outline-secondary py-0.5 px-1.5 text-info d-flex align-items-center gap-1 text-decoration-none"
                            title="Call customer"
                          >
                            <Phone size={11} />
                            {formattedPhone}
                          </a>
                          <a
                            href={`https://wa.me/${waNumber}?text=${waMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-outline-success py-0.5 px-1.5 d-flex align-items-center gap-1 text-decoration-none"
                            title="Message on WhatsApp"
                          >
                            <MessageSquare size={11} />
                            WhatsApp
                          </a>
                        </div>
                        {apt.vehicleModel && (
                          <div className="text-secondary extra-small mt-0.5">
                            Vehicle: <span className="text-light">{apt.vehicleModel}</span>
                          </div>
                        )}
                      </td>

                      {/* Delivery Mode & Address */}
                      <td style={{ maxWidth: '240px' }}>
                        {apt.serviceType === 'HOME_DELIVERY' ? (
                          <>
                            <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 extra-small mb-1 d-inline-flex align-items-center gap-1">
                              <Truck size={11} /> Doorstep Delivery
                            </span>
                            <div className="small text-white text-truncate" title={apt.deliveryAddress}>
                              {apt.deliveryAddress}
                            </div>
                            {apt.landmark && (
                              <div className="text-secondary extra-small">
                                Near: {apt.landmark}
                              </div>
                            )}
                            <div className="text-secondary extra-small">
                              {apt.city} - {apt.pincode}
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="badge bg-secondary bg-opacity-30 text-light border border-secondary border-opacity-30 extra-small mb-1 d-inline-flex align-items-center gap-1">
                              <Building size={11} /> Workshop Visit
                            </span>
                            <div className="text-secondary extra-small">
                              Cantonment Market Shop #03, Ramgarh Cantt
                            </div>
                          </>
                        )}
                      </td>

                      {/* Tyre Ordered */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="p-1 rounded bg-secondary bg-opacity-20 text-warning"
                            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Disc3 size={16} />
                          </div>
                          <div>
                            <div className="fw-bold text-white small">
                              {apt.tyreDetails?.brandName} {apt.tyreDetails?.modelName}
                            </div>
                            <div className="text-secondary extra-small">
                              Size: <strong className="text-light">{apt.tyreDetails?.size}</strong> ({apt.tyreDetails?.vehicleType})
                            </div>
                            <div className="badge bg-dark border border-secondary text-light extra-small mt-0.5">
                              Qty: {apt.quantity} {apt.quantity > 1 ? 'Tyres' : 'Tyre'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price & Delivery Charge */}
                      <td>
                        <div className="text-white small fw-semibold">
                          {formatRupees(apt.totalAmountPaise)}
                        </div>
                        <div className="text-secondary extra-small">
                          Tyres: {formatRupees(apt.tyreTotalPaise)}
                        </div>
                        <div className="text-info extra-small">
                          Delivery: {apt.estimatedDeliveryChargePaise > 0 ? formatRupees(apt.estimatedDeliveryChargePaise) : 'Free / Distance TBD'}
                        </div>
                        <div className="text-success extra-small fw-semibold">
                          Fitting: FREE (₹0)
                        </div>
                      </td>

                      {/* Status */}
                      <td>{renderStatusBadge(apt.status)}</td>

                      {/* Actions */}
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
                            onClick={() => openStatusModal(apt)}
                          >
                            <Edit size={13} />
                            Manage
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: apt._id,
                                bookingNumber: apt.bookingNumber,
                              })
                            }
                            title="Delete booking"
                          >
                            <Trash2 size={13} />
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
          <div className="p-3 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
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
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content bg-dark border border-secondary border-opacity-30 text-white shadow-2xl">
              <div className="modal-header border-secondary border-opacity-20">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <CalendarClock className="text-warning" size={20} />
                  Manage Booking: {selectedAppointment.bookingNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowStatusModal(false)}
                />
              </div>

              <form onSubmit={handleStatusSubmit}>
                <div className="modal-body p-4">
                  {/* Customer Quick Summary */}
                  <div className="p-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-20 mb-3">
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong className="text-white">{selectedAppointment.customerName}</strong>
                        <div className="text-info small">{selectedAppointment.customerPhone}</div>
                      </div>
                      <div className="text-end">
                        <span className="text-secondary extra-small">Tyre:</span>
                        <div className="text-warning small fw-bold">
                          {selectedAppointment.quantity}x {selectedAppointment.tyreDetails?.brandName} {selectedAppointment.tyreDetails?.size}
                        </div>
                      </div>
                    </div>
                    {selectedAppointment.serviceType === 'HOME_DELIVERY' && (
                      <div className="text-secondary extra-small mt-2 pt-2 border-top border-secondary border-opacity-10">
                        <MapPin size={11} className="inline me-1 text-primary" />
                        {selectedAppointment.deliveryAddress}, {selectedAppointment.city}
                      </div>
                    )}
                  </div>

                  {/* Status Selector */}
                  <div className="mb-3">
                    <label className="form-label extra-small text-secondary fw-semibold">
                      Appointment Status *
                    </label>
                    <select
                      className="form-select bg-dark border-secondary text-white"
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
                  <div className="mb-3">
                    <label className="form-label extra-small text-secondary fw-semibold">
                      Distance-Based Delivery Charge (₹)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-secondary bg-opacity-20 border-secondary text-secondary">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        className="form-control bg-dark border-secondary text-white"
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
                    <span className="extra-small text-secondary">
                      Distance ke hisab se delivery charge set karein (Tyre fitting hamesha Free rahegi).
                    </span>
                  </div>

                  {/* Assigned Technician / Staff */}
                  <div className="mb-3">
                    <label className="form-label extra-small text-secondary fw-semibold">
                      Assigned Delivery Technician / Staff
                    </label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-white"
                      placeholder="e.g. Istiyak / Suresh (Driver)"
                      value={statusFormData.assignedStaff}
                      onChange={(e) =>
                        setStatusFormData({ ...statusFormData, assignedStaff: e.target.value })
                      }
                    />
                  </div>

                  {/* Admin Notes */}
                  <div className="mb-3">
                    <label className="form-label extra-small text-secondary fw-semibold">
                      Internal Admin Notes
                    </label>
                    <textarea
                      rows="2"
                      className="form-control bg-dark border-secondary text-white"
                      placeholder="e.g. Customer requested fitting at 11:30 AM, near Old Bus Stand..."
                      value={statusFormData.adminNotes}
                      onChange={(e) =>
                        setStatusFormData({ ...statusFormData, adminNotes: e.target.value })
                      }
                    />
                  </div>

                  {/* Cancelled Reason (only visible if CANCELLED) */}
                  {statusFormData.status === 'CANCELLED' && (
                    <div className="mb-3">
                      <label className="form-label extra-small text-danger fw-semibold">
                        Cancellation Reason
                      </label>
                      <input
                        type="text"
                        className="form-control bg-dark border-danger text-white"
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

                <div className="modal-footer border-secondary border-opacity-20">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowStatusModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-warning px-4"
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
