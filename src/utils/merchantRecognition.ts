// Multi-layered merchant recognition system - FIXED VERSION
export interface OCRResult {
  merchant: string;
  totalAmount: number;
  rawText?: string;
  lines?: string[];
}

export interface MerchantCandidate {
  name: string;
  confidence: number;
  source: 'ocr' | 'keyword' | 'database' | 'geolocation';
  normalized: string;
}

export interface LocationContext {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export class MerchantRecognitionEngine {
  
  // Major SA merchants with variations
  private static readonly KNOWN_MERCHANTS = [
    'Pick n Pay', 'Pick\'n Pay', 'PnP', 'Checkers', 'Shoprite', 'Spar', 'Woolworths', 'Woolies',
    'Clicks', 'Dis-Chem', 'Dischem', 'Game', 'Makro', 'Builders Warehouse', 'Builders',
    'PEP', 'Mr Price', 'MrPrice', 'Edgars', 'Truworths', 'Foschini',
    'Steers', 'KFC', 'McDonald\'s', 'McDonalds', 'Nando\'s', 'Nandos', 'Wimpy', 'Debonairs',
    'Roman\'s Pizza', 'Romans Pizza', 'Ocean Basket', 'Spur', 'Mugg & Bean', 'Mugg and Bean',
    'Engen', 'Shell', 'BP', 'Caltex', 'Sasol', 'Total',
    'FNB', 'Standard Bank', 'ABSA', 'Nedbank', 'Capitec',
    'MTN', 'Vodacom', 'Cell C', 'Telkom'
  ];

  // Layer 1: OCR Processing - Enhanced text extraction
  static extractTextCandidates(ocrResult: OCRResult): string[] {
    const candidates: string[] = [];
    
    // Get lines from OCR result
    const lines = ocrResult.lines || (ocrResult.rawText?.split('\n')) || [];
    
    // Check ALL lines, not just top ones (Pick n Pay logo might be anywhere)
    for (const line of lines) {
      const cleaned = line.trim();
      if (this.isValidTextCandidate(cleaned)) {
        candidates.push(cleaned);
      }
    }
    
    // Also include the original merchant if present
    if (ocrResult.merchant && this.isValidTextCandidate(ocrResult.merchant)) {
      candidates.push(ocrResult.merchant);
    }
    
    return [...new Set(candidates)]; // Remove duplicates
  }

  // Layer 2: Keyword & Pattern Matching - PRIORITIZE KNOWN MERCHANTS
  static findKnownMerchants(textCandidates: string[]): MerchantCandidate[] {
    const matches: MerchantCandidate[] = [];
    
    for (const candidate of textCandidates) {
      const lowerCandidate = candidate.toLowerCase();
      
      for (const known of this.KNOWN_MERCHANTS) {
        const lowerKnown = known.toLowerCase();
        
        // Exact match - HIGHEST priority
        if (lowerCandidate === lowerKnown) {
          matches.push({
            name: known,
            confidence: 0.99,
            source: 'keyword',
            normalized: this.normalizeMerchantName(known)
          });
        }
        // Partial match - HIGH priority
        else if (lowerCandidate.includes(lowerKnown) || lowerKnown.includes(lowerCandidate)) {
          matches.push({
            name: known,
            confidence: 0.95,
            source: 'keyword',
            normalized: this.normalizeMerchantName(known)
          });
        }
        // Fuzzy match - GOOD priority
        else if (this.calculateSimilarity(lowerCandidate, lowerKnown) > 0.8) {
          matches.push({
            name: known,
            confidence: 0.90,
            source: 'keyword',
            normalized: this.normalizeMerchantName(known)
          });
        }
      }
    }
    
    return matches;
  }

  // Layer 3: Business Pattern Recognition
  static async lookupMerchantDatabase(textCandidates: string[]): Promise<MerchantCandidate[]> {
    const databaseMatches: MerchantCandidate[] = [];
    
    for (const candidate of textCandidates) {
      // Business entity patterns
      const businessPatterns = [
        /(.+)\s+(pty\s+ltd|pty|ltd|cc|inc)/i,
        /(.+)\s+(trading\s+as|t\/a|ta)\s+(.+)/i,
        /(.+)\s+(store|shop|market|cafe|restaurant)/i
      ];
      
      for (const pattern of businessPatterns) {
        const match = candidate.match(pattern);
        if (match) {
          const merchantName = match[1].trim();
          if (merchantName.length >= 3) {
            databaseMatches.push({
              name: merchantName,
              confidence: 0.60, // Lower than known merchants
              source: 'database',
              normalized: this.normalizeMerchantName(merchantName)
            });
          }
        }
      }
    }
    
    return databaseMatches;
  }

  // Layer 4: Geolocation Context
  static async enhanceWithGeolocation(
    candidates: MerchantCandidate[], 
    location?: LocationContext
  ): Promise<MerchantCandidate[]> {
    if (!location?.latitude || !location?.longitude) {
      return candidates;
    }
    
    return candidates.map(candidate => {
      let locationBonus = 0;
      
      // Small bonus for fuel stations
      if (['Engen', 'Shell', 'BP', 'Caltex', 'Sasol'].includes(candidate.name)) {
        locationBonus = 0.02;
      }
      
      // Small bonus for grocery stores during shopping hours
      const hour = new Date().getHours();
      if (['Pick n Pay', 'Checkers', 'Shoprite', 'Spar'].includes(candidate.name) && 
          hour >= 8 && hour <= 20) {
        locationBonus = 0.01;
      }
      
      return {
        ...candidate,
        confidence: Math.min(0.99, candidate.confidence + locationBonus)
      };
    });
  }

  // Layer 5: Prepare top candidates
  static prepareUserConfirmation(candidates: MerchantCandidate[]): MerchantCandidate[] {
    // Remove duplicates and sort by confidence
    const uniqueCandidates = new Map<string, MerchantCandidate>();
    
    for (const candidate of candidates) {
      const key = candidate.normalized;
      const existing = uniqueCandidates.get(key);
      
      if (!existing || candidate.confidence > existing.confidence) {
        uniqueCandidates.set(key, candidate);
      }
    }
    
    // Return top 3 candidates
    return Array.from(uniqueCandidates.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  // Main orchestration method
  static async recognizeMerchant(
    ocrResult: OCRResult, 
    location?: LocationContext
  ): Promise<MerchantCandidate[]> {
    
    // Layer 1: Extract text candidates from OCR
    const textCandidates = this.extractTextCandidates(ocrResult);
    
    // Layer 2: Find known merchants (HIGHEST PRIORITY)
    const knownMatches = this.findKnownMerchants(textCandidates);
    
    // Layer 3: Database lookup (LOWER PRIORITY)
    const databaseMatches = await this.lookupMerchantDatabase(textCandidates);
    
    // Combine all candidates
    let allCandidates = [...knownMatches, ...databaseMatches];
    
    // Layer 4: Enhance with geolocation
    allCandidates = await this.enhanceWithGeolocation(allCandidates, location);
    
    // Layer 5: Prepare for user confirmation
    const topCandidates = this.prepareUserConfirmation(allCandidates);
    
    // If we have high-confidence matches (known merchants), return the best one
    if (topCandidates.length > 0 && topCandidates[0].confidence >= 0.9) {
      return [topCandidates[0]];
    }
    
    // Otherwise, return top 3 for user selection
    return topCandidates.length > 0 ? topCandidates : [{
      name: ocrResult.merchant || 'Unknown Merchant',
      confidence: 0.1,
      source: 'ocr',
      normalized: this.normalizeMerchantName(ocrResult.merchant || 'Unknown Merchant')
    }];
  }

  // Helper methods
  private static isValidTextCandidate(text: string): boolean {
    if (!text || text.length < 3 || text.length > 50) return false;
    
    const excludePatterns = [
      /^(tax\s+invoice|invoice|receipt|slip|till\s+slip)$/i,
      /^(vat\s+reg|registration|reg\s+no|vat\s+no)$/i,
      /^(parking|car\s+park|carpark)$/i, // EXCLUDE PARKING
      /^(entrance|exit|gate|barrier)$/i,
      /^(level|floor|section|bay)$/i,
      /^(hourly|daily|monthly|rate)$/i,
      /^\d+$/,
      /^\d{2}:\d{2}/,
      /\d{4}\/\d{2}\/\d{2}/,
      /@/,
      /^www\./,
      /^(tel|phone|fax|email)$/i,
      /^(thank\s+you|thanks|welcome)$/i
    ];
    
    return !excludePatterns.some(pattern => pattern.test(text));
  }

  private static normalizeMerchantName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
