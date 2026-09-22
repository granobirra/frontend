import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type ToastType = "success" | "error" | "info";
type ToastState = { message: string; type: ToastType } | null;

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [opacity]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(hide, 2600);
    },
    [opacity, hide],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  const bg =
    toast?.type === "success"
      ? colors.success
      : toast?.type === "error"
        ? colors.error
        : colors.surfaceInverse;
  const fg =
    toast?.type === "info" ? colors.onSurfaceInverse : colors.onError;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrap, { top: insets.top + 12, opacity }]}
          testID="app-toast"
        >
          <View style={[styles.toast, { backgroundColor: bg }]}>
            <Text style={[styles.text, { color: fg }]} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const useStyles = makeStyles(() => ({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 1000,
  },
  toast: {
    maxWidth: 520,
    width: "100%",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...StyleSheet.flatten({
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    }),
  },
  text: {
    fontFamily: fonts.text.semibold,
    fontSize: 14,
    textAlign: "center",
  },
}));
