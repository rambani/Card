/**
 * Wallet Switcher Service
 *
 * Handles switching the default card in Apple Pay / Google Pay.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * IMPORTANT: PLATFORM LIMITATIONS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * APPLE PAY (iOS):
 * ───────────────────────────────────────────────────────────────────────
 * • No public API to programmatically change the default card
 * • PassKit framework allows ADDING cards, but not setting default
 * • Workarounds:
 *   1. Deep link to Wallet settings (user manually selects)
 *   2. Use Shortcuts/Siri integration for voice activation
 *   3. Widget that shows "tap to open wallet with instructions"
 *
 * GOOGLE PAY (Android):
 * ───────────────────────────────────────────────────────────────────────
 * • No public API for changing default payment method
 * • Can use Intent to open Google Pay settings
 * • Wear OS has slightly more flexibility
 *
 * SAMSUNG PAY:
 * ───────────────────────────────────────────────────────────────────────
 * • SDK allows some card management
 * • More flexible than Apple/Google
 *
 * ═══════════════════════════════════════════════════════════════════════
 * OUR APPROACH: GUIDE THE USER
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Since we can't auto-switch, we:
 * 1. Show clear notification with the right card
 * 2. Provide quick action to open wallet
 * 3. Display visual guide showing which card to select
 * 4. Remember preference for next time at this merchant
 *
 */

import { Card } from '../models/Card';

export interface WalletSwitchResult {
  success: boolean;
  method: 'AUTO' | 'MANUAL_REQUIRED';
  message: string;
  deepLink?: string;
  instructions?: string[];
}

export type WalletProvider = 'APPLE_PAY' | 'GOOGLE_PAY' | 'SAMSUNG_PAY' | 'UNKNOWN';

export class WalletSwitcher {

  /**
   * Detect which wallet the user has
   */
  detectWalletProvider(userAgent?: string): WalletProvider {
    // In a real mobile app, you'd check:
    // - iOS: PassKit availability
    // - Android: Google Pay API availability

    if (!userAgent) return 'UNKNOWN';

    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'APPLE_PAY';
    }
    if (userAgent.includes('Android')) {
      return 'GOOGLE_PAY';
    }
    return 'UNKNOWN';
  }

  /**
   * Attempt to switch default card
   */
  async switchDefaultCard(
    card: Card,
    walletProvider: WalletProvider
  ): Promise<WalletSwitchResult> {

    switch (walletProvider) {
      case 'APPLE_PAY':
        return this.switchApplePay(card);

      case 'GOOGLE_PAY':
        return this.switchGooglePay(card);

      case 'SAMSUNG_PAY':
        return this.switchSamsungPay(card);

      default:
        return {
          success: false,
          method: 'MANUAL_REQUIRED',
          message: 'Unknown wallet provider',
          instructions: ['Please manually select your card in your wallet app']
        };
    }
  }

  /**
   * Apple Pay switching (requires user action)
   */
  private switchApplePay(card: Card): WalletSwitchResult {
    // Deep link to Wallet app
    // Note: This opens wallet but can't pre-select a card
    const deepLink = 'shoebox://';  // Opens Wallet app

    return {
      success: true,
      method: 'MANUAL_REQUIRED',
      message: `Select ${card.productName} (****${card.lastFourDigits}) in Wallet`,
      deepLink,
      instructions: [
        '1. Tap to open Apple Wallet',
        `2. Find your ${card.productName} card`,
        '3. Tap and hold to set as default',
        '4. Or just keep it on screen and double-click power to pay'
      ]
    };
  }

  /**
   * Google Pay switching (requires user action)
   */
  private switchGooglePay(card: Card): WalletSwitchResult {
    // Intent to open Google Pay
    const deepLink = 'intent://pay/#Intent;scheme=gpay;package=com.google.android.apps.walletnfcrel;end';

    return {
      success: true,
      method: 'MANUAL_REQUIRED',
      message: `Select ${card.productName} (****${card.lastFourDigits}) in Google Pay`,
      deepLink: 'gpay://default',  // Simplified for demo
      instructions: [
        '1. Tap to open Google Pay',
        '2. Go to "Payment methods"',
        `3. Find your ${card.productName} card`,
        '4. Tap the 3 dots → "Set as default"'
      ]
    };
  }

  /**
   * Samsung Pay switching
   */
  private switchSamsungPay(card: Card): WalletSwitchResult {
    return {
      success: true,
      method: 'MANUAL_REQUIRED',
      message: `Select ${card.productName} in Samsung Pay`,
      deepLink: 'samsungpay://launch',
      instructions: [
        '1. Swipe up from bottom of screen',
        `2. Swipe to your ${card.productName} card`,
        '3. Authenticate and pay'
      ]
    };
  }

  /**
   * Generate a visual card indicator for the notification
   */
  generateCardVisual(card: Card): CardVisual {
    // Generate a simple visual representation
    const networkColors: Record<string, string> = {
      'VISA': '#1A1F71',
      'MASTERCARD': '#EB001B',
      'AMERICAN_EXPRESS': '#006FCF',
      'DISCOVER': '#FF6000'
    };

    return {
      backgroundColor: networkColors[card.network] || '#333333',
      lastFour: card.lastFourDigits,
      networkLogo: card.network,
      productName: card.productName,
      displayText: `****${card.lastFourDigits}`
    };
  }

  /**
   * Create Siri Shortcut configuration (iOS)
   *
   * Users can set up: "Hey Siri, I'm buying groceries"
   * → Shortcut runs our app's quick select
   * → Shows which card to use
   */
  getSiriShortcutConfig(category: string): SiriShortcut {
    return {
      activityType: 'com.smartpay.selectCard',
      title: `SmartPay: ${category}`,
      suggestedInvocationPhrase: `I'm buying ${category.toLowerCase()}`,
      userInfo: { category },
      isEligibleForSearch: true,
      isEligibleForPrediction: true
    };
  }
}

interface CardVisual {
  backgroundColor: string;
  lastFour: string;
  networkLogo: string;
  productName: string;
  displayText: string;
}

interface SiriShortcut {
  activityType: string;
  title: string;
  suggestedInvocationPhrase: string;
  userInfo: Record<string, string>;
  isEligibleForSearch: boolean;
  isEligibleForPrediction: boolean;
}

export const walletSwitcher = new WalletSwitcher();
