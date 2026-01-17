/**
 * Location-Based Merchant Detection Service
 *
 * Detects when user is near a merchant and identifies the category.
 * Uses GPS + Google Places API (or Apple Maps) to identify nearby businesses.
 *
 * FLOW:
 * 1. Monitor location in background (geofencing)
 * 2. When user stops moving (arrived somewhere), query nearby places
 * 3. Match place to merchant database
 * 4. Return merchant info with confidence level
 */

import { RewardCategory } from '../models/Reward';

export interface DetectedMerchant {
  id: string;
  name: string;
  category: RewardCategory;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';

  // Location data
  placeId?: string;  // Google Places ID
  address: string;
  distance: number;  // meters from user

  // For confirmation UI
  possibleCategories?: RewardCategory[];  // If confidence is LOW
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;  // meters
}

/**
 * Known merchant patterns for category inference
 * In production, this would be a much larger database
 */
const MERCHANT_PATTERNS: Array<{
  pattern: RegExp;
  category: RewardCategory;
  confidence: 'HIGH' | 'MEDIUM';
}> = [
  // Restaurants - HIGH confidence
  { pattern: /olive garden|applebee|chili's|outback|cheesecake factory/i, category: RewardCategory.RESTAURANTS, confidence: 'HIGH' },
  { pattern: /chipotle|panera|sweetgreen|cava/i, category: RewardCategory.RESTAURANTS, confidence: 'HIGH' },

  // Fast Food - HIGH confidence
  { pattern: /mcdonald|burger king|wendy|taco bell|chick-fil-a|popeyes/i, category: RewardCategory.FAST_FOOD, confidence: 'HIGH' },
  { pattern: /starbucks|dunkin|peet's coffee/i, category: RewardCategory.CAFES, confidence: 'HIGH' },

  // Grocery - HIGH confidence
  { pattern: /whole foods|trader joe|kroger|safeway|publix|wegmans|aldi/i, category: RewardCategory.GROCERIES, confidence: 'HIGH' },
  { pattern: /costco|sam's club|bj's wholesale/i, category: RewardCategory.WHOLESALE_CLUBS, confidence: 'HIGH' },

  // Gas - HIGH confidence
  { pattern: /shell|chevron|exxon|mobil|bp|76|speedway|wawa/i, category: RewardCategory.GAS_STATIONS, confidence: 'HIGH' },

  // Travel - HIGH confidence
  { pattern: /marriott|hilton|hyatt|sheraton|westin|holiday inn/i, category: RewardCategory.HOTELS, confidence: 'HIGH' },
  { pattern: /delta|united|american airlines|southwest|jetblue/i, category: RewardCategory.AIRLINES, confidence: 'HIGH' },
  { pattern: /hertz|enterprise|avis|budget rent/i, category: RewardCategory.CAR_RENTAL, confidence: 'HIGH' },

  // Retail - MEDIUM confidence (could be many categories)
  { pattern: /target/i, category: RewardCategory.DEPARTMENT_STORES, confidence: 'MEDIUM' },
  { pattern: /walmart/i, category: RewardCategory.DEPARTMENT_STORES, confidence: 'MEDIUM' },
  { pattern: /amazon|whole foods/i, category: RewardCategory.GROCERIES, confidence: 'MEDIUM' },

  // Electronics
  { pattern: /best buy|apple store|micro center/i, category: RewardCategory.ELECTRONICS, confidence: 'HIGH' },

  // Pharmacy
  { pattern: /cvs|walgreens|rite aid/i, category: RewardCategory.PHARMACIES, confidence: 'HIGH' },

  // Home Improvement
  { pattern: /home depot|lowe's|menards/i, category: RewardCategory.HOME_IMPROVEMENT, confidence: 'HIGH' },
];

/**
 * Google Places type to category mapping
 */
const PLACE_TYPE_MAPPING: Record<string, RewardCategory> = {
  'restaurant': RewardCategory.RESTAURANTS,
  'food': RewardCategory.RESTAURANTS,
  'cafe': RewardCategory.CAFES,
  'bar': RewardCategory.BARS,
  'meal_takeaway': RewardCategory.FAST_FOOD,
  'meal_delivery': RewardCategory.RESTAURANTS,
  'gas_station': RewardCategory.GAS_STATIONS,
  'grocery_or_supermarket': RewardCategory.GROCERIES,
  'supermarket': RewardCategory.GROCERIES,
  'drugstore': RewardCategory.PHARMACIES,
  'pharmacy': RewardCategory.PHARMACIES,
  'lodging': RewardCategory.HOTELS,
  'airport': RewardCategory.AIRLINES,
  'car_rental': RewardCategory.CAR_RENTAL,
  'department_store': RewardCategory.DEPARTMENT_STORES,
  'clothing_store': RewardCategory.CLOTHING,
  'electronics_store': RewardCategory.ELECTRONICS,
  'home_goods_store': RewardCategory.HOME_IMPROVEMENT,
  'hardware_store': RewardCategory.HOME_IMPROVEMENT,
  'movie_theater': RewardCategory.MOVIES,
  'gym': RewardCategory.FITNESS,
  'parking': RewardCategory.PARKING,
  'transit_station': RewardCategory.PUBLIC_TRANSIT,
};

export class LocationService {
  private lastKnownLocation: LocationCoordinates | null = null;
  private googleApiKey: string;

  constructor(googleApiKey: string = '') {
    this.googleApiKey = googleApiKey;
  }

  /**
   * Update current location
   */
  updateLocation(coords: LocationCoordinates): void {
    this.lastKnownLocation = coords;
  }

  /**
   * Detect merchant at current location
   */
  async detectMerchant(coords?: LocationCoordinates): Promise<DetectedMerchant | null> {
    const location = coords || this.lastKnownLocation;
    if (!location) {
      return null;
    }

    // In production: Call Google Places API
    // For now: Simulate with mock data
    const nearbyPlaces = await this.getNearbyPlaces(location);

    if (nearbyPlaces.length === 0) {
      return null;
    }

    // Find the closest place
    const closest = nearbyPlaces[0];

    // Try to identify category
    return this.identifyMerchant(closest);
  }

  /**
   * Get nearby places from Google Places API
   */
  private async getNearbyPlaces(location: LocationCoordinates): Promise<GooglePlace[]> {
    // In production, this would call:
    // https://maps.googleapis.com/maps/api/place/nearbysearch/json
    // ?location=${lat},${lng}&radius=50&key=${apiKey}

    // For demo, return mock based on common scenarios
    return this.mockNearbyPlaces(location);
  }

  /**
   * Identify merchant category from place data
   */
  private identifyMerchant(place: GooglePlace): DetectedMerchant {
    // First, try exact name match
    for (const pattern of MERCHANT_PATTERNS) {
      if (pattern.pattern.test(place.name)) {
        return {
          id: place.place_id,
          name: place.name,
          category: pattern.category,
          confidence: pattern.confidence,
          placeId: place.place_id,
          address: place.vicinity,
          distance: place.distance
        };
      }
    }

    // Second, try place type mapping
    for (const type of place.types) {
      if (PLACE_TYPE_MAPPING[type]) {
        return {
          id: place.place_id,
          name: place.name,
          category: PLACE_TYPE_MAPPING[type],
          confidence: 'MEDIUM',
          placeId: place.place_id,
          address: place.vicinity,
          distance: place.distance,
          possibleCategories: this.getSimilarCategories(PLACE_TYPE_MAPPING[type])
        };
      }
    }

    // Low confidence - ask user
    return {
      id: place.place_id,
      name: place.name,
      category: RewardCategory.OTHER,
      confidence: 'LOW',
      placeId: place.place_id,
      address: place.vicinity,
      distance: place.distance,
      possibleCategories: this.guessCategories(place)
    };
  }

  /**
   * Get similar categories for confirmation UI
   */
  private getSimilarCategories(primary: RewardCategory): RewardCategory[] {
    const similar: Record<RewardCategory, RewardCategory[]> = {
      [RewardCategory.RESTAURANTS]: [RewardCategory.FAST_FOOD, RewardCategory.BARS, RewardCategory.CAFES],
      [RewardCategory.FAST_FOOD]: [RewardCategory.RESTAURANTS, RewardCategory.CAFES],
      [RewardCategory.GROCERIES]: [RewardCategory.WHOLESALE_CLUBS, RewardCategory.SUPERMARKETS],
      [RewardCategory.DEPARTMENT_STORES]: [RewardCategory.CLOTHING, RewardCategory.ONLINE_SHOPPING],
      [RewardCategory.GAS_STATIONS]: [RewardCategory.OTHER],
      [RewardCategory.HOTELS]: [RewardCategory.AIRLINES, RewardCategory.CAR_RENTAL],
      // ... add more
    } as Record<RewardCategory, RewardCategory[]>;

    return similar[primary] || [RewardCategory.OTHER];
  }

  /**
   * Guess possible categories for unknown merchant
   */
  private guessCategories(place: GooglePlace): RewardCategory[] {
    const categories: RewardCategory[] = [];

    for (const type of place.types) {
      if (PLACE_TYPE_MAPPING[type] && !categories.includes(PLACE_TYPE_MAPPING[type])) {
        categories.push(PLACE_TYPE_MAPPING[type]);
      }
    }

    // Add common categories as fallback
    if (categories.length < 3) {
      categories.push(RewardCategory.RESTAURANTS, RewardCategory.OTHER);
    }

    return categories.slice(0, 5);  // Max 5 options
  }

  /**
   * Mock nearby places for testing
   */
  private mockNearbyPlaces(_location: LocationCoordinates): GooglePlace[] {
    // This would be replaced with real API call
    return [];
  }
}

/**
 * Google Places API response type
 */
interface GooglePlace {
  place_id: string;
  name: string;
  types: string[];
  vicinity: string;
  distance: number;
  geometry: {
    location: { lat: number; lng: number };
  };
}

export const locationService = new LocationService();
