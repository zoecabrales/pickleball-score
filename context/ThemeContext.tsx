import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export type Palette = {
  background: string;
  card: string;
  ink: string;
  muted: string;
  green: string;
  paleGreen: string;
  lime: string;
  line: string;
  red: string;
  paleRed: string;
  borderRed: string;
  navy: string;
};

export type ThemeId = "court" | "midnight" | "ocean" | "sunset" | "grape";

export type AppTheme = {
  id: ThemeId;
  name: string;
  isDark: boolean;
  colors: Palette;
};

export const THEMES: AppTheme[] = [
  {
    id: "court",
    name: "Court Green",
    isDark: false,
    colors: {
      background: "#F4F6F1",
      card: "#FFFFFF",
      ink: "#15241E",
      muted: "#7B8981",
      green: "#176B4B",
      paleGreen: "#E3F2E9",
      lime: "#D4F45B",
      line: "#E6EBE6",
      red: "#B74838",
      paleRed: "#FBEDEA",
      borderRed: "#F0D6D1",
      navy: "#17342A",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    isDark: true,
    colors: {
      background: "#0E1512",
      card: "#18231E",
      ink: "#E8F0EB",
      muted: "#8FA298",
      green: "#2FA878",
      paleGreen: "#1E3A2E",
      lime: "#D4F45B",
      line: "#273630",
      red: "#E0705F",
      paleRed: "#2E1B18",
      borderRed: "#4A2B26",
      navy: "#0A1C14",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    isDark: false,
    colors: {
      background: "#F0F5FA",
      card: "#FFFFFF",
      ink: "#10243A",
      muted: "#6F8497",
      green: "#1769AA",
      paleGreen: "#E0EEF9",
      lime: "#8EE3F5",
      line: "#DFE8F0",
      red: "#B74838",
      paleRed: "#FBEDEA",
      borderRed: "#F0D6D1",
      navy: "#123552",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    isDark: false,
    colors: {
      background: "#FBF4EE",
      card: "#FFFFFF",
      ink: "#2E1A14",
      muted: "#8D7A70",
      green: "#CF4F25",
      paleGreen: "#FCE6DB",
      lime: "#FFD166",
      line: "#F0E2D8",
      red: "#A3231B",
      paleRed: "#FBEDEA",
      borderRed: "#F0D6D1",
      navy: "#4A2217",
    },
  },
  {
    id: "grape",
    name: "Grape",
    isDark: false,
    colors: {
      background: "#F6F3FA",
      card: "#FFFFFF",
      ink: "#231A33",
      muted: "#81789A",
      green: "#6A3FB5",
      paleGreen: "#EBE3F7",
      lime: "#F2E06B",
      line: "#E6E0EF",
      red: "#B74838",
      paleRed: "#FBEDEA",
      borderRed: "#F0D6D1",
      navy: "#2D1F4A",
    },
  },
];

const STORAGE_KEY = "pickleball-score:theme:v1";

type ThemeContextValue = AppTheme & {
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("court");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const match = THEMES.find((theme) => theme.id === stored);
        if (match) setThemeId(match.id);
      })
      .catch(() => undefined);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => undefined);
  }, []);

  const value = useMemo(() => {
    const theme = THEMES.find((item) => item.id === themeId) ?? THEMES[0];
    return { ...theme, setTheme };
  }, [themeId, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }
  return context;
}
