# Payment System - Complete User Journey & Examples

## User Journey Diagrams

### Complete Payment Lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│ STAGE 1: ADOPTION & PAYMENT                                    │
├────────────────────────────────────────────────────────────────┤
│
│  USER                 → Selects Tree
│  ↓
│  USER                 → Initiates Razorpay Payment
│  ↓
│  RAZORPAY             → User completes payment
│  ↓
│  FRONTEND             → Sends verification to backend
│  ↓
│  BACKEND              → Verifies Razorpay signature
│                       ↓
│                       → Creates Adoption (status: active)
│                       → Creates Payment (status: completed)
│                       → Creates Transaction (ADOPTION_PAYMENT)
│                       → Creates Commission (status: pending)
│                       → Creates/Updates FarmerWallet
│                       → Marks Tree as "adopted"
│                       → Sends certificate task to celery
│                       → Notifies user
│  ↓
│  USER NOTIFICATION   → "Adoption successful! Certificate being prepared"
│
│  MONEY STATUS        → ₹1000 held in ADMIN ACCOUNT
│  FARMER BALANCE      → ₹700 PENDING (waiting for delivery)
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ STAGE 2: FRUIT GROWING & DELIVERY                              │
├────────────────────────────────────────────────────────────────┤
│
│  FARMER               → Cares for tree
│                       → Updates memories/photos
│                       → Tracks growth
│  ↓
│  FRUIT READY         → Harvest occurs
│  ↓
│  FARMER/ADMIN        → Packages fruit
│                       → Creates delivery record
│                       → Updates delivery status
│  ↓
│  DELIVERY TRACKING   → "processing" → "shipped" → "out_for_delivery"
│  ↓
│  FRUIT ARRIVES       → User receives package
│  ↓
│  USER/ADMIN          → Marks delivery as "delivered"
│                       → Updates delivery_proof (photo/signature)
│
│  MONEY STATUS        → ₹1000 still in ADMIN ACCOUNT
│  FARMER BALANCE      → ₹700 still PENDING
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ STAGE 3: PAYMENT RELEASE TO FARMER                             │
├────────────────────────────────────────────────────────────────┤
│
│  ADMIN                → Views pending commissions
│                       → Gets commission details
│  ↓
│  ADMIN                → Verifies delivery is "delivered"
│                       → Verifies payment amount correct
│                       → Approves payment release
│  ↓
│  SYSTEM               → Creates Transaction (PAYMENT_RELEASE)
│                       → Updates Commission status → "RELEASED"
│                       → Updates FarmerWallet:
│                         - available_balance += ₹700
│                         - total_earned += ₹700
│                         - pending_balance -= ₹700
│                       → Updates Delivery:
│                         - payment_released = true
│                         - payment_released_at = timestamp
│  ↓
│  FARMER NOTIFICATION → "Payment released! ₹700 available in wallet"
│
│  MONEY STATUS        → ₹300 (30% commission) kept by ADMIN
│                       → ₹700 moved to FARMER WALLET
│  FARMER BALANCE      → ₹700 AVAILABLE
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ STAGE 4: FARMER WITHDRAWAL                                     │
├────────────────────────────────────────────────────────────────┤
│
│  FARMER               → Adds bank account details
│                       → Requests bank verification (admin)
│  ↓
│  ADMIN                → Verifies bank details
│                       → Marks wallet.bank_verified = true
│  ↓
│  FARMER               → Requests withdrawal (₹700)
│  ↓
│  SYSTEM               → Validates:
│                         - Bank verified? YES
│                         - Sufficient balance? YES (₹700 >= ₹700)
│  ↓
│  ADMIN                → Reviews withdrawal requests
│                       → Processes payment to bank
│  ↓
│  BANK TRANSFER        → ₹700 → Farmer's Bank Account
│  ↓
│  SYSTEM               → Updates wallet:
│                         - available_balance = 0
│                         - withdrawn_amount = ₹700
│  ↓
│  FARMER NOTIFICATION → "Withdrawal processed! ₹700 transferred"
│
│  MONEY STATUS        → ₹700 WITHDRAWN
│  FARMER BALANCE      → ₹0 (completed this cycle)
└────────────────────────────────────────────────────────────────┘
```

## Example Scenarios

### Scenario 1: Happy Path - Complete Adoption

**Timeline: User adopts mango tree for ₹1000**

```
Day 1 (Adoption):
├─ 10:00 AM - User sees mango tree on website
├─ 10:05 AM - User clicks "Adopt This Tree"
├─ 10:10 AM - User completes Razorpay payment of ₹1000
├─ 10:11 AM - Backend verification successful
│   ├─ ✅ Adoption created (active)
│   ├─ ✅ Payment logged (completed)
│   ├─ ✅ Transaction created (ADOPTION_PAYMENT)
│   ├─ ✅ Commission created (₹700 pending for farmer)
│   ├─ ✅ FarmerWallet updated (pending_balance: ₹700)
│   ├─ ✅ Certificate generation queued
│   └─ ✅ User notified
├─ 10:15 AM - User receives notification and certificate
│   └─ "Congratulations! Your mango tree is adopted!"
│
│ System Status:
│ - Admin Account: +₹1000 (held)
│ - Farmer Pending: +₹700
│ - Platform Commission: +₹300 (kept)

Days 2-180 (Fruit Growing):
├─ Farmer updates photos regularly
├─ Memories and timeline created
├─ System tracks tree health
└─ User receives monthly updates

Day 181 (Delivery):
├─ Farmer harvests mangoes
├─ Farmer packages with care
├─ Admin creates delivery record
├─ Delivery assigned to shipper
├─ Tracking updates: processing → shipped → out for delivery
├─ User receives package with 5-10 fresh mangoes
├─ User/Admin marks delivery as complete
│
│ System Status (Before Payment Release):
│ - Admin Account: Still ₹1000 (held)
│ - Farmer Pending: ₹700 (waiting)

Day 182 (Admin Verifies & Releases):
├─ Admin checks pending commissions
├─ Admin verifies delivery status: ✅ "delivered"
├─ Admin verifies payment amount: ✅ ₹700 correct
├─ Admin clicks "Release Payment"
├─ System processes:
│   ├─ ✅ Transaction created (PAYMENT_RELEASE)
│   ├─ ✅ Commission marked: RELEASED
│   ├─ ✅ FarmerWallet updated:
│   │   ├─ available_balance: +₹700
│   │   ├─ total_earned: +₹700
│   │   └─ pending_balance: -₹700
│   └─ ✅ Farmer notified
├─ Farmer receives notification
│   └─ "Payment released! ₹700 available in your wallet"
│
│ System Status (After Payment Release):
│ - Admin Account: ₹300 remaining (commission)
│ - Farmer Available: ₹700 (can withdraw)
│ - Platform Commission: ₹300 (kept)

Day 183 (Farmer Withdraws):
├─ Farmer adds bank account details
├─ Admin verifies bank account
├─ Farmer requests withdrawal of ₹700
├─ Admin approves
├─ Bank transfer initiated
├─ Farmer receives ₹700 in bank
│
│ System Status (Final):
│ - Admin Account: ₹300 (platform fee)
│ - Farmer Bank: ₹700 (received)
│ - Platform Revenue: ₹300
│ - Farmer Earnings: ₹700
```

### Scenario 2: Multiple Adoptions from Same Farmer

**Timeline: Farmer has 5 tree adoptions processed**

```
Adoption 1:
├─ Tree: Mango
├─ User Payment: ₹1000
├─ Farmer Commission (70%): ₹700
└─ Status: ✅ Released to wallet

Adoption 2:
├─ Tree: Orange
├─ User Payment: ₹800
├─ Farmer Commission (70%): ₹560
└─ Status: ✅ Released to wallet

Adoption 3:
├─ Tree: Apple
├─ User Payment: ₹1200
├─ Farmer Commission (70%): ₹840
└─ Status: ⏳ Pending (delivery in progress)

Adoption 4:
├─ Tree: Banana
├─ User Payment: ₹600
├─ Farmer Commission (70%): ₹420
└─ Status: ✅ Released to wallet

Adoption 5:
├─ Tree: Guava
├─ User Payment: ₹500
├─ Farmer Commission (70%): ₹350
└─ Status: ⏳ Pending (delivery next week)

─────────────────────────────────────

Farmer Wallet Summary:
├─ Total Earned: ₹2770 (700 + 560 + 840 + 420 + 350)
├─ Available Balance: ₹1680 (can withdraw now)
├─ Pending Balance: ₹1090 (waiting for delivery)
├─ Withdrawn Amount: ₹0 (haven't withdrawn yet)
│
├─ Commission Details:
│  ├─ Released: 4 (valued ₹2680)
│  ├─ Pending: 2 (valued ₹1090)
│  └─ Total: 6 trees adopted
```

### Scenario 3: Multiple Payment Releases by Admin

**Timeline: Admin releases 10 commissions in one day**

```
Admin Dashboard View:
├─ Total Adoption Payments: ₹50,000 (held)
├─ Total Payments Released: ₹35,000
├─ Currently Held: ₹15,000
├─ Pending Commissions: 10 (₹10,500 total)
└─ Transaction Count: 25

Release Process:
├─ 09:00 AM - Admin views pending commissions
│            - 10 commissions ready for release
│            - Total: ₹10,500 to be released
├─ 09:05 AM - Admin verifies each delivery status
│            - All 10 deliveries marked as "delivered"
│            - All delivery proofs verified
├─ 09:15 AM - Admin releases all 10 commissions
│            ├─ Release 1: ₹1000 → Farmer A
│            ├─ Release 2: ₹1200 → Farmer B
│            ├─ Release 3: ₹900 → Farmer C
│            ├─ Release 4: ₹1100 → Farmer D
│            ├─ Release 5: ₹1050 → Farmer A
│            ├─ Release 6: ₹1200 → Farmer E
│            ├─ Release 7: ₹800 → Farmer B
│            ├─ Release 8: ₹950 → Farmer F
│            ├─ Release 9: ₹1100 → Farmer C
│            └─ Release 10: ₹1200 → Farmer D
│
│ 10 Transactions created (PAYMENT_RELEASE)
│ 10 Commissions marked: RELEASED
│ 6 Farmer wallets updated

Summary after releases:
├─ Total Released: ₹10,500
├─ Farmer A Balance: ₹2000 (from 2 adoptions)
├─ Farmer B Balance: ₹1700 (from 2 adoptions)
├─ Farmer C Balance: ₹1850 (from 2 adoptions)
├─ Farmer D Balance: ₹2300 (from 2 adoptions)
├─ Farmer E Balance: ₹1200 (from 1 adoption)
├─ Farmer F Balance: ₹950 (from 1 adoption)
│
└─ All farmers notified of payment release
```

### Scenario 4: Error Handling - Delivery Not Marked Complete

**Timeline: Admin tries to release before delivery confirmation**

```
Admin Action:
├─ Admin tries to release payment for Commission ID: comm-123
├─ Delivery ID: del-123
│
System Validation:
├─ ❌ Check delivery status
│  └─ Status: "out_for_delivery" (not "delivered")
│
Error Response:
├─ Status: 400 Bad Request
├─ Message: "Delivery status must be 'delivered', currently: out_for_delivery"
│
Result:
├─ ❌ Payment NOT released
├─ ❌ Commission still PENDING
├─ ❌ FarmerWallet NOT updated
├─ ✅ Transaction NOT created
│
Fix Required:
├─ Admin marks delivery as "delivered"
├─ Admin verifies delivery proof (photo/signature)
├─ Then tries to release payment again
│
Retry (After Delivery Marked Complete):
├─ ✅ Delivery status: "delivered"
├─ ✅ Release payment successful
├─ ✅ Payment released: ₹700
└─ ✅ Farmer wallet updated
```

### Scenario 5: Admin Account Fund Management

**Timeline: Tracking money flow through admin account**

```
Day 1:
├─ Total Adoptions: 0
├─ Admin Account: ₹0
├─ Farmer Pending: ₹0
├─ Total Income: ₹0

After User A Adopts (₹1000):
├─ Total Adoptions: 1
├─ Admin Account: ₹1000 (held for farmer + commission)
├─ Farmer A Pending: ₹700
├─ Platform Commission: ₹300
│
├─ Breakdown:
│  ├─ Will go to Farmer: ₹700
│  └─ Platform keeps: ₹300

After User B Adopts (₹1500):
├─ Total Adoptions: 2
├─ Admin Account: ₹2500 (1000 + 1500)
├─ Farmer A Pending: ₹700
├─ Farmer B Pending: ₹1050
├─ Platform Commission: ₹450 (300 + 150)

After Admin Releases Farmer A:
├─ Total Adoptions: 2
├─ Admin Account: ₹1500 (held for B only)
├─ Farmer A Withdrawn: ₹700
├─ Farmer B Pending: ₹1050
├─ Platform Commission: ₹450

Quarterly Report:
├─ Total Adoption Income: ₹2,500,000
├─ Total Payments Released: ₹1,750,000 (70% to farmers)
├─ Platform Commission: ₹750,000 (30% kept)
├─ Currently Held: ₹750,000 (not yet released)
├─ Number of Adoptions: 2500
├─ Active Farmers: 150
└─ Average Payment Time: 6 days
```

## Key Metrics for Monitoring

### Admin Dashboard Metrics

```
Payment Flow Metrics:
├─ Total Adoption Income: ₹X
├─ Total Payments Released: ₹Y
├─ Money Currently Held: ₹X-Y
├─ Platform Commission Rate: 30%
├─ Average Release Time: N days

Efficiency Metrics:
├─ Pending Commissions: N count
├─ Average Time to Release: N days
├─ Failed Payment Attempts: N
├─ Refund Rate: X%

Farmer Metrics:
├─ Total Active Farmers: N
├─ Average Earnings per Farmer: ₹X
├─ Farmers with Pending Payments: N
├─ Farmers with Withdrawn Funds: N
```

### Farmer Dashboard Metrics

```
Earnings Summary:
├─ Total Earned: ₹X
├─ Available Balance: ₹Y (can withdraw)
├─ Pending Balance: ₹Z (waiting for delivery)
├─ Withdrawn: ₹W

Commission Details:
├─ Released Adoptions: N
├─ Pending Adoptions: M
├─ Average Commission per Tree: ₹X

Withdrawal History:
├─ Total Withdrawn: ₹X
├─ Last Withdrawal: Date
├─ Next Available: Date
└─ Bank Verified: Yes/No
```

## Testing Checklist

### Payment Flow Testing

- [ ] User payment creates transaction record
- [ ] Commission created with correct amount (70%)
- [ ] Farmer wallet auto-created
- [ ] Admin can view pending commissions
- [ ] Admin can release payment after delivery confirmed
- [ ] Farmer wallet balance updated after release
- [ ] Farmer can view released payments
- [ ] Farmer can add bank details
- [ ] Farmer can request withdrawal
- [ ] Transaction audit trail complete

### Error Scenarios

- [ ] Release payment before delivery → Error
- [ ] Release already released payment → Error
- [ ] Farmer withdrawal without bank details → Error
- [ ] Farmer withdrawal exceeding balance → Error
- [ ] Database rollback on payment error → Data consistent

### Security Testing

- [ ] Non-admin cannot release payments
- [ ] Non-farmer cannot access wallet
- [ ] Payment amounts cannot be modified
- [ ] Transactions are immutable
- [ ] Admin ID tracked for accountability
