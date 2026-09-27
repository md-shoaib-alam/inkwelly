import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText as BaseThemedText } from '@/components/themed-text';

// Local override to ensure onboarding text is always in light mode theme
const ThemedText = (props: React.ComponentProps<typeof BaseThemedText>) => (
  <BaseThemedText 
    lightColor={props.lightColor ?? '#000000'} 
    darkColor={props.darkColor ?? '#000000'} 
    {...props} 
  />
);

import type { ThemeColors } from '@/types';

interface AdminSlideProps {
  colors: ThemeColors;
}

export default function AdminSlide({ colors }: AdminSlideProps) {
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const contentMaxWidth = isTablet ? 720 : '100%';

  // 1:1 aspect ratio (4:4 square) image size - increased to take more screen space
  const imageSize = Math.min(height * 0.38, isTablet ? 420 : 300);

  // Dynamic icon backgrounds for premium light mode styling
  const iconBgColor = '#E6F0FF';

  return (
    <View style={[styles.slideContainer, { maxWidth: contentMaxWidth, alignSelf: 'center' }]}>
      {/* Expanded Illustration Container - Cream background to blend the illustration perfectly */}
      <View style={[
        styles.imageContainer, 
        { width: imageSize, height: imageSize },
        styles.lightThemeImageWrapper
      ]}>
        <Image
          source={require('@/assets/images/onboarding_admins.png')}
          style={styles.slideImage}
          contentFit="contain"
        />
      </View>

      <View style={styles.roleHeaderContainer}>
        <ThemedText style={[styles.roleTitle, { color: '#007AFF' }]}>For Administrators</ThemedText>
        <ThemedText style={[styles.roleSubtitle, { color: colors.textSecondary }]}>
          Streamline operations and manage your school efficiently.
        </ThemedText>
      </View>

      {/* Bento Grid Features Layout */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="people-circle-outline" size={18} color="#007AFF" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Students</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Manage profiles & admissions.</ThemedText>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="school-outline" size={18} color="#007AFF" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Academics</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Classes, exams & curriculum.</ThemedText>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="briefcase-outline" size={18} color="#007AFF" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Staff & Roles</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Manage staff roles & security.</ThemedText>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="analytics-outline" size={18} color="#007AFF" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Analytics</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Insightful reports & metrics.</ThemedText>
          </View>
        </View>
      </View>

      {/* Bottom Pill Badge */}
      <View style={[styles.badgeCard, { backgroundColor: 'rgba(0, 122, 255, 0.05)', borderColor: 'rgba(0, 122, 255, 0.15)' }]}>
        <Ionicons name="shield-sharp" size={14} color="#007AFF" style={{ marginRight: 6 }} />
        <ThemedText style={[styles.badgeCardText, { color: '#0062CC' }]}>
          Complete control. Stronger schools.
        </ThemedText>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  slideContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  lightThemeImageWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  darkThemeImageWrapper: {
    backgroundColor: '#FAF7ED', // Matches the cream background color of the illustration
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  roleHeaderContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  gridContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.12)', // Subtle blue matching theme border
    padding: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  gridIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 3,
    textAlign: 'center',
  },
  gridItemDesc: {
    fontSize: 9.5,
    color: '#60646C',
    textAlign: 'center',
    lineHeight: 12,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30, // Pill design
    borderWidth: 1,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  badgeCardText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});
