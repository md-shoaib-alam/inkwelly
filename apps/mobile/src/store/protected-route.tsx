import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth, UserRole } from './auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="title">Access Denied</ThemedText>
        <ThemedText>You do not have permission to view this screen.</ThemedText>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
