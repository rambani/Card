/**
 * Credit Card Model
 *
 * Represents a credit card in the user's digital wallet.
 * Contains tokenized card data for security (never store full card numbers).
 *
 * In a real implementation, actual card data would be tokenized by a
 * PCI-compliant payment processor (Stripe, Braintree, etc.)
 */

export enum CardNetwork {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMERICAN_EXPRESS',
  DISCOVER = 'DISCOVER',
  JCB = 'JCB',
  DINERS = 'DINERS_CLUB',
  UNIONPAY = 'UNIONPAY'
}

export enum CardType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  PREPAID = 'PREPAID'
}

export interface CardIssuer {
  id: string;
  name: string;
  country: string;
  supportPhone?: string;
}

export interface Card {
  id: string;
  userId: string;

  // Tokenized reference - never store actual card numbers
  // This token is provided by the payment processor
  paymentToken: string;

  // Display information (safe to store)
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;

  // Card classification
  network: CardNetwork;
  cardType: CardType;
  issuer: CardIssuer;

  // Product information (e.g., "Chase Sapphire Preferred", "Amex Gold")
  productName: string;
  productTier: 'BASIC' | 'REWARDS' | 'PREMIUM' | 'ULTRA_PREMIUM';

  // Annual fee (affects ROI calculations)
  annualFee: number;

  // Status
  isActive: boolean;
  isPrimary: boolean;

  // User preferences
  nickname?: string;
  color?: string; // For UI display

  // Metadata
  addedAt: Date;
  lastUsedAt?: Date;
}

/**
 * Card creation input (what the user provides)
 * Actual card details are sent directly to payment processor
 */
export interface CardInput {
  userId: string;
  productName: string;
  nickname?: string;

  // These would come from the payment processor after tokenization
  paymentToken: string;
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  network: CardNetwork;
  cardType: CardType;
  issuer: CardIssuer;
}

/**
 * Card summary for display (no sensitive data)
 */
export interface CardSummary {
  id: string;
  productName: string;
  nickname?: string;
  lastFourDigits: string;
  network: CardNetwork;
  issuer: string;
  color?: string;
  isPrimary: boolean;
}
