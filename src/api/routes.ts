/**
 * API Routes
 *
 * RESTful API endpoints for:
 * - Card management (CRUD)
 * - Smart card selection
 * - Offers management
 * - Wallet statistics
 */

import { Router, Request, Response } from 'express';
import { walletService } from '../services/WalletService';
import { cardSelectionService } from '../services/CardSelectionService';
import { smartPayService } from '../services/SmartPayService';
import { walletSwitcher } from '../services/WalletSwitcher';
import { TransactionRequest } from '../models/Transaction';
import { CardInput, CardNetwork, CardType } from '../models/Card';
import { RewardCategory } from '../models/Reward';

const router = Router();

// ============================================
// CARD MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/cards
 * List all cards for a user
 */
router.get('/cards', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const cards = walletService.getCardSummaries(userId);
    res.json({ cards });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

/**
 * POST /api/cards
 * Add a new card to wallet
 */
router.post('/cards', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const input: CardInput = {
      userId,
      productName: req.body.productName,
      nickname: req.body.nickname,
      paymentToken: req.body.paymentToken,
      lastFourDigits: req.body.lastFourDigits,
      expiryMonth: req.body.expiryMonth,
      expiryYear: req.body.expiryYear,
      cardholderName: req.body.cardholderName,
      network: req.body.network as CardNetwork,
      cardType: req.body.cardType as CardType || CardType.CREDIT,
      issuer: req.body.issuer
    };

    const card = walletService.addCard(input);
    res.status(201).json({ card });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/cards/:id
 * Get a specific card
 */
router.get('/cards/:id', (req: Request, res: Response) => {
  try {
    const card = walletService.getCard(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json({ card });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

/**
 * PATCH /api/cards/:id
 * Update card properties
 */
router.patch('/cards/:id', (req: Request, res: Response) => {
  try {
    const card = walletService.updateCard(req.params.id, {
      nickname: req.body.nickname,
      color: req.body.color,
      isActive: req.body.isActive
    });
    res.json({ card });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/cards/:id
 * Remove a card
 */
router.delete('/cards/:id', (req: Request, res: Response) => {
  try {
    walletService.removeCard(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/cards/:id/primary
 * Set card as primary
 */
router.post('/cards/:id/primary', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    walletService.setPrimaryCard(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// SMART SELECTION ENDPOINTS
// ============================================

/**
 * POST /api/select-card
 * Get the optimal card for a transaction
 *
 * This is the main endpoint for smart card selection.
 *
 * Request body:
 * {
 *   amount: number,        // Transaction amount
 *   currency: string,      // ISO currency code (default: USD)
 *   merchantId?: string,   // Merchant ID (if known)
 *   merchantName?: string, // Merchant name (for lookup)
 *   mcc?: string,          // Merchant Category Code (if known)
 *   isOnline?: boolean,    // Is this an online transaction?
 * }
 */
router.post('/select-card', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const request: TransactionRequest = {
      userId,
      amount: req.body.amount,
      currency: req.body.currency || 'USD',
      merchantId: req.body.merchantId,
      merchantName: req.body.merchantName,
      mcc: req.body.mcc,
      isOnline: req.body.isOnline,
      isInternational: req.body.isInternational
    };

    const result = cardSelectionService.selectOptimalCard(request);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/compare-cards
 * Compare all cards for a transaction
 */
router.post('/compare-cards', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const request: TransactionRequest = {
      userId,
      amount: req.body.amount,
      currency: req.body.currency || 'USD',
      merchantId: req.body.merchantId,
      merchantName: req.body.merchantName,
      mcc: req.body.mcc
    };

    const comparisons = cardSelectionService.compareCards(request);
    res.json({
      comparisons: comparisons.map(c => ({
        cardId: c.card.id,
        cardName: c.card.productInfo.name,
        category: c.category,
        rewardType: c.rewardType,
        totalRate: c.totalRate,
        effectiveCashBackPercent: c.effectiveCashBackPercent,
        dollarValue: c.dollarValue,
        explanation: c.explanation,
        isAtCap: c.isAtCap
      }))
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/best-cards-by-category
 * Get the best card for each spending category
 */
router.get('/best-cards-by-category', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const bestCards = cardSelectionService.getBestCardsByCategory(userId);
    const result: Record<string, { cardName: string; rate: number }> = {};

    for (const [category, card] of bestCards) {
      result[category] = card;
    }

    res.json({ bestCardsByCategory: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// OFFERS ENDPOINTS
// ============================================

/**
 * GET /api/cards/:id/offers
 * Get offers for a card
 */
router.get('/cards/:id/offers', (req: Request, res: Response) => {
  try {
    const offers = walletService.getCardOffers(req.params.id);
    res.json({ offers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

/**
 * POST /api/cards/:id/offers
 * Add an offer to a card
 */
router.post('/cards/:id/offers', (req: Request, res: Response) => {
  try {
    const offer = walletService.addOffer(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      rewardType: req.body.rewardType,
      bonusEarnRate: req.body.bonusEarnRate,
      bonusAmount: req.body.bonusAmount,
      merchantName: req.body.merchantName,
      merchantIds: req.body.merchantIds,
      categories: req.body.categories,
      minimumSpend: req.body.minimumSpend,
      validFrom: new Date(req.body.validFrom),
      validUntil: new Date(req.body.validUntil),
      maxUses: req.body.maxUses,
      usedCount: 0,
      maxBonusAmount: req.body.maxBonusAmount,
      isActivated: false
    });
    res.status(201).json({ offer });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/cards/:cardId/offers/:offerId/activate
 * Activate an offer
 */
router.post('/cards/:cardId/offers/:offerId/activate', (req: Request, res: Response) => {
  try {
    walletService.activateOffer(req.params.cardId, req.params.offerId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// WALLET STATISTICS
// ============================================

/**
 * GET /api/wallet/stats
 * Get wallet statistics
 */
router.get('/wallet/stats', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const stats = walletService.getWalletStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/wallet/simulate
 * Simulate rewards based on spending pattern
 */
router.post('/wallet/simulate', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const monthlySpending = new Map<RewardCategory, number>();
    for (const [category, amount] of Object.entries(req.body.monthlySpending || {})) {
      monthlySpending.set(category as RewardCategory, amount as number);
    }

    const results = cardSelectionService.simulateRewards(userId, monthlySpending);
    res.json({ simulation: results });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// MCC LOOKUP (for debugging/testing)
// ============================================

/**
 * GET /api/mcc/:code
 * Look up an MCC code
 */
router.get('/mcc/:code', (req: Request, res: Response) => {
  try {
    const { getCategoryFromMCC, getMCCDescription, MCC_DATABASE } = require('../data/mcc-codes');
    const code = req.params.code;

    res.json({
      mcc: code,
      description: getMCCDescription(code),
      category: getCategoryFromMCC(code),
      details: MCC_DATABASE[code] || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup MCC' });
  }
});

// ============================================
// SMARTPAY ENDPOINTS (Location-Based Selection)
// ============================================

/**
 * POST /api/smartpay/location
 * Process a location update and get card recommendation
 *
 * This is the main endpoint for the SmartPay experience.
 * Call this when user's location changes significantly.
 */
router.post('/smartpay/location', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { latitude, longitude, accuracy, estimatedAmount } = req.body;

    const notification = await smartPayService.processLocationUpdate(
      userId,
      { latitude, longitude, accuracy: accuracy || 10 },
      estimatedAmount || 50
    );

    if (!notification) {
      return res.json({ detected: false, message: 'No merchant detected nearby' });
    }

    res.json({
      detected: true,
      notification
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/smartpay/confirm
 * User confirms the recommended card
 */
router.post('/smartpay/confirm', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { notificationId } = req.body;
    const result = await smartPayService.confirmSelection(notificationId, userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/smartpay/select-category
 * User selects a category (when confidence is low/medium)
 */
router.post('/smartpay/select-category', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { notificationId, category, estimatedAmount } = req.body;
    const notification = await smartPayService.selectCategory(
      notificationId,
      userId,
      category as RewardCategory,
      estimatedAmount || 50
    );
    res.json({ notification });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/smartpay/quick-select
 * Quick category selection (for Siri shortcuts, widgets, etc.)
 *
 * Example: "Hey Siri, I'm buying groceries"
 * → Calls this endpoint with category: "GROCERIES"
 */
router.post('/smartpay/quick-select', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { category, estimatedAmount } = req.body;
    const result = await smartPayService.quickSelect(
      userId,
      category as RewardCategory,
      estimatedAmount || 50
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/smartpay/categories
 * Get all available categories with best cards
 * (For building the category picker UI)
 */
router.get('/smartpay/categories', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const categories = await smartPayService.getAllCategoryOptions(userId);
    res.json({ categories });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/smartpay/switch-wallet
 * Get instructions for switching wallet default card
 */
router.post('/smartpay/switch-wallet', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.body;
    const userAgent = req.headers['user-agent'] as string;

    const card = walletService.getCard(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const walletProvider = walletSwitcher.detectWalletProvider(userAgent);
    const result = await walletSwitcher.switchDefaultCard(card, walletProvider);

    res.json({
      ...result,
      cardVisual: walletSwitcher.generateCardVisual(card)
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
