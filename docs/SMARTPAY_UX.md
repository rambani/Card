# SmartPay User Experience

A seamless, intuitive way to always pay with the optimal credit card.

## The Problem

You have 4 credit cards:
- Amex Gold: 4x at restaurants
- Blue Cash: 6% at groceries
- Chase Sapphire: 3x on travel
- Citi Double Cash: 2% on everything

**Challenge**: Remembering which card to use where.

## The Solution: SmartPay

A companion app that tells you the right card to use based on where you are.

---

## User Flows

### Flow 1: High Confidence (Known Merchant)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   📍 You walk into Chipotle                                        │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │                                                            │  │
│   │   🍽️ CHIPOTLE                                              │  │
│   │                                                            │  │
│   │   Best card for dining:                                    │  │
│   │   ┌────────────────────────────────────┐                  │  │
│   │   │  💳 Amex Gold          ****1234   │                  │  │
│   │   │      4x points ($3.00 on $50)     │                  │  │
│   │   └────────────────────────────────────┘                  │  │
│   │                                                            │  │
│   │   ┌──────────────┐  ┌──────────────────┐                 │  │
│   │   │  ✓ Use This  │  │  Show Other Cards │                 │  │
│   │   └──────────────┘  └──────────────────┘                 │  │
│   │                                                            │  │
│   └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│   User taps "Use This" → Card set as default → Ready to pay       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Flow 2: Medium Confidence (Multi-Category Merchant)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   📍 You walk into Target                                          │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │                                                            │  │
│   │   🏪 TARGET                                                 │  │
│   │                                                            │  │
│   │   What are you buying today?                               │  │
│   │                                                            │  │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│   │   │   🛒    │ │   👕    │ │   💊    │ │   🛍️    │        │  │
│   │   │Groceries│ │Clothing │ │Pharmacy │ │ General │        │  │
│   │   │ 6% back │ │ 2% back │ │ 3% back │ │ 2% back │        │  │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│   │                                                            │  │
│   └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│   User taps "Groceries" → Blue Cash selected → Ready to pay       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Flow 3: Quick Select (Siri / Widget)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   User: "Hey Siri, I'm buying groceries"                           │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │                                                            │  │
│   │   🛒 GROCERIES                                              │  │
│   │                                                            │  │
│   │   Using Blue Cash Preferred                                │  │
│   │   6% back on this purchase                                 │  │
│   │                                                            │  │
│   │   ┌────────────────────────────────────┐                  │  │
│   │   │  💳 Blue Cash       ****5678       │                  │  │
│   │   │      Now set as default            │                  │  │
│   │   └────────────────────────────────────┘                  │  │
│   │                                                            │  │
│   └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│   Card automatically set → User can pay immediately               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Flow 4: Lock Screen Widget

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   Lock Screen Widget (always visible):                             │
│                                                                    │
│   ┌────────────────────────────────────┐                          │
│   │  📍 Near: Whole Foods              │                          │
│   │  💳 Use: Blue Cash (6%)            │                          │
│   │  [Tap to Set Default]              │                          │
│   └────────────────────────────────────┘                          │
│                                                                    │
│   One tap → Opens wallet with right card shown                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

### 1. Minimal Friction
- **One tap** to confirm in most cases
- **No typing** required
- **Automatic detection** when possible

### 2. Clear Value Display
- Always show the **reward rate** (4x, 6%)
- Always show **dollar value** ($3.00 on $50)
- Make savings tangible

### 3. Simple Category Picker
- Use **emojis** for quick recognition
- **Max 4-6 options** visible at once
- Most common categories first

### 4. Graceful Fallback
- If location fails → show category picker
- If unsure → ask (don't guess wrong)
- Always have "Other" option

---

## UI Components

### Notification Card

```
┌──────────────────────────────────────────┐
│  [Icon] MERCHANT NAME                    │
│                                          │
│  Best card:                              │
│  ┌────────────────────────────────────┐ │
│  │ 💳 Card Name           ****1234    │ │
│  │     4x points ($3.00 value)        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Primary Action]  [Secondary Action]   │
└──────────────────────────────────────────┘
```

### Category Selector

```
┌──────────────────────────────────────────┐
│  What are you buying?                    │
│                                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ 🍽️  │ │ 🛒  │ │ ⛽  │ │ ✈️  │       │
│  │Dine │ │Groc │ │Gas  │ │Travel│       │
│  │ 4x  │ │ 6%  │ │ 3%  │ │ 3x  │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                          │
│  ┌─────┐ ┌─────┐ ┌─────────────────┐   │
│  │ 📺  │ │ 💊  │ │    🛍️ Other     │   │
│  │Stream│ │Pharm│ │                 │   │
│  │ 6%  │ │ 3%  │ │                 │   │
│  └─────┘ └─────┘ └─────────────────┘   │
└──────────────────────────────────────────┘
```

### Card Visual

```
┌────────────────────────────────────────┐
│                                        │
│  AMEX GOLD                             │
│                                        │
│                                        │
│                          ****1234      │
│                                        │
│  ▶ Using for: Dining (4x)              │
└────────────────────────────────────────┘
```

---

## API Endpoints for Mobile App

### 1. Location Detection
```
POST /api/smartpay/location
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "estimatedAmount": 50
}

Response:
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
```

### 2. Quick Select (Siri)
```
POST /api/smartpay/quick-select
{
  "category": "GROCERIES"
}

Response:
{
  "cardName": "Blue Cash Preferred",
  "rewardRate": "6%",
  "message": "🛒 Groceries: Using Blue Cash (6%)"
}
```

### 3. Get Categories (for UI)
```
GET /api/smartpay/categories

Response:
{
  "categories": [
    { "category": "RESTAURANTS", "emoji": "🍽️", "label": "Dining", "bestCard": "Amex Gold", "rewardRate": "4x" },
    { "category": "GROCERIES", "emoji": "🛒", "label": "Groceries", "bestCard": "Blue Cash", "rewardRate": "6%" },
    ...
  ]
}
```

---

## Platform Considerations

### iOS Limitation
Apple doesn't allow programmatic default card changes. Our approach:

1. Show notification with recommended card
2. Provide deep link to Wallet app
3. Display visual guide: "Find card that looks like this"
4. Card is ready when user opens Apple Pay

### Android
Similar limitations with Google Pay. We use:

1. Notification with card recommendation
2. Intent to open Google Pay
3. Visual indicator of which card to select

### Workaround: Siri Shortcuts
Most seamless experience on iOS:

1. User sets up: "Hey Siri, I'm buying [category]"
2. Shortcut runs our quick-select API
3. Shows result and opens Wallet
4. User is primed to select the right card

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time from detection to payment ready | < 5 seconds |
| Category selection taps | 1-2 max |
| Correct card usage rate | > 90% |
| User satisfaction | 4.5+ stars |

---

## Summary

SmartPay makes credit card optimization **effortless**:

1. **Automatic**: Detects where you are
2. **Simple**: One tap to confirm or pick category
3. **Clear**: Shows exact value you'll earn
4. **Fast**: Ready to pay in seconds
