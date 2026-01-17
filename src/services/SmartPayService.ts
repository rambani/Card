/**
 * SmartPay Service
 *
 * The main orchestrator that provides a seamless card selection experience.
 *
 * USER FLOW:
 * ═══════════════════════════════════════════════════════════════════════
 *
 *   1. USER ARRIVES AT MERCHANT
 *      │
 *      ▼
 *   2. LOCATION SERVICE DETECTS MERCHANT
 *      │
 *      ├─── HIGH CONFIDENCE ──────────────────────────────────────┐
 *      │    "Chipotle detected"                                   │
 *      │         │                                                │
 *      │         ▼                                                │
 *      │    ┌────────────────────────────────┐                   │
 *      │    │ 🍽️ Chipotle                     │                   │
 *      │    │ Best card: Amex Gold (4x)      │                   │
 *      │    │                                │                   │
 *      │    │ [✓ Set Default]  [Change]      │                   │
 *      │    └────────────────────────────────┘                   │
 *      │                                                          │
 *      ├─── MEDIUM CONFIDENCE ────────────────────────────────────┤
 *      │    "Target detected"                                     │
 *      │         │                                                │
 *      │         ▼                                                │
 *      │    ┌────────────────────────────────┐                   │
 *      │    │ 🏪 Target                       │                   │
 *      │    │ What are you buying?           │                   │
 *      │    │                                │                   │
 *      │    │ [🛒 Grocery] [👕 Clothing]     │                   │
 *      │    │ [💊 Pharmacy] [🛍️ General]     │                   │
 *      │    └────────────────────────────────┘                   │
 *      │                                                          │
 *      └─── LOW CONFIDENCE ───────────────────────────────────────┘
 *           "Unknown store detected"
 *                │
 *                ▼
 *           ┌────────────────────────────────┐
 *           │ 📍 123 Main Street             │
 *           │ What type of purchase?         │
 *           │                                │
 *           │ [🍽️] [🛒] [⛽] [✈️] [🛍️] [...]  │
 *           └────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { RewardCategory } from '../models/Reward';
import { LocationService, DetectedMerchant, LocationCoordinates } from './LocationService';
import { cardSelectionService, UserCard } from './CardSelectionService';
import { walletService } from './WalletService';

/**
 * Notification types for the UI
 */
export type NotificationType = 'AUTO_SWITCH' | 'CONFIRM_CATEGORY' | 'SELECT_CATEGORY';

export interface SmartPayNotification {
  id: string;
  type: NotificationType;
  timestamp: Date;

  // Merchant info
  merchant: {
    name: string;
    address: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };

  // Recommended card
  recommendedCard: {
    cardId: string;
    cardName: string;
    lastFour: string;
    rewardRate: string;  // e.g., "4x points" or "6% back"
    estimatedValue: string;  // e.g., "$3.00 on $50"
  };

  // For category selection (MEDIUM/LOW confidence)
  categoryOptions?: CategoryOption[];

  // User response tracking
  responded: boolean;
  userSelection?: {
    confirmedCategory: RewardCategory;
    selectedCardId: string;
  };
}

export interface CategoryOption {
  category: RewardCategory;
  emoji: string;
  label: string;
  bestCard: string;
  rewardRate: string;
}

/**
 * Category display configuration
 */
const CATEGORY_DISPLAY: Record<RewardCategory, { emoji: string; label: string }> = {
  [RewardCategory.RESTAURANTS]: { emoji: '🍽️', label: 'Dining' },
  [RewardCategory.FAST_FOOD]: { emoji: '🍔', label: 'Fast Food' },
  [RewardCategory.CAFES]: { emoji: '☕', label: 'Coffee' },
  [RewardCategory.BARS]: { emoji: '🍺', label: 'Bars' },
  [RewardCategory.GROCERIES]: { emoji: '🛒', label: 'Groceries' },
  [RewardCategory.SUPERMARKETS]: { emoji: '🏪', label: 'Supermarket' },
  [RewardCategory.GAS_STATIONS]: { emoji: '⛽', label: 'Gas' },
  [RewardCategory.AIRLINES]: { emoji: '✈️', label: 'Flights' },
  [RewardCategory.HOTELS]: { emoji: '🏨', label: 'Hotels' },
  [RewardCategory.CAR_RENTAL]: { emoji: '🚗', label: 'Car Rental' },
  [RewardCategory.RIDESHARE]: { emoji: '🚕', label: 'Uber/Lyft' },
  [RewardCategory.PUBLIC_TRANSIT]: { emoji: '🚇', label: 'Transit' },
  [RewardCategory.STREAMING]: { emoji: '📺', label: 'Streaming' },
  [RewardCategory.PHARMACIES]: { emoji: '💊', label: 'Pharmacy' },
  [RewardCategory.DEPARTMENT_STORES]: { emoji: '🏬', label: 'Department' },
  [RewardCategory.CLOTHING]: { emoji: '👕', label: 'Clothing' },
  [RewardCategory.ELECTRONICS]: { emoji: '📱', label: 'Electronics' },
  [RewardCategory.HOME_IMPROVEMENT]: { emoji: '🔨', label: 'Home' },
  [RewardCategory.WHOLESALE_CLUBS]: { emoji: '📦', label: 'Wholesale' },
  [RewardCategory.MOVIES]: { emoji: '🎬', label: 'Movies' },
  [RewardCategory.ENTERTAINMENT]: { emoji: '🎭', label: 'Entertainment' },
  [RewardCategory.FITNESS]: { emoji: '💪', label: 'Gym' },
  [RewardCategory.HEALTHCARE]: { emoji: '🏥', label: 'Healthcare' },
  [RewardCategory.ONLINE_SHOPPING]: { emoji: '📦', label: 'Online' },
  [RewardCategory.OTHER]: { emoji: '🛍️', label: 'Other' },
  // Add remaining categories with defaults
  [RewardCategory.CONCERTS]: { emoji: '🎵', label: 'Concerts' },
  [RewardCategory.SPORTS]: { emoji: '⚽', label: 'Sports' },
  [RewardCategory.GAMING]: { emoji: '🎮', label: 'Gaming' },
  [RewardCategory.UTILITIES]: { emoji: '💡', label: 'Utilities' },
  [RewardCategory.PHONE_INTERNET]: { emoji: '📞', label: 'Phone/Internet' },
  [RewardCategory.INSURANCE]: { emoji: '🛡️', label: 'Insurance' },
  [RewardCategory.SUBSCRIPTIONS]: { emoji: '🔄', label: 'Subscriptions' },
  [RewardCategory.EDUCATION]: { emoji: '📚', label: 'Education' },
  [RewardCategory.OFFICE_SUPPLIES]: { emoji: '📎', label: 'Office' },
  [RewardCategory.PARKING]: { emoji: '🅿️', label: 'Parking' },
  [RewardCategory.TOLLS]: { emoji: '🛣️', label: 'Tolls' },
  [RewardCategory.ALL_PURCHASES]: { emoji: '💳', label: 'All' },
};

export class SmartPayService {
  private locationService: LocationService;
  private pendingNotifications: Map<string, SmartPayNotification> = new Map();
  private notificationCallback?: (notification: SmartPayNotification) => void;

  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * Register callback for new notifications
   * (In a real app, this would trigger push notifications)
   */
  onNotification(callback: (notification: SmartPayNotification) => void): void {
    this.notificationCallback = callback;
  }

  /**
   * Main entry: Process a location update
   */
  async processLocationUpdate(
    userId: string,
    coords: LocationCoordinates,
    estimatedAmount: number = 50  // Default estimate for reward calculation
  ): Promise<SmartPayNotification | null> {
    // Update location service
    this.locationService.updateLocation(coords);

    // Detect nearby merchant
    const merchant = await this.locationService.detectMerchant(coords);
    if (!merchant) {
      return null;
    }

    // Generate notification based on confidence
    const notification = await this.generateNotification(userId, merchant, estimatedAmount);

    if (notification) {
      this.pendingNotifications.set(notification.id, notification);

      // Trigger callback
      if (this.notificationCallback) {
        this.notificationCallback(notification);
      }
    }

    return notification;
  }

  /**
   * Generate appropriate notification based on confidence level
   */
  private async generateNotification(
    userId: string,
    merchant: DetectedMerchant,
    estimatedAmount: number
  ): Promise<SmartPayNotification> {
    const notificationId = uuidv4();

    // Get the best card for detected category
    const selection = cardSelectionService.selectOptimalCard({
      userId,
      amount: estimatedAmount,
      currency: 'USD',
      merchantName: merchant.name
    });

    // Base notification
    const notification: SmartPayNotification = {
      id: notificationId,
      type: this.getNotificationType(merchant.confidence),
      timestamp: new Date(),
      merchant: {
        name: merchant.name,
        address: merchant.address,
        confidence: merchant.confidence
      },
      recommendedCard: {
        cardId: selection.selectedCard.cardId,
        cardName: selection.selectedCard.cardName,
        lastFour: selection.selectedCard.lastFourDigits,
        rewardRate: this.formatRewardRate(selection.estimatedReward.type, selection.estimatedReward.effectiveCashBackPercent),
        estimatedValue: `$${selection.estimatedReward.dollarValue.toFixed(2)} on $${estimatedAmount}`
      },
      responded: false
    };

    // Add category options if needed
    if (merchant.confidence !== 'HIGH') {
      notification.categoryOptions = await this.buildCategoryOptions(
        userId,
        merchant.possibleCategories || [merchant.category, RewardCategory.OTHER],
        estimatedAmount
      );
    }

    return notification;
  }

  /**
   * Get notification type based on confidence
   */
  private getNotificationType(confidence: 'HIGH' | 'MEDIUM' | 'LOW'): NotificationType {
    switch (confidence) {
      case 'HIGH':
        return 'AUTO_SWITCH';  // Just confirm
      case 'MEDIUM':
        return 'CONFIRM_CATEGORY';  // Show likely options
      case 'LOW':
        return 'SELECT_CATEGORY';  // Full category picker
    }
  }

  /**
   * Build category options with best card for each
   */
  private async buildCategoryOptions(
    userId: string,
    categories: RewardCategory[],
    amount: number
  ): Promise<CategoryOption[]> {
    const options: CategoryOption[] = [];

    for (const category of categories) {
      const display = CATEGORY_DISPLAY[category] || { emoji: '🛍️', label: category };

      // Get best card for this category
      // (simplified - in production, query the selection service)
      const bestCards = cardSelectionService.getBestCardsByCategory(userId);
      const bestForCategory = bestCards.get(category);

      options.push({
        category,
        emoji: display.emoji,
        label: display.label,
        bestCard: bestForCategory?.cardName || 'Default Card',
        rewardRate: bestForCategory ? `${bestForCategory.rate}x` : '1x'
      });
    }

    return options;
  }

  /**
   * Format reward rate for display
   */
  private formatRewardRate(type: string, rate: number): string {
    if (type === 'CASH_BACK') {
      return `${rate}% back`;
    }
    return `${rate}x points`;
  }

  /**
   * User confirms the recommended card
   */
  async confirmSelection(
    notificationId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const notification = this.pendingNotifications.get(notificationId);
    if (!notification) {
      return { success: false, message: 'Notification not found' };
    }

    // Mark as responded
    notification.responded = true;

    // Set this card as default in wallet
    // (In production: trigger Apple Wallet default change)
    walletService.setPrimaryCard(userId, notification.recommendedCard.cardId);

    return {
      success: true,
      message: `${notification.recommendedCard.cardName} set as default. Ready to pay!`
    };
  }

  /**
   * User selects a different category
   */
  async selectCategory(
    notificationId: string,
    userId: string,
    category: RewardCategory,
    estimatedAmount: number = 50
  ): Promise<SmartPayNotification> {
    const notification = this.pendingNotifications.get(notificationId);

    // Get best card for selected category
    const selection = cardSelectionService.selectOptimalCard({
      userId,
      amount: estimatedAmount,
      currency: 'USD',
      // Use category hint
    });

    // Update notification with new selection
    if (notification) {
      notification.responded = true;
      notification.userSelection = {
        confirmedCategory: category,
        selectedCardId: selection.selectedCard.cardId
      };
      notification.recommendedCard = {
        cardId: selection.selectedCard.cardId,
        cardName: selection.selectedCard.cardName,
        lastFour: selection.selectedCard.lastFourDigits,
        rewardRate: this.formatRewardRate(selection.estimatedReward.type, selection.estimatedReward.effectiveCashBackPercent),
        estimatedValue: `$${selection.estimatedReward.dollarValue.toFixed(2)}`
      };
    }

    // Set as default
    walletService.setPrimaryCard(userId, selection.selectedCard.cardId);

    return notification!;
  }

  /**
   * Quick action: Select category without location detection
   * (For Siri shortcuts, widgets, etc.)
   */
  async quickSelect(
    userId: string,
    category: RewardCategory,
    estimatedAmount: number = 50
  ): Promise<{
    cardName: string;
    lastFour: string;
    rewardRate: string;
    message: string;
  }> {
    // Get best card for category
    const bestCards = cardSelectionService.getBestCardsByCategory(userId);
    const best = bestCards.get(category);

    if (!best) {
      return {
        cardName: 'No card found',
        lastFour: '----',
        rewardRate: '0x',
        message: 'No cards available for this category'
      };
    }

    // Find the card ID and set as default
    const userCards = walletService.getUserCards(userId);
    const card = userCards.find(c => c.productName === best.cardName);

    if (card) {
      walletService.setPrimaryCard(userId, card.id);
    }

    const display = CATEGORY_DISPLAY[category];
    return {
      cardName: best.cardName,
      lastFour: card?.lastFourDigits || '****',
      rewardRate: `${best.rate}x`,
      message: `${display.emoji} ${display.label}: Using ${best.cardName} (${best.rate}x)`
    };
  }

  /**
   * Get all category options for full picker UI
   */
  async getAllCategoryOptions(userId: string): Promise<CategoryOption[]> {
    const allCategories: RewardCategory[] = [
      RewardCategory.RESTAURANTS,
      RewardCategory.GROCERIES,
      RewardCategory.GAS_STATIONS,
      RewardCategory.AIRLINES,
      RewardCategory.HOTELS,
      RewardCategory.STREAMING,
      RewardCategory.PHARMACIES,
      RewardCategory.DEPARTMENT_STORES,
      RewardCategory.ELECTRONICS,
      RewardCategory.HOME_IMPROVEMENT,
      RewardCategory.OTHER
    ];

    return this.buildCategoryOptions(userId, allCategories, 50);
  }
}

export const smartPayService = new SmartPayService();
