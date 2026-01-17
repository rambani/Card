# How SmartPay Works

A simple guide to understanding the Smart Card Rewards Selection System.

## The Problem

You have multiple credit cards with different rewards:

| Card | Best For | Reward |
|------|----------|--------|
| Amex Gold | Restaurants | 4x points |
| Blue Cash Preferred | Groceries | 6% back |
| Chase Sapphire | Travel | 3x points |
| Citi Double Cash | Everything else | 2% back |

**The challenge**: Remembering which card to use at each store.

**The cost of forgetting**: Using a 2% card at a restaurant instead of a 4x card means losing ~$4 on every $100 spent.

## The Solution: SmartPay

SmartPay tells you which card to use based on where you are.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   You walk into Chipotle                                        │
│           ↓                                                     │
│   📱 Notification appears:                                      │
│   ┌───────────────────────────────────────┐                    │
│   │ 🍽️ CHIPOTLE                           │                    │
│   │                                       │                    │
│   │ Use Amex Gold for 4x points           │                    │
│   │ Earn ~$2.00 on this purchase          │                    │
│   │                                       │                    │
│   │ [ ✓ Open Wallet ]                     │                    │
│   └───────────────────────────────────────┘                    │
│           ↓                                                     │
│   You tap → Wallet opens → Select Amex Gold → Pay              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## How It Identifies Merchants

### Step 1: Location Detection

Your phone's GPS tells us where you are.

### Step 2: Merchant Lookup

We identify the merchant using:

```
PRIORITY ORDER:

1. Known merchant database
   "Chipotle" → Restaurant → HIGH confidence

2. Google/Apple Places API
   GPS coordinates → "Chipotle Mexican Grill" nearby

3. Place type mapping
   Google says "restaurant" → Dining category

4. Ask the user (fallback)
   "What are you buying?" → [🍽️] [🛒] [⛽] [🛍️]
```

### Step 3: Category Matching

Once we know the merchant, we map it to a rewards category:

```
Chipotle → Restaurant → MCC 5812 → DINING category
```

### Step 4: Card Selection

We calculate which card earns the most:

```
DINING at $50:

Amex Gold:     4x × 1.5¢ value = 6.0% effective → $3.00 ✓ BEST
Chase Sapphire: 3x × 1.25¢     = 3.75% effective → $1.88
Blue Cash:     1%              = 1.0% effective  → $0.50
Citi Double:   2%              = 2.0% effective  → $1.00
```

## The User Experience

### Scenario A: Known Merchant (One Tap)

```
┌────────────────────────────────────┐
│ 🍽️ CHIPOTLE                        │
│                                    │
│ Best card: Amex Gold (4x)          │
│ Value: $3.00 on ~$50               │
│                                    │
│ [ ✓ Use This ]  [ Other Options ]  │
└────────────────────────────────────┘

→ Tap "Use This" → Done
```

### Scenario B: Multi-Category Store (Two Taps)

```
┌────────────────────────────────────┐
│ 🏪 TARGET                          │
│                                    │
│ What are you buying?               │
│                                    │
│ [🛒 Grocery] [👕 Clothes]          │
│ [💊 Pharmacy] [🛍️ Other]           │
└────────────────────────────────────┘

→ Tap "Grocery" → Blue Cash selected → Done
```

### Scenario C: Voice Command (Zero Taps)

```
"Hey Siri, I'm buying groceries"
         ↓
"Using Blue Cash Preferred for 6% back"
         ↓
Wallet opens, ready to pay
```

## Why Not Auto-Switch Cards?

### The Platform Limitation

Apple Pay and Google Pay don't allow apps to programmatically change the default card. This is a security decision by Apple/Google.

```
WHAT WE CAN'T DO:
❌ Automatically switch your Apple Pay default
❌ Intercept the payment and route it
❌ Control which card appears when you double-click

WHAT WE CAN DO:
✅ Detect where you are
✅ Tell you which card is best
✅ Open the Wallet app for you
✅ Show you which card to select
```

### The "Curve" Approach (Not Available in US)

Curve (UK/EU) solves this by being a card issuer themselves:

```
CURVE MODEL:
You → Curve Card → Merchant
         ↓
    Curve routes to your Amex/Chase/etc.

HOW THEY DO IT:
- They have a banking license
- They issue their own Mastercard
- They charge your underlying card as a separate transaction
- Merchant sees "Curve" not your actual card

WHY IT'S NOT IN US:
- Requires money transmitter licenses (50 states)
- Regulatory approval takes years
- Costs millions in legal/compliance
- Card network rules differ in US
```

### Our Approach: Practical & Effective

```
SMARTPAY MODEL:
You → See recommendation → Select card → Pay

ADVANTAGES:
✅ Works today (no regulatory hurdles)
✅ Category bonuses always apply correctly
✅ All card benefits preserved
✅ No middleman fees
✅ 3 seconds of effort vs. automatic

THE TRADEOFF:
You manually select the card (~3 seconds)
But you ALWAYS get the right rewards
```

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SMARTPAY SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MOBILE APP                          BACKEND API                │
│  ──────────                          ───────────                │
│  │                                   │                          │
│  │ Location                          │ /api/smartpay/location   │
│  │ Services ──────────────────────▶  │ - Detect merchant        │
│  │                                   │ - Match category         │
│  │                                   │ - Calculate best card    │
│  │ Notification ◀────────────────────│ - Return recommendation  │
│  │ Display                           │                          │
│  │                                   │ /api/smartpay/confirm    │
│  │ User ─────────────────────────▶   │ - Set as default         │
│  │ Confirms                          │ - Open wallet            │
│  │                                   │                          │
│  │ Wallet                            │                          │
│  │ Opens ───▶ User pays              │                          │
│  │                                   │                          │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Endpoint | Purpose | When to Call |
|----------|---------|--------------|
| `POST /api/smartpay/location` | Get card recommendation | User location changes |
| `POST /api/smartpay/confirm` | Confirm selection | User taps "Use This" |
| `POST /api/smartpay/select-category` | Manual category pick | User taps category button |
| `POST /api/smartpay/quick-select` | Voice/widget selection | Siri shortcut triggered |
| `GET /api/smartpay/categories` | Get category list | Build category picker UI |

## Example API Flow

```bash
# 1. User arrives at location
POST /api/smartpay/location
{
  "latitude": 37.7749,
  "longitude": -122.4194
}

# Response
{
  "detected": true,
  "notification": {
    "type": "AUTO_SWITCH",
    "merchant": { "name": "Chipotle", "confidence": "HIGH" },
    "recommendedCard": {
      "cardName": "Amex Gold",
      "rewardRate": "4x points",
      "estimatedValue": "$3.00"
    }
  }
}

# 2. User confirms
POST /api/smartpay/confirm
{ "notificationId": "notif-123" }

# Response
{
  "success": true,
  "message": "Amex Gold ready. Opening wallet..."
}
```

## The Value Proposition

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  WITHOUT SMARTPAY:                                              │
│  - You guess which card to use                                  │
│  - Often use the wrong one                                      │
│  - Miss out on 2-4% rewards regularly                           │
│  - Over a year: $200-500 in lost rewards                        │
│                                                                 │
│  WITH SMARTPAY:                                                 │
│  - Always know the best card                                    │
│  - 3 seconds to confirm                                         │
│  - Never miss category bonuses                                  │
│  - Maximize every purchase                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Future Possibilities

If regulations change or partnerships form:

| Feature | Requirement | Status |
|---------|-------------|--------|
| Auto-switch in Apple Pay | Apple API access | Not available |
| Curve-style routing | Banking license | Possible (expensive) |
| Bank partnership | Issuer integration | Potential path |
| Virtual card numbers | Card issuing rights | Via BaaS partners |

For now, SmartPay provides **90% of the value with 0% of the regulatory complexity**.
