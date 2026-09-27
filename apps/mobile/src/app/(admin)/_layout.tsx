import React, { useEffect } from 'react';
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/store/auth-context";
import { ActivityIndicator, View } from 'react-native';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.replace('/login');
    }
  }, [user, isLoading]);

  if (isLoading || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    />
  );
}
