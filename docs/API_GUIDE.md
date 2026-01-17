# API Usage Guide

Complete guide to using the Smart Card Rewards Selection API.

## Getting Started

### Starting the Server

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Or build and run production
npm run build
npm start
```

Server runs at `http://localhost:3000`

### Authentication

All endpoints require a user identifier via the `x-user-id` header:

```bash
curl -H "x-user-id: user123" http://localhost:3000/api/cards
```

## Complete API Reference

---

## Card Management

### Add a Card

**POST** `/api/cards`

Add a new credit card to the user's wallet.

**Request:**
```json
{
  "productName": "Chase Sapphire Preferred",
  "paymentToken": "tok_visa_4242",
  "lastFourDigits": "4242",
  "expiryMonth": 12,
  "expiryYear": 2027,
  "cardholderName": "John Doe",
  "network": "VISA",
  "cardType": "CREDIT",
  "issuer": {
    "id": "chase",
    "name": "Chase",
    "country": "US"
  },
  "nickname": "My Travel Card"
}
```

**Response:**
```json
{
  "card": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "userId": "user123",
    "productName": "Chase Sapphire Preferred",
    "lastFourDigits": "4242",
    "network": "VISA",
    "isActive": true,
    "isPrimary": true,
    "addedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "productName": "Chase Sapphire Preferred",
    "paymentToken": "tok_visa_4242",
    "lastFourDigits": "4242",
    "expiryMonth": 12,
    "expiryYear": 2027,
    "cardholderName": "John Doe",
    "network": "VISA",
    "issuer": {"id": "chase", "name": "Chase", "country": "US"}
  }'
```

### List All Cards

**GET** `/api/cards`

Get all cards in the user's wallet.

**Response:**
```json
{
  "cards": [
    {
      "id": "card-1",
      "productName": "Chase Sapphire Preferred",
      "nickname": "Travel Card",
      "lastFourDigits": "4242",
      "network": "VISA",
      "issuer": "Chase",
      "isPrimary": true
    },
    {
      "id": "card-2",
      "productName": "American Express Gold Card",
      "lastFourDigits": "1234",
      "network": "AMERICAN_EXPRESS",
      "issuer": "American Express",
      "isPrimary": false
    }
  ]
}
```

### Get Card Details

**GET** `/api/cards/:id`

**Response:**
```json
{
  "card": {
    "id": "card-1",
    "userId": "user123",
    "productName": "Chase Sapphire Preferred",
    "lastFourDigits": "4242",
    "expiryMonth": 12,
    "expiryYear": 2027,
    "cardholderName": "John Doe",
    "network": "VISA",
    "productTier": "PREMIUM",
    "annualFee": 95,
    "isActive": true,
    "isPrimary": true
  }
}
```

### Update Card

**PATCH** `/api/cards/:id`

Update card properties (nickname, color, active status).

**Request:**
```json
{
  "nickname": "My Dining Card",
  "color": "#1a73e8",
  "isActive": true
}
```

### Delete Card

**DELETE** `/api/cards/:id`

Remove a card from the wallet.

```bash
curl -X DELETE http://localhost:3000/api/cards/card-1 \
  -H "x-user-id: user123"
```

### Set Primary Card

**POST** `/api/cards/:id/primary`

Set a card as the primary/default card.

```bash
curl -X POST http://localhost:3000/api/cards/card-2/primary \
  -H "x-user-id: user123"
```

---

## Smart Card Selection

### Select Optimal Card

**POST** `/api/select-card`

The main endpoint - get the best card for a transaction.

**Request:**
```json
{
  "amount": 75.00,
  "currency": "USD",
  "merchantName": "Olive Garden",
  "mcc": "5812",
  "isOnline": false
}
```

**Response:**
```json
{
  "selectedCard": {
    "cardId": "card-2",
    "cardName": "American Express Gold Card",
    "lastFourDigits": "1234",
    "network": "AMERICAN_EXPRESS"
  },
  "selectionReason": "Base: 1x, +3x 4x points at restaurants worldwide",
  "estimatedReward": {
    "type": "POINTS",
    "amount": 300,
    "effectiveCashBackPercent": 6,
    "dollarValue": 4.50
  },
  "alternatives": [
    {
      "cardId": "card-1",
      "cardName": "Chase Sapphire Preferred",
      "estimatedReward": 2.81,
      "reason": "Base: 1x, +2x 3x points on dining"
    }
  ],
  "applicableOffers": [],
  "detectedCategory": "RESTAURANTS",
  "mcc": "5812"
}
```

**Common Scenarios:**

```bash
# Restaurant purchase
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"amount": 50, "merchantName": "Chipotle", "mcc": "5812"}'

# Grocery shopping
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"amount": 150, "merchantName": "Whole Foods", "mcc": "5411"}'

# Gas station
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"amount": 45, "merchantName": "Shell", "mcc": "5541"}'

# Online shopping
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"amount": 200, "merchantName": "Amazon", "isOnline": true}'

# Hotel booking
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"amount": 350, "merchantName": "Marriott", "mcc": "3503"}'

# Airline ticket
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"amount": 500, "merchantName": "Delta", "mcc": "3058"}'
```

### Compare All Cards

**POST** `/api/compare-cards`

See how all cards compare for a transaction.

**Request:**
```json
{
  "amount": 100.00,
  "merchantName": "Starbucks",
  "mcc": "5814"
}
```

**Response:**
```json
{
  "comparisons": [
    {
      "cardId": "card-2",
      "cardName": "American Express Gold Card",
      "category": "FAST_FOOD",
      "rewardType": "POINTS",
      "totalRate": 4,
      "effectiveCashBackPercent": 6,
      "dollarValue": 6.00,
      "explanation": "Base: 1x, +3x 4x points at restaurants worldwide",
      "isAtCap": false
    },
    {
      "cardId": "card-1",
      "cardName": "Chase Sapphire Preferred",
      "category": "FAST_FOOD",
      "rewardType": "POINTS",
      "totalRate": 3,
      "effectiveCashBackPercent": 3.75,
      "dollarValue": 3.75,
      "explanation": "Base: 1x, +2x 3x points on dining",
      "isAtCap": false
    }
  ]
}
```

### Best Cards by Category

**GET** `/api/best-cards-by-category`

Get the optimal card for each spending category.

**Response:**
```json
{
  "bestCardsByCategory": {
    "RESTAURANTS": { "cardName": "American Express Gold Card", "rate": 4 },
    "GROCERIES": { "cardName": "Blue Cash Preferred Card", "rate": 6 },
    "GAS_STATIONS": { "cardName": "Blue Cash Preferred Card", "rate": 3 },
    "AIRLINES": { "cardName": "American Express Platinum Card", "rate": 5 },
    "HOTELS": { "cardName": "Chase Sapphire Reserve", "rate": 3 },
    "STREAMING": { "cardName": "Blue Cash Preferred Card", "rate": 6 },
    "OTHER": { "cardName": "Citi Double Cash", "rate": 2 }
  }
}
```

---

## Offers Management

### List Card Offers

**GET** `/api/cards/:id/offers`

Get all offers for a specific card.

**Response:**
```json
{
  "offers": [
    {
      "id": "offer-1",
      "cardId": "card-1",
      "title": "Earn 5x at Whole Foods",
      "description": "Limited time: Earn 5x points at Whole Foods Market",
      "rewardType": "POINTS",
      "bonusEarnRate": 2,
      "merchantName": "Whole Foods",
      "validFrom": "2024-01-01T00:00:00.000Z",
      "validUntil": "2024-03-31T23:59:59.000Z",
      "isActivated": false
    }
  ]
}
```

### Add an Offer

**POST** `/api/cards/:id/offers`

Add a promotional offer to a card.

**Request:**
```json
{
  "title": "10% back at Amazon",
  "description": "Earn 10% back on Amazon purchases up to $50",
  "rewardType": "CASH_BACK",
  "bonusEarnRate": 10,
  "merchantName": "Amazon",
  "validFrom": "2024-01-15",
  "validUntil": "2024-02-15",
  "maxBonusAmount": 50
}
```

### Activate an Offer

**POST** `/api/cards/:cardId/offers/:offerId/activate`

Activate an offer to include it in reward calculations.

```bash
curl -X POST http://localhost:3000/api/cards/card-1/offers/offer-1/activate \
  -H "x-user-id: user123"
```

---

## Wallet Statistics

### Get Wallet Stats

**GET** `/api/wallet/stats`

Get overview statistics for the wallet.

**Response:**
```json
{
  "totalCards": 4,
  "activeCards": 4,
  "totalAnnualFees": 790,
  "primaryCard": "Chase Sapphire Preferred"
}
```

### Simulate Rewards

**POST** `/api/wallet/simulate`

Simulate monthly rewards based on spending patterns.

**Request:**
```json
{
  "monthlySpending": {
    "RESTAURANTS": 500,
    "GROCERIES": 800,
    "GAS_STATIONS": 200,
    "STREAMING": 50,
    "OTHER": 1000
  }
}
```

**Response:**
```json
{
  "simulation": [
    {
      "cardId": "card-2",
      "cardName": "American Express Gold Card",
      "totalRewards": 89.17
    },
    {
      "cardId": "card-1",
      "cardName": "Chase Sapphire Preferred",
      "totalRewards": 52.08
    },
    {
      "cardId": "card-3",
      "cardName": "Citi Double Cash",
      "totalRewards": 51.00
    }
  ]
}
```

This tells you which card would earn the most rewards based on your typical spending.

---

## Utilities

### MCC Lookup

**GET** `/api/mcc/:code`

Look up a Merchant Category Code.

```bash
curl http://localhost:3000/api/mcc/5812
```

**Response:**
```json
{
  "mcc": "5812",
  "description": "Eating Places and Restaurants",
  "category": "RESTAURANTS",
  "details": {
    "code": "5812",
    "description": "Eating Places and Restaurants",
    "category": "RESTAURANTS"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message description"
}
```

### Common Errors

| Status | Error | Cause |
|--------|-------|-------|
| 400 | "Unknown card product" | Invalid productName when adding card |
| 401 | "User ID required" | Missing x-user-id header |
| 404 | "Card not found" | Invalid card ID |
| 400 | "No cards registered for user" | User has no cards in wallet |

---

## Integration Examples

### JavaScript/TypeScript Client

```typescript
class SmartCardClient {
  private baseUrl: string;
  private userId: string;

  constructor(baseUrl: string, userId: string) {
    this.baseUrl = baseUrl;
    this.userId = userId;
  }

  async selectCard(transaction: {
    amount: number;
    merchantName?: string;
    mcc?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/api/select-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId
      },
      body: JSON.stringify(transaction)
    });
    return response.json();
  }

  async getCards() {
    const response = await fetch(`${this.baseUrl}/api/cards`, {
      headers: { 'x-user-id': this.userId }
    });
    return response.json();
  }
}

// Usage
const client = new SmartCardClient('http://localhost:3000', 'user123');
const result = await client.selectCard({
  amount: 50,
  merchantName: 'Starbucks'
});
console.log(`Use: ${result.selectedCard.cardName}`);
```

### Python Client

```python
import requests

class SmartCardClient:
    def __init__(self, base_url: str, user_id: str):
        self.base_url = base_url
        self.headers = {'x-user-id': user_id}

    def select_card(self, amount: float, merchant_name: str = None, mcc: str = None):
        response = requests.post(
            f'{self.base_url}/api/select-card',
            headers={**self.headers, 'Content-Type': 'application/json'},
            json={'amount': amount, 'merchantName': merchant_name, 'mcc': mcc}
        )
        return response.json()

# Usage
client = SmartCardClient('http://localhost:3000', 'user123')
result = client.select_card(50, merchant_name='Chipotle')
print(f"Use: {result['selectedCard']['cardName']}")
```

### cURL Script

```bash
#!/bin/bash
# smart-select.sh - Quick card selection script

USER_ID="user123"
BASE_URL="http://localhost:3000"

select_card() {
  local amount=$1
  local merchant=$2

  curl -s -X POST "$BASE_URL/api/select-card" \
    -H "Content-Type: application/json" \
    -H "x-user-id: $USER_ID" \
    -d "{\"amount\": $amount, \"merchantName\": \"$merchant\"}" \
    | jq '.selectedCard.cardName, .estimatedReward.dollarValue'
}

# Usage: ./smart-select.sh 50 "Starbucks"
select_card $1 "$2"
```
