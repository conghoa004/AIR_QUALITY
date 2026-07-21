import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";

const Loading = () => {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" style={styles.loading} color="#004487" />
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  loading: {
    transform: "scale(1.5)",
  }
});
