# System Architecture

This document explains the architecture of the Smart Card Rewards Selection System.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SMART CARD SELECTION SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Client    │     │   REST API  │     │  Services   │                   │
│  │   Apps      │────▶│   Layer     │────▶│   Layer     │                   │
│  │             │     │             │     │             │                   │
│  │ • Mobile    │     │ • Express   │     │ • Selection │                   │
│  │ • Web       │     │ • Routes    │     │ • Wallet    │                   │
│  │ • Extension │     │ • Middleware│     │ • Rewards   │                   │
│  └─────────────┘     └─────────────┘     └──────┬──────┘                   │
│                                                  │                          │
│                                                  ▼                          │
│                      ┌─────────────────────────────────────────┐           │
│                      │              Data Layer                  │           │
│                      │                                          │           │
│                      │  ┌──────────┐  ┌──────────┐  ┌────────┐ │           │
│                      │  │   MCC    │  │   Card   │  │ User   │ │           │
│                      │  │ Database │  │ Products │  │ Wallet │ │           │
│                      │  └──────────┘  └──────────┘  └────────┘ │           │
│                      └─────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. API Layer (`src/api/`)

The REST API layer handles all incoming requests and routes them to appropriate services.

```
routes.ts
├── Card Management
│   ├── GET    /api/cards           → List user's cards
│   ├── POST   /api/cards           → Add new card
│   ├── GET    /api/cards/:id       → Get card details
│   ├── PATCH  /api/cards/:id       → Update card
│   ├── DELETE /api/cards/:id       → Remove card
│   └── POST   /api/cards/:id/primary → Set as primary
│
├── Smart Selection
│   ├── POST   /api/select-card     → Get optimal card
│   ├── POST   /api/compare-cards   → Compare all cards
│   └── GET    /api/best-cards-by-category → Category winners
│
├── Offers
│   ├── GET    /api/cards/:id/offers → List offers
│   ├── POST   /api/cards/:id/offers → Add offer
│   └── POST   /api/cards/:id/offers/:offerId/activate → Activate
│
└── Wallet
    ├── GET    /api/wallet/stats    → Wallet statistics
    └── POST   /api/wallet/simulate → Simulate rewards
```

### 2. Services Layer (`src/services/`)

#### CardSelectionService

The core algorithm that selects the optimal card:

```typescript
class CardSelectionService {
  // Main selection method
  selectOptimalCard(request: TransactionRequest): CardSelectionResult

  // Compare all cards for a transaction
  compareCards(request: TransactionRequest): CardRewardCalculation[]

  // Get best card for each category
  getBestCardsByCategory(userId: string): Map<RewardCategory, CardInfo>

  // Simulate rewards over spending pattern
  simulateRewards(userId: string, spending: Map): SimulationResult[]
}
```

**Selection Algorithm Flow:**

```
                    ┌─────────────────────┐
                    │  Transaction Input  │
                    │  (amount, merchant) │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Identify Category  │
                    │  (MCC → Category)   │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │   For Each Card in Wallet:     │
              │                                │
              │  1. Get base reward rate       │
              │  2. Check category bonuses     │
              │  3. Apply active offers        │
              │  4. Check spending caps        │
              │  5. Calculate effective value  │
              └────────────────┬───────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Rank by Value     │
                    │   (highest first)   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Return Best Card   │
                    │  + Alternatives     │
                    └─────────────────────┘
```

#### WalletService

Manages the user's digital wallet:

```typescript
class WalletService {
  // Card CRUD operations
  addCard(input: CardInput): Card
  getUserCards(userId: string): Card[]
  updateCard(cardId: string, updates: Partial<Card>): Card
  removeCard(cardId: string): void

  // Offer management
  addOffer(cardId: string, offer: Offer): CardOffer
  activateOffer(cardId: string, offerId: string): void

  // Spending tracking (for caps)
  recordSpending(cardId: string, category: RewardCategory, amount: number): void
  resetMonthlySpending(cardId: string): void
}
```

### 3. Data Layer (`src/data/`)

#### MCC Database (`mcc-codes.ts`)

Maps Merchant Category Codes to reward categories:

```typescript
const MCC_DATABASE: Record<string, MCCDefinition> = {
  '5812': {
    code: '5812',
    description: 'Eating Places and Restaurants',
    category: RewardCategory.RESTAURANTS,
    commonBrands: ['Olive Garden', 'Applebees']
  },
  // 100+ more codes...
}
```

**Category Mapping Strategy:**

```
MCC Code
    │
    ├─── Direct Lookup (mcc-codes.ts)
    │         │
    │         └─── Found? → Return category
    │
    ├─── Range Check
    │         │
    │         ├─── 3000-3299 → AIRLINES
    │         ├─── 3300-3499 → CAR_RENTAL
    │         ├─── 3500-3999 → HOTELS
    │         └─── etc.
    │
    └─── Merchant Name Lookup
              │
              └─── Fuzzy match against known merchants
```

#### Card Products Database (`card-products.ts`)

Contains reward structures for popular cards:

```typescript
const CARD_PRODUCTS: CardProduct[] = [
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    annualFee: 250,
    baseReward: { type: RewardType.POINTS, rate: 1 },
    categoryBonuses: [
      {
        categories: [RewardCategory.RESTAURANTS],
        type: RewardType.POINTS,
        rate: 4,
        description: '4x points at restaurants worldwide'
      },
      {
        categories: [RewardCategory.GROCERIES],
        type: RewardType.POINTS,
        rate: 4,
        cap: 25000,  // Annual cap
        description: '4x at US supermarkets'
      }
    ],
    defaultPointValueCents: 1.5  // For value calculation
  }
]
```

### 4. Models Layer (`src/models/`)

#### Card Model

```typescript
interface Card {
  id: string;
  userId: string;
  paymentToken: string;      // From payment processor (Stripe, etc.)
  lastFourDigits: string;    // For display
  network: CardNetwork;      // VISA, MASTERCARD, AMEX
  productName: string;       // "Chase Sapphire Preferred"
  isActive: boolean;
  isPrimary: boolean;
}
```

#### Reward Model

```typescript
interface RewardRule {
  category: RewardCategory;
  rewardType: RewardType;    // CASH_BACK, POINTS, MILES
  earnRate: number;          // 3 = 3% or 3x
  pointValueCents?: number;  // For conversion
  maxEarnPerMonth?: number;  // Spending caps
}

interface CardOffer {
  title: string;
  bonusEarnRate: number;
  categories?: RewardCategory[];
  validFrom: Date;
  validUntil: Date;
  isActivated: boolean;
}
```

#### Transaction Model

```typescript
interface TransactionRequest {
  userId: string;
  amount: number;
  currency: string;
  merchantId?: string;
  merchantName?: string;
  mcc?: string;
  isOnline?: boolean;
}

interface CardSelectionResult {
  selectedCard: CardInfo;
  selectionReason: string;
  estimatedReward: RewardEstimate;
  alternatives: Alternative[];
  detectedCategory: string;
}
```

## Reward Calculation Engine

### Effective Value Calculation

The system converts all rewards to a common currency (effective cash back percentage):

```
For CASH_BACK:
  effectiveValue = earnRate
  Example: 3% cash back → 3% effective

For POINTS/MILES:
  effectiveValue = earnRate × (pointValue / 100)
  Example: 4x points × 1.5¢ per point = 6% effective

For offers:
  totalValue = baseValue + offerBonus
```

### Example Calculation

Transaction: $100 dinner at a restaurant (MCC 5812)

```
Card: Amex Gold
─────────────────────────────
Base Rate:      1x points
Category Bonus: 4x on dining
Active Offer:   +2% at this restaurant
─────────────────────────────
Total Points:   400 + 200 = 600 points
Point Value:    1.5¢ each
Cash Value:     $9.00 (9% effective)


Card: Chase Sapphire Preferred
─────────────────────────────
Base Rate:      1x points
Category Bonus: 3x on dining
─────────────────────────────
Total Points:   300 points
Point Value:    1.25¢ each
Cash Value:     $3.75 (3.75% effective)


Winner: Amex Gold ($9.00 > $3.75)
```

## Data Flow Diagrams

### Card Addition Flow

```
┌────────┐     ┌─────────┐     ┌──────────────┐     ┌────────────┐
│  User  │────▶│   App   │────▶│   Payment    │────▶│  Our API   │
│        │     │         │     │  Processor   │     │            │
└────────┘     └─────────┘     │  (Stripe)    │     └────────────┘
                               └──────────────┘
    │               │                 │                    │
    │  Card info    │   Card details  │   Token +          │
    │  entry        │   (encrypted)   │   last 4           │
    │               │                 │                    │
    ▼               ▼                 ▼                    ▼
  User enters    Securely sent    Tokenized,           Stores token
  card details   to processor     returns token        + card metadata
```

### Transaction Selection Flow

```
┌────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Payment   │────▶│  Selection  │────▶│  Return Best    │
│  Terminal  │     │     API     │     │     Card        │
└────────────┘     └─────────────┘     └─────────────────┘
      │                   │                     │
      │                   │                     │
      ▼                   ▼                     ▼
  Sends MCC,        Calculates          Shows recommended
  merchant info,    rewards for         card to user
  amount           each card
```

## Extensibility Points

### Adding New Card Issuers

1. Add card products to `card-products.ts`
2. Include all category bonuses with rates
3. Set appropriate point valuations

### Adding New Merchant Categories

1. Add MCC codes to `mcc-codes.ts`
2. Map to appropriate `RewardCategory`
3. Add common brand examples

### Adding New Reward Types

1. Extend `RewardType` enum
2. Update calculation logic in `CardSelectionService`
3. Add conversion rates if applicable

## Performance Considerations

- **In-Memory Storage**: Current implementation uses Maps for fast lookup
- **Category Caching**: MCC lookups are O(1) with hash map
- **Parallel Calculation**: Cards can be evaluated concurrently
- **Lazy Loading**: Card products loaded on demand

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: Transport Security                             │
│  └── TLS 1.3 for all API calls                          │
│                                                          │
│  Layer 2: Authentication                                 │
│  └── x-user-id header (extend to JWT/OAuth)             │
│                                                          │
│  Layer 3: Data Protection                                │
│  ├── No PAN storage (payment tokens only)               │
│  ├── Encrypted at rest                                  │
│  └── Minimal PII retention                              │
│                                                          │
│  Layer 4: API Security                                   │
│  ├── Helmet.js security headers                         │
│  ├── CORS configuration                                 │
│  └── Rate limiting (add in production)                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
