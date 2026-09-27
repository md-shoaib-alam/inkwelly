/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Palette = {
  primary: '#007AFF',
  primaryDark: '#0051D5',
  primaryLight: '#4F7DF9',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  dangerLight: '#FF453A',
  purple: '#AF52DE',
  indigo: '#5856D6',
  cyan: '#00C6FF',
  teal: '#12D0F6',
  gray: '#8E8E93',
  // school-web brand family (Tailwind raw scales used by the attendance QR UI)
  brandBlue: '#2563EB', // blue-600
  brandBlueStrong: '#1D4ED8', // blue-700
  brandIndigo: '#4F46E5', // indigo-600
  scanBlue: '#3B82F6', // blue-500
  scanBlueSoft: '#60A5FA', // blue-400
  okGreen: '#059669', // emerald-600
  okGreenSoft: '#34D399', // emerald-400
  warnAmber: '#F59E0B', // amber-500
  errRose: '#E11D48', // rose-600
  errRoseSoft: '#FB7185', // rose-400
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    border: '#E5E5EA',
    primary: Palette.primary,
    primaryDark: Palette.primaryDark,
    success: Palette.success,
    warning: Palette.warning,
    danger: Palette.danger,
    purple: Palette.purple,
    indigo: Palette.indigo,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    border: '#2C2C2E',
    primary: Palette.primaryLight,
    primaryDark: Palette.primary,
    success: Palette.success,
    warning: Palette.warning,
    danger: Palette.dangerLight,
    purple: Palette.purple,
    indigo: Palette.indigo,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
