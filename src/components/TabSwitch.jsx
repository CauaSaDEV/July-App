import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, TouchableOpacity, StyleSheet, View } from "react-native";

const PAD = 4;
const COLOR_ACTIVE = "#D1779F"; // troque pela cor primária do app

export default function TabSwitch({ tabs, value, onChange }) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, tabs.findIndex((t) => t.key === value));
  const slide = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: index,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [index]);

  const tabWidth = width ? (width - PAD * 2) / tabs.length : 0;

  const translateX = slide.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * tabWidth),
  });

  return (
    <View style={styles.container} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View
          style={[styles.indicator, { width: tabWidth, transform: [{ translateX }] }]}
        />
      )}
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            activeOpacity={0.8}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.text, selected && styles.textActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 14,
    padding: PAD,
    marginBottom: 16,
  },
  indicator: {
    position: "absolute",
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: 11,
    backgroundColor: COLOR_ACTIVE,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 14, fontWeight: "600", color: "#666" },
  textActive: { color: "#fff" },
});