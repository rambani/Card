# Testing Guide

Step-by-step guide to test the SmartPay system.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm run dev

# Server runs at http://localhost:3000
```

## Test Flow: Complete User Journey

### Step 1: See Available Cards

```bash
# Get all available card products
curl http://localhost:3000/api/card-picker/products | jq
```

Response shows cards grouped by issuer:
```json
{
  "issuers": ["American Express", "Capital One", "Chase", "Citi", ...],
  "cardsByIssuer": {
    "Chase": [
      {
        "id": "chase-sapphire-preferred",
        "name": "Chase Sapphire Preferred",
        "annualFee": 95,
        "topRewards": [
          { "category": "Dining", "rate": "3x", "emoji": "🍽️" },
          { "category": "Streaming", "rate": "3x", "emoji": "📺" }
        ],
        "color": "#004977"
      }
    ]
  }
}
```

### Step 2: Add Your Cards (Simple Selection)

```bash
# Add Chase Freedom Unlimited
curl -X POST http://localhost:3000/api/card-picker/select \
  -H "Content-Type: application/json" \
  -d '{"productId": "chase-freedom-unlimited"}'
```

Response:
```json
{
  "success": true,
  "card": {
    "id": "abc-123",
    "productId": "chase-freedom-unlimited",
    "productName": "Chase Freedom Unlimited"
  },
  "userId": "user-a1b2c3d4",
  "message": "Chase Freedom Unlimited added to your wallet!"
}
```

**Save the `userId` for subsequent requests!**

### Step 3: Add More Cards (Quick Setup)

```bash
# Add multiple cards at once
curl -X POST http://localhost:3000/api/card-picker/quick-setup \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{
    "productIds": [
      "amex-gold",
      "chase-sapphire-preferred",
      "amex-blue-cash-preferred"
    ]
  }'
```

### Step 4: View Your Cards

```bash
curl http://localhost:3000/api/card-picker/my-cards \
  -H "x-user-id: user-a1b2c3d4" | jq
```

Response:
```json
{
  "cards": [
    {
      "id": "card-1",
      "productName": "Chase Freedom Unlimited",
      "topRewards": [{"category": "Dining", "rate": "3%", "emoji": "🍽️"}],
      "color": "#0066b2"
    },
    {
      "id": "card-2",
      "productName": "American Express Gold Card",
      "topRewards": [{"category": "Dining", "rate": "4x", "emoji": "🍽️"}],
      "color": "#b5985a"
    }
  ],
  "count": 4
}
```

### Step 5: Get Card Recommendation (The Magic!)

```bash
# Simulate arriving at Chipotle
curl -X POST http://localhost:3000/api/smartpay/quick-select \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{"category": "RESTAURANTS"}'
```

Response:
```json
{
  "cardName": "American Express Gold Card",
  "lastFour": "****",
  "rewardRate": "4x",
  "message": "🍽️ Dining: Using American Express Gold Card (4x)"
}
```

### Step 6: Test Different Categories

```bash
# Groceries
curl -X POST http://localhost:3000/api/smartpay/quick-select \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{"category": "GROCERIES"}'

# Gas
curl -X POST http://localhost:3000/api/smartpay/quick-select \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{"category": "GAS_STATIONS"}'

# Travel
curl -X POST http://localhost:3000/api/smartpay/quick-select \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{"category": "AIRLINES"}'
```

### Step 7: Get All Categories with Best Cards

```bash
curl http://localhost:3000/api/smartpay/categories \
  -H "x-user-id: user-a1b2c3d4" | jq
```

---

## Test Scenarios

### Scenario A: Restaurant Purchase

```bash
# What card should I use at Olive Garden for a $50 dinner?
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{
    "amount": 50,
    "merchantName": "Olive Garden"
  }'
```

Expected: Recommends Amex Gold (4x dining)

### Scenario B: Grocery Shopping

```bash
# What card for $150 at Whole Foods?
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{
    "amount": 150,
    "merchantName": "Whole Foods",
    "mcc": "5411"
  }'
```

Expected: Recommends Blue Cash Preferred (6% groceries)

### Scenario C: Gas Station

```bash
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{
    "amount": 45,
    "merchantName": "Shell",
    "mcc": "5541"
  }'
```

### Scenario D: Compare All Cards

```bash
# See how all cards compare for a $100 restaurant bill
curl -X POST http://localhost:3000/api/compare-cards \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a1b2c3d4" \
  -d '{
    "amount": 100,
    "merchantName": "Steakhouse",
    "mcc": "5812"
  }'
```

---

## UI Testing Flow

### Onboarding Screen Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    💳 SmartPay                                  │
│                                                                 │
│            Which cards do you have?                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  🔍 Search cards...                                     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   POPULAR CARDS                                                 │
│   ─────────────                                                 │
│                                                                 │
│   ┌─────────────────────┐  ┌─────────────────────┐            │
│   │ ████████████████████│  │ ████████████████████│            │
│   │ Chase Sapphire      │  │ Amex Gold           │            │
│   │ Preferred           │  │                     │            │
│   │                     │  │                     │            │
│   │ 🍽️ 3x Dining        │  │ 🍽️ 4x Dining        │            │
│   │ ✈️ 2x Travel         │  │ 🛒 4x Groceries     │            │
│   │                     │  │                     │            │
│   │ [ ] Add this card   │  │ [✓] Added           │            │
│   └─────────────────────┘  └─────────────────────┘            │
│                                                                 │
│   ┌─────────────────────┐  ┌─────────────────────┐            │
│   │ ████████████████████│  │ ████████████████████│            │
│   │ Blue Cash           │  │ Citi Double Cash    │            │
│   │ Preferred           │  │                     │            │
│   │                     │  │                     │            │
│   │ 🛒 6% Groceries     │  │ 💳 2% Everything    │            │
│   │ 📺 6% Streaming     │  │                     │            │
│   │                     │  │                     │            │
│   │ [ ] Add this card   │  │ [ ] Add this card   │            │
│   └─────────────────────┘  └─────────────────────┘            │
│                                                                 │
│                     [ Continue → ]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Main App Screen Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  SmartPay                                    ⚙️                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │   What are you buying?                                  │   │
│  │                                                         │   │
│  │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │   │
│  │   │ 🍽️  │ │ 🛒  │ │ ⛽  │ │ ✈️  │ │ 🛍️  │            │   │
│  │   │Dine │ │Groc │ │Gas  │ │Travel│ │Other│            │   │
│  │   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  YOUR BEST CARDS                                                │
│  ───────────────                                                │
│                                                                 │
│  🍽️ Dining                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Amex Gold                              4x points       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🛒 Groceries                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Blue Cash Preferred                    6% back         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⛽ Gas                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Blue Cash Preferred                    3% back         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💳 Everything Else                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Citi Double Cash                       2% back         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                                                 │
│  ───────────────────────────────────────────────────────────   │
│  🏠 Home    📊 Rewards    💳 Cards    ⚙️ Settings               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Reference for Testing

### Card Picker Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/card-picker/products` | GET | List all card products |
| `/api/card-picker/products/:id` | GET | Get card details |
| `/api/card-picker/search?q=chase` | GET | Search cards |
| `/api/card-picker/select` | POST | Add a card |
| `/api/card-picker/quick-setup` | POST | Add multiple cards |
| `/api/card-picker/my-cards` | GET | List user's cards |

### SmartPay Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/smartpay/quick-select` | POST | Get best card for category |
| `/api/smartpay/categories` | GET | All categories with best cards |
| `/api/smartpay/location` | POST | Location-based recommendation |
| `/api/smartpay/confirm` | POST | Confirm selection |

### Selection Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/select-card` | POST | Get optimal card for transaction |
| `/api/compare-cards` | POST | Compare all cards |
| `/api/best-cards-by-category` | GET | Best card per category |

---

## Common Test Data

### Available Product IDs

```
Chase:
- chase-sapphire-preferred
- chase-sapphire-reserve
- chase-freedom-unlimited
- chase-freedom-flex

American Express:
- amex-gold
- amex-platinum
- amex-blue-cash-preferred

Capital One:
- capital-one-venture-x
- capital-one-savor

Citi:
- citi-double-cash
- citi-custom-cash

Others:
- discover-it
- wells-fargo-active-cash
- bofa-premium-rewards
- us-bank-altitude-go
```

### Category Values

```
RESTAURANTS, FAST_FOOD, CAFES, BARS
GROCERIES, SUPERMARKETS
GAS_STATIONS
AIRLINES, HOTELS, CAR_RENTAL
STREAMING, ENTERTAINMENT
PHARMACIES, HEALTHCARE
DEPARTMENT_STORES, CLOTHING
ELECTRONICS, HOME_IMPROVEMENT
OTHER
```

### Common MCC Codes

```
5812 - Restaurants
5814 - Fast Food
5411 - Grocery Stores
5541 - Gas Stations
3000-3299 - Airlines
3500-3999 - Hotels
4899 - Streaming Services
5912 - Pharmacies
```

---

## Automated Test Script

Save as `test.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
USER_ID=""

echo "=== SmartPay Test Script ==="
echo ""

# Step 1: Add cards
echo "1. Adding cards..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/card-picker/quick-setup" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": [
      "amex-gold",
      "chase-freedom-unlimited",
      "amex-blue-cash-preferred",
      "citi-double-cash"
    ]
  }')

USER_ID=$(echo $RESPONSE | jq -r '.userId')
echo "User ID: $USER_ID"
echo ""

# Step 2: Get best cards by category
echo "2. Best cards by category:"
curl -s "$BASE_URL/api/smartpay/categories" \
  -H "x-user-id: $USER_ID" | jq '.categories[] | "\(.emoji) \(.label): \(.bestCard) (\(.rewardRate))"'
echo ""

# Step 3: Test restaurant recommendation
echo "3. Restaurant ($50 at Chipotle):"
curl -s -X POST "$BASE_URL/api/smartpay/quick-select" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{"category": "RESTAURANTS"}' | jq '.message'
echo ""

# Step 4: Test grocery recommendation
echo "4. Groceries ($100 at Whole Foods):"
curl -s -X POST "$BASE_URL/api/smartpay/quick-select" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{"category": "GROCERIES"}' | jq '.message'
echo ""

# Step 5: Test gas recommendation
echo "5. Gas ($45 at Shell):"
curl -s -X POST "$BASE_URL/api/smartpay/quick-select" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{"category": "GAS_STATIONS"}' | jq '.message'
echo ""

echo "=== Tests Complete ==="
```

Run with: `chmod +x test.sh && ./test.sh`

---

## Expected Results

With cards: Amex Gold, Blue Cash Preferred, Chase Freedom Unlimited, Citi Double Cash

| Category | Expected Card | Rate |
|----------|---------------|------|
| Dining | Amex Gold | 4x |
| Groceries | Blue Cash Preferred | 6% |
| Gas | Blue Cash Preferred | 3% |
| Streaming | Blue Cash Preferred | 6% |
| Travel | Amex Gold | 3x |
| Everything else | Citi Double Cash | 2% |
