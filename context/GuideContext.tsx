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

import WelcomeGuide from "@/components/WelcomeGuide";

const SEEN_KEY = "pickleball-score:welcome-guide-seen:v1";

type GuideContextValue = { showGuide: () => void };

const GuideContext = createContext<GuideContextValue | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(SEEN_KEY)
      .then((seen) => {
        if (isMounted && !seen) setVisible(true);
      })
      .catch(() => {
        // If storage is unavailable, skip the guide rather than block the app.
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const closeGuide = useCallback(() => {
    setVisible(false);
    void AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {});
  }, []);

  const showGuide = useCallback(() => setVisible(true), []);
  const value = useMemo(() => ({ showGuide }), [showGuide]);

  return (
    <GuideContext.Provider value={value}>
      {children}
      <WelcomeGuide visible={visible} onClose={closeGuide} />
    </GuideContext.Provider>
  );
}

export function useGuide() {
  const context = useContext(GuideContext);
  if (!context) throw new Error("useGuide must be used within GuideProvider");
  return context;
}
