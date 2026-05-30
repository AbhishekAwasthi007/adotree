# Tree Adoption Payment Flow Documentation

## Overview

This payment system implements a secure, multi-party transaction management system for tree adoptions with the following key features:

- **User Payment** → Money held in Admin Account
- **Delivery Verification** → Admin releases payment to Farmer
- **Farmer Wallet** → Farmers track earnings and manage withdrawals
- **Commission Tracking** → Each adoption tracked individually with commission calculations
- **Complete Audit Trail** → All transactions recorded for transparency and compliance

## Payment Flow Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Pays for Tree Adoption (Razorpay)
       │
       ▼
┌──────────────────────────────────┐
│   Admin Account (Holding Pool)   │
│  - Receives & holds all payments │
│  - Manages payment releases      │
└──────────────────────────────────┘
       │
       │ 2. After Delivery Verified
       │    Admin releases payment
       │
       ▼
┌──────────────────────────────────┐
│    Farmer Wallet (70%)           │
│ - Available: Can withdraw now    │
│ - Pending: Waiting verification  │
│ - Tracks all commissions         │
└──────────────────────────────────┘
       │
       │ 3. Farmer Requests Withdrawal
       │
       ▼
┌──────────────────────────────────┐
│    Farmer Bank Account           │
│ - Direct bank transfer           │
│ - UPI payment                    │
└──────────────────────────────────┘
```

## Database Models

### 1. Transaction Model
Tracks all financial movements in the system.

```python
class Transaction:
    - transaction_type: ADOPTION_PAYMENT, PAYMENT_RELEASE, REFUND, COMMISSION
    - status: PENDING, COMPLETED, FAILED, REVERSED
    - amount: Decimal
    - from_user_id: Who initiated (User or Admin)
    - to_user_id: Who receives (Farmer or null for admin account)
    - adoption_id: Reference to adoption
    - payment_id: Reference to payment
    - delivery_id: Reference to delivery
    - released_by_admin_id: Admin who released
    - released_at: When payment was released
    - commission_percentage & amount: Tracked for transparency
```

### 2. FarmerWallet Model
Tracks farmer's earnings and bank details.

```python
class FarmerWallet:
    - farmer_id: Reference to farmer
    - total_earned: Sum of all commissions
    - available_balance: Can withdraw now
    - pending_balance: Waiting for delivery verification
    - withdrawn_amount: Total withdrawn to date
    - bank_account_holder: For verification
    - bank_account_number: Encrypted in production
    - bank_ifsc_code: Bank routing
    - upi_id: Alternative payment method
    - bank_verified: Admin verification status
```

### 3. Commission Model
Tracks commission per adoption.

```python
class Commission:
    - adoption_id: Which tree adoption
    - farmer_id: Which farmer
    - adoption_price: User paid amount
    - commission_percentage: 70% (configurable)
    - commission_amount: Calculated amount
    - status: PENDING → RELEASED
    - released_at: When admin released
    - released_by_admin_id: Which admin
```

### 4. AdminBankAccount Model
Admin's receiving account for payments.

```python
class AdminBankAccount:
    - account_holder_name: Platform name
    - bank_name: Bank details
    - account_number: Encrypted
    - ifsc_code: Routing info
    - upi_id: Optional UPI
    - is_active: Account active status
    - verified: Admin verified
```

## API Endpoints

### Admin Endpoints (`/admin/payments`)

#### 1. Get All Transactions
```
GET /admin/transactions?transaction_type=ADOPTION_PAYMENT&status=COMPLETED&skip=0&limit=50
Response: List of all transactions with filters
```

#### 2. Get Pending Commissions
```
GET /admin/pending-commissions
Response: Commissions waiting for payment release
```

#### 3. Release Payment to Farmer
```
POST /admin/release-payment/{commission_id}?delivery_id={delivery_id}
Body: None (delivery must be marked as 'delivered')
Response: {
    "message": "Payment released successfully",
    "transaction_id": "uuid",
    "amount": "Decimal"
}
```

#### 4. Get Adoption Payment Status
```
GET /admin/adoption-payment-status/{adoption_id}
Response: {
    "adoption_id": "uuid",
    "payment": {
        "amount": "1000.00",
        "status": "completed",
        "transaction_id": "razorpay_id"
    },
    "commission": {
        "amount": "700.00",
        "percentage": "70",
        "status": "pending",
        "released_at": null
    },
    "delivery": {
        "status": "delivered",
        "payment_released": false,
        "payment_released_at": null
    }
}
```

#### 5. Payment Statistics Dashboard
```
GET /admin/payment-statistics
Response: {
    "total_adoption_payments": "50000.00",
    "total_payments_released": "35000.00",
    "held_in_admin_account": "15000.00",
    "pending_commissions": {
        "count": 5,
        "total_amount": "3500.00"
    },
    "held_commissions_total": "15000.00"
}
```

### Farmer Endpoints (`/farmer/wallet`)

#### 1. Get Farmer Wallet
```
GET /farmer/wallet
Response: {
    "id": "uuid",
    "farmer_id": "uuid",
    "total_earned": "700.00",
    "available_balance": "0.00",
    "pending_balance": "700.00",
    "withdrawn_amount": "0.00",
    "bank_account_number": "****1234",
    "bank_verified": false
}
```

#### 2. Update Bank Details
```
PUT /farmer/wallet
Body: {
    "bank_account_holder": "Farmer Name",
    "bank_name": "ICICI Bank",
    "bank_account_number": "1234567890123",
    "bank_ifsc_code": "ICIC0000001",
    "upi_id": "farmer@upi"
}
Response: Updated wallet details
```

#### 3. Get Farmer Transactions
```
GET /farmer/transactions?skip=0&limit=50
Response: List of payment releases received by farmer
```

#### 4. Get Earnings Summary
```
GET /farmer/earnings-summary
Response: {
    "total_earned": "700.00",
    "available_balance": "700.00",
    "pending_balance": "0.00",
    "withdrawn_amount": "0.00",
    "commission_stats": {
        "released_count": 1,
        "pending_count": 0
    }
}
```

#### 5. Request Withdrawal
```
POST /farmer/request-withdrawal
Body: {
    "amount": 500.00
}
Response: {
    "message": "Withdrawal request created successfully",
    "amount": "500.00",
    "status": "pending_admin_approval"
}
```

## Payment Processing Steps

### Step 1: User Adopts Tree & Makes Payment

```python
# Frontend initiates Razorpay payment
POST /payments/create-order
{
    "tree_id": "uuid",
    "amount": 1000.00
}

Response: {
    "order_id": "razorpay_order_123",
    "amount": 100000,  # in paise
    "currency": "INR"
}
```

### Step 2: Payment Verification & Transaction Creation

```python
# After payment on Razorpay, frontend verifies
POST /payments/verify
{
    "razorpay_order_id": "order_123",
    "razorpay_payment_id": "pay_123",
    "razorpay_signature": "sig_123",
    "tree_id": "uuid",
    "custom_tree_name": "My Mango",
    "occasion_type": "Birthday",
    "dedication_message": "For my son"
}
```

**System creates automatically:**
1. Adoption record (status: active)
2. Payment record (status: completed)
3. **Transaction record** (ADOPTION_PAYMENT, holding in admin account)
4. **Commission record** (PENDING, waiting for delivery)
5. FarmerWallet is auto-created if doesn't exist
6. TreeMemory (initial ceremony memory)
7. Certificate generation task
8. User notification

### Step 3: Fruit Delivery & Admin Verification

When fruit is delivered:

```python
# Admin marks delivery as delivered
PUT /deliveries/{delivery_id}
{
    "status": "delivered",
    "delivery_proof": "image_url",
    "actual_delivery_date": "2026-05-30"
}
```

### Step 4: Admin Releases Payment to Farmer

```python
# Admin verifies delivery and releases payment
POST /admin/release-payment/{commission_id}?delivery_id={delivery_id}

System:
1. Verifies delivery status is "delivered"
2. Creates new Transaction (PAYMENT_RELEASE)
3. Updates FarmerWallet:
   - Adds to available_balance
   - Adds to total_earned
   - Removes from pending_balance
4. Updates Commission status to "RELEASED"
5. Marks delivery as payment_released
```

## Commission Calculation

### Default Configuration
- **Farmer Commission:** 70% of adoption price
- **Platform Fee:** 30% of adoption price

### Example
```
Adoption Price: ₹1000
Farmer Commission: ₹1000 × 70% = ₹700
Platform Fee: ₹1000 × 30% = ₹300
```

## Transaction Status Flow

### For Adoption Payment (ADOPTION_PAYMENT)
```
User Pays → PENDING → COMPLETED (or FAILED/REFUNDED)
```

### For Payment Release (PAYMENT_RELEASE)
```
Delivery Verified → PENDING → COMPLETED
```

## Error Handling

### Payment Release Errors

1. **Commission not found** - Invalid commission_id
2. **Delivery not found** - Invalid delivery_id
3. **Delivery not delivered** - Delivery status must be "delivered"
4. **Commission already released** - Cannot release same commission twice
5. **Database errors** - Automatic rollback on transaction failure

## Security Considerations

1. **Bank Account Protection**
   - Encrypt account numbers in production
   - PCI DSS compliance for stored payment methods
   - Separate bank account for each farmer

2. **Transaction Integrity**
   - All transactions immutable once committed
   - Admin approval required for all payments
   - Delivery verification before payment release

3. **Audit Trail**
   - Complete history of all transactions
   - Timestamps on all operations
   - Admin ID tracked for accountability
   - Notes field for additional documentation

4. **Withdrawal Security**
   - Bank verification required before withdrawal
   - Admin approval process recommended
   - Rate limiting on withdrawal requests

## Admin Dashboard Metrics

The payment statistics endpoint provides:
- Total adoption payments received
- Total payments released to farmers
- Amount currently held in admin account
- Count and total of pending commissions
- Pending release commissions value

## Farmer Dashboard Metrics

The farmer wallet provides:
- Total earned from all adoptions
- Available balance for withdrawal
- Pending balance (awaiting delivery)
- Total withdrawn to date
- Commission statistics (count of released/pending)

## Future Enhancements

1. **Automated Withdrawal**
   - Scheduled batch withdrawals for approved farmers
   - Auto-withdrawal when threshold reached

2. **Commission Tiers**
   - Different commission percentages based on:
     - Farmer verification level
     - Adoption frequency
     - Customer reviews

3. **Refund Management**
   - Handle adoption cancellations
   - Reverse transactions when needed
   - Refund to original payment method

4. **Payment Analytics**
   - Commission trends
   - Farmer earnings comparison
   - Payment processing times
   - Farmer withdrawal patterns

5. **Integration**
   - Bank reconciliation
   - Automated accounting exports
   - Tax reporting

## Testing

```bash
# Test adoption payment with mock Razorpay
curl -X POST http://localhost:8000/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_mock_test",
    "razorpay_payment_id": "pay_mock_test",
    "razorpay_signature": "sig_mock_test",
    "tree_id": "tree-uuid",
    "custom_tree_name": "Test Tree"
  }'

# Get admin statistics
curl http://localhost:8000/admin/payment-statistics \
  -H "Authorization: Bearer admin_token"

# Get farmer wallet
curl http://localhost:8000/farmer/wallet \
  -H "Authorization: Bearer farmer_token"
```

## Configuration

Add to `app/core/config.py`:
```python
# Commission percentage (0-100)
DEFAULT_COMMISSION_PERCENTAGE: float = 70.0

# Minimum withdrawal amount
MIN_WITHDRAWAL_AMOUNT: float = 100.0

# Maximum pending balance before auto-refund (in days)
PENDING_PAYMENT_EXPIRY_DAYS: int = 30
```
