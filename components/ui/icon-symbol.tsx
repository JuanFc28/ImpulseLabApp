// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  magnifyingglass: "search",
  "person.crop.circle.fill": "person",
  "bolt.fill": "bolt",

  calendar: "calendar-today",
  "person.3.fill": "groups",

  "dumbbell.fill": "fitness-center",
  checkmark: "check",
  xmark: "close",
  "figure.mind.and.body": "self-improvement",
  "person.fill": "person",
  "flame.fill": "whatshot",
  "checkmark.circle.fill": "check-circle",
  "music.note": "music-note",
  qrcode: "qr-code",
  "chevron.left": "chevron-left",
  "chart.bar.fill": "bar-chart",
  "medal.fill": "emoji-events",
  "xmark.circle.fill": "cancel",
  "exclamationmark.triangle.fill": "warning",
  "envelope.fill": "mail",
  "shield.fill": "security",
  "rectangle.portrait.and.arrow.right": "logout",

  "gearshape.fill": "settings",
  "plus.circle.fill": "add-circle",
  "list.bullet": "format-list-bulleted",
  pencil: "edit",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
