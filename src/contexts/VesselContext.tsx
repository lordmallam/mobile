/**
 * Vessel Context for state management using React Context API.
 */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Vessel } from '../types';
import { STALE_VESSEL_TIMEOUT_MS } from '../config';

interface VesselContextType {
  vessels: Map<number, Vessel>;
  lastServerTime: string | null;
  addVessel: (vessel: Vessel) => void;
  updateVessel: (vessel: Vessel) => void;
  updateMultipleVessels: (vessels: Vessel[]) => void;
  removeStaleVessels: () => void;
  clearAll: () => void;
  setLastServerTime: (time: string) => void;
}

const VesselContext = createContext<VesselContextType | undefined>(undefined);

export const VesselProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vessels, setVessels] = useState<Map<number, Vessel>>(new Map());
  const [lastServerTime, setLastServerTime] = useState<string | null>(null);
  
  const addVessel = useCallback((vessel: Vessel) => {
    setVessels(prevVessels => {
      const newVessels = new Map(prevVessels);
      newVessels.set(vessel.mmsi, vessel);
      return newVessels;
    });
  }, []);
  
  const updateVessel = useCallback((vessel: Vessel) => {
    setVessels(prevVessels => {
      const newVessels = new Map(prevVessels);
      newVessels.set(vessel.mmsi, vessel);
      return newVessels;
    });
  }, []);
  
  const updateMultipleVessels = useCallback((vessels: Vessel[]) => {
    setVessels(prevVessels => {
      const newVessels = new Map(prevVessels);
      vessels.forEach(vessel => {
        newVessels.set(vessel.mmsi, vessel);
      });
      return newVessels;
    });
  }, []);
  
  const removeStaleVessels = useCallback(() => {
    const now = Date.now();
    const staleThreshold = now - STALE_VESSEL_TIMEOUT_MS;
    
    setVessels(prevVessels => {
      const newVessels = new Map<number, Vessel>();
      
      prevVessels.forEach((vessel, mmsi) => {
        const vesselTime = new Date(vessel.last_updated).getTime();
        if (vesselTime > staleThreshold) {
          newVessels.set(mmsi, vessel);
        }
      });
      
      return newVessels;
    });
  }, []);
  
  const clearAll = useCallback(() => {
    setVessels(new Map());
    setLastServerTime(null);
  }, []);
  
  const value: VesselContextType = {
    vessels,
    lastServerTime,
    addVessel,
    updateVessel,
    updateMultipleVessels,
    removeStaleVessels,
    clearAll,
    setLastServerTime,
  };
  
  return <VesselContext.Provider value={value}>{children}</VesselContext.Provider>;
};

export const useVessels = (): VesselContextType => {
  const context = useContext(VesselContext);
  if (!context) {
    throw new Error('useVessels must be used within a VesselProvider');
  }
  return context;
};

