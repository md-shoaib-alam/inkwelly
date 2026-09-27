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

interface TeacherSlideProps {
  colors: ThemeColors;
}

export default function TeacherSlide({ colors }: TeacherSlideProps) {
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const contentMaxWidth = isTablet ? 720 : '100%';

  // 1:1 aspect ratio (4:4 square) image size - increased to take more screen space
  const imageSize = Math.min(height * 0.38, isTablet ? 420 : 300);

  // Dynamic icon backgrounds for premium light mode styling
  const iconBgColor = '#F2F0FF';

  return (
    <View style={[styles.slideContainer, { maxWidth: contentMaxWidth, alignSelf: 'center' }]}>
      {/* Expanded Illustration Container - Cream background to blend the illustration perfectly */}
      <View style={[
        styles.imageContainer, 
        { width: imageSize, height: imageSize },
        styles.lightThemeImageWrapper
      ]}>
        <Image
          source={require('@/assets/images/onboarding_teachers.png')}
          style={styles.slideImage}
          contentFit="cover"
        />
      </View>

      <View style={styles.roleHeaderContainer}>
        <ThemedText style={[styles.roleTitle, { color: '#5E5CE6' }]}>For Teachers</ThemedText>
        <ThemedText style={[styles.roleSubtitle, { color: colors.textSecondary }]}>
          Teach, manage and inspire more effectively.
        </ThemedText>
      </View>

      {/* Bento Grid Features Layout */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="calendar-outline" size={18} color="#5E5CE6" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Manage Classes</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Timetable, classes & materials.</ThemedText>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="people-outline" size={18} color="#5E5CE6" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Track Students</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Attendance, grades & reviews.</ThemedText>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="document-text-outline" size={18} color="#5E5CE6" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Exams & Tests</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Assignments & evaluation.</ThemedText>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.gridIconCircle, { backgroundColor: iconBgColor }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#5E5CE6" />
            </View>
            <ThemedText style={styles.gridItemTitle}>Communicate</ThemedText>
            <ThemedText style={styles.gridItemDesc}>Real-time student/parent chat.</ThemedText>
          </View>
        </View>
      </View>

      {/* Bottom Pill Badge */}
      <View style={[styles.badgeCard, { backgroundColor: 'rgba(94, 92, 230, 0.05)', borderColor: 'rgba(94, 92, 230, 0.15)' }]}>
        <Ionicons name="sparkles-sharp" size={14} color="#5E5CE6" style={{ marginRight: 6 }} />
        <ThemedText style={[styles.badgeCardText, { color: '#4E4CB8' }]}>
          Less paperwork, more teaching.
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
    borderColor: 'rgba(94, 92, 230, 0.12)', // Subtle purple matching theme border
    padding: 12,
    alignItems: 'center',
    shadowColor: '#5E5CE6',
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
