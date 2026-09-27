import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

type FormInputProps = React.ComponentProps<typeof TextInput>;

export function FormInput({ style, theme, ...props }: FormInputProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  
  const isDark = activeTheme === 'dark';
  const inputBg = isDark ? '#1C1D21' : '#F9FBFD';
  const inputBorder = colors.backgroundSelected;

  return (
    <TextInput
      mode="outlined"
      activeOutlineColor="#007AFF"
      outlineColor={inputBorder}
      textColor={colors.text}
      placeholderTextColor={colors.textSecondary}
      theme={{ 
        roundness: 12,
        ...theme 
      }}
      style={[
        styles.input, 
        { backgroundColor: inputBg }, 
        style
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 12,
  },
});
