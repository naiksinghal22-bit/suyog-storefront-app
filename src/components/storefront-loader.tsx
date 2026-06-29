import { Image, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useRef } from "react";

import { colors } from "@/src/lib/theme";

const BRAND_LOGO = require("../../assets/icon.png");

type StorefrontLoaderProps = {
  title?: string;
  subtitle?: string;
};

export function StorefrontLoader({
  title = "Curating your storefront",
  subtitle = "Gathering new arrivals, festive picks, and favorite looks.",
}: StorefrontLoaderProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 800,
          toValue: 1,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 800,
          toValue: 0,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        duration: 1800,
        toValue: 1,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    shimmerLoop.start();

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, [pulse, shimmer]);

  const dots = useMemo(() => [0, 1, 2], []);

  return (
    <View style={styles.card}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [
              {
                translateX: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-220, 220],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.logoShell,
          {
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.06],
                }),
              },
            ],
          },
        ]}
      >
        <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.dotRow}>
        {dots.map((dot) => (
          <Animated.View
            key={dot}
            style={[
              styles.dot,
              {
                opacity: pulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: dot === 1 ? [0.35, 1, 0.35] : [0.2, 0.7, 0.2],
                }),
                transform: [
                  {
                    translateY: pulse.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: dot === 1 ? [0, -4, 0] : [0, dot === 0 ? -1 : 1, 0],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#f8fbfb",
    borderColor: "#dfeceb",
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 30,
    position: "relative",
  },
  shimmer: {
    backgroundColor: "rgba(255,255,255,0.45)",
    height: 180,
    left: 0,
    position: "absolute",
    top: -20,
    transform: [{ rotate: "18deg" }],
    width: 90,
  },
  logoShell: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 78,
    justifyContent: "center",
    marginBottom: 18,
    width: 78,
  },
  logo: {
    height: 54,
    width: 54,
  },
  title: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  dotRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  dot: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
});
