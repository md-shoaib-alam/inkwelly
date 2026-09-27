import { View, type ViewProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  safeAreaTop?: boolean;
};

export function ThemedView({ style, lightColor, darkColor, safeAreaTop, ...otherProps }: ThemedViewProps) {
  const { activeTheme } = useSettings();
  const backgroundColor = activeTheme === 'light' ? (lightColor ?? Colors.light.background) : (darkColor ?? Colors.dark.background);
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        { backgroundColor }, 
        safeAreaTop && { paddingTop: insets.top }, 
        style
      ]} 
      {...otherProps} 
    />
  );
}
