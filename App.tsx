/**
 * AIS Viewer Mobile App
 * 
 * Main application component with Vessel Context Provider
 * and VesselMap component.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VesselProvider } from './src/contexts/VesselContext';
import { VesselMap } from './src/components/VesselMap';

export default function App() {
  return (
    <VesselProvider>
      <View style={styles.container}>
        <VesselMap />
        <StatusBar style="auto" />
      </View>
    </VesselProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

