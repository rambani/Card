/**
 * Credit Card Products Database
 *
 * Contains reward structures for popular credit cards.
 * In a production system, this would be stored in a database
 * and updated regularly as issuers change their reward programs.
 *
 * This data enables the smart selection algorithm to know
 * what rewards each card earns in each category.
 */

import { RewardCategory, RewardType, RewardRule } from '../models/Reward';
import { CardNetwork } from '../models/Card';

export interface CardProduct {
  id: string;
  name: string;
  issuer: string;
  network: CardNetwork;
  annualFee: number;
  productTier: 'BASIC' | 'REWARDS' | 'PREMIUM' | 'ULTRA_PREMIUM';

  // Default point value in cents (for calculating effective cash back)
  defaultPointValueCents: number;

  // Base reward (all purchases)
  baseReward: {
    type: RewardType;
    rate: number;  // percentage or multiplier
  };

  // Category bonuses
  categoryBonuses: Array<{
    categories: RewardCategory[];
    type: RewardType;
    rate: number;
    cap?: number;  // monthly cap in dollars
    description: string;
  }>;

  // Special features
  features: string[];
}

/**
 * Popular Credit Card Products
 * Real-world reward structures (as of knowledge cutoff)
 */
export const CARD_PRODUCTS: CardProduct[] = [
  // CHASE CARDS
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    network: CardNetwork.VISA,
    annualFee: 95,
    productTier: 'PREMIUM',
    defaultPointValueCents: 1.25,  // 1.25 cents via Chase Travel
    baseReward: { type: RewardType.POINTS, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.FAST_FOOD, RewardCategory.BARS, RewardCategory.CAFES],
        type: RewardType.POINTS,
        rate: 3,
        description: '3x points on dining'
      },
      {
        categories: [RewardCategory.AIRLINES, RewardCategory.HOTELS, RewardCategory.CAR_RENTAL],
        type: RewardType.POINTS,
        rate: 2,
        description: '2x points on travel'
      },
      {
        categories: [RewardCategory.STREAMING],
        type: RewardType.POINTS,
        rate: 3,
        description: '3x points on streaming services'
      },
      {
        categories: [RewardCategory.ONLINE_SHOPPING],
        type: RewardType.POINTS,
        rate: 3,
        description: '3x points on online groceries'
      }
    ],
    features: ['Transfer to travel partners', 'Trip cancellation insurance', 'No foreign transaction fees']
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    network: CardNetwork.VISA,
    annualFee: 550,
    productTier: 'ULTRA_PREMIUM',
    defaultPointValueCents: 1.5,  // 1.5 cents via Chase Travel
    baseReward: { type: RewardType.POINTS, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.FAST_FOOD, RewardCategory.BARS, RewardCategory.CAFES],
        type: RewardType.POINTS,
        rate: 3,
        description: '3x points on dining'
      },
      {
        categories: [RewardCategory.AIRLINES, RewardCategory.HOTELS, RewardCategory.CAR_RENTAL, RewardCategory.PUBLIC_TRANSIT, RewardCategory.RIDESHARE, RewardCategory.TOLLS, RewardCategory.PARKING],
        type: RewardType.POINTS,
        rate: 3,
        description: '3x points on travel'
      }
    ],
    features: ['$300 annual travel credit', 'Priority Pass lounge access', 'Global Entry/TSA PreCheck credit']
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    network: CardNetwork.VISA,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 1.0,
    baseReward: { type: RewardType.CASH_BACK, rate: 1.5 },
    categoryBonuses: [
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.FAST_FOOD],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% on dining'
      },
      {
        categories: [RewardCategory.PHARMACIES],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% at drugstores'
      }
    ],
    features: ['No annual fee', 'Unlimited 1.5% cash back', 'Can combine points with Sapphire cards']
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    network: CardNetwork.MASTERCARD,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 1.0,
    baseReward: { type: RewardType.CASH_BACK, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.FAST_FOOD],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% on dining'
      },
      {
        categories: [RewardCategory.PHARMACIES],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% at drugstores'
      }
      // Note: Also has 5% rotating categories (quarterly activation required)
    ],
    features: ['No annual fee', '5% rotating quarterly categories', 'Cell phone protection']
  },

  // AMERICAN EXPRESS CARDS
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    network: CardNetwork.AMEX,
    annualFee: 250,
    productTier: 'PREMIUM',
    defaultPointValueCents: 1.5,  // Via transfer partners
    baseReward: { type: RewardType.POINTS, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.FAST_FOOD, RewardCategory.BARS, RewardCategory.CAFES],
        type: RewardType.POINTS,
        rate: 4,
        description: '4x points at restaurants worldwide'
      },
      {
        categories: [RewardCategory.GROCERIES, RewardCategory.SUPERMARKETS],
        type: RewardType.POINTS,
        rate: 4,
        cap: 25000,
        description: '4x points at US supermarkets (up to $25k/year)'
      },
      {
        categories: [RewardCategory.AIRLINES],
        type: RewardType.POINTS,
        rate: 3,
        description: '3x points on flights booked directly with airlines'
      }
    ],
    features: ['$120 dining credit', '$120 Uber Cash', 'No foreign transaction fees']
  },
  {
    id: 'amex-platinum',
    name: 'American Express Platinum Card',
    issuer: 'American Express',
    network: CardNetwork.AMEX,
    annualFee: 695,
    productTier: 'ULTRA_PREMIUM',
    defaultPointValueCents: 2.0,  // Via transfer partners
    baseReward: { type: RewardType.POINTS, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.AIRLINES],
        type: RewardType.POINTS,
        rate: 5,
        description: '5x points on flights booked directly or via Amex Travel'
      },
      {
        categories: [RewardCategory.HOTELS],
        type: RewardType.POINTS,
        rate: 5,
        description: '5x points on prepaid hotels via Amex Travel'
      }
    ],
    features: ['$200 airline fee credit', '$200 hotel credit', 'Centurion Lounge access', 'Global Entry credit']
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred Card',
    issuer: 'American Express',
    network: CardNetwork.AMEX,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 100,  // Cash back
    baseReward: { type: RewardType.CASH_BACK, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.GROCERIES, RewardCategory.SUPERMARKETS],
        type: RewardType.CASH_BACK,
        rate: 6,
        cap: 6000,
        description: '6% at US supermarkets (up to $6k/year)'
      },
      {
        categories: [RewardCategory.STREAMING],
        type: RewardType.CASH_BACK,
        rate: 6,
        description: '6% on select US streaming subscriptions'
      },
      {
        categories: [RewardCategory.PUBLIC_TRANSIT, RewardCategory.RIDESHARE],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% on transit and US gas stations'
      },
      {
        categories: [RewardCategory.GAS_STATIONS],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% at US gas stations'
      }
    ],
    features: ['$0 annual fee (waived)', 'Return protection', 'Purchase protection']
  },

  // CAPITAL ONE CARDS
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    network: CardNetwork.VISA,
    annualFee: 395,
    productTier: 'ULTRA_PREMIUM',
    defaultPointValueCents: 1.0,  // 1 cent fixed
    baseReward: { type: RewardType.MILES, rate: 2 },
    categoryBonuses: [
      {
        categories: [RewardCategory.AIRLINES, RewardCategory.HOTELS],
        type: RewardType.MILES,
        rate: 10,
        description: '10x miles on hotels and rental cars via Capital One Travel'
      },
      {
        categories: [RewardCategory.CAR_RENTAL],
        type: RewardType.MILES,
        rate: 10,
        description: '10x miles on rental cars via Capital One Travel'
      },
      {
        categories: [RewardCategory.AIRLINES],
        type: RewardType.MILES,
        rate: 5,
        description: '5x miles on flights via Capital One Travel'
      }
    ],
    features: ['$300 annual travel credit', 'Priority Pass lounge access', '10,000 anniversary bonus miles']
  },
  {
    id: 'capital-one-savor',
    name: 'Capital One SavorOne',
    issuer: 'Capital One',
    network: CardNetwork.MASTERCARD,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 100,
    baseReward: { type: RewardType.CASH_BACK, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.FAST_FOOD, RewardCategory.BARS],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% on dining'
      },
      {
        categories: [RewardCategory.ENTERTAINMENT, RewardCategory.MOVIES, RewardCategory.CONCERTS, RewardCategory.SPORTS],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% on entertainment'
      },
      {
        categories: [RewardCategory.STREAMING],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% on streaming services'
      },
      {
        categories: [RewardCategory.GROCERIES],
        type: RewardType.CASH_BACK,
        rate: 3,
        description: '3% at grocery stores'
      }
    ],
    features: ['No annual fee', 'No foreign transaction fees', 'Extended warranty']
  },

  // CITI CARDS
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    issuer: 'Citi',
    network: CardNetwork.MASTERCARD,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 100,
    baseReward: { type: RewardType.CASH_BACK, rate: 2 },  // 1% when you buy + 1% when you pay
    categoryBonuses: [],  // Flat 2% on everything
    features: ['No annual fee', '2% on all purchases', 'No category restrictions']
  },
  {
    id: 'citi-custom-cash',
    name: 'Citi Custom Cash',
    issuer: 'Citi',
    network: CardNetwork.MASTERCARD,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 100,
    baseReward: { type: RewardType.CASH_BACK, rate: 1 },
    categoryBonuses: [
      // Automatically earns 5% in your top eligible spending category each billing cycle
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.GAS_STATIONS, RewardCategory.GROCERIES, RewardCategory.DEPARTMENT_STORES, RewardCategory.HOME_IMPROVEMENT, RewardCategory.FITNESS, RewardCategory.STREAMING, RewardCategory.PHARMACIES, RewardCategory.RIDESHARE],
        type: RewardType.CASH_BACK,
        rate: 5,
        cap: 500,
        description: '5% on your top spending category each cycle (up to $500)'
      }
    ],
    features: ['No annual fee', 'Automatic category detection', 'Flexible rewards']
  },

  // DISCOVER CARDS
  {
    id: 'discover-it',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    network: CardNetwork.DISCOVER,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 100,
    baseReward: { type: RewardType.CASH_BACK, rate: 1 },
    categoryBonuses: [
      // Rotating 5% categories (quarterly activation required)
      // Categories change each quarter - this is a sample
      {
        categories: [RewardCategory.GAS_STATIONS],
        type: RewardType.CASH_BACK,
        rate: 5,
        cap: 1500,
        description: '5% on rotating quarterly categories (up to $1,500/quarter)'
      }
    ],
    features: ['No annual fee', 'Cashback Match first year', 'No foreign transaction fees']
  },

  // WELLS FARGO
  {
    id: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash',
    issuer: 'Wells Fargo',
    network: CardNetwork.VISA,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 100,
    baseReward: { type: RewardType.CASH_BACK, rate: 2 },
    categoryBonuses: [],  // Flat 2% on everything
    features: ['No annual fee', '2% on all purchases', 'Cell phone protection']
  },

  // BANK OF AMERICA
  {
    id: 'bofa-premium-rewards',
    name: 'Bank of America Premium Rewards',
    issuer: 'Bank of America',
    network: CardNetwork.VISA,
    annualFee: 95,
    productTier: 'PREMIUM',
    defaultPointValueCents: 1.0,
    baseReward: { type: RewardType.POINTS, rate: 1.5 },
    categoryBonuses: [
      {
        categories: [RewardCategory.AIRLINES, RewardCategory.HOTELS, RewardCategory.CAR_RENTAL],
        type: RewardType.POINTS,
        rate: 2,
        description: '2 points per $1 on travel'
      },
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.FAST_FOOD],
        type: RewardType.POINTS,
        rate: 2,
        description: '2 points per $1 on dining'
      }
    ],
    features: ['$100 airline incidental credit', 'TSA PreCheck/Global Entry credit', 'Preferred Rewards bonus']
  },

  // US BANK
  {
    id: 'us-bank-altitude-go',
    name: 'U.S. Bank Altitude Go',
    issuer: 'U.S. Bank',
    network: CardNetwork.VISA,
    annualFee: 0,
    productTier: 'REWARDS',
    defaultPointValueCents: 100,
    baseReward: { type: RewardType.POINTS, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.RESTAURANTS, RewardCategory.FAST_FOOD, RewardCategory.BARS],
        type: RewardType.POINTS,
        rate: 4,
        description: '4x points on dining'
      },
      {
        categories: [RewardCategory.GROCERIES],
        type: RewardType.POINTS,
        rate: 2,
        description: '2x points on grocery stores and grocery delivery'
      },
      {
        categories: [RewardCategory.GAS_STATIONS, RewardCategory.RIDESHARE],
        type: RewardType.POINTS,
        rate: 2,
        description: '2x points on gas stations and EV charging'
      },
      {
        categories: [RewardCategory.STREAMING],
        type: RewardType.POINTS,
        rate: 2,
        description: '2x points on streaming services'
      }
    ],
    features: ['No annual fee', 'No foreign transaction fees', '$15 streaming credit']
  }
];

/**
 * Get a card product by ID
 */
export function getCardProduct(productId: string): CardProduct | undefined {
  return CARD_PRODUCTS.find(p => p.id === productId);
}

/**
 * Get all card products from a specific issuer
 */
export function getCardsByIssuer(issuer: string): CardProduct[] {
  return CARD_PRODUCTS.filter(p => p.issuer.toLowerCase() === issuer.toLowerCase());
}

/**
 * Get cards that have bonus in a specific category
 */
export function getCardsWithCategoryBonus(category: RewardCategory): CardProduct[] {
  return CARD_PRODUCTS.filter(p =>
    p.categoryBonuses.some(b => b.categories.includes(category))
  );
}
