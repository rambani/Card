/**
 * Merchant Category Codes (MCC) Database
 *
 * MCCs are 4-digit codes used by card networks to classify merchants
 * by the type of goods or services they provide.
 *
 * HOW MCCs ARE ASSIGNED AND TRANSMITTED:
 * ======================================
 *
 * 1. MERCHANT ONBOARDING
 *    - When a merchant signs up with a payment processor (acquirer)
 *    - The acquirer assigns an MCC based on the merchant's primary business
 *    - MCCs are standardized by ISO 18245
 *
 * 2. TRANSACTION FLOW
 *    - Customer taps/inserts/swipes card at terminal
 *    - Terminal sends authorization request to acquirer
 *    - Acquirer forwards to card network (Visa/MC/Amex)
 *    - Network routes to issuing bank
 *    - Authorization response flows back
 *    - MCC is included in every authorization message
 *
 * 3. DATA FORMAT (ISO 8583)
 *    - MCC is transmitted in Field 18 of ISO 8583 message
 *    - Part of the standard financial message format
 *
 * 4. CATEGORY RANGES
 *    - 0001-1499: Agricultural Services
 *    - 1500-2999: Contracted Services
 *    - 3000-3999: Airlines, Car Rentals, Hotels
 *    - 4000-4799: Transportation
 *    - 4800-4999: Utilities
 *    - 5000-5599: Retail Outlets
 *    - 5600-5699: Clothing Stores
 *    - 5700-7299: Miscellaneous Stores
 *    - 7300-7999: Service Providers
 *    - 8000-8999: Professional Services
 *    - 9000-9999: Government Services
 */

import { RewardCategory } from '../models/Reward';

export interface MCCDefinition {
  code: string;
  description: string;
  category: RewardCategory;
  subcategory?: string;
  commonBrands?: string[];
}

/**
 * Comprehensive MCC to Reward Category mapping
 * This is what enables identifying transaction types for reward optimization
 */
export const MCC_DATABASE: Record<string, MCCDefinition> = {
  // AIRLINES (3000-3299)
  '3000': { code: '3000', description: 'United Airlines', category: RewardCategory.AIRLINES, commonBrands: ['United'] },
  '3001': { code: '3001', description: 'American Airlines', category: RewardCategory.AIRLINES, commonBrands: ['American'] },
  '3005': { code: '3005', description: 'British Airways', category: RewardCategory.AIRLINES, commonBrands: ['British Airways'] },
  '3007': { code: '3007', description: 'Air France', category: RewardCategory.AIRLINES, commonBrands: ['Air France'] },
  '3026': { code: '3026', description: 'Alaska Airlines', category: RewardCategory.AIRLINES, commonBrands: ['Alaska'] },
  '3058': { code: '3058', description: 'Delta Airlines', category: RewardCategory.AIRLINES, commonBrands: ['Delta'] },
  '3065': { code: '3065', description: 'Southwest Airlines', category: RewardCategory.AIRLINES, commonBrands: ['Southwest'] },
  '3082': { code: '3082', description: 'Korean Air', category: RewardCategory.AIRLINES, commonBrands: ['Korean Air'] },
  '3174': { code: '3174', description: 'JetBlue Airways', category: RewardCategory.AIRLINES, commonBrands: ['JetBlue'] },
  '4511': { code: '4511', description: 'Airlines and Air Carriers', category: RewardCategory.AIRLINES },

  // CAR RENTALS (3300-3499)
  '3351': { code: '3351', description: 'Enterprise Rent-A-Car', category: RewardCategory.CAR_RENTAL, commonBrands: ['Enterprise'] },
  '3352': { code: '3352', description: 'National Car Rental', category: RewardCategory.CAR_RENTAL, commonBrands: ['National'] },
  '3353': { code: '3353', description: 'Hertz', category: RewardCategory.CAR_RENTAL, commonBrands: ['Hertz'] },
  '3354': { code: '3354', description: 'Avis', category: RewardCategory.CAR_RENTAL, commonBrands: ['Avis'] },
  '3357': { code: '3357', description: 'Budget Rent-A-Car', category: RewardCategory.CAR_RENTAL, commonBrands: ['Budget'] },
  '3366': { code: '3366', description: 'Dollar Rent A Car', category: RewardCategory.CAR_RENTAL, commonBrands: ['Dollar'] },
  '7512': { code: '7512', description: 'Car Rental Agencies', category: RewardCategory.CAR_RENTAL },

  // HOTELS (3500-3999)
  '3501': { code: '3501', description: 'Hilton Hotels', category: RewardCategory.HOTELS, commonBrands: ['Hilton'] },
  '3502': { code: '3502', description: 'Sheraton Hotels', category: RewardCategory.HOTELS, commonBrands: ['Sheraton'] },
  '3503': { code: '3503', description: 'Marriott Hotels', category: RewardCategory.HOTELS, commonBrands: ['Marriott'] },
  '3504': { code: '3504', description: 'Hyatt Hotels', category: RewardCategory.HOTELS, commonBrands: ['Hyatt'] },
  '3506': { code: '3506', description: 'Holiday Inn', category: RewardCategory.HOTELS, commonBrands: ['Holiday Inn', 'IHG'] },
  '3509': { code: '3509', description: 'Westin Hotels', category: RewardCategory.HOTELS, commonBrands: ['Westin'] },
  '3512': { code: '3512', description: 'Four Seasons Hotels', category: RewardCategory.HOTELS, commonBrands: ['Four Seasons'] },
  '3533': { code: '3533', description: 'Best Western', category: RewardCategory.HOTELS, commonBrands: ['Best Western'] },
  '3640': { code: '3640', description: 'Airbnb', category: RewardCategory.HOTELS, commonBrands: ['Airbnb'] },
  '7011': { code: '7011', description: 'Hotels, Motels, and Resorts', category: RewardCategory.HOTELS },

  // TRANSPORTATION
  '4111': { code: '4111', description: 'Local and Suburban Transit', category: RewardCategory.PUBLIC_TRANSIT },
  '4112': { code: '4112', description: 'Passenger Railways', category: RewardCategory.PUBLIC_TRANSIT, commonBrands: ['Amtrak'] },
  '4121': { code: '4121', description: 'Taxicabs and Limousines', category: RewardCategory.RIDESHARE },
  '4131': { code: '4131', description: 'Bus Lines', category: RewardCategory.PUBLIC_TRANSIT, commonBrands: ['Greyhound'] },
  '4214': { code: '4214', description: 'Motor Freight and Storage', category: RewardCategory.OTHER },
  '4411': { code: '4411', description: 'Cruise Lines', category: RewardCategory.HOTELS },
  '4457': { code: '4457', description: 'Boat Rentals and Leasing', category: RewardCategory.OTHER },
  '4468': { code: '4468', description: 'Marinas and Marine Service', category: RewardCategory.OTHER },
  '4789': { code: '4789', description: 'Transportation Services', category: RewardCategory.PUBLIC_TRANSIT },

  // RIDESHARE SPECIFIC
  '4121-UBER': { code: '4121', description: 'Uber', category: RewardCategory.RIDESHARE, commonBrands: ['Uber'] },
  '4121-LYFT': { code: '4121', description: 'Lyft', category: RewardCategory.RIDESHARE, commonBrands: ['Lyft'] },

  // UTILITIES
  '4812': { code: '4812', description: 'Telecommunication Equipment', category: RewardCategory.PHONE_INTERNET },
  '4814': { code: '4814', description: 'Telecommunication Services', category: RewardCategory.PHONE_INTERNET },
  '4816': { code: '4816', description: 'Computer Network Services', category: RewardCategory.PHONE_INTERNET },
  '4821': { code: '4821', description: 'Telegraph Services', category: RewardCategory.UTILITIES },
  '4829': { code: '4829', description: 'Wire Transfers', category: RewardCategory.OTHER },
  '4899': { code: '4899', description: 'Cable and Streaming Services', category: RewardCategory.STREAMING, commonBrands: ['Netflix', 'Hulu', 'Disney+'] },
  '4900': { code: '4900', description: 'Utilities - Electric, Gas, Water', category: RewardCategory.UTILITIES },

  // GAS STATIONS
  '5172': { code: '5172', description: 'Petroleum Products', category: RewardCategory.GAS_STATIONS },
  '5541': { code: '5541', description: 'Service Stations', category: RewardCategory.GAS_STATIONS },
  '5542': { code: '5542', description: 'Automated Fuel Dispensers', category: RewardCategory.GAS_STATIONS },
  '5983': { code: '5983', description: 'Fuel Dealers', category: RewardCategory.GAS_STATIONS },

  // GROCERIES & SUPERMARKETS
  '5411': { code: '5411', description: 'Grocery Stores and Supermarkets', category: RewardCategory.GROCERIES, commonBrands: ['Kroger', 'Safeway', 'Publix', 'Whole Foods'] },
  '5422': { code: '5422', description: 'Freezer/Locker Meat', category: RewardCategory.GROCERIES },
  '5441': { code: '5441', description: 'Candy/Nut/Confectionery Stores', category: RewardCategory.GROCERIES },
  '5451': { code: '5451', description: 'Dairy Products Stores', category: RewardCategory.GROCERIES },
  '5462': { code: '5462', description: 'Bakeries', category: RewardCategory.GROCERIES },
  '5499': { code: '5499', description: 'Misc Food Stores', category: RewardCategory.GROCERIES },

  // RESTAURANTS & DINING
  '5811': { code: '5811', description: 'Caterers', category: RewardCategory.RESTAURANTS },
  '5812': { code: '5812', description: 'Eating Places and Restaurants', category: RewardCategory.RESTAURANTS },
  '5813': { code: '5813', description: 'Bars, Cocktail Lounges, Taverns', category: RewardCategory.BARS },
  '5814': { code: '5814', description: 'Fast Food Restaurants', category: RewardCategory.FAST_FOOD, commonBrands: ['McDonalds', 'Burger King', 'Wendys'] },

  // WHOLESALE CLUBS
  '5300': { code: '5300', description: 'Wholesale Clubs', category: RewardCategory.WHOLESALE_CLUBS, commonBrands: ['Costco', 'Sams Club', 'BJs'] },

  // DEPARTMENT STORES
  '5311': { code: '5311', description: 'Department Stores', category: RewardCategory.DEPARTMENT_STORES, commonBrands: ['Macys', 'Nordstrom', 'JCPenney'] },
  '5331': { code: '5331', description: 'Variety Stores', category: RewardCategory.DEPARTMENT_STORES },

  // DRUG STORES & PHARMACIES
  '5912': { code: '5912', description: 'Drug Stores and Pharmacies', category: RewardCategory.PHARMACIES, commonBrands: ['CVS', 'Walgreens', 'Rite Aid'] },

  // CLOTHING
  '5611': { code: '5611', description: 'Mens Clothing Stores', category: RewardCategory.CLOTHING },
  '5621': { code: '5621', description: 'Womens Ready-to-Wear Stores', category: RewardCategory.CLOTHING },
  '5631': { code: '5631', description: 'Womens Accessory Stores', category: RewardCategory.CLOTHING },
  '5641': { code: '5641', description: 'Childrens Clothing Stores', category: RewardCategory.CLOTHING },
  '5651': { code: '5651', description: 'Family Clothing Stores', category: RewardCategory.CLOTHING },
  '5661': { code: '5661', description: 'Shoe Stores', category: RewardCategory.CLOTHING },
  '5691': { code: '5691', description: 'Clothing Stores', category: RewardCategory.CLOTHING },
  '5699': { code: '5699', description: 'Miscellaneous Apparel Stores', category: RewardCategory.CLOTHING },

  // HOME IMPROVEMENT
  '5200': { code: '5200', description: 'Home Supply Warehouse Stores', category: RewardCategory.HOME_IMPROVEMENT, commonBrands: ['Home Depot', 'Lowes'] },
  '5211': { code: '5211', description: 'Lumber and Building Materials', category: RewardCategory.HOME_IMPROVEMENT },
  '5231': { code: '5231', description: 'Glass, Paint, Wallpaper Stores', category: RewardCategory.HOME_IMPROVEMENT },
  '5251': { code: '5251', description: 'Hardware Stores', category: RewardCategory.HOME_IMPROVEMENT },
  '5261': { code: '5261', description: 'Lawn and Garden Stores', category: RewardCategory.HOME_IMPROVEMENT },

  // ELECTRONICS
  '5045': { code: '5045', description: 'Computers and Software', category: RewardCategory.ELECTRONICS },
  '5732': { code: '5732', description: 'Electronics Stores', category: RewardCategory.ELECTRONICS, commonBrands: ['Best Buy', 'Apple Store'] },
  '5734': { code: '5734', description: 'Computer Software Stores', category: RewardCategory.ELECTRONICS },
  '5946': { code: '5946', description: 'Camera and Photographic Stores', category: RewardCategory.ELECTRONICS },

  // ENTERTAINMENT
  '7832': { code: '7832', description: 'Motion Picture Theaters', category: RewardCategory.MOVIES, commonBrands: ['AMC', 'Regal', 'Cinemark'] },
  '7911': { code: '7911', description: 'Dance Halls and Studios', category: RewardCategory.ENTERTAINMENT },
  '7922': { code: '7922', description: 'Theatrical Producers', category: RewardCategory.CONCERTS },
  '7929': { code: '7929', description: 'Bands, Orchestras, Entertainment', category: RewardCategory.CONCERTS },
  '7932': { code: '7932', description: 'Billiard and Pool Establishments', category: RewardCategory.ENTERTAINMENT },
  '7933': { code: '7933', description: 'Bowling Alleys', category: RewardCategory.ENTERTAINMENT },
  '7941': { code: '7941', description: 'Sports Clubs and Fields', category: RewardCategory.SPORTS },
  '7991': { code: '7991', description: 'Tourist Attractions', category: RewardCategory.ENTERTAINMENT },
  '7993': { code: '7993', description: 'Video Amusement Game Supplies', category: RewardCategory.GAMING },
  '7994': { code: '7994', description: 'Video Game Arcades', category: RewardCategory.GAMING },
  '7995': { code: '7995', description: 'Betting and Casino Gambling', category: RewardCategory.ENTERTAINMENT },
  '7996': { code: '7996', description: 'Amusement Parks', category: RewardCategory.ENTERTAINMENT },
  '7998': { code: '7998', description: 'Aquariums and Zoos', category: RewardCategory.ENTERTAINMENT },
  '7999': { code: '7999', description: 'Recreation Services', category: RewardCategory.ENTERTAINMENT },

  // FITNESS & HEALTH
  '7941-GYM': { code: '7941', description: 'Gyms and Fitness Centers', category: RewardCategory.FITNESS, commonBrands: ['Planet Fitness', 'LA Fitness', 'Equinox'] },
  '7997': { code: '7997', description: 'Membership Clubs', category: RewardCategory.FITNESS },
  '8011': { code: '8011', description: 'Doctors', category: RewardCategory.HEALTHCARE },
  '8021': { code: '8021', description: 'Dentists and Orthodontists', category: RewardCategory.HEALTHCARE },
  '8031': { code: '8031', description: 'Osteopaths', category: RewardCategory.HEALTHCARE },
  '8041': { code: '8041', description: 'Chiropractors', category: RewardCategory.HEALTHCARE },
  '8042': { code: '8042', description: 'Optometrists and Ophthalmologists', category: RewardCategory.HEALTHCARE },
  '8049': { code: '8049', description: 'Podiatrists and Chiropodists', category: RewardCategory.HEALTHCARE },
  '8050': { code: '8050', description: 'Nursing and Personal Care', category: RewardCategory.HEALTHCARE },
  '8062': { code: '8062', description: 'Hospitals', category: RewardCategory.HEALTHCARE },
  '8071': { code: '8071', description: 'Medical and Dental Labs', category: RewardCategory.HEALTHCARE },
  '8099': { code: '8099', description: 'Medical Services', category: RewardCategory.HEALTHCARE },

  // EDUCATION
  '8211': { code: '8211', description: 'Elementary and Secondary Schools', category: RewardCategory.EDUCATION },
  '8220': { code: '8220', description: 'Colleges and Universities', category: RewardCategory.EDUCATION },
  '8241': { code: '8241', description: 'Correspondence Schools', category: RewardCategory.EDUCATION },
  '8244': { code: '8244', description: 'Business and Secretarial Schools', category: RewardCategory.EDUCATION },
  '8249': { code: '8249', description: 'Trade and Vocational Schools', category: RewardCategory.EDUCATION },
  '8299': { code: '8299', description: 'Schools and Educational Services', category: RewardCategory.EDUCATION },

  // OFFICE SUPPLIES
  '5111': { code: '5111', description: 'Stationery and Office Supplies', category: RewardCategory.OFFICE_SUPPLIES },
  '5943': { code: '5943', description: 'Stationery Stores', category: RewardCategory.OFFICE_SUPPLIES, commonBrands: ['Staples', 'Office Depot'] },

  // ONLINE / E-COMMERCE
  '5399': { code: '5399', description: 'Miscellaneous General Merchandise', category: RewardCategory.ONLINE_SHOPPING },
  '5964': { code: '5964', description: 'Direct Marketing - Catalog Merchant', category: RewardCategory.ONLINE_SHOPPING },
  '5965': { code: '5965', description: 'Direct Marketing - Combination Catalog', category: RewardCategory.ONLINE_SHOPPING },
  '5966': { code: '5966', description: 'Direct Marketing - Outbound Telemarketing', category: RewardCategory.ONLINE_SHOPPING },
  '5967': { code: '5967', description: 'Direct Marketing - Inbound Teleservices', category: RewardCategory.ONLINE_SHOPPING },
  '5968': { code: '5968', description: 'Direct Marketing - Subscription', category: RewardCategory.SUBSCRIPTIONS },
  '5969': { code: '5969', description: 'Direct Marketing - Other', category: RewardCategory.ONLINE_SHOPPING },

  // PARKING
  '7523': { code: '7523', description: 'Parking Lots and Garages', category: RewardCategory.PARKING },

  // TOLLS
  '4784': { code: '4784', description: 'Tolls and Bridge Fees', category: RewardCategory.TOLLS },

  // INSURANCE
  '5960': { code: '5960', description: 'Direct Marketing - Insurance', category: RewardCategory.INSURANCE },
  '6300': { code: '6300', description: 'Insurance Sales and Underwriting', category: RewardCategory.INSURANCE },
};

/**
 * Get category from MCC code
 */
export function getCategoryFromMCC(mcc: string): RewardCategory {
  const definition = MCC_DATABASE[mcc];
  if (definition) {
    return definition.category;
  }

  // Handle ranges
  const mccNum = parseInt(mcc, 10);

  // Airlines: 3000-3299
  if (mccNum >= 3000 && mccNum <= 3299) {
    return RewardCategory.AIRLINES;
  }

  // Car Rentals: 3300-3499
  if (mccNum >= 3300 && mccNum <= 3499) {
    return RewardCategory.CAR_RENTAL;
  }

  // Hotels: 3500-3999
  if (mccNum >= 3500 && mccNum <= 3999) {
    return RewardCategory.HOTELS;
  }

  // Transportation: 4000-4799
  if (mccNum >= 4000 && mccNum <= 4799) {
    return RewardCategory.PUBLIC_TRANSIT;
  }

  // Utilities: 4800-4999
  if (mccNum >= 4800 && mccNum <= 4999) {
    return RewardCategory.UTILITIES;
  }

  return RewardCategory.OTHER;
}

/**
 * Get MCC description
 */
export function getMCCDescription(mcc: string): string {
  return MCC_DATABASE[mcc]?.description || 'Unknown Merchant Category';
}

/**
 * Find MCCs matching a category
 */
export function getMCCsForCategory(category: RewardCategory): string[] {
  return Object.entries(MCC_DATABASE)
    .filter(([_, def]) => def.category === category)
    .map(([code, _]) => code);
}

/**
 * Common merchant to MCC mapping for popular retailers
 * This helps when we only have merchant name, not MCC
 */
export const MERCHANT_MCC_LOOKUP: Record<string, string> = {
  // Online Retailers
  'amazon': '5999',
  'amazon.com': '5999',
  'ebay': '5999',
  'walmart.com': '5311',
  'target.com': '5311',

  // Restaurants
  'doordash': '5812',
  'uber eats': '5812',
  'grubhub': '5812',
  'postmates': '5812',

  // Rideshare
  'uber': '4121',
  'lyft': '4121',

  // Streaming
  'netflix': '4899',
  'hulu': '4899',
  'disney+': '4899',
  'disney plus': '4899',
  'spotify': '4899',
  'apple music': '4899',
  'hbo max': '4899',
  'max': '4899',

  // Gas Stations
  'shell': '5541',
  'chevron': '5541',
  'exxon': '5541',
  'mobil': '5541',
  'bp': '5541',

  // Groceries
  'whole foods': '5411',
  'trader joes': '5411',
  'kroger': '5411',
  'safeway': '5411',
  'publix': '5411',
  'wegmans': '5411',

  // Coffee
  'starbucks': '5814',
  'dunkin': '5814',

  // Fast Food
  'mcdonalds': '5814',
  'burger king': '5814',
  'wendys': '5814',
  'taco bell': '5814',
  'chick-fil-a': '5814',
  'chipotle': '5812',

  // Wholesale
  'costco': '5300',
  'sams club': '5300',
  'bjs': '5300',
};
