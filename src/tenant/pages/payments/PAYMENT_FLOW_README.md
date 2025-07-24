# Payment Method Selection Flow

This document describes the new payment method selection flow implemented in the Rusunawa application.

## Flow Overview

The payment flow has been restructured to provide a proper payment method selection process:

1. **Booking Creation** → User creates a booking through RoomDetail or BookRoom components
2. **Payment Method Selection** → User is redirected to `/bookings/{bookingId}/payment-method`
3. **Payment Execution** → Based on selection:
   - **Manual Payment**: Redirected to `/bookings/{bookingId}/manual-payment` or `/invoices/{invoiceId}/manual-payment`
   - **Midtrans Payment**: Redirected to `/bookings/{bookingId}/midtrans-payment` or `/invoices/{invoiceId}/midtrans-payment`
4. **Payment Verification** → Different flows for each method:
   - **Manual**: User uploads payment proof for admin verification
   - **Midtrans**: Automated verification through Midtrans webhook
5. **Invoice Update** → Payment status updates invoice accordingly

## New Routes Added

```javascript
// Payment method selection
/bookings/:bookingId/payment-method

// Manual payment flow
/bookings/:bookingId/manual-payment
/invoices/:invoiceId/manual-payment

// Midtrans payment flow
/bookings/:bookingId/midtrans-payment
/invoices/:invoiceId/midtrans-payment
```

## Components Created/Updated

### New Components
1. **PaymentMethodSelection** - Allows users to choose between Midtrans and Manual payment
2. **MidtransPayment** - Dedicated page for Midtrans payment processing
3. **ManualPayment** - Enhanced to handle both booking and invoice contexts

### Updated Components
1. **BookingModal** - Now redirects to payment method selection after booking creation
2. **PaymentProcess** - Added redirect logic to payment method selection if accessed directly
3. **tenantRoutes** - Added new payment-related routes

## Payment Method Selection Logic

The `PaymentMethodSelection` component:
1. Fetches available payment methods from the backend
2. Displays payment options with descriptions
3. Generates invoice with appropriate payment method
4. Redirects to the corresponding payment flow based on user selection

## Manual Payment Flow

Features:
- Bank transfer details input
- Payment proof upload
- Form validation
- Status tracking
- Admin verification workflow

## Midtrans Payment Flow

Features:
- Secure payment link generation
- Multiple payment options (cards, e-wallets, bank transfer, QRIS)
- Payment status checking
- Automatic webhook verification
- Fallback payment links when API is unavailable

## Usage Examples

### After Booking Creation
```javascript
// In BookingModal.jsx or BookRoom.jsx
navigate(`/tenant/bookings/${bookingId}/payment-method`);
```

### Manual Payment
```javascript
// From PaymentMethodSelection
navigate(`/tenant/invoices/${invoiceId}/manual-payment`);
// or
navigate(`/tenant/bookings/${bookingId}/manual-payment`);
```

### Midtrans Payment
```javascript
// From PaymentMethodSelection
navigate(`/tenant/invoices/${invoiceId}/midtrans-payment`, {
  state: { paymentUrl }
});
```

## Error Handling

Each component includes comprehensive error handling:
- Invalid ID validation
- Network error handling
- User-friendly error messages
- Graceful fallbacks

## Backward Compatibility

The old `/bookings/:bookingId/payment` route still exists but now redirects to the payment method selection page, ensuring backward compatibility.

## Testing

To test the flow:
1. Create a booking through the room booking process
2. Verify redirection to payment method selection
3. Test both manual and Midtrans payment flows
4. Verify proper navigation and state management
5. Test error scenarios (invalid IDs, network failures)
