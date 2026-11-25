import React, { useEffect, useRef } from "react";
import { Animated, Easing, TouchableOpacity, StyleSheet } from "react-native";

const WIDTH = 108;
const HEIGHT = 32;
const PAD = 3;
const KNOB = HEIGHT - PAD * 2;
const TRAVEL = WIDTH - KNOB - PAD * 2; // distância que a bolinha percorre

const COLOR_ACTIVE = "#1FE885";
const COLOR_INACTIVE = "#FF1A4B";

const DURATION = 380; // aumente para deslizar mais devagar
const EASING = Easing.bezier(0.4, 0, 0.2, 1); // começa e termina suave

export default function StatusToggle({ showInactive, onChange }) {
  const isActive = !showInactive;

  const slide = useRef(new Animated.Value(isActive ? 1 : 0)).current; // native
  const color = useRef(new Animated.Value(isActive ? 1 : 0)).current; // JS
  const busy = useRef(false);

  function runAnimation(toValue, onDone) {
    Animated.parallel([
      Animated.timing(slide, {
        toValue,
        duration: DURATION,
        easing: EASING,
        useNativeDriver: true,
      }),
      Animated.timing(color, {
        toValue,
        duration: DURATION,
        easing: EASING,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => onDone && finished && onDone());
  }

  // mantém sincronizado se o valor mudar por fora
  useEffect(() => {
    runAnimation(isActive ? 1 : 0);
  }, [isActive]);

  function handlePress() {
    if (busy.current) return;
    busy.current = true;
    // anima primeiro, avisa a tela só no final
    runAnimation(isActive ? 0 : 1, () => {
      busy.current = false;
      onChange(isActive); // true = vai para inativos
    });
  }

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRAVEL],
  });

  const backgroundColor = color.interpolate({
    inputRange: [0, 1],
    outputRange: [COLOR_INACTIVE, COLOR_ACTIVE],
  });

  // textos deslizam levemente junto com a bolinha
  const activeTextX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-14, 0],
  });
  const inactiveTextX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });
  const activeOpacity = slide.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const inactiveOpacity = slide.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.Text
          style={[
            styles.label,
            { left: 12, opacity: activeOpacity, transform: [{ translateX: activeTextX }] },
          ]}
        >
          Ativos
        </Animated.Text>

        <Animated.Text
          style={[
            styles.label,
            { right: 10, opacity: inactiveOpacity, transform: [{ translateX: inactiveTextX }] },
          ]}
        >
          Inativos
        </Animated.Text>

        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]}>
          <Animated.Text
            style={[styles.icon, styles.iconAbs, { color: COLOR_ACTIVE, opacity: activeOpacity }]}
          >
            ✓
          </Animated.Text>
          <Animated.Text
            style={[styles.icon, styles.iconAbs, { color: COLOR_INACTIVE, opacity: inactiveOpacity }]}
          >
            ✕
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex",
    marginBottom: 10,
  },
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: PAD,
    justifyContent: "center",
  },
  label: {
    position: "absolute",
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 14,
    fontWeight: "900",
  },
  iconAbs: {
    position: "absolute",
  },
});