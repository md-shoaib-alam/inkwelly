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

interface ParentSlideProps {
  colors: ThemeColors;
}

export default function ParentSlide({ colors }: ParentSlideProps) {
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const contentMaxWidth = isTablet ? 720 : '100%';

  // 1:1 aspect ratio (4:4 square) image size - increased to take more screen space
  const imageSize = Math.min(height * 0.38, isTablet ? 420 : 300);

  // Dynamic icon backgrounds for premium light mode styling
  const iconBgColor = '#E8F8F0';

  return (
    <View style={[styles.slideContainer, { maxWidth: contentMaxWidth, alignSelf: 'center' }]}>
      {/* Expanded Illustration Container - Cream background to blend the illustration perfectly */}
      <View style={[
        styles.imageContainer, 
        { width: imageSize, height: imageSize },
        styles.lightThemeImageWrapper
      ]}>
        <Image
          source={require('@/assets/images/onboarding_parents.png')}
          style={styles.slideImage}
          contentFit="cover"
        />
      </View>

      <View style={styles.roleHeaderContainer}>
        <ThemedText style={[styles.roleTitle, { color: '#00A86B' }]}>For Parents</ThemedText>
        <ThemedText style={[styles.roleSubtitle, { color: colors.textSecondary }]}>
          Stay informed and support your child's journey.
        </ThemedText>
      </View>

      {/* Bento Grid Features Layout */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="bar-chart-outline" size={18} color="#00A86B" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Track Progress</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Attendance, grades and reports.</ThemedText>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="notifications-outline" size={18} color="#00A86B" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Stay Updated</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Get real-time notices and events.</ThemedText>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="chatbubbles-outline" size={18} color="#00A86B" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Communicate</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Connect with school staff directly.</ThemedText>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="wallet-outline" size={18} color="#00A86B" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Manage Fees</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Secure payments and fee status.</ThemedText>
          </View>
        </View>
      </View>

      {/* Bottom Pill Badge */}
      <View style={[styles.badgeCard, { backgroundColor: 'rgba(0, 168, 107, 0.05)', borderColor: 'rgba(0, 168, 107, 0.15)' }]}>
        <Ionicons name="shield-checkmark-sharp" size={14} color="#00A86B" style={{ marginRight: 6 }} />
        <ThemedText style={[styles.badgeCardText, { color: '#008A55' }]}>
          Your child's school, in your pocket.
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
    backgroundColor: '#FAF7ED', // Matches the exact background color of the illustration
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
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
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
    borderColor: 'rgba(0, 168, 107, 0.12)', // Subtle green matching theme border
    padding: 12,
    alignItems: 'center',
    shadowColor: '#00A86B',
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
