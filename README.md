# Smart Card Rewards Selection System

A digital wallet system that automatically selects the optimal credit card for each transaction based on rewards, offers, and spending patterns.

## Features

- **Smart Card Selection**: Automatically recommends the best card for each purchase
- **MCC-Based Categorization**: Uses Merchant Category Codes to identify transaction types
- **Reward Calculation**: Calculates effective cash back value for points/miles
- **Offer Tracking**: Includes active promotions in reward calculations
- **Spending Cap Awareness**: Tracks category spending limits
- **Multi-Card Comparison**: Shows alternatives with reward comparisons

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

The server will start at `http://localhost:3000`.

## API Overview

### Card Management

```bash
# Add a card
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "productName": "Chase Sapphire Preferred",
    "paymentToken": "tok_visa_123",
    "lastFourDigits": "4242",
    "expiryMonth": 12,
    "expiryYear": 2027,
    "cardholderName": "John Doe",
    "network": "VISA",
    "issuer": { "id": "chase", "name": "Chase", "country": "US" }
  }'

# List cards
curl http://localhost:3000/api/cards \
  -H "x-user-id: user123"
```

### Smart Card Selection

```bash
# Get optimal card for a restaurant purchase
curl -X POST http://localhost:3000/api/select-card \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "amount": 75.00,
    "merchantName": "Olive Garden",
    "mcc": "5812"
  }'
```

Response:
```json
{
  "selectedCard": {
    "cardId": "abc-123",
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
  "alternatives": [...],
  "detectedCategory": "RESTAURANTS",
  "mcc": "5812"
}
```

### Compare All Cards

```bash
curl -X POST http://localhost:3000/api/compare-cards \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "amount": 100.00,
    "merchantName": "Shell",
    "mcc": "5541"
  }'
```

### Get Best Card Per Category

```bash
curl http://localhost:3000/api/best-cards-by-category \
  -H "x-user-id: user123"
```

## How It Works

### Transaction Identification

When a transaction occurs, the system identifies the category using:

1. **MCC Code** (Primary): 4-digit Merchant Category Code from payment networks
2. **Merchant ID**: Direct lookup for known merchants
3. **Merchant Name**: Fuzzy matching against known retailers

### Reward Calculation

For each card, the system calculates:

```
Effective Value = Base Rate + Category Bonus + Active Offers
```

Points/miles are converted to cash value using issuer-specific valuations:
- Chase Ultimate Rewards: 1.25-1.5 cents/point
- Amex Membership Rewards: 1.5-2.0 cents/point
- Capital One Miles: 1.0 cent/mile

### Card Product Database

The system includes reward structures for popular cards:

| Card | Best Categories | Rate |
|------|----------------|------|
| Amex Gold | Dining, Groceries | 4x |
| Chase Sapphire Preferred | Dining, Travel | 3x |
| Chase Sapphire Reserve | Dining, Travel | 3x |
| Blue Cash Preferred | Groceries, Streaming | 6% |
| Citi Double Cash | Everything | 2% |
| Capital One SavorOne | Dining, Entertainment | 3% |

## Project Structure

```
src/
├── api/
│   └── routes.ts         # API endpoints
├── data/
│   ├── mcc-codes.ts      # MCC to category mapping
│   └── card-products.ts  # Card reward structures
├── models/
│   ├── Card.ts           # Card data model
│   ├── Reward.ts         # Reward rules and offers
│   └── Transaction.ts    # Transaction data model
├── services/
│   ├── CardSelectionService.ts  # Selection algorithm
│   └── WalletService.ts         # Wallet management
└── index.ts              # Application entry point

docs/
└── DATA_TRANSMISSION.md  # How credit card data works
```

## Security Notes

This system is designed with PCI compliance in mind:

- **Never stores full card numbers** - Only payment processor tokens
- **Display data only** - Last 4 digits, expiry, cardholder name
- **Token-based payments** - Actual charges go through payment processor

## Supported Card Products

The system includes reward data for 15+ popular credit cards from:
- Chase (Sapphire Preferred, Sapphire Reserve, Freedom Flex, Freedom Unlimited)
- American Express (Gold, Platinum, Blue Cash Preferred)
- Capital One (Venture X, SavorOne)
- Citi (Double Cash, Custom Cash)
- Discover (it Cash Back)
- Wells Fargo (Active Cash)
- Bank of America (Premium Rewards)
- U.S. Bank (Altitude Go)

## Extending the System

### Adding New Cards

Edit `src/data/card-products.ts`:

```typescript
{
  id: 'new-card-id',
  name: 'New Card Name',
  issuer: 'Issuer Name',
  network: CardNetwork.VISA,
  annualFee: 95,
  productTier: 'PREMIUM',
  defaultPointValueCents: 1.5,
  baseReward: { type: RewardType.POINTS, rate: 1 },
  categoryBonuses: [
    {
      categories: [RewardCategory.DINING],
      type: RewardType.POINTS,
      rate: 4,
      description: '4x on dining'
    }
  ],
  features: ['Feature 1', 'Feature 2']
}
```

### Adding New MCC Codes

Edit `src/data/mcc-codes.ts`:

```typescript
'1234': {
  code: '1234',
  description: 'New Merchant Type',
  category: RewardCategory.CATEGORY_NAME,
  commonBrands: ['Brand1', 'Brand2']
}
```

## License

MIT
