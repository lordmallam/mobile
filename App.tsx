/**
 * AIS Viewer Mobile App
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { VesselProvider } from "./src/contexts/VesselContext";
import { VesselMap } from "./src/components/VesselMap";

export default function App() {
  return (
    <VesselProvider>
      <View style={styles.container}>
        <VesselMap />
        <StatusBar style="auto" />
        <Text>Hello World</Text>
      </View>
    </VesselProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
