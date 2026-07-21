import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import React from 'react';

const LoadingData = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Đang tải dữ liệu...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // nền nhẹ nhàng
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default LoadingData;