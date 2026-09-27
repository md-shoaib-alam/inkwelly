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

interface WelcomeSlideProps {
  colors: ThemeColors;
}

export default function WelcomeSlide({ colors }: WelcomeSlideProps) {
  const { width, height } = useWindowDimensions();

  // Responsive scaling calculations
  const isTablet = width > 600;
  
  // Expanded width and height constraints to make the illustration take up more screen space
  const contentMaxWidth = isTablet ? 720 : '100%';
  const illustrationHeight = Math.min(height * 0.52, isTablet ? 550 : 340);

  return (
    <View style={[styles.slideContainer, { maxWidth: contentMaxWidth, alignSelf: 'center' }]}>
      
      {/* Combined Illustration - Increased size to take more screen space */}
      <View style={[
        styles.visualContainer, 
        { height: illustrationHeight, maxWidth: isTablet ? 600 : 360 }
      ]}>
        <Image
          source={require('@/assets/images/onboarding_welcome_combined.png')}
          style={styles.illustrationImage}
          contentFit="contain"
        />
      </View>

      {/* All-In-One Solution Grid */}
      <View style={[styles.solutionCard, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#F0F0F3' }]}>
        
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#E8F8F0' }]}>
                <Ionicons name="book" size={22} color="#34C759" />
              </View>
              <ThemedText style={[styles.gridLabel, { color: colors.text }]}>Academics</ThemedText>
            </View>
            <View style={styles.gridItem}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#E6F0FF' }]}>
                <Ionicons name="people" size={22} color="#007AFF" />
              </View>
              <ThemedText style={[styles.gridLabel, { color: colors.text }]}>Attendance</ThemedText>
            </View>
            <View style={styles.gridItem}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="chatbubbles" size={22} color="#AF52DE" />
              </View>
              <ThemedText style={[styles.gridLabel, { color: colors.text }]}>Communication</ThemedText>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#FFF2E6' }]}>
                <Ionicons name="document-text" size={22} color="#FF9500" />
              </View>
              <ThemedText style={[styles.gridLabel, { color: colors.text }]}>Exams</ThemedText>
            </View>
            <View style={styles.gridItem}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#E8F8F0' }]}>
                <Ionicons name="wallet" size={22} color="#34C759" />
              </View>
              <ThemedText style={[styles.gridLabel, { color: colors.text }]}>Fees</ThemedText>
            </View>
            <View style={styles.gridItem}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#FFEBEA' }]}>
                <Ionicons name="calendar" size={22} color="#FF2D55" />
              </View>
              <ThemedText style={[styles.gridLabel, { color: colors.text }]}>Events</ThemedText>
            </View>
          </View>
        </View>
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
  visualContainer: {
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  darkThemeImageWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  solutionCard: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 6,
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
