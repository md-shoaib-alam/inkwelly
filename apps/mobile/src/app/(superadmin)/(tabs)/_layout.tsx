import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '@/store/auth-context';
import { TabIcon } from '@/components/TabIcon';

export default function SuperAdminTabLayout() {
  const router = useRouter();
  const { activeTheme } = useSettings();
  const theme = activeTheme;
  const backgroundColor = Colors[theme].background;
  const { logout } = useAuth();

  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        sceneStyle: { backgroundColor: backgroundColor },
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: backgroundColor,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme === 'light' ? '#E5E5E5' : '#2C2C2E',
        },
        headerTintColor: Colors[theme].text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
      tabBar={() => null}
    >
      <Tabs.Screen
        name="web-version"
        options={{
          title: 'Web Portal',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={async () => {
                await logout();
                router.replace('/');
              }}
              style={{ marginRight: 16 }}
            >
              <TabIcon name="log-out-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )
        }}
      />
    </Tabs>
  );
}
