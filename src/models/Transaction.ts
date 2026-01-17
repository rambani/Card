/**
 * Transaction Model
 *
 * Represents a payment transaction in the system.
 *
 * HOW TRANSACTION IDENTIFICATION WORKS:
 * =====================================
 *
 * When a card is used for a transaction, the payment network (Visa, Mastercard, etc.)
 * transmits several key pieces of data that help identify the transaction type:
 *
 * 1. MERCHANT CATEGORY CODE (MCC)
 *    - 4-digit code assigned to merchants by card networks
 *    - Identifies the type of business (restaurant, gas station, airline, etc.)
 *    - Set when merchant opens their payment processing account
 *    - Example: 5812 = Restaurants, 5411 = Grocery Stores, 3000-3299 = Airlines
 *
 * 2. MERCHANT ID (MID)
 *    - Unique identifier for the specific merchant
 *    - Allows for merchant-specific bonuses and offers
 *
 * 3. TRANSACTION AMOUNT
 *    - Total purchase amount
 *    - May affect reward tiers or qualifying thresholds
 *
 * 4. CARD PRESENT vs CARD NOT PRESENT
 *    - Indicates if physical card was used (swipe/chip/tap) or online
 *    - Affects fraud risk and sometimes reward categories
 *
 * 5. TERMINAL TYPE
 *    - POS terminal, ATM, e-commerce, mobile payment
 *    - Helps identify transaction context
 */

export enum TransactionStatus {
  PENDING = 'PENDING',           // Authorization received, not yet settled
  AUTHORIZED = 'AUTHORIZED',     // Approved but funds not yet captured
  CAPTURED = 'CAPTURED',         // Funds captured from card
  SETTLED = 'SETTLED',           // Transaction completed
  DECLINED = 'DECLINED',         // Transaction rejected
  REFUNDED = 'REFUNDED',         // Money returned
  DISPUTED = 'DISPUTED',         // Chargeback initiated
  VOIDED = 'VOIDED'              // Cancelled before settlement
}

export enum TransactionMethod {
  CHIP = 'CHIP',                 // EMV chip insert
  CONTACTLESS = 'CONTACTLESS',   // NFC tap (Apple Pay, Google Pay, tap card)
  SWIPE = 'SWIPE',               // Magnetic stripe
  MANUAL = 'MANUAL',             // Key-entered (phone orders)
  ONLINE = 'ONLINE',             // E-commerce
  RECURRING = 'RECURRING',       // Subscription/auto-pay
  WALLET = 'WALLET'              // Digital wallet
}

export interface MerchantInfo {
  merchantId: string;
  name: string;
  mcc: string;                   // Merchant Category Code
  mccDescription: string;

  // Location (for geo-based offers)
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  cardId: string;

  // Amount
  amount: number;
  currency: string;              // ISO 4217 (USD, EUR, etc.)
  localAmount?: number;          // Original amount if foreign transaction
  localCurrency?: string;

  // Merchant information
  merchant: MerchantInfo;

  // Transaction details
  method: TransactionMethod;
  isCardPresent: boolean;
  isOnline: boolean;
  isInternational: boolean;

  // Status tracking
  status: TransactionStatus;
  authorizationCode?: string;

  // Timestamps
  initiatedAt: Date;
  authorizedAt?: Date;
  settledAt?: Date;

  // Rewards earned
  rewardsEarned?: {
    type: string;
    amount: number;
    valueInCents: number;
  };

  // Reference
  receiptUrl?: string;
  notes?: string;
}

/**
 * Transaction Request - incoming transaction to be processed
 * This is what we receive when determining the optimal card
 */
export interface TransactionRequest {
  userId: string;

  // Transaction details
  amount: number;
  currency: string;

  // Merchant identification - at least one required
  merchantId?: string;           // Specific merchant ID
  merchantName?: string;         // Merchant name for lookup
  mcc?: string;                  // Merchant Category Code

  // Context
  method?: TransactionMethod;
  isOnline?: boolean;
  isInternational?: boolean;

  // Location (for geo-based offers)
  location?: {
    latitude: number;
    longitude: number;
  };

  // Optional: specific card to use (bypass smart selection)
  preferredCardId?: string;
}

/**
 * Card Selection Result - the optimal card for a transaction
 */
export interface CardSelectionResult {
  // Recommended card
  selectedCard: {
    cardId: string;
    cardName: string;
    lastFourDigits: string;
    network: string;
  };

  // Why this card was selected
  selectionReason: string;
  estimatedReward: {
    type: string;
    amount: number;
    effectiveCashBackPercent: number;
    dollarValue: number;
  };

  // Comparison with other cards
  alternatives: Array<{
    cardId: string;
    cardName: string;
    estimatedReward: number;
    reason: string;
  }>;

  // Any applicable offers
  applicableOffers: Array<{
    offerId: string;
    title: string;
    bonusValue: number;
  }>;

  // Transaction category detected
  detectedCategory: string;
  mcc?: string;
}
