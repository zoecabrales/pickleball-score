import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";

import { useAppTheme } from "@/context/ThemeContext";

export default function TabLayout() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
          backgroundColor: colors.card,
          borderTopColor: colors.line,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "square.grid.2x2.fill",
                android: "dashboard",
                web: "dashboard",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Players",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "person.2.fill",
                android: "people",
                web: "people",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Play",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "tennisball.fill",
                android: "sports_tennis",
                web: "sports_tennis",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Rankings",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "trophy.fill",
                android: "emoji_events",
                web: "emoji_events",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "gearshape.fill",
                android: "settings",
                web: "settings",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />
    </Tabs>
  );
}
