/**
 * Digital Wallet Service
 *
 * Manages the user's digital wallet containing multiple credit cards.
 * Handles card storage, tokenization references, and wallet operations.
 *
 * SECURITY CONSIDERATIONS:
 * ========================
 * - Never store full card numbers (PAN)
 * - Use payment processor tokens (Stripe, Braintree, etc.)
 * - Encrypt sensitive data at rest
 * - Follow PCI-DSS compliance guidelines
 */

import { v4 as uuidv4 } from 'uuid';
import { Card, CardInput, CardSummary, CardNetwork, CardType } from '../models/Card';
import { CardOffer, RewardCategory } from '../models/Reward';
import { CardProduct, getCardProduct, CARD_PRODUCTS } from '../data/card-products';
import { UserCard, cardSelectionService } from './CardSelectionService';

/**
 * In-memory storage (replace with database in production)
 */
interface WalletStorage {
  cards: Map<string, Card>;
  userCards: Map<string, string[]>;  // userId -> cardIds
  cardOffers: Map<string, CardOffer[]>;  // cardId -> offers
  spendingHistory: Map<string, Map<RewardCategory, number>>;  // cardId -> category spending
}

const storage: WalletStorage = {
  cards: new Map(),
  userCards: new Map(),
  cardOffers: new Map(),
  spendingHistory: new Map()
};

export class WalletService {
  /**
   * Add a new card to user's wallet
   *
   * In production, this would:
   * 1. Send card details to payment processor (Stripe, etc.)
   * 2. Receive a token back
   * 3. Store only the token and display info
   */
  addCard(input: CardInput): Card {
    // Find the product info
    const product = CARD_PRODUCTS.find(p =>
      p.name.toLowerCase() === input.productName.toLowerCase()
    );

    if (!product) {
      throw new Error(`Unknown card product: ${input.productName}`);
    }

    const card: Card = {
      id: uuidv4(),
      userId: input.userId,
      paymentToken: input.paymentToken,
      lastFourDigits: input.lastFourDigits,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
      cardholderName: input.cardholderName,
      network: input.network,
      cardType: input.cardType,
      issuer: input.issuer,
      productName: product.name,
      productTier: product.productTier,
      annualFee: product.annualFee,
      isActive: true,
      isPrimary: false,
      nickname: input.nickname,
      addedAt: new Date()
    };

    // Store the card
    storage.cards.set(card.id, card);

    // Add to user's card list
    const userCardIds = storage.userCards.get(input.userId) || [];
    userCardIds.push(card.id);
    storage.userCards.set(input.userId, userCardIds);

    // Initialize spending tracking
    storage.spendingHistory.set(card.id, new Map());

    // Initialize empty offers list
    storage.cardOffers.set(card.id, []);

    // If this is the first card, make it primary
    if (userCardIds.length === 1) {
      card.isPrimary = true;
    }

    // Register with selection service
    this.syncWithSelectionService(input.userId);

    return card;
  }

  /**
   * Get all cards for a user
   */
  getUserCards(userId: string): Card[] {
    const cardIds = storage.userCards.get(userId) || [];
    return cardIds
      .map(id => storage.cards.get(id))
      .filter((card): card is Card => card !== undefined);
  }

  /**
   * Get card summaries (safe for display)
   */
  getCardSummaries(userId: string): CardSummary[] {
    return this.getUserCards(userId).map(card => ({
      id: card.id,
      productName: card.productName,
      nickname: card.nickname,
      lastFourDigits: card.lastFourDigits,
      network: card.network,
      issuer: card.issuer.name,
      color: card.color,
      isPrimary: card.isPrimary
    }));
  }

  /**
   * Get a specific card
   */
  getCard(cardId: string): Card | undefined {
    return storage.cards.get(cardId);
  }

  /**
   * Update card properties
   */
  updateCard(cardId: string, updates: Partial<Pick<Card, 'nickname' | 'color' | 'isActive'>>): Card {
    const card = storage.cards.get(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    if (updates.nickname !== undefined) card.nickname = updates.nickname;
    if (updates.color !== undefined) card.color = updates.color;
    if (updates.isActive !== undefined) card.isActive = updates.isActive;

    this.syncWithSelectionService(card.userId);
    return card;
  }

  /**
   * Set a card as primary
   */
  setPrimaryCard(userId: string, cardId: string): void {
    const userCards = this.getUserCards(userId);

    for (const card of userCards) {
      card.isPrimary = card.id === cardId;
    }

    this.syncWithSelectionService(userId);
  }

  /**
   * Remove a card from wallet
   */
  removeCard(cardId: string): void {
    const card = storage.cards.get(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    // Remove from storage
    storage.cards.delete(cardId);
    storage.cardOffers.delete(cardId);
    storage.spendingHistory.delete(cardId);

    // Remove from user's list
    const userCardIds = storage.userCards.get(card.userId) || [];
    const index = userCardIds.indexOf(cardId);
    if (index > -1) {
      userCardIds.splice(index, 1);
    }

    // If this was primary, set another as primary
    if (card.isPrimary && userCardIds.length > 0) {
      const newPrimary = storage.cards.get(userCardIds[0]);
      if (newPrimary) {
        newPrimary.isPrimary = true;
      }
    }

    this.syncWithSelectionService(card.userId);
  }

  /**
   * Add an offer to a card
   */
  addOffer(cardId: string, offer: Omit<CardOffer, 'id' | 'cardId'>): CardOffer {
    const card = storage.cards.get(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    const fullOffer: CardOffer = {
      ...offer,
      id: uuidv4(),
      cardId
    };

    const offers = storage.cardOffers.get(cardId) || [];
    offers.push(fullOffer);
    storage.cardOffers.set(cardId, offers);

    this.syncWithSelectionService(card.userId);
    return fullOffer;
  }

  /**
   * Activate an offer
   */
  activateOffer(cardId: string, offerId: string): void {
    const offers = storage.cardOffers.get(cardId) || [];
    const offer = offers.find(o => o.id === offerId);

    if (offer) {
      offer.isActivated = true;
      offer.activatedAt = new Date();

      const card = storage.cards.get(cardId);
      if (card) {
        this.syncWithSelectionService(card.userId);
      }
    }
  }

  /**
   * Get offers for a card
   */
  getCardOffers(cardId: string): CardOffer[] {
    return storage.cardOffers.get(cardId) || [];
  }

  /**
   * Record spending (for cap tracking)
   */
  recordSpending(cardId: string, category: RewardCategory, amount: number): void {
    const spending = storage.spendingHistory.get(cardId) || new Map();
    const current = spending.get(category) || 0;
    spending.set(category, current + amount);
    storage.spendingHistory.set(cardId, spending);

    const card = storage.cards.get(cardId);
    if (card) {
      this.syncWithSelectionService(card.userId);
    }
  }

  /**
   * Reset monthly spending (call at start of billing cycle)
   */
  resetMonthlySpending(cardId: string): void {
    storage.spendingHistory.set(cardId, new Map());

    const card = storage.cards.get(cardId);
    if (card) {
      this.syncWithSelectionService(card.userId);
    }
  }

  /**
   * Sync wallet data with selection service
   */
  private syncWithSelectionService(userId: string): void {
    const cards = this.getUserCards(userId);
    const userCards: UserCard[] = cards.map(card => {
      const product = CARD_PRODUCTS.find(p =>
        p.name.toLowerCase() === card.productName.toLowerCase()
      );

      if (!product) {
        throw new Error(`Product info not found for ${card.productName}`);
      }

      return {
        ...card,
        productInfo: product,
        activeOffers: storage.cardOffers.get(card.id) || [],
        monthlySpending: storage.spendingHistory.get(card.id) || new Map()
      };
    });

    cardSelectionService.registerUserCards(userId, userCards);
  }

  /**
   * Get wallet statistics
   */
  getWalletStats(userId: string): {
    totalCards: number;
    activeCards: number;
    totalAnnualFees: number;
    primaryCard: string | null;
  } {
    const cards = this.getUserCards(userId);
    const activeCards = cards.filter(c => c.isActive);

    return {
      totalCards: cards.length,
      activeCards: activeCards.length,
      totalAnnualFees: activeCards.reduce((sum, c) => sum + c.annualFee, 0),
      primaryCard: cards.find(c => c.isPrimary)?.productName || null
    };
  }
}

// Export singleton instance
export const walletService = new WalletService();
