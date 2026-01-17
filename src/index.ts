/**
 * Smart Card Rewards Selection System
 *
 * A digital wallet system that automatically selects the optimal
 * credit card for each transaction based on rewards and offers.
 *
 * HOW IT WORKS:
 * =============
 * 1. User adds credit cards to their digital wallet
 * 2. When making a purchase, the system:
 *    a. Identifies the transaction type (via MCC code or merchant name)
 *    b. Calculates potential rewards for each card
 *    c. Factors in active offers and promotions
 *    d. Recommends the card that maximizes rewards
 * 3. User pays with the recommended card (or chooses an alternative)
 *
 * DATA TRANSMISSION FLOW:
 * =======================
 * See /docs/DATA_TRANSMISSION.md for detailed documentation on
 * how credit card data flows through payment networks.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './api/routes';
import cardPickerRoutes from './api/card-picker';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);
app.use('/api/card-picker', cardPickerRoutes);

// API documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'SmartPay - Smart Card Rewards Selection API',
    version: '1.0.0',
    endpoints: {
      cardPicker: {
        'GET /api/card-picker/products': 'List all available card products',
        'GET /api/card-picker/products/:id': 'Get card product details',
        'GET /api/card-picker/search?q=': 'Search cards by name',
        'POST /api/card-picker/select': 'Add a card to your wallet',
        'POST /api/card-picker/quick-setup': 'Add multiple cards at once',
        'GET /api/card-picker/my-cards': 'Get your selected cards',
        'DELETE /api/card-picker/select/:id': 'Remove a card'
      },
      smartpay: {
        'POST /api/smartpay/location': 'Get card recommendation for location',
        'POST /api/smartpay/quick-select': 'Quick category selection (Siri)',
        'POST /api/smartpay/confirm': 'Confirm card selection',
        'GET /api/smartpay/categories': 'Get all categories with best cards'
      },
      selection: {
        'POST /api/select-card': 'Get optimal card for transaction',
        'POST /api/compare-cards': 'Compare all cards for transaction',
        'GET /api/best-cards-by-category': 'Get best card per category'
      },
      wallet: {
        'GET /api/wallet/stats': 'Get wallet statistics',
        'POST /api/wallet/simulate': 'Simulate monthly rewards'
      },
      utilities: {
        'GET /api/mcc/:code': 'Look up MCC code'
      }
    },
    headers: {
      'x-user-id': 'User identifier (auto-generated if not provided)'
    }
  });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Smart Card Rewards Selection System                ║
║                                                            ║
║  Server running on http://localhost:${PORT}                   ║
║  API documentation: http://localhost:${PORT}/api              ║
║                                                            ║
║  Features:                                                 ║
║  • Automatic optimal card selection                        ║
║  • MCC-based transaction categorization                    ║
║  • Real-time reward calculations                           ║
║  • Offer and promotion tracking                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

export default app;
