/**
 * Configuration for the AIS Viewer mobile app.
 */

// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Mapbox Configuration
export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

// Polling Configuration
export const POLL_INTERVAL_MS = 10000; // 10 seconds

// Map Configuration
export const MIN_ZOOM_LEVEL = 12; // Only show vessels at zoom >= 12

export const DEFAULT_MAP_CENTER = {
  longitude: -122.4194, // San Francisco
  latitude: 37.7749,
};

export const DEFAULT_MAP_ZOOM = 10;

// Vessel Configuration
export const STALE_VESSEL_TIMEOUT_MS = 120000; // 2 minutes

