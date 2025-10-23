/**
 * Simplified Compass Module
 * Uses native device sensors with minimal logic
 */

// Jerusalem coordinates (Kotel)
export const JERUSALEM_COORDS = { lat: 31.7767, lng: 35.2345 };

// Compass configuration
const COMPASS_CONFIG = {
  MEDIAN_FILTER_SIZE: 5,
  SMOOTHING_ALPHA: 0.25,
  UPDATE_THROTTLE_MS: 50,
  LOCATION_ACCURACY_THRESHOLD: 12, // meters
  ALIGNMENT_TOLERANCE: 10, // degrees
};

// Types
export interface CompassState {
  deviceHeading: number;
  bearing: number;
  isAligned: boolean;
  location: { lat: number; lng: number } | null;
  hasPermission: boolean;
  isSupported: boolean;
  error: string | null;
  debugInfo?: DebugInfo;
}

export interface DebugInfo {
  rawAlpha: number;
  rawAbsolute: boolean;
  eventType: string;
  deviceType: string;
  accuracy: number;
  filterBuffer: number[];
  computedRotation: number;
  eventRate: number;
}

// Device detection utilities
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const hasWebkitCompass = 'webkitCompassHeading' in DeviceOrientationEvent.prototype;
  const hasAbsoluteOrientation = 'ondeviceorientationabsolute' in window;
  const needsPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function';
  
  // Enhanced iPhone model detection
  let iphoneModel = 'Unknown';
  if (isIOS) {
    if (/iPhone OS 17_0|iPhone OS 18_0|iPhone OS 19_0/.test(ua)) {
      iphoneModel = 'iPhone 15/16+ (iOS 17+)';
    } else if (/iPhone OS 16_0|iPhone OS 15_0/.test(ua)) {
      iphoneModel = 'iPhone 12/13/14 (iOS 15-16)';
    } else if (/iPhone OS 14_0|iPhone OS 13_0/.test(ua)) {
      iphoneModel = 'iPhone 11/XS/XR (iOS 13-14)';
    } else if (/iPhone OS 12_0|iPhone OS 11_0/.test(ua)) {
      iphoneModel = 'iPhone 6/7/8/X (iOS 11-12)';
    } else {
      iphoneModel = 'iPhone 5s/6 (iOS 10-)';
    }
  }
  
  return {
    isIOS,
    isAndroid,
    hasWebkitCompass,
    hasAbsoluteOrientation,
    needsPermission,
    deviceType: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Other',
    iphoneModel: isIOS ? iphoneModel : null
  };
}

// Bearing calculation (user location to Jerusalem)
export function calculateBearing(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const deltaLng = ((toLng - fromLng) * Math.PI) / 180;
  
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return normalizeDegrees(bearing);
}

// Normalize degrees to 0-360 range
export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

// Calculate rotation needed to align bearing with device heading
export function calculateCompassRotation(bearing: number, deviceHeading: number): number {
  return normalizeDegrees(bearing - deviceHeading);
}

// Simple median filter for stability
export function medianFilter(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

// Exponential smoothing for compass values (handles 359->1 transitions)
export function smoothCompassValue(current: number, previous: number, alpha: number): number {
  if (previous === null || previous === undefined) return current;
  
  // Handle circular nature of compass headings
  let diff = current - previous;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  const smoothed = previous + alpha * diff;
  return normalizeDegrees(smoothed);
}

// Check if compass is aligned with Jerusalem
export function isAligned(bearing: number, deviceHeading: number, tolerance: number = COMPASS_CONFIG.ALIGNMENT_TOLERANCE): boolean {
  let diff = Math.abs(bearing - deviceHeading);
  if (diff > 180) diff = 360 - diff;
  return diff <= tolerance;
}

// Main Compass Class
export class SimpleCompass {
  private state: CompassState;
  private subscribers: Set<(state: CompassState) => void> = new Set();
  private orientationHandler: ((event: DeviceOrientationEvent) => void) | null = null;
  private absoluteOrientationHandler: ((event: DeviceOrientationEvent) => void) | null = null;
  private watchId: number | null = null;
  private activeEventType: string | null = null;
  private eventSwitchTimeout: NodeJS.Timeout | null = null;
  
  // Filtering and smoothing
  private headingBuffer: number[] = [];
  private lastSmoothedHeading: number | null = null;
  private lastUpdateTime = 0;
  private eventCount = 0;
  
  // Debug mode
  private debugMode = false;
  
  constructor() {
    this.state = {
      deviceHeading: 0,
      bearing: 0,
      isAligned: false,
      location: null,
      hasPermission: false,
      isSupported: false,
      error: null
    };
    
    // Check for debug mode
    this.debugMode = new URLSearchParams(window.location.search).get('debug') === 'compass';
    
    this.initialize();
  }
  
  private initialize() {
    this.state.isSupported = typeof DeviceOrientationEvent !== 'undefined';
    
    if (this.debugMode) {
      // Debug mode enabled
    }
    
    // Request location first
    this.requestLocation();
  }
  
  private requestLocation() {
    if (!navigator.geolocation) {
      this.state.error = 'Geolocation not supported';
      this.notifySubscribers();
      return;
    }
    
    // Use cached location if available and fresh (within 15 minutes)
    const cached = this.getCachedLocation();
    if (cached) {
      this.state.location = cached;
      this.calculateBearing();
      this.notifySubscribers();
      return;
    }
    
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000 // 5 minutes
    };
    
    navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Only update if location changed significantly
        if (!this.state.location || this.locationChanged(this.state.location, newLocation, position.coords.accuracy)) {
          this.state.location = newLocation;
          this.cacheLocation(newLocation);
          this.calculateBearing();
          this.notifySubscribers();
        }
      },
      (error) => {
        this.state.error = `Location error: ${error.message}`;
        // Fallback to approximate bearing
        this.state.bearing = 90; // East (approximate for most locations)
        this.notifySubscribers();
      },
      options
    );
  }
  
  private locationChanged(oldLoc: {lat: number, lng: number}, newLoc: {lat: number, lng: number}, accuracy: number): boolean {
    const distance = this.calculateDistance(oldLoc.lat, oldLoc.lng, newLoc.lat, newLoc.lng);
    return distance > Math.max(COMPASS_CONFIG.LOCATION_ACCURACY_THRESHOLD, accuracy || 50);
  }
  
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  
  private getCachedLocation(): {lat: number, lng: number} | null {
    try {
      const cached = localStorage.getItem('compass-location');
      const timestamp = localStorage.getItem('compass-location-time');
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 15 * 60 * 1000) { // 15 minutes
          return JSON.parse(cached);
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  }
  
  private cacheLocation(location: {lat: number, lng: number}) {
    try {
      localStorage.setItem('compass-location', JSON.stringify(location));
      localStorage.setItem('compass-location-time', Date.now().toString());
    } catch (e) {
      // Ignore cache errors
    }
  }
  
  private calculateBearing() {
    if (!this.state.location) return;
    
    this.state.bearing = calculateBearing(
      this.state.location.lat,
      this.state.location.lng,
      JERUSALEM_COORDS.lat,
      JERUSALEM_COORDS.lng
    );
  }
  
  async requestPermission(): Promise<boolean> {
    const deviceInfo = getDeviceInfo();
    
    if (deviceInfo.needsPermission) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        this.state.hasPermission = response === 'granted';
      } catch (error) {
        this.state.hasPermission = false;
        this.state.error = 'Permission denied';
      }
    } else {
      this.state.hasPermission = true;
    }
    
    if (this.state.hasPermission) {
      this.startOrientationTracking();
    }
    
    this.notifySubscribers();
    return this.state.hasPermission;
  }
  
  private startOrientationTracking() {
    if (this.orientationHandler || this.absoluteOrientationHandler) {
      this.stopOrientationTracking();
    }
    
    const deviceInfo = getDeviceInfo();
    
    // For iOS with webkitCompassHeading, only use deviceorientation
    if (deviceInfo.isIOS && deviceInfo.hasWebkitCompass) {
      this.activeEventType = 'deviceorientation';
      this.orientationHandler = (event: DeviceOrientationEvent) => {
        this.handleOrientationEvent(event, 'deviceorientation');
      };
      window.addEventListener('deviceorientation', this.orientationHandler, { passive: true });
      
      if (this.debugMode) {
        console.log('[Compass] iOS: Using deviceorientation with webkitCompassHeading');
      }
      return;
    }
    
    // For Android and other devices: Try both events, use whichever fires first
    // Chrome Android no longer fires deviceorientationabsolute, but we try both
    let absoluteEventFired = false;
    let standardEventFired = false;
    
    // Handler for deviceorientationabsolute
    this.absoluteOrientationHandler = (event: DeviceOrientationEvent) => {
      if (!absoluteEventFired) {
        absoluteEventFired = true;
        this.activeEventType = 'deviceorientationabsolute';
        
        // Remove standard event listener if absolute works
        if (this.orientationHandler) {
          window.removeEventListener('deviceorientation', this.orientationHandler);
          this.orientationHandler = null;
        }
        
        if (this.debugMode) {
          console.log('[Compass] Using deviceorientationabsolute');
        }
      }
      this.handleOrientationEvent(event, 'deviceorientationabsolute');
    };
    
    // Handler for standard deviceorientation (fallback)
    this.orientationHandler = (event: DeviceOrientationEvent) => {
      if (!standardEventFired) {
        standardEventFired = true;
        this.activeEventType = 'deviceorientation';
        
        if (this.debugMode) {
          console.log('[Compass] Using deviceorientation (fallback)');
        }
      }
      this.handleOrientationEvent(event, 'deviceorientation');
    };
    
    // Subscribe to both events
    window.addEventListener('deviceorientationabsolute', this.absoluteOrientationHandler as any, { passive: true });
    window.addEventListener('deviceorientation', this.orientationHandler, { passive: true });
    
    // After 1 second, if deviceorientationabsolute hasn't fired, remove it
    this.eventSwitchTimeout = setTimeout(() => {
      if (!absoluteEventFired && this.absoluteOrientationHandler) {
        window.removeEventListener('deviceorientationabsolute', this.absoluteOrientationHandler as any);
        this.absoluteOrientationHandler = null;
        this.activeEventType = 'deviceorientation';
        
        if (this.debugMode) {
          console.log('[Compass] deviceorientationabsolute timeout, using deviceorientation only');
        }
      }
      this.eventSwitchTimeout = null;
    }, 1000);
    
    if (this.debugMode) {
      console.log('[Compass] Android: Trying both deviceorientationabsolute and deviceorientation');
    }
  }
  
  private handleOrientationEvent(event: DeviceOrientationEvent, eventType: string) {
    const now = Date.now();
    this.eventCount++;
    
    // Throttle updates
    if (now - this.lastUpdateTime < COMPASS_CONFIG.UPDATE_THROTTLE_MS) {
      return;
    }
    
    let heading: number;
    const deviceInfo = getDeviceInfo();
    
    // Enhanced iOS support for different iPhone models
    if (deviceInfo.isIOS && (event as any).webkitCompassHeading !== undefined && (event as any).webkitCompassHeading !== -1) {
      // iOS native compass heading (most accurate for iPhone 6+ and newer)
      heading = (event as any).webkitCompassHeading;
    } else if (event.alpha !== null && event.alpha !== undefined) {
      // Fallback to alpha-based heading for older iOS devices or when webkitCompassHeading is unavailable
      if (deviceInfo.isAndroid) {
        // Android: alpha is device-frame yaw where 0° = portrait pointing East
        // Need to compensate for screen orientation
        const screenOrientationAngle = (screen.orientation?.angle ?? window.orientation) || 0;
        
        // Convert device-frame yaw to magnetic heading
        // Formula: heading = 360 - alpha + screenOrientation
        heading = normalizeDegrees(360 - event.alpha + screenOrientationAngle);
        
        if (this.debugMode) {
          console.log('[Compass] Android heading calculation:', {
            rawAlpha: event.alpha,
            screenOrientation: screenOrientationAngle,
            computedHeading: heading,
            absolute: event.absolute
          });
        }
      } else if (deviceInfo.isIOS) {
        // iOS: webkitCompassHeading unavailable, use alpha with iOS correction
        // For iOS, when webkitCompassHeading is not available, alpha needs correction
        heading = event.absolute ? event.alpha : normalizeDegrees(360 - event.alpha);
      } else {
        // Other devices: typically need inversion
        heading = normalizeDegrees(360 - event.alpha);
      }
    } else {
      // No valid heading available - this might indicate a problem
      if (this.debugMode) {
        console.warn('No valid compass heading available', {
          webkitCompassHeading: (event as any).webkitCompassHeading,
          alpha: event.alpha,
          absolute: event.absolute,
          deviceInfo
        });
      }
      return;
    }
    
    // Validate heading range
    if (heading < 0 || heading > 360 || isNaN(heading)) {
      if (this.debugMode) {
        console.warn('Invalid heading value:', heading);
      }
      return;
    }
    
    // Apply median filter for stability
    this.headingBuffer.push(heading);
    if (this.headingBuffer.length > COMPASS_CONFIG.MEDIAN_FILTER_SIZE) {
      this.headingBuffer.shift();
    }
    
    if (this.headingBuffer.length >= 3) {
      const filteredHeading = medianFilter(this.headingBuffer);
      const smoothedHeading = smoothCompassValue(
        filteredHeading,
        this.lastSmoothedHeading || filteredHeading,
        COMPASS_CONFIG.SMOOTHING_ALPHA
      );
      
      this.state.deviceHeading = Math.round(smoothedHeading);
      this.lastSmoothedHeading = smoothedHeading;
      this.lastUpdateTime = now;
      
      // Check alignment
      this.state.isAligned = isAligned(this.state.bearing, this.state.deviceHeading);
      
      // Debug info
      if (this.debugMode) {
        this.state.debugInfo = {
          rawAlpha: event.alpha || 0,
          rawAbsolute: event.absolute || false,
          eventType,
          deviceType: deviceInfo.deviceType,
          accuracy: this.headingBuffer.length,
          filterBuffer: [...this.headingBuffer],
          computedRotation: calculateCompassRotation(this.state.bearing, this.state.deviceHeading),
          eventRate: this.eventCount / ((now - this.lastUpdateTime) / 1000)
        };
      }
      
      this.notifySubscribers();
    }
  }
  
  private stopOrientationTracking() {
    // Clear event switch timeout
    if (this.eventSwitchTimeout) {
      clearTimeout(this.eventSwitchTimeout);
      this.eventSwitchTimeout = null;
    }
    
    // Remove deviceorientation listener
    if (this.orientationHandler) {
      window.removeEventListener('deviceorientation', this.orientationHandler);
      this.orientationHandler = null;
    }
    
    // Remove deviceorientationabsolute listener
    if (this.absoluteOrientationHandler) {
      window.removeEventListener('deviceorientationabsolute', this.absoluteOrientationHandler as any);
      this.absoluteOrientationHandler = null;
    }
    
    this.activeEventType = null;
  }
  
  subscribe(callback: (state: CompassState) => void) {
    this.subscribers.add(callback);
    // Immediately notify with current state
    callback(this.state);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback({ ...this.state }));
  }
  
  dispose() {
    this.stopOrientationTracking();
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.subscribers.clear();
  }
  
  getState(): CompassState {
    return { ...this.state };
  }
}