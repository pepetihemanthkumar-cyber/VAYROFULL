import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Printer, X, FileText } from 'lucide-react'
import { GlassButton } from '../ui/GlassButton'
import { Brand } from '../layout/Brand'
import { modalTransition, backdropTransition } from '../../animations/variants'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useEscapeKey } from '../../hooks/useEscapeKey'

export function InvoiceModal({ isOpen, onClose, booking }) {
  useEscapeKey(isOpen, onClose)

  function handlePrint() {
    window.print()
  }

  const vehicle = booking?.vehicle || booking?.vehicleSnapshot || {}
  const driver = booking?.driverDetails || booking?.driverSnapshot || {}
  const durationLabel = booking?.durationLabel || `${booking?.rentalDays || 1} days`
  const bookingDate = booking?.createdAt ? formatDate(booking.createdAt.slice(0, 10)) : booking?.pickupDate ? formatDate(booking.pickupDate) : 'Today'
  const isBike = (vehicle.type || '').toUpperCase() === 'BIKE' || booking?.vehicleCategory === 'BIKE' || vehicle.vehicleType === 'bike' || booking?.vehicleType === 'bike'
  const invoiceTitle = isBike ? 'VAYRO BIKE RENTAL INVOICE' : 'VAYRO CAR RENTAL INVOICE'

  if (!booking) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop-layer" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title">
          <motion.div
            className="modal-backdrop"
            onClick={onClose}
            variants={backdropTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
          <motion.div
            className="invoice-modal-panel"
            variants={modalTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Modal Actions Header */}
            <div className="invoice-modal-header no-print">
              <div className="invoice-modal-title-group">
                <FileText size={20} className="text-secondary" aria-hidden="true" />
                <h3 id="invoice-modal-title">Rental Invoice & Receipt</h3>
              </div>
              <div className="invoice-modal-actions">
                <GlassButton variant="primary" onClick={handlePrint} size="sm">
                  <Printer size={15} aria-hidden="true" /> Print / Save PDF
                </GlassButton>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={onClose}
                  aria-label="Close invoice"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div className="invoice-printable-sheet" id="vayro-invoice-sheet">
              {/* Header */}
              <div className="invoice-sheet-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Brand size="sm" />
                  <div>
                    <h1 className="invoice-brand-title" style={{ margin: 0 }}>VAYRO</h1>
                    <p className="invoice-brand-subtitle">{invoiceTitle}</p>
                    <small className="invoice-address-line">
                      VAYRO India Mobility HQ · MG Road, Governorpet, Vijayawada · GSTIN: 37AAAAA0000A1Z5
                    </small>
                  </div>
                </div>
                <div className="invoice-meta-block">
                  <span className="invoice-type-tag">{invoiceTitle}</span>
                  <div className="invoice-meta-row">
                    <span>Invoice / Ref:</span>
                    <strong>{booking.id}</strong>
                  </div>
                  <div className="invoice-meta-row">
                    <span>Payment Ref:</span>
                    <strong>{booking.paymentReference || 'PAY-2026-VERIFIED'}</strong>
                  </div>
                  <div className="invoice-meta-row">
                    <span>Issue Date:</span>
                    <strong>{bookingDate}</strong>
                  </div>
                </div>
              </div>

              <div className="invoice-divider-line" />

              {/* Customer & Vehicle Info Grid */}
              <div className="invoice-parties-grid">
                <div className="invoice-party-box">
                  <p className="invoice-section-title">BILLED TO ({isBike ? 'RIDER' : 'CUSTOMER / DRIVER'})</p>
                  <strong>{driver.fullName || (isBike ? 'Verified Rider' : 'Verified Driver')}</strong>
                  <p>{driver.email || 'customer@vayro.com'}</p>
                  <p>Phone: {driver.phone || '+91 98765 43210'}</p>
                  <p>License: {driver.licenseNumber || 'MH01-2022-009182'}</p>
                </div>

                <div className="invoice-party-box">
                  <p className="invoice-section-title">{isBike ? 'RENTAL MOTORCYCLE / SCOOTER' : 'RENTAL CAR'}</p>
                  <strong>{vehicle.name || `${vehicle.brand} ${vehicle.model}`}</strong>
                  {isBike ? (
                    <>
                      <p>Type: <strong>Bike Rental</strong> ({vehicle.category || vehicle.type} · {vehicle.class || 'Standard'})</p>
                      <p>Engine / Power: <strong>{vehicle.enginePower || `${vehicle.engine || 'High Output'} Motor`}</strong></p>
                      <p>Reg No: <strong>{vehicle.registrationNumber || 'AP 16 BK 2026'}</strong></p>
                      <p>Safety Equipment: <strong>1 DOT Helmet Included</strong></p>
                    </>
                  ) : (
                    <>
                      <p>Type: <strong>Car Rental</strong> ({vehicle.category || vehicle.type} · {vehicle.class || 'Sedan'})</p>
                      <p>{vehicle.year} · {vehicle.transmission} · {vehicle.fuelType} · {vehicle.seats || 5} Seats</p>
                      <p>Reg No: <strong>{vehicle.registrationNumber || 'AP 16 VY 2026'}</strong></p>
                    </>
                  )}
                  <p>Daily Base Rate: {formatCurrency(booking.dailyRate || vehicle.dailyRate || 0)} / day</p>
                </div>
              </div>

              {/* Schedule & Depot Grid */}
              <div className="invoice-schedule-card">
                <div className="invoice-schedule-col">
                  <span className="invoice-tag">PICK-UP</span>
                  <strong>{formatDate(booking.pickupDate)} · {booking.pickupTime || '10:00 AM'}</strong>
                  <p>{booking.pickupLocation || 'VAYRO Vijayawada Central'}</p>
                </div>
                <div className="invoice-schedule-col">
                  <span className="invoice-tag">DURATION</span>
                  <strong>{durationLabel}</strong>
                  <p>Confirmed Fleet Schedule</p>
                </div>
                <div className="invoice-schedule-col">
                  <span className="invoice-tag">RETURN</span>
                  <strong>{formatDate(booking.returnDate)} · {booking.returnTime || '10:00 AM'}</strong>
                  <p>{booking.returnLocation || 'VAYRO Vijayawada Central'}</p>
                </div>
              </div>

              {/* Itemized Fare Statement Table */}
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Rate / Basis</th>
                    <th>Duration</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{isBike ? 'Motorcycle Base Rental' : 'Vehicle Base Rental'}</strong>
                      <p className="item-subtext">{vehicle.name} reservation fare</p>
                    </td>
                    <td>{formatCurrency(booking.dailyRate || vehicle.dailyRate || 0)} / day</td>
                    <td>{durationLabel}</td>
                    <td className="text-right">{formatCurrency(booking.baseRate || booking.vehicleTotal || 0)}</td>
                  </tr>

                  {booking.discount > 0 && (
                    <tr>
                      <td>
                        <strong className="text-success">Duration Discount</strong>
                        <p className="item-subtext">Multi-day long duration promotion</p>
                      </td>
                      <td>Promo savings</td>
                      <td>{durationLabel}</td>
                      <td className="text-right text-success">- {formatCurrency(booking.discount)}</td>
                    </tr>
                  )}

                  {booking.couponDiscount > 0 && (
                    <tr>
                      <td>
                        <strong className="text-success">Coupon Code: {booking.couponCode}</strong>
                        <p className="item-subtext">Promotional voucher discount</p>
                      </td>
                      <td>Promo code</td>
                      <td>—</td>
                      <td className="text-right text-success">- {formatCurrency(booking.couponDiscount)}</td>
                    </tr>
                  )}

                  {(booking.addonsList || []).map((addon) => (
                    <tr key={addon.id}>
                      <td>
                        <strong>{addon.name}</strong>
                        <p className="item-subtext">{addon.description}</p>
                      </td>
                      <td>{formatCurrency(addon.pricePerDay)} / day</td>
                      <td>{durationLabel}</td>
                      <td className="text-right">{formatCurrency(addon.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="invoice-total-row">
                    <td colSpan="3">
                      <strong>TOTAL PAID IN FULL (INR)</strong>
                      <p className="item-subtext">All applicable GST taxes and service charges included</p>
                    </td>
                    <td className="text-right">
                      <strong className="invoice-grand-total">{formatCurrency(booking.totalAmount)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer Notes & Legal */}
              <div className="invoice-footer-notes">
                <div className="invoice-compliance-pill">
                  <CheckCircle2 size={15} className="text-success" aria-hidden="true" />
                  <span>Payment Verified · Zero Outstanding Balance</span>
                </div>
                <p>
                  {isBike
                    ? 'Mandatory helmet safety compliance applies to rider and pillion passenger under Indian Motor Vehicles Act. Vehicles are GPS-equipped and sanitized before every handover.'
                    : 'Vehicles are sanitized, commercially insured, and GPS-monitored. 24/7 Roadside Assistance helpline: 1800-DRIVE-EASE.'}
                </p>
                <small>
                  This is a computer-generated official tax invoice and booking receipt requiring no physical signature.
                </small>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
