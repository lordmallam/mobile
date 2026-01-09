/**
 * Vessel Map Component
 * 
 * Displays vessels on a Mapbox map with:
 * - 10-second HTTP polling for updates
 * - Zoom level enforcement (>= 12)
 * - Vessel markers with course indicators
 * - Delta updates
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useVessels } from '../contexts/VesselContext';
import { VesselApiService } from '../services/VesselApiService';
import {
  MAPBOX_ACCESS_TOKEN,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MIN_ZOOM_LEVEL,
  POLL_INTERVAL_MS,
} from '../config';
import { Bbox } from '../types';

// Set Mapbox access token
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

export const VesselMap: React.FC = () => {
  const {
    vessels,
    lastServerTime,
    updateMultipleVessels,
    removeStaleVessels,
    clearAll,
    setLastServerTime,
  } = useVessels();
  
  const [zoom, setZoom] = useState(DEFAULT_MAP_ZOOM);
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Fetch vessels from API.
   */
  const fetchVessels = useCallback(async () => {
    if (!bbox || zoom < MIN_ZOOM_LEVEL) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await VesselApiService.fetchVessels(
        bbox,
        Math.round(zoom),
        lastServerTime || undefined
      );
      
      // Update vessels
      if (response.vessels.length > 0) {
        updateMultipleVessels(response.vessels);
      }
      
      // Update server time for next delta request
      setLastServerTime(response.server_time);
      
      console.log(
        `Fetched ${response.vessels.length} vessels (delta: ${response.is_delta})`
      );
    } catch (err) {
      console.error('Error fetching vessels:', err);
      setError('Failed to fetch vessels');
    } finally {
      setIsLoading(false);
    }
  }, [bbox, zoom, lastServerTime, updateMultipleVessels, setLastServerTime]);
  
  /**
   * Handle region change (viewport moved/zoomed).
   */
  const handleRegionDidChange = useCallback(async () => {
    try {
      // Get visible bounds
      const bounds = await mapRef.current?.getVisibleBounds();
      const currentZoom = await mapRef.current?.getZoom();
      
      if (!bounds || !currentZoom) return;
      
      setZoom(currentZoom);
      
      const newBbox: Bbox = {
        minLon: bounds[0][0],
        minLat: bounds[0][1],
        maxLon: bounds[1][0],
        maxLat: bounds[1][1],
      };
      
      setBbox(newBbox);
      
      // If zoom changed significantly, clear vessels and refetch
      if (currentZoom < MIN_ZOOM_LEVEL) {
        clearAll();
      }
    } catch (err) {
      console.error('Error handling region change:', err);
    }
  }, [clearAll]);
  
  /**
   * Start polling when viewport is ready and zoom >= 12.
   */
  useEffect(() => {
    if (zoom < MIN_ZOOM_LEVEL || !bbox) {
      // Stop polling if zoomed out
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }
    
    // Fetch immediately
    fetchVessels();
    
    // Start polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchVessels();
      removeStaleVessels(); // Clean up stale vessels
    }, POLL_INTERVAL_MS);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [bbox, zoom, fetchVessels, removeStaleVessels]);
  
  /**
   * Convert vessels to GeoJSON for Mapbox.
   */
  const vesselGeoJSON = React.useMemo(() => {
    const features = Array.from(vessels.values()).map(vessel => ({
      type: 'Feature' as const,
      id: vessel.mmsi,
      geometry: {
        type: 'Point' as const,
        coordinates: [vessel.longitude, vessel.latitude],
      },
      properties: {
        mmsi: vessel.mmsi,
        course: vessel.course ?? 0,
        speed: vessel.speed ?? 0,
        ship_type: vessel.ship_type ?? 0,
        last_updated: vessel.last_updated,
      },
    }));
    
    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [vessels]);
  
  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        onRegionDidChange={handleRegionDidChange}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_MAP_ZOOM}
          centerCoordinate={[DEFAULT_MAP_CENTER.longitude, DEFAULT_MAP_CENTER.latitude]}
        />
        
        {/* Vessel markers */}
        {zoom >= MIN_ZOOM_LEVEL && (
          <MapboxGL.ShapeSource id="vessels" shape={vesselGeoJSON}>
            {/* Vessel icons with course rotation */}
            <MapboxGL.SymbolLayer
              id="vessel-icons"
              style={{
                iconImage: 'marker-15', // Built-in Mapbox marker (fallback)
                iconSize: 1.5,
                iconRotate: ['get', 'course'],
                iconRotationAlignment: 'map',
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
              }}
            />
            
            {/* MMSI labels at high zoom */}
            {zoom >= 14 && (
              <MapboxGL.SymbolLayer
                id="vessel-labels"
                style={{
                  textField: ['get', 'mmsi'],
                  textSize: 10,
                  textOffset: [0, 1.5],
                  textColor: '#333',
                  textHaloColor: '#fff',
                  textHaloWidth: 1,
                }}
              />
            )}
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>
      
      {/* Zoom warning */}
      {zoom < MIN_ZOOM_LEVEL && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Zoom in to level {MIN_ZOOM_LEVEL} or higher to see vessels
          </Text>
        </View>
      )}
      
      {/* Status indicators */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Zoom: {zoom.toFixed(1)} | Vessels: {vessels.size}
        </Text>
        {isLoading && <Text style={styles.statusText}>Loading...</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  warningContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    padding: 15,
    borderRadius: 8,
  },
  warningText: {
    color: '#000',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});

