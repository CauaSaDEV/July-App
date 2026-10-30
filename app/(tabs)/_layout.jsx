import { Tabs, usePathname, useRouter } from "expo-router";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const PAGE_TITLES = {
  "/Home": "Início",
  "/Agendamentos": "Agendamentos",
  "/Clientes": "Clientes",
  "/Servicos": "Serviços",
  "/Financeiro": "Financeiro",
  "/Usuarios": "Usuários",
};

const BREAKPOINTS = {
  xs: 360,
  sm: 400,
  md: 600,
  lg: 900,
};

function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= BREAKPOINTS.md;
  const isSmallScreen = width < BREAKPOINTS.xs;
  const isShortHeight = height < 420;

  return { width, height, isLandscape, isTablet, isSmallScreen, isShortHeight };
}

function TopHeader() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isTablet, isShortHeight } = useResponsive();
  const title = PAGE_TITLES[pathname] || "";

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          paddingBottom: isShortHeight ? 6 : 12,
          paddingHorizontal: isTablet ? 32 : 16,
        },
      ]}
    >
      <Text
        style={[styles.headerTitle, { fontSize: isTablet ? 22 : 18 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>
    </View>
  );
}

function CustomTabBar({ state, descriptors }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, isTablet, isSmallScreen, isShortHeight } = useResponsive();

  const horizontalMargin = isSmallScreen ? 12 : isTablet ? 40 : 20;
  const bottomSpace = Math.max(insets.bottom, 8) + 4;
  const barHeight = isShortHeight ? 48 : isTablet ? 68 : 60;
  const iconSize = isSmallScreen ? 20 : isTablet ? 26 : 24;

  const maxBarWidth = 520;
  const availableWidth = width - horizontalMargin * 2;
  const barWidth = Math.min(availableWidth, maxBarWidth);
  const sideOffset = (width - barWidth) / 2;

  return (
    <View
      style={[
        styles.tabBarFloating,
        {
          left: sideOffset,
          right: sideOffset,
          bottom: bottomSpace,
          height: barHeight,
          borderRadius: barHeight / 2,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (options.href === null) return null;
        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) {
            router.navigate(route.name === "index" ? "/" : `/${route.name}`);
          }
        };

        const activeColor = "#ffffff";
        const inactiveColor = "#8e8e93";
        const currentColor = isFocused ? activeColor : inactiveColor;

        const renderIcon = () => {
          switch (route.name) {
            case "index":
            case "Home":
              return <Ionicons name={isFocused ? "home" : "home-outline"} size={iconSize} color={currentColor} />;
            case "Agendamentos":
              return <Ionicons name={isFocused ? "calendar" : "calendar-outline"} size={iconSize} color={currentColor} />;
            case "Clientes":
              return <Ionicons name={isFocused ? "people" : "people-outline"} size={iconSize} color={currentColor} />;
            case "Servicos":
              return <Ionicons name={isFocused ? "briefcase" : "briefcase-outline"} size={iconSize} color={currentColor} />;
            case "Financeiro":
              return (
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.currencyIcon,
                    {
                      color: currentColor,
                      fontWeight: isFocused ? "bold" : "normal",
                      fontSize: iconSize,
                    },
                  ]}
                >
                  $
                </Text>
              );
            case "Usuarios":
              return <Ionicons name={isFocused ? "person-circle" : "person-circle-outline"} size={iconSize} color={currentColor} />;
            default:
              return null;
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={route.name}
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {renderIcon()}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TopHeader />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false, // o TopHeader acima já faz esse papel
          lazy: true,
        }}
      >
        <Tabs.Screen name="Home" options={{ title: "Início" }} />
        <Tabs.Screen name="Agendamentos" options={{ title: "Agendamentos" }} />
        <Tabs.Screen name="Clientes" options={{ title: "Clientes" }} />
        <Tabs.Screen name="Servicos" options={{ title: "Serviços" }} />
        <Tabs.Screen name="Financeiro" options={{ title: "Financeiro" }} />
        <Tabs.Screen name="Usuarios" options={{ title: "Usuários" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#000",
  },
  tabBarFloating: {
    position: "absolute",
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 999,
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  currencyIcon: {
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
    lineHeight: Platform.OS === "ios" ? 24 : undefined,
  },
});