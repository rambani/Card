/**
 * Smart Card Selection Service
 *
 * The core algorithm that determines the optimal credit card
 * for a given transaction based on:
 * - Merchant Category Code (MCC) / transaction type
 * - Card reward structures
 * - Active offers and promotions
 * - Spending caps and limits
 * - Point/mile valuations
 *
 * SELECTION ALGORITHM:
 * ====================
 * 1. Identify transaction category from MCC or merchant name
 * 2. For each card in user's wallet:
 *    a. Find applicable reward rules (category bonuses)
 *    b. Check for any active merchant/category offers
 *    c. Calculate effective reward value considering:
 *       - Base earn rate
 *       - Category multipliers
 *       - Offer bonuses
 *       - Point/mile valuations
 *       - Spending caps
 * 3. Rank cards by effective reward value
 * 4. Return the card with highest value + comparison data
 */

import { v4 as uuidv4 } from 'uuid';
import { Card } from '../models/Card';
import { RewardCategory, RewardType, RewardRule, CardOffer, CalculatedReward } from '../models/Reward';
import { TransactionRequest, CardSelectionResult } from '../models/Transaction';
import { getCategoryFromMCC, getMCCDescription, MERCHANT_MCC_LOOKUP } from '../data/mcc-codes';
import { CardProduct, getCardProduct, CARD_PRODUCTS } from '../data/card-products';

/**
 * User's card with associated product info and spending data
 */
export interface UserCard extends Card {
  productInfo: CardProduct;
  activeOffers: CardOffer[];
  monthlySpending: Map<RewardCategory, number>;  // Track spending for caps
}

/**
 * Reward calculation result for a single card
 */
interface CardRewardCalculation {
  card: UserCard;
  category: RewardCategory;
  baseRate: number;
  bonusRate: number;
  offerBonus: number;
  totalRate: number;
  rewardType: RewardType;
  effectiveCashBackPercent: number;
  dollarValue: number;
  explanation: string;
  isAtCap: boolean;
  applicableOffers: CardOffer[];
}

export class CardSelectionService {
  private userCards: Map<string, UserCard[]> = new Map();

  /**
   * Register a user's cards
   */
  registerUserCards(userId: string, cards: UserCard[]): void {
    this.userCards.set(userId, cards);
  }

  /**
   * Get user's cards
   */
  getUserCards(userId: string): UserCard[] {
    return this.userCards.get(userId) || [];
  }

  /**
   * Main entry point: Select the optimal card for a transaction
   */
  selectOptimalCard(request: TransactionRequest): CardSelectionResult {
    const userCards = this.getUserCards(request.userId);

    if (userCards.length === 0) {
      throw new Error('No cards registered for user');
    }

    // Step 1: Determine the transaction category
    const category = this.identifyCategory(request);
    const mcc = request.mcc || this.inferMCC(request);

    // Step 2: Calculate rewards for each card
    const calculations = userCards
      .filter(card => card.isActive)
      .map(card => this.calculateCardReward(card, category, request.amount));

    // Step 3: Sort by effective value (highest first)
    calculations.sort((a, b) => b.dollarValue - a.dollarValue);

    // Step 4: Build result
    const bestCard = calculations[0];
    const alternatives = calculations.slice(1, 4);  // Top 3 alternatives

    return {
      selectedCard: {
        cardId: bestCard.card.id,
        cardName: bestCard.card.productInfo.name,
        lastFourDigits: bestCard.card.lastFourDigits,
        network: bestCard.card.network
      },
      selectionReason: bestCard.explanation,
      estimatedReward: {
        type: bestCard.rewardType,
        amount: bestCard.totalRate * request.amount / 100,
        effectiveCashBackPercent: bestCard.effectiveCashBackPercent,
        dollarValue: bestCard.dollarValue
      },
      alternatives: alternatives.map(alt => ({
        cardId: alt.card.id,
        cardName: alt.card.productInfo.name,
        estimatedReward: alt.dollarValue,
        reason: alt.explanation
      })),
      applicableOffers: bestCard.applicableOffers.map(offer => ({
        offerId: offer.id,
        title: offer.title,
        bonusValue: offer.bonusEarnRate * request.amount / 100
      })),
      detectedCategory: category,
      mcc: mcc
    };
  }

  /**
   * Identify the reward category from transaction data
   */
  private identifyCategory(request: TransactionRequest): RewardCategory {
    // Priority 1: MCC code (most accurate)
    if (request.mcc) {
      return getCategoryFromMCC(request.mcc);
    }

    // Priority 2: Merchant ID lookup
    if (request.merchantId) {
      // In production, this would query a merchant database
      // For now, fall through to merchant name
    }

    // Priority 3: Merchant name lookup
    if (request.merchantName) {
      const normalizedName = request.merchantName.toLowerCase().trim();

      // Check our merchant lookup table
      const mcc = MERCHANT_MCC_LOOKUP[normalizedName];
      if (mcc) {
        return getCategoryFromMCC(mcc);
      }

      // Fuzzy matching for common merchants
      for (const [merchant, mappedMCC] of Object.entries(MERCHANT_MCC_LOOKUP)) {
        if (normalizedName.includes(merchant) || merchant.includes(normalizedName)) {
          return getCategoryFromMCC(mappedMCC);
        }
      }
    }

    // Default: General purchase
    return RewardCategory.OTHER;
  }

  /**
   * Infer MCC from transaction request
   */
  private inferMCC(request: TransactionRequest): string | undefined {
    if (request.merchantName) {
      const normalizedName = request.merchantName.toLowerCase().trim();
      return MERCHANT_MCC_LOOKUP[normalizedName];
    }
    return undefined;
  }

  /**
   * Calculate the reward for a specific card on a transaction
   */
  private calculateCardReward(
    card: UserCard,
    category: RewardCategory,
    amount: number
  ): CardRewardCalculation {
    const product = card.productInfo;
    let explanation: string[] = [];

    // Base reward rate
    const baseRate = product.baseReward.rate;
    const rewardType = product.baseReward.type;
    explanation.push(`Base: ${baseRate}${rewardType === RewardType.CASH_BACK ? '%' : 'x'}`);

    // Find category bonus
    let bonusRate = 0;
    let categoryBonus = product.categoryBonuses.find(b =>
      b.categories.includes(category)
    );

    // Check if at spending cap
    let isAtCap = false;
    if (categoryBonus) {
      // Check spending caps
      if (categoryBonus.cap) {
        const currentSpending = card.monthlySpending.get(category) || 0;
        if (currentSpending >= categoryBonus.cap) {
          isAtCap = true;
          explanation.push(`(cap reached for ${category})`);
        } else {
          bonusRate = categoryBonus.rate - baseRate;  // Additional rate above base
          explanation.push(`+${categoryBonus.rate - baseRate}${rewardType === RewardType.CASH_BACK ? '%' : 'x'} ${categoryBonus.description}`);
        }
      } else {
        bonusRate = categoryBonus.rate - baseRate;
        explanation.push(`+${categoryBonus.rate - baseRate}${rewardType === RewardType.CASH_BACK ? '%' : 'x'} ${categoryBonus.description}`);
      }
    }

    // Check active offers
    let offerBonus = 0;
    const applicableOffers: CardOffer[] = [];
    for (const offer of card.activeOffers) {
      if (offer.isActivated &&
        offer.validFrom <= new Date() &&
        offer.validUntil >= new Date() &&
        (!offer.categories || offer.categories.includes(category))) {
        offerBonus += offer.bonusEarnRate;
        applicableOffers.push(offer);
        explanation.push(`+${offer.bonusEarnRate}% from offer: ${offer.title}`);
      }
    }

    // Calculate total rate
    let totalRate = isAtCap ? baseRate : (categoryBonus?.rate || baseRate);
    totalRate += offerBonus;

    // Calculate effective cash back percentage
    let effectiveCashBackPercent: number;
    if (rewardType === RewardType.CASH_BACK) {
      effectiveCashBackPercent = totalRate;
    } else {
      // Convert points/miles to cash value
      const pointValue = product.defaultPointValueCents / 100;  // Convert cents to dollars
      effectiveCashBackPercent = totalRate * pointValue;
    }

    // Calculate dollar value for this transaction
    const dollarValue = (effectiveCashBackPercent / 100) * amount;

    return {
      card,
      category,
      baseRate,
      bonusRate,
      offerBonus,
      totalRate,
      rewardType,
      effectiveCashBackPercent,
      dollarValue,
      explanation: explanation.join(', '),
      isAtCap,
      applicableOffers
    };
  }

  /**
   * Compare all cards for a transaction (without selecting)
   */
  compareCards(request: TransactionRequest): CardRewardCalculation[] {
    const userCards = this.getUserCards(request.userId);
    const category = this.identifyCategory(request);

    return userCards
      .filter(card => card.isActive)
      .map(card => this.calculateCardReward(card, category, request.amount))
      .sort((a, b) => b.dollarValue - a.dollarValue);
  }

  /**
   * Get the best card for each category (wallet summary)
   */
  getBestCardsByCategory(userId: string): Map<RewardCategory, { cardName: string; rate: number }> {
    const userCards = this.getUserCards(userId);
    const result = new Map<RewardCategory, { cardName: string; rate: number }>();

    // Check each category
    for (const category of Object.values(RewardCategory)) {
      let bestCard: { cardName: string; rate: number } | null = null;

      for (const card of userCards) {
        if (!card.isActive) continue;

        const product = card.productInfo;
        let rate = product.baseReward.rate;

        // Check for category bonus
        const bonus = product.categoryBonuses.find(b =>
          b.categories.includes(category as RewardCategory)
        );
        if (bonus) {
          rate = bonus.rate;
        }

        if (!bestCard || rate > bestCard.rate) {
          bestCard = { cardName: product.name, rate };
        }
      }

      if (bestCard) {
        result.set(category as RewardCategory, bestCard);
      }
    }

    return result;
  }

  /**
   * Simulate reward earnings over a spending pattern
   */
  simulateRewards(
    userId: string,
    monthlySpending: Map<RewardCategory, number>
  ): { cardId: string; cardName: string; totalRewards: number }[] {
    const userCards = this.getUserCards(userId);
    const results: { cardId: string; cardName: string; totalRewards: number }[] = [];

    for (const card of userCards) {
      let totalRewards = 0;

      for (const [category, amount] of monthlySpending) {
        const calculation = this.calculateCardReward(card, category, amount);
        totalRewards += calculation.dollarValue;
      }

      // Subtract annual fee (prorated monthly)
      const monthlyFee = card.productInfo.annualFee / 12;
      totalRewards -= monthlyFee;

      results.push({
        cardId: card.id,
        cardName: card.productInfo.name,
        totalRewards
      });
    }

    return results.sort((a, b) => b.totalRewards - a.totalRewards);
  }
}

// Export singleton instance
export const cardSelectionService = new CardSelectionService();
