import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, setApiBaseUrl, DEFAULT_IP } from '@/lib/api';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsContextType {
  themeMode: ThemeMode;
  activeTheme: 'light' | 'dark';
  apiIp: string;
  apiBaseUrl: string;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setApiIp: (ip: string) => Promise<void>;
  isLoading: boolean;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [apiIp, setApiIpState] = useState<string>(DEFAULT_IP);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        const savedIp = await AsyncStorage.getItem('apiIp');
        const savedChildId = await AsyncStorage.getItem('parent_selected_child_id');
        
        if (savedTheme) {
          setThemeModeState(savedTheme as ThemeMode);
        }
        if (savedIp) {
          setApiIpState(savedIp);
          setApiBaseUrl(savedIp);
        }
        if (savedChildId) {
          setSelectedChildId(savedChildId);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (e) {
      console.error(e);
    }
  };

  const setApiIp = async (ip: string) => {
    setApiIpState(ip);
    setApiBaseUrl(ip);
    try {
      await AsyncStorage.setItem('apiIp', ip);
    } catch (e) {
      console.error(e);
    }
  };

  const updateSelectedChildId = async (id: string) => {
    setSelectedChildId(id);
    try {
      await AsyncStorage.setItem('parent_selected_child_id', id);
    } catch (e) {
      console.error(e);
    }
  };

  const activeTheme = themeMode === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const apiBaseUrl = getApiBaseUrl();

  return (
    <SettingsContext.Provider value={{
      themeMode,
      activeTheme,
      apiIp,
      apiBaseUrl,
      setThemeMode,
      setApiIp,
      isLoading,
      selectedChildId,
      setSelectedChildId: updateSelectedChildId
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
