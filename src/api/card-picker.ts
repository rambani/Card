/**
 * Simple Card Picker API
 *
 * Users don't need to enter card numbers or log in.
 * They simply select which cards they have from a list,
 * and we automatically know the rewards structure.
 *
 * FLOW:
 * 1. User opens app for first time
 * 2. Sees list of popular cards with their rewards
 * 3. Taps the cards they have
 * 4. Done! Ready to use SmartPay
 *
 * NO PAYMENT PROCESSING - just reward optimization
 */

import { Router, Request, Response } from 'express';
import { CARD_PRODUCTS, CardProduct } from '../data/card-products';
import { RewardCategory } from '../models/Reward';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage for user's selected cards
const userSelectedCards: Map<string, SelectedCard[]> = new Map();

interface SelectedCard {
  id: string;
  productId: string;
  nickname?: string;
  lastFourDigits?: string;  // Optional - just for display
  addedAt: Date;
}

/**
 * GET /api/card-picker/products
 * Get all available card products to choose from
 *
 * Returns cards grouped by issuer with reward summaries
 */
router.get('/products', (_req: Request, res: Response) => {
  // Group cards by issuer
  const byIssuer: Record<string, CardProductSummary[]> = {};

  for (const card of CARD_PRODUCTS) {
    if (!byIssuer[card.issuer]) {
      byIssuer[card.issuer] = [];
    }

    byIssuer[card.issuer].push({
      id: card.id,
      name: card.name,
      issuer: card.issuer,
      annualFee: card.annualFee,
      network: card.network,
      topRewards: getTopRewards(card),
      color: getCardColor(card.issuer, card.name)
    });
  }

  res.json({
    issuers: Object.keys(byIssuer).sort(),
    cardsByIssuer: byIssuer,
    totalCards: CARD_PRODUCTS.length
  });
});

/**
 * GET /api/card-picker/products/:id
 * Get detailed info about a specific card product
 */
router.get('/products/:id', (req: Request, res: Response) => {
  const card = CARD_PRODUCTS.find(c => c.id === req.params.id);

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json({
    id: card.id,
    name: card.name,
    issuer: card.issuer,
    network: card.network,
    annualFee: card.annualFee,
    productTier: card.productTier,
    baseReward: card.baseReward,
    categoryBonuses: card.categoryBonuses.map(b => ({
      categories: b.categories,
      rate: b.rate,
      type: b.type,
      description: b.description,
      cap: b.cap
    })),
    features: card.features,
    color: getCardColor(card.issuer, card.name)
  });
});

/**
 * POST /api/card-picker/select
 * User selects a card they have
 *
 * Just needs the product ID - no card numbers!
 */
router.post('/select', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || `anon-${uuidv4().slice(0, 8)}`;
  const { productId, nickname, lastFourDigits } = req.body;

  // Verify product exists
  const product = CARD_PRODUCTS.find(c => c.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Card product not found' });
  }

  // Get or create user's card list
  let userCards = userSelectedCards.get(userId) || [];

  // Check if already added
  if (userCards.some(c => c.productId === productId)) {
    return res.status(400).json({ error: 'Card already added' });
  }

  // Add the card
  const selectedCard: SelectedCard = {
    id: uuidv4(),
    productId,
    nickname,
    lastFourDigits,
    addedAt: new Date()
  };

  userCards.push(selectedCard);
  userSelectedCards.set(userId, userCards);

  res.status(201).json({
    success: true,
    card: {
      ...selectedCard,
      productName: product.name,
      issuer: product.issuer
    },
    userId,  // Return so anonymous users can continue session
    message: `${product.name} added to your wallet!`
  });
});

/**
 * DELETE /api/card-picker/select/:cardId
 * Remove a card from user's selection
 */
router.delete('/select/:cardId', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  let userCards = userSelectedCards.get(userId) || [];
  const initialLength = userCards.length;

  userCards = userCards.filter(c => c.id !== req.params.cardId);
  userSelectedCards.set(userId, userCards);

  if (userCards.length === initialLength) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json({ success: true, message: 'Card removed' });
});

/**
 * GET /api/card-picker/my-cards
 * Get user's selected cards
 */
router.get('/my-cards', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const userCards = userSelectedCards.get(userId) || [];

  // Enrich with product details
  const enrichedCards = userCards.map(card => {
    const product = CARD_PRODUCTS.find(p => p.id === card.productId);
    return {
      id: card.id,
      productId: card.productId,
      productName: product?.name || 'Unknown',
      issuer: product?.issuer || 'Unknown',
      network: product?.network,
      nickname: card.nickname,
      lastFourDigits: card.lastFourDigits,
      topRewards: product ? getTopRewards(product) : [],
      color: product ? getCardColor(product.issuer, product.name) : '#666',
      addedAt: card.addedAt
    };
  });

  res.json({
    cards: enrichedCards,
    count: enrichedCards.length
  });
});

/**
 * POST /api/card-picker/quick-setup
 * Quick setup - add multiple cards at once
 */
router.post('/quick-setup', (req: Request, res: Response) => {
  let userId = req.headers['x-user-id'] as string;
  if (!userId) {
    userId = `user-${uuidv4().slice(0, 8)}`;
  }

  const { productIds } = req.body as { productIds: string[] };

  if (!productIds || !Array.isArray(productIds)) {
    return res.status(400).json({ error: 'productIds array required' });
  }

  const addedCards: any[] = [];
  const errors: string[] = [];

  for (const productId of productIds) {
    const product = CARD_PRODUCTS.find(c => c.id === productId);
    if (!product) {
      errors.push(`Unknown product: ${productId}`);
      continue;
    }

    let userCards = userSelectedCards.get(userId) || [];
    if (userCards.some(c => c.productId === productId)) {
      continue; // Skip duplicates silently
    }

    const selectedCard: SelectedCard = {
      id: uuidv4(),
      productId,
      addedAt: new Date()
    };

    userCards.push(selectedCard);
    userSelectedCards.set(userId, userCards);

    addedCards.push({
      id: selectedCard.id,
      productName: product.name
    });
  }

  res.json({
    success: true,
    userId,
    addedCards,
    errors: errors.length > 0 ? errors : undefined,
    message: `Added ${addedCards.length} cards to your wallet`
  });
});

/**
 * GET /api/card-picker/search
 * Search for cards by name
 */
router.get('/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase();

  if (!query || query.length < 2) {
    return res.json({ results: [] });
  }

  const results = CARD_PRODUCTS
    .filter(card =>
      card.name.toLowerCase().includes(query) ||
      card.issuer.toLowerCase().includes(query)
    )
    .map(card => ({
      id: card.id,
      name: card.name,
      issuer: card.issuer,
      topRewards: getTopRewards(card),
      color: getCardColor(card.issuer, card.name)
    }));

  res.json({ results });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

interface CardProductSummary {
  id: string;
  name: string;
  issuer: string;
  annualFee: number;
  network: string;
  topRewards: TopReward[];
  color: string;
}

interface TopReward {
  category: string;
  rate: string;
  emoji: string;
}

function getTopRewards(card: CardProduct): TopReward[] {
  const rewards: TopReward[] = [];

  // Get top 3 category bonuses
  const sorted = [...card.categoryBonuses].sort((a, b) => b.rate - a.rate);

  for (const bonus of sorted.slice(0, 3)) {
    const category = bonus.categories[0];
    rewards.push({
      category: formatCategory(category),
      rate: formatRate(bonus.rate, bonus.type),
      emoji: getCategoryEmoji(category)
    });
  }

  // Add base rate if room
  if (rewards.length < 3) {
    rewards.push({
      category: 'Everything else',
      rate: formatRate(card.baseReward.rate, card.baseReward.type),
      emoji: '💳'
    });
  }

  return rewards;
}

function formatCategory(category: RewardCategory): string {
  const names: Record<string, string> = {
    RESTAURANTS: 'Dining',
    FAST_FOOD: 'Fast Food',
    GROCERIES: 'Groceries',
    GAS_STATIONS: 'Gas',
    AIRLINES: 'Flights',
    HOTELS: 'Hotels',
    STREAMING: 'Streaming',
    PHARMACIES: 'Pharmacy',
    TRAVEL: 'Travel',
    ENTERTAINMENT: 'Entertainment'
  };
  return names[category] || category.replace(/_/g, ' ').toLowerCase();
}

function formatRate(rate: number, type: string): string {
  if (type === 'CASH_BACK') {
    return `${rate}%`;
  }
  return `${rate}x`;
}

function getCategoryEmoji(category: RewardCategory): string {
  const emojis: Record<string, string> = {
    RESTAURANTS: '🍽️',
    FAST_FOOD: '🍔',
    GROCERIES: '🛒',
    GAS_STATIONS: '⛽',
    AIRLINES: '✈️',
    HOTELS: '🏨',
    STREAMING: '📺',
    PHARMACIES: '💊',
    TRAVEL: '🧳',
    ENTERTAINMENT: '🎭',
    CAR_RENTAL: '🚗',
    RIDESHARE: '🚕',
    CAFES: '☕'
  };
  return emojis[category] || '💳';
}

function getCardColor(issuer: string, cardName: string): string {
  // Brand colors for popular cards
  const colors: Record<string, string> = {
    // Chase
    'Chase Sapphire Preferred': '#004977',
    'Chase Sapphire Reserve': '#1a1f71',
    'Chase Freedom Unlimited': '#0066b2',
    'Chase Freedom Flex': '#0066b2',

    // Amex
    'American Express Gold Card': '#b5985a',
    'American Express Platinum Card': '#e5e4e2',
    'Blue Cash Preferred Card': '#006fcf',

    // Capital One
    'Capital One Venture X': '#004977',
    'Capital One SavorOne': '#d03027',

    // Citi
    'Citi Double Cash': '#003da5',
    'Citi Custom Cash': '#003da5',

    // Discover
    'Discover it Cash Back': '#ff6000',

    // Others
    'Wells Fargo Active Cash': '#d71e28',
    'Bank of America Premium Rewards': '#e31837',
    'U.S. Bank Altitude Go': '#0c2074'
  };

  if (colors[cardName]) {
    return colors[cardName];
  }

  // Fallback to issuer colors
  const issuerColors: Record<string, string> = {
    'Chase': '#004977',
    'American Express': '#006fcf',
    'Capital One': '#004977',
    'Citi': '#003da5',
    'Discover': '#ff6000',
    'Wells Fargo': '#d71e28',
    'Bank of America': '#e31837',
    'U.S. Bank': '#0c2074'
  };

  return issuerColors[issuer] || '#333333';
}

export default router;
