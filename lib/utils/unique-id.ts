/**
 * Generates a unique ID for users that is guaranteed to be unique
 * Format: YYYY-NNNNNN (Year + 6-digit sequential number)
 * Example: 2024-000001, 2024-000002, etc.
 */

interface UniqueIdOptions {
  prefix?: string;
  length?: number;
  includeTimestamp?: boolean;
}

/**
 * Generate a unique ID based on timestamp and random component
 * This ensures uniqueness even in high-concurrency scenarios
 */
export function generateUniqueId(options: UniqueIdOptions = {}): string {
  const {
    prefix = '',
    length = 10,
    includeTimestamp = true
  } = options;

  const year = new Date().getFullYear();
  const timestamp = Date.now();
  
  // Generate random component (6 digits)
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  if (includeTimestamp) {
    // Format: PREFIX-YYYY-TIMESTAMP-RANDOM
    const baseId = `${year}-${timestamp}-${random}`;
    return prefix ? `${prefix}-${baseId}` : baseId;
  } else {
    // Format: PREFIX-YYYY-RANDOM (simpler format)
    const baseId = `${year}-${random}`;
    return prefix ? `${prefix}-${baseId}` : baseId;
  }
}

/**
 * Generate a sequential unique ID based on the last used ID
 * This is useful when you want predictable, sequential IDs
 */
export function generateSequentialUniqueId(lastId: string | null, prefix: string = 'USR'): string {
  const year = new Date().getFullYear();
  
  if (!lastId) {
    // First ID for this year
    return `${prefix}-${year}-000001`;
  }
  
  // Parse the last ID to get the sequence number
  const parts = lastId.split('-');
  const lastYear = parseInt(parts[1]);
  const lastSequence = parseInt(parts[2]);
  
  if (lastYear < year) {
    // New year, reset sequence
    return `${prefix}-${year}-000001`;
  }
  
  // Increment sequence
  const newSequence = (lastSequence + 1).toString().padStart(6, '0');
  return `${prefix}-${year}-${newSequence}`;
}

/**
 * Generate a short unique ID (8 characters)
 * Good for user-friendly IDs that are easy to type
 */
export function generateShortUniqueId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  
  // First 2 chars: Year code (24 = 2024, 25 = 2025, etc.)
  const yearCode = (new Date().getFullYear() % 100).toString();
  id += yearCode;
  
  // Next 6 chars: Random alphanumeric
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Validate if a unique ID follows the expected format
 */
export function validateUniqueId(id: string, format: 'full' | 'sequential' | 'short' = 'sequential'): boolean {
  if (!id) return false;
  
  switch (format) {
    case 'full':
      // Format: YYYY-TIMESTAMP-RANDOM or PREFIX-YYYY-TIMESTAMP-RANDOM
      return /^([A-Z]+-)?[0-9]{4}-[0-9]+-[0-9]{6}$/.test(id);
    
    case 'sequential':
      // Format: PREFIX-YYYY-NNNNNN
      return /^[A-Z]{3}-[0-9]{4}-[0-9]{6}$/.test(id);
    
    case 'short':
      // Format: 2 digits + 6 alphanumeric
      return /^[0-9]{2}[A-Z0-9]{6}$/.test(id);
    
    default:
      return false;
  }
}