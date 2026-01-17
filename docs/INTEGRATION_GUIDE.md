# Integration Guide

This guide explains how to integrate the Smart Card Selection System with various platforms and use cases.

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [Mobile Wallet Integration](#mobile-wallet-integration)
3. [Browser Extension Integration](#browser-extension-integration)
4. [Point of Sale Integration](#point-of-sale-integration)
5. [E-commerce Integration](#e-commerce-integration)
6. [Banking App Integration](#banking-app-integration)
7. [Webhook Events](#webhook-events)

---

## Integration Overview

### Integration Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTEGRATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                  │
│    │   Mobile     │   │   Browser    │   │    POS       │                  │
│    │   Wallet     │   │   Extension  │   │  Terminal    │                  │
│    └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                  │
│           │                  │                  │                           │
│           └──────────────────┼──────────────────┘                           │
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │   Selection API     │                                  │
│                    │  POST /select-card  │                                  │
│                    └─────────────────────┘                                  │
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │  Payment Processor  │                                  │
│                    │  (Stripe/Braintree) │                                  │
│                    └─────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### When to Call the Selection API

| Trigger | Action |
|---------|--------|
| User opens wallet app | Pre-load best cards by category |
| User approaches POS terminal | Query optimal card for merchant |
| User reaches checkout page | Recommend card based on merchant |
| User starts payment flow | Final card selection |

---

## Mobile Wallet Integration

### Overview

Integrate with iOS/Android wallet apps to provide automatic card recommendations.

### Integration Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MOBILE WALLET FLOW                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. USER OPENS WALLET                                                      │
│     ┌─────────────┐                                                        │
│     │  Wallet App │ ──▶ GET /api/cards (load user's cards)                │
│     └─────────────┘ ──▶ GET /api/best-cards-by-category (precompute)      │
│                                                                            │
│  2. APPROACHING MERCHANT (NFC/Location detected)                           │
│     ┌─────────────┐                                                        │
│     │  Wallet App │ ──▶ POST /api/select-card                             │
│     └─────────────┘     { merchantName, amount (estimated), location }     │
│           │                                                                │
│           ▼                                                                │
│     ┌───────────────────────────────────────┐                              │
│     │  "Use Amex Gold for 4x dining points" │                              │
│     │  [Amex Gold ****1234]                 │                              │
│     │                                       │                              │
│     │  Alternatives:                        │                              │
│     │  • Chase Sapphire (3x) - $2.25 value │                              │
│     │  • Freedom Flex (3%) - $1.50 value   │                              │
│     └───────────────────────────────────────┘                              │
│                                                                            │
│  3. USER CONFIRMS PAYMENT                                                  │
│     ┌─────────────┐                                                        │
│     │  Wallet App │ ──▶ Process payment with selected card                │
│     └─────────────┘ ──▶ POST /api/record-transaction (for tracking)       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### iOS Implementation (Swift)

```swift
import Foundation

class SmartCardService {
    private let baseURL = "https://api.smartcard.example.com"
    private let userId: String

    init(userId: String) {
        self.userId = userId
    }

    func selectOptimalCard(
        amount: Double,
        merchantName: String?,
        mcc: String?,
        completion: @escaping (CardSelection?) -> Void
    ) {
        var body: [String: Any] = ["amount": amount]
        if let merchant = merchantName { body["merchantName"] = merchant }
        if let code = mcc { body["mcc"] = code }

        var request = URLRequest(url: URL(string: "\(baseURL)/api/select-card")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(userId, forHTTPHeaderField: "x-user-id")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, _, error in
            guard let data = data, error == nil else {
                completion(nil)
                return
            }
            let selection = try? JSONDecoder().decode(CardSelection.self, from: data)
            DispatchQueue.main.async {
                completion(selection)
            }
        }.resume()
    }
}

// Usage in wallet view
class WalletViewController: UIViewController {
    let smartCard = SmartCardService(userId: "user123")

    func onMerchantDetected(merchantName: String, estimatedAmount: Double) {
        smartCard.selectOptimalCard(
            amount: estimatedAmount,
            merchantName: merchantName,
            mcc: nil
        ) { [weak self] selection in
            guard let selection = selection else { return }
            self?.showCardRecommendation(selection)
        }
    }

    func showCardRecommendation(_ selection: CardSelection) {
        // Update UI to highlight recommended card
        let alert = UIAlertController(
            title: "Best Card for \(selection.detectedCategory)",
            message: "Use \(selection.selectedCard.cardName) for \(selection.estimatedReward.effectiveCashBackPercent)% back",
            preferredStyle: .actionSheet
        )
        // Add actions...
    }
}
```

### Android Implementation (Kotlin)

```kotlin
class SmartCardService(private val userId: String) {
    private val client = OkHttpClient()
    private val baseUrl = "https://api.smartcard.example.com"

    suspend fun selectOptimalCard(
        amount: Double,
        merchantName: String? = null,
        mcc: String? = null
    ): CardSelection? = withContext(Dispatchers.IO) {
        val body = JSONObject().apply {
            put("amount", amount)
            merchantName?.let { put("merchantName", it) }
            mcc?.let { put("mcc", it) }
        }

        val request = Request.Builder()
            .url("$baseUrl/api/select-card")
            .post(body.toString().toRequestBody("application/json".toMediaType()))
            .addHeader("x-user-id", userId)
            .build()

        client.newCall(request).execute().use { response ->
            if (response.isSuccessful) {
                response.body?.string()?.let {
                    Gson().fromJson(it, CardSelection::class.java)
                }
            } else null
        }
    }
}

// Usage in activity
class WalletActivity : AppCompatActivity() {
    private val smartCard = SmartCardService("user123")

    private fun onNfcMerchantDetected(merchantInfo: MerchantInfo) {
        lifecycleScope.launch {
            val selection = smartCard.selectOptimalCard(
                amount = merchantInfo.estimatedAmount,
                merchantName = merchantInfo.name
            )
            selection?.let { showRecommendation(it) }
        }
    }
}
```

---

## Browser Extension Integration

### Overview

A browser extension that recommends the best card at e-commerce checkout pages.

### Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   BROWSER EXTENSION ARCHITECTURE                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────┐     ┌─────────────────────┐                      │
│  │   Content Script    │     │  Background Worker   │                      │
│  │  (runs on page)     │◀───▶│  (API calls)         │                      │
│  └──────────┬──────────┘     └──────────┬──────────┘                      │
│             │                           │                                  │
│             │ Detect checkout           │ POST /select-card                │
│             │ Extract merchant/amount   │                                  │
│             │                           │                                  │
│             ▼                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐                  │
│  │                    CHECKOUT PAGE                     │                  │
│  │  ┌───────────────────────────────────────────────┐  │                  │
│  │  │  💳 SmartCard Recommends:                     │  │                  │
│  │  │  Use Amex Gold for 4x points ($3.00 value)    │  │                  │
│  │  │  [Apply Card] [Show Alternatives]              │  │                  │
│  │  └───────────────────────────────────────────────┘  │                  │
│  │                                                      │                  │
│  │  Payment Method: [Credit Card ▼]                    │                  │
│  │  Card Number: [________________]                    │                  │
│  │                                                      │                  │
│  └─────────────────────────────────────────────────────┘                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Extension Implementation

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Smart Card Selector",
  "version": "1.0",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://*/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["https://*/*checkout*", "https://*/*cart*", "https://*/*payment*"],
    "js": ["content.js"],
    "css": ["styles.css"]
  }]
}
```

**background.js:**
```javascript
// Background service worker
const API_BASE = 'https://api.smartcard.example.com';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'selectCard') {
    selectOptimalCard(request.data).then(sendResponse);
    return true; // Keep channel open for async response
  }
});

async function selectOptimalCard({ amount, merchantName }) {
  const { userId } = await chrome.storage.sync.get('userId');

  const response = await fetch(`${API_BASE}/api/select-card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify({ amount, merchantName })
  });

  return response.json();
}
```

**content.js:**
```javascript
// Content script - runs on checkout pages
class CheckoutDetector {
  constructor() {
    this.init();
  }

  init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detect());
    } else {
      this.detect();
    }
  }

  detect() {
    const merchantName = this.getMerchantName();
    const amount = this.getOrderTotal();

    if (amount > 0) {
      this.getRecommendation(amount, merchantName);
    }
  }

  getMerchantName() {
    // Extract from domain or page title
    const domain = window.location.hostname.replace('www.', '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  getOrderTotal() {
    // Common selectors for order totals
    const selectors = [
      '[data-testid="order-total"]',
      '.order-total',
      '.cart-total',
      '#total-price',
      '.grand-total'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent;
        const match = text.match(/\$?([\d,]+\.?\d*)/);
        if (match) {
          return parseFloat(match[1].replace(',', ''));
        }
      }
    }
    return 0;
  }

  async getRecommendation(amount, merchantName) {
    const response = await chrome.runtime.sendMessage({
      action: 'selectCard',
      data: { amount, merchantName }
    });

    if (response?.selectedCard) {
      this.showRecommendation(response);
    }
  }

  showRecommendation(selection) {
    const widget = document.createElement('div');
    widget.id = 'smartcard-widget';
    widget.innerHTML = `
      <div class="smartcard-header">
        💳 SmartCard Recommends
      </div>
      <div class="smartcard-body">
        <strong>${selection.selectedCard.cardName}</strong>
        <br>
        Earn ${selection.estimatedReward.effectiveCashBackPercent}% back
        ($${selection.estimatedReward.dollarValue.toFixed(2)} value)
        <br>
        <small>${selection.selectionReason}</small>
      </div>
      <div class="smartcard-actions">
        <button id="smartcard-details">View Details</button>
      </div>
    `;

    // Insert near payment form
    const paymentForm = document.querySelector('[data-testid="payment-form"], .payment-form, #payment');
    if (paymentForm) {
      paymentForm.parentNode.insertBefore(widget, paymentForm);
    }
  }
}

new CheckoutDetector();
```

---

## Point of Sale Integration

### Overview

Integrate with POS systems to provide card recommendations at physical retail locations.

### NFC/Tap to Pay Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       POS INTEGRATION FLOW                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. TRANSACTION INITIATED                                                  │
│     ┌──────────┐                                                           │
│     │   POS    │ ──▶ Send transaction details to smart card system        │
│     │ Terminal │     { mcc, merchantId, amount }                           │
│     └──────────┘                                                           │
│          │                                                                 │
│          ▼                                                                 │
│  2. CARD SELECTION                                                         │
│     ┌──────────────────┐                                                   │
│     │ Selection API    │ ──▶ Returns optimal card + token                 │
│     └──────────────────┘                                                   │
│          │                                                                 │
│          ▼                                                                 │
│  3. CUSTOMER DISPLAY (optional)                                            │
│     ┌───────────────────────────────────────┐                              │
│     │  Recommended: Amex Gold (4x dining)   │                              │
│     │  Tap phone to pay with optimal card   │                              │
│     └───────────────────────────────────────┘                              │
│          │                                                                 │
│          ▼                                                                 │
│  4. PAYMENT PROCESSING                                                     │
│     ┌──────────┐                                                           │
│     │   NFC    │ ──▶ Phone selects recommended card automatically         │
│     │   Tap    │ ──▶ Payment token sent to processor                      │
│     └──────────┘                                                           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### POS Integration API

```typescript
// POS system integration
interface POSTransaction {
  terminalId: string;
  merchantId: string;
  mcc: string;
  amount: number;
  currency: string;
  customerId?: string;  // Loyalty program ID
}

async function getOptimalCardForPOS(transaction: POSTransaction) {
  // Look up user by loyalty ID or prompt for identification
  const userId = await identifyCustomer(transaction.customerId);

  const response = await fetch('/api/select-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-terminal-id': transaction.terminalId
    },
    body: JSON.stringify({
      amount: transaction.amount,
      mcc: transaction.mcc,
      merchantId: transaction.merchantId
    })
  });

  return response.json();
}
```

---

## E-commerce Integration

### Checkout Widget

Embed a card recommendation widget in your checkout page.

```html
<!-- Include the widget script -->
<script src="https://cdn.smartcard.example.com/widget.js"></script>

<!-- Add widget container -->
<div id="smartcard-recommendation"></div>

<!-- Initialize -->
<script>
  SmartCardWidget.init({
    containerId: 'smartcard-recommendation',
    userId: 'USER_ID_FROM_YOUR_AUTH',
    orderTotal: 125.99,
    merchantName: 'Your Store Name',
    onCardSelected: function(card) {
      // Auto-fill card details or show instructions
      console.log('Selected card:', card.cardName);
    }
  });
</script>
```

### Server-Side Integration

```javascript
// Node.js e-commerce backend
const express = require('express');
const app = express();

app.post('/checkout/get-card-recommendation', async (req, res) => {
  const { userId, orderTotal, items } = req.body;

  // Determine primary category from items
  const category = determineCategoryFromItems(items);

  const response = await fetch('https://api.smartcard.example.com/api/select-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify({
      amount: orderTotal,
      merchantName: 'Your Store',
      // Map your category to MCC
      mcc: categoryToMCC(category)
    })
  });

  const recommendation = await response.json();
  res.json(recommendation);
});

function categoryToMCC(category) {
  const mapping = {
    'electronics': '5732',
    'clothing': '5651',
    'groceries': '5411',
    'home': '5200'
  };
  return mapping[category] || '5999';
}
```

---

## Banking App Integration

### Overview

Banks can integrate this system into their mobile apps to help customers maximize rewards.

### Integration Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    BANKING APP INTEGRATION                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐            │
│  │  Banking App  │────▶│  Bank's API   │────▶│ SmartCard API │            │
│  │               │     │   Gateway     │     │               │            │
│  └───────────────┘     └───────────────┘     └───────────────┘            │
│         │                                            │                     │
│         │ Display                                    │                     │
│         ▼                                            ▼                     │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │                      REWARDS DASHBOARD                       │          │
│  │                                                              │          │
│  │  Your Cards                    Best Card by Category         │          │
│  │  ─────────                     ─────────────────────         │          │
│  │  💳 Sapphire Preferred         🍽️ Dining: Sapphire (3x)      │          │
│  │  💳 Freedom Flex               ✈️ Travel: Sapphire (3x)      │          │
│  │  💳 Freedom Unlimited          ⛽ Gas: Freedom (5x this Q)   │          │
│  │                                🛒 Grocery: Freedom Unlim     │          │
│  │                                                              │          │
│  │  [Simulate My Rewards]  [View Transaction History]          │          │
│  │                                                              │          │
│  └─────────────────────────────────────────────────────────────┘          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Webhook Events

### Available Events

Configure webhooks to receive notifications:

| Event | Description |
|-------|-------------|
| `card.added` | New card added to wallet |
| `card.removed` | Card removed from wallet |
| `selection.made` | Card recommendation generated |
| `offer.activated` | User activated an offer |
| `cap.reached` | Spending cap reached for category |

### Webhook Payload

```json
{
  "event": "selection.made",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "data": {
    "userId": "user123",
    "transactionAmount": 75.00,
    "category": "RESTAURANTS",
    "selectedCard": "amex-gold",
    "estimatedReward": 4.50,
    "alternativesCount": 3
  }
}
```

### Webhook Configuration

```bash
# Register a webhook endpoint
curl -X POST https://api.smartcard.example.com/api/webhooks \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "url": "https://your-app.com/webhooks/smartcard",
    "events": ["selection.made", "cap.reached"],
    "secret": "your_webhook_secret"
  }'
```

---

## Security Best Practices

### API Security

1. **Use HTTPS** for all API calls
2. **Implement rate limiting** to prevent abuse
3. **Validate all inputs** on both client and server
4. **Use secure token storage** (Keychain/Keystore)

### Data Privacy

1. **Never log sensitive data** (tokens, card numbers)
2. **Implement user consent** for data collection
3. **Provide data export/deletion** options
4. **Follow GDPR/CCPA** requirements

### Token Handling

```typescript
// Secure token storage example (React Native)
import * as Keychain from 'react-native-keychain';

async function storePaymentToken(cardId: string, token: string) {
  await Keychain.setGenericPassword(cardId, token, {
    service: 'smartcard-tokens',
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}

async function getPaymentToken(cardId: string) {
  const credentials = await Keychain.getGenericPassword({
    service: 'smartcard-tokens'
  });
  return credentials ? credentials.password : null;
}
```
