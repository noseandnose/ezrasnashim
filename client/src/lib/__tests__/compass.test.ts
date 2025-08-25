/**
 * Unit tests for compass module
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateBearing,
  normalizeDegrees,
  calculateCompassRotation,
  medianFilter,
  smoothCompassValue,
  isAligned,
  JERUSALEM_COORDS
} from '../compass';

describe('Compass Math Functions', () => {
  describe('normalizeDegrees', () => {
    it('should normalize positive degrees', () => {
      expect(normalizeDegrees(45)).toBe(45);
      expect(normalizeDegrees(360)).toBe(0);
      expect(normalizeDegrees(450)).toBe(90);
    });
    
    it('should normalize negative degrees', () => {
      expect(normalizeDegrees(-45)).toBe(315);
      expect(normalizeDegrees(-90)).toBe(270);
      expect(normalizeDegrees(-360)).toBe(0);
    });
  });
  
  describe('calculateBearing', () => {
    it('should calculate bearing from New York to Jerusalem', () => {
      // New York to Jerusalem should be roughly northeast (around 60 degrees)
      const bearing = calculateBearing(40.7128, -74.0060, JERUSALEM_COORDS.lat, JERUSALEM_COORDS.lng);
      expect(bearing).toBeGreaterThan(50);
      expect(bearing).toBeLessThan(80);
    });
    
    it('should calculate bearing from London to Jerusalem', () => {
      // London to Jerusalem should be roughly southeast (around 120 degrees)
      const bearing = calculateBearing(51.5074, -0.1278, JERUSALEM_COORDS.lat, JERUSALEM_COORDS.lng);
      expect(bearing).toBeGreaterThan(100);
      expect(bearing).toBeLessThan(140);
    });
    
    it('should handle same location', () => {
      const bearing = calculateBearing(JERUSALEM_COORDS.lat, JERUSALEM_COORDS.lng, JERUSALEM_COORDS.lat, JERUSALEM_COORDS.lng);
      expect(bearing).toBe(0);
    });
  });
  
  describe('calculateCompassRotation', () => {
    it('should calculate correct rotation for alignment', () => {
      expect(calculateCompassRotation(90, 0)).toBe(90); // Turn 90 degrees right
      expect(calculateCompassRotation(0, 90)).toBe(270); // Turn 270 degrees right (or 90 left)
      expect(calculateCompassRotation(45, 45)).toBe(0); // Already aligned
    });
    
    it('should handle wrap-around cases', () => {
      expect(calculateCompassRotation(10, 350)).toBe(20); // 10 - 350 = -340, normalized to 20
      expect(calculateCompassRotation(350, 10)).toBe(340); // 350 - 10 = 340
    });
  });
  
  describe('medianFilter', () => {
    it('should return median of odd number of values', () => {
      expect(medianFilter([1, 3, 2, 5, 4])).toBe(3);
    });
    
    it('should return average of middle two for even number of values', () => {
      expect(medianFilter([1, 2, 3, 4])).toBe(2.5);
    });
    
    it('should handle single value', () => {
      expect(medianFilter([42])).toBe(42);
    });
  });
  
  describe('smoothCompassValue', () => {
    it('should smooth normal transitions', () => {
      const result = smoothCompassValue(10, 5, 0.5);
      expect(result).toBe(7.5);
    });
    
    it('should handle 359->1 degree transitions correctly', () => {
      const result = smoothCompassValue(1, 359, 0.5);
      expect(result).toBe(0); // Should wrap around correctly
    });
    
    it('should handle 1->359 degree transitions correctly', () => {
      const result = smoothCompassValue(359, 1, 0.5);
      expect(result).toBe(0); // Should wrap around correctly
    });
    
    it('should return current value when no previous value', () => {
      expect(smoothCompassValue(45, null as any, 0.5)).toBe(45);
      expect(smoothCompassValue(45, undefined as any, 0.5)).toBe(45);
    });
  });
  
  describe('isAligned', () => {
    it('should detect alignment within tolerance', () => {
      expect(isAligned(90, 85, 10)).toBe(true); // 5 degree difference
      expect(isAligned(90, 95, 10)).toBe(true); // 5 degree difference
      expect(isAligned(90, 105, 10)).toBe(false); // 15 degree difference
    });
    
    it('should handle wrap-around alignment', () => {
      expect(isAligned(5, 355, 15)).toBe(true); // 10 degree difference across 0
      expect(isAligned(355, 5, 15)).toBe(true); // 10 degree difference across 0
      expect(isAligned(5, 340, 15)).toBe(false); // 25 degree difference
    });
    
    it('should use default tolerance', () => {
      expect(isAligned(90, 95)).toBe(true); // Within default 10 degree tolerance
      expect(isAligned(90, 105)).toBe(false); // Outside default 10 degree tolerance
    });
  });
});

describe('Orientation Mapping', () => {
  // Test screen orientation corrections
  describe('Screen orientation handling', () => {
    it('should handle portrait orientation (0 degrees)', () => {
      // When phone is upright, no additional rotation needed
      const deviceHeading = 90; // Device pointing east
      expect(normalizeDegrees(deviceHeading + 0)).toBe(90);
    });
    
    it('should handle landscape left (90 degrees)', () => {
      // When phone is rotated 90 degrees left, add 90 degrees correction
      const deviceHeading = 90; // Device pointing east
      const correctedHeading = normalizeDegrees(deviceHeading + 90);
      expect(correctedHeading).toBe(180); // Should now point south
    });
    
    it('should handle landscape right (-90 degrees)', () => {
      // When phone is rotated 90 degrees right, subtract 90 degrees
      const deviceHeading = 90; // Device pointing east
      const correctedHeading = normalizeDegrees(deviceHeading - 90);
      expect(correctedHeading).toBe(0); // Should now point north
    });
    
    it('should handle upside down (180 degrees)', () => {
      // When phone is upside down, add 180 degrees
      const deviceHeading = 90; // Device pointing east
      const correctedHeading = normalizeDegrees(deviceHeading + 180);
      expect(correctedHeading).toBe(270); // Should now point west
    });
  });
});