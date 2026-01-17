/**
 * Reward Models
 *
 * Defines the reward structures for credit cards.
 * Credit card rewards typically come in several forms:
 * - Cash back (percentage of purchase)
 * - Points (multiplier on base earn rate)
 * - Miles (airline/travel specific)
 *
 * Rewards are usually category-based, with different rates for:
 * - Specific merchants (e.g., 5% at Amazon)
 * - Merchant Category Codes (MCCs) (e.g., 3% on dining)
 * - Rotating categories (quarterly bonuses)
 * - Base rate (everything else)
 */

export enum RewardType {
  CASH_BACK = 'CASH_BACK',           // Percentage returned as cash
  POINTS = 'POINTS',                   // Points with variable value
  MILES = 'MILES',                     // Airline/travel miles
  STATEMENT_CREDIT = 'STATEMENT_CREDIT' // Credit applied to statement
}

export enum RewardCategory {
  // Dining
  RESTAURANTS = 'RESTAURANTS',
  FAST_FOOD = 'FAST_FOOD',
  BARS = 'BARS',
  CAFES = 'CAFES',

  // Travel
  AIRLINES = 'AIRLINES',
  HOTELS = 'HOTELS',
  CAR_RENTAL = 'CAR_RENTAL',
  RIDESHARE = 'RIDESHARE',
  PUBLIC_TRANSIT = 'PUBLIC_TRANSIT',
  GAS_STATIONS = 'GAS_STATIONS',
  PARKING = 'PARKING',
  TOLLS = 'TOLLS',

  // Shopping
  GROCERIES = 'GROCERIES',
  SUPERMARKETS = 'SUPERMARKETS',
  DEPARTMENT_STORES = 'DEPARTMENT_STORES',
  ONLINE_SHOPPING = 'ONLINE_SHOPPING',
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',

  // Entertainment
  STREAMING = 'STREAMING',
  MOVIES = 'MOVIES',
  CONCERTS = 'CONCERTS',
  SPORTS = 'SPORTS',
  GAMING = 'GAMING',

  // Services
  UTILITIES = 'UTILITIES',
  PHONE_INTERNET = 'PHONE_INTERNET',
  INSURANCE = 'INSURANCE',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',

  // Health
  PHARMACIES = 'PHARMACIES',
  HEALTHCARE = 'HEALTHCARE',
  FITNESS = 'FITNESS',

  // Other
  WHOLESALE_CLUBS = 'WHOLESALE_CLUBS',
  HOME_IMPROVEMENT = 'HOME_IMPROVEMENT',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  EDUCATION = 'EDUCATION',

  // Catch-all
  OTHER = 'OTHER',
  ALL_PURCHASES = 'ALL_PURCHASES'  // Base rate
}

/**
 * Reward Rule - defines earning rate for a specific category
 */
export interface RewardRule {
  id: string;
  cardId: string;

  // What category this rule applies to
  category: RewardCategory;

  // Specific merchant IDs (for merchant-specific bonuses)
  specificMerchantIds?: string[];

  // Reward configuration
  rewardType: RewardType;

  // Earning rate
  // For CASH_BACK: percentage (e.g., 3 = 3%)
  // For POINTS/MILES: multiplier on base (e.g., 3 = 3x points)
  earnRate: number;

  // Point/mile value in cents (for calculating effective cash back)
  // e.g., Chase points = 1.25 cents, Amex MR = 1.5-2 cents
  pointValueCents?: number;

  // Caps and limits
  maxEarnPerMonth?: number;      // Maximum dollars that earn bonus rate
  maxEarnPerQuarter?: number;
  maxEarnPerYear?: number;

  // Time-based rules
  isRotatingCategory: boolean;   // Changes quarterly
  validFrom?: Date;
  validUntil?: Date;

  // Priority (higher = checked first)
  priority: number;

  // Is this rule currently active?
  isActive: boolean;
}

/**
 * Current Offer - time-limited promotional offers
 */
export interface CardOffer {
  id: string;
  cardId: string;

  // Offer details
  title: string;
  description: string;

  // Earning bonus
  rewardType: RewardType;
  bonusEarnRate: number;        // Additional earn rate
  bonusAmount?: number;          // Or flat bonus amount

  // Qualifying criteria
  merchantName?: string;
  merchantIds?: string[];
  categories?: RewardCategory[];
  minimumSpend?: number;

  // Validity
  validFrom: Date;
  validUntil: Date;

  // Limits
  maxUses?: number;
  usedCount: number;
  maxBonusAmount?: number;

  // Status
  isActivated: boolean;
  activatedAt?: Date;
}

/**
 * Calculated reward for a potential transaction
 */
export interface CalculatedReward {
  cardId: string;
  cardName: string;

  // What you'll earn
  rewardType: RewardType;
  earnedAmount: number;          // Points/miles/dollars earned
  effectiveCashBack: number;     // Estimated cash value

  // Applied rules
  appliedRule: RewardRule;
  appliedOffers: CardOffer[];

  // Breakdown
  baseReward: number;
  bonusReward: number;
  offerReward: number;

  // Metadata
  explanation: string;
}

/**
 * Reward redemption value mapping
 * Different cards have different point values depending on redemption method
 */
export interface RedemptionValue {
  rewardType: RewardType;
  method: 'STATEMENT_CREDIT' | 'TRAVEL_PORTAL' | 'TRANSFER_PARTNER' | 'GIFT_CARD' | 'CASH';
  valueInCents: number;  // Value per point/mile in cents
  description: string;
}
