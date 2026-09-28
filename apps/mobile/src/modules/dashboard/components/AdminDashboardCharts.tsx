import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Text as SvgText, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 600;
const containerHeight = isLargeScreen ? 250 : 180;
const chartHeight = isLargeScreen ? 190 : 120;
const barWidth = isLargeScreen ? 24 : 18;
const barBorderRadius = isLargeScreen ? 12 : 9;
const revenueBarWidth = isLargeScreen ? 44 : 24;
const revenueBarBorderRadius = isLargeScreen ? 12 : 8;

const PIE_COLORS = ["#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#f43f5e", "#f59e0b"];

// Custom SVG Donut Chart Utils
const PI = Math.PI;

function getPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function getDonutPath(cx: number, cy: number, r: number, innerR: number, startAngle: number, endAngle: number, totalSlices: number) {
  const paddingAngle = totalSlices > 1 ? 2 : 0;
  const actualStart = startAngle + paddingAngle / 2;
  const actualEnd = endAngle - paddingAngle / 2;

  if (actualEnd <= actualStart) return ""; 

  const startOut = getPoint(cx, cy, r, actualEnd);
  const endOut = getPoint(cx, cy, r, actualStart);
  const startIn = getPoint(cx, cy, innerR, actualEnd);
  const endIn = getPoint(cx, cy, innerR, actualStart);
  const largeArcFlag = actualEnd - actualStart <= 180 ? 0 : 1;

  return [
    `M ${endOut.x} ${endOut.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${startOut.x} ${startOut.y}`,
    `L ${startIn.x} ${startIn.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${endIn.x} ${endIn.y}`,
    `Z`
  ].join(" ");
}

interface RevenueBarChartProps {
  revenueData: { month: string; amount: number }[];
  colors: any;
  activeTheme: 'light' | 'dark';
}

function RevenueBarChart({ revenueData, colors, activeTheme }: RevenueBarChartProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    revenueData && revenueData.length > 0 ? revenueData.length - 1 : null
  );

  const maxVal = Math.max(...revenueData.map(d => d.amount), 1);
  const peakMonthObj = revenueData.reduce(
    (prev, current) => (prev.amount > current.amount ? prev : current),
    revenueData[0]
  );
  const selectedMonthObj = selectedMonthIndex !== null ? revenueData[selectedMonthIndex] : null;
  const currentMonthObj = revenueData && revenueData.length > 0 ? revenueData[revenueData.length - 1] : null;

  return (
    <View style={styles.revenueContainer}>
      <View style={[
        styles.tooltipContainer, 
        { 
          backgroundColor: activeTheme === 'light' ? '#F2F2F7' : '#1C1C1E',
          borderColor: activeTheme === 'light' ? '#E5E5EA' : '#2C2C2E',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingVertical: 10,
        }
      ]}>
        <View style={styles.infoCol}>
          <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Peak ({peakMonthObj?.month || '—'})
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: '#34C759' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            ₹{peakMonthObj ? peakMonthObj.amount.toLocaleString() : '0'}
          </ThemedText>
        </View>
 
        <View style={[styles.infoDivider, { backgroundColor: activeTheme === 'light' ? '#E5E5EA' : '#2C2C2E' }]} />

        <View style={styles.infoCol}>
          <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Current Month
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            ₹{currentMonthObj ? currentMonthObj.amount.toLocaleString() : '0'}
          </ThemedText>
        </View>

        <View style={[styles.infoDivider, { backgroundColor: activeTheme === 'light' ? '#E5E5EA' : '#2C2C2E' }]} />

        <View style={styles.infoCol}>
          <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {selectedMonthObj ? `${selectedMonthObj.month} (Selected)` : 'Select Bar'}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: '#007AFF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {selectedMonthObj ? `₹${selectedMonthObj.amount.toLocaleString()}` : '—'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.revenueBarContainer}>
        {revenueData.map((item, index) => {
          const isSelected = selectedMonthIndex === index;
          const rawPercentage = (item.amount / maxVal) * 100;
          const barHeight = item.amount > 0 ? `${Math.max(rawPercentage, 8)}%` : '6%';
          
          return (
            <TouchableOpacity 
              key={index} 
              style={styles.revenueBarCol}
              activeOpacity={0.8}
              onPress={() => setSelectedMonthIndex(index)}
            >
              <View style={styles.valueLabelContainer}>
                {isSelected && (
                  <View style={styles.floatingValueBubble}>
                    <ThemedText style={styles.barValueLabel}>
                      ₹{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(0)}k` : item.amount}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={[
                styles.revenueBarBg, 
                { 
                  width: revenueBarWidth,
                  borderRadius: revenueBarBorderRadius,
                  height: chartHeight,
                  backgroundColor: activeTheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)' 
                }
              ]}>
                {item.amount > 0 ? (
                  <LinearGradient
                    colors={isSelected ? ['#007AFF', '#00C6FF'] : ['#34C759', '#11998e']}
                    style={[styles.revenueBarFill, { height: barHeight as any, borderRadius: revenueBarBorderRadius }]}
                  />
                ) : (
                  <View style={[styles.revenueBarFill, { height: barHeight as any, backgroundColor: 'transparent' }]} />
                )}
              </View>
              <ThemedText style={[
                styles.revenueMonthLabel, 
                { color: isSelected ? '#007AFF' : colors.text, fontWeight: isSelected ? 'bold' : '600' }
              ]}>
                {item.month}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface DashboardChartsProps {
  attendanceData: { month: string; rate: number }[];
  classData: { name: string; students: number }[];
  revenueData: { month: string; amount: number }[];
  feeByType: { type: string; collected: number; pending: number }[];
  maleStudents: number;
  femaleStudents: number;
}

export function DashboardCharts({
  attendanceData,
  classData,
  revenueData,
  maleStudents,
  femaleStudents
}: DashboardChartsProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const hasAttendance = attendanceData && attendanceData.length > 0;

  const hasRevenue = revenueData && revenueData.length > 0;

  const groupedClassData = useMemo(() => {
    const groupedDataMap = (classData ?? []).reduce((acc: Record<string, number>, item: any) => {
      const className = item.name.split("-")[0].trim();
      acc[className] = (acc[className] || 0) + Number(item.students || 0);
      return acc;
    }, {});

    return Object.entries(groupedDataMap)
      .map(([name, students]) => ({ name, students }))
      .filter(item => item.students > 0)
      .sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
        return numA - numB;
      });
  }, [classData]);

  const totalStudents = useMemo(() => {
    return groupedClassData.reduce((acc, curr) => acc + curr.students, 0);
  }, [groupedClassData]);

  return (
    <View style={styles.container}>
      {/* Attendance Trend */}
      <View style={[
        styles.card, 
        { 
          backgroundColor: colors.backgroundElement,
          borderColor: activeTheme === 'dark' ? '#2C2E35' : '#E8EFF9',
          shadowColor: activeTheme === 'dark' ? '#000000' : '#8FA4C4',
        }
      ]}>
        <View style={styles.chartHeaderRow}>
          <ThemedText type="defaultSemiBold" style={[styles.chartTitle, { color: colors.text }]}>Attendance Trend (%)</ThemedText>
          {hasAttendance && (() => {
            const currentAttendance = attendanceData[attendanceData.length - 1];
            return (
              <View style={[styles.avgBadge, { backgroundColor: activeTheme === 'dark' ? '#1B3D2B' : '#E8FDF0' }]}>
                <ThemedText style={[styles.avgBadgeText, { color: '#34C759' }]}>
                  {currentAttendance.month}: {currentAttendance.rate}%
                </ThemedText>
              </View>
            );
          })()}
        </View>

        {hasAttendance ? (
          <View style={[styles.barContainer, { height: containerHeight }]}>
            {attendanceData.map((item, index) => {
              const isActive = item.rate > 0;
              const barHeight = item.rate > 0 ? `${item.rate}%` : '6%';
              return (
                <View key={index} style={styles.barCol}>
                  <View style={[
                    styles.barBg, 
                    { 
                      width: barWidth,
                      borderRadius: barBorderRadius,
                      height: chartHeight,
                      backgroundColor: activeTheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)' 
                    }
                  ]}>
                    {isActive ? (
                      <LinearGradient
                        colors={['#007AFF', '#00C6FF']}
                        style={[styles.barFill, { height: barHeight as any, borderRadius: barBorderRadius }]}
                      />
                    ) : (
                      <View style={[styles.barFill, { height: barHeight as any, backgroundColor: 'transparent' }]} />
                    )}
                  </View>
                  <ThemedText style={[styles.monthLabel, { color: colors.text, fontWeight: '600' }]}>{item.month}</ThemedText>
                  <ThemedText style={[styles.percentageLabel, { color: colors.text, fontWeight: '600' }]}>{item.rate}%</ThemedText>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyChart, { height: chartHeight }]}>
            <ThemedText style={{ color: colors.textSecondary }}>No attendance data available.</ThemedText>
          </View>
        )}
      </View>

      {/* Fee Collection Trend */}
      <View style={[
        styles.card, 
        { 
          backgroundColor: colors.backgroundElement,
          borderColor: activeTheme === 'dark' ? '#2C2E35' : '#E8EFF9',
          shadowColor: activeTheme === 'dark' ? '#000000' : '#8FA4C4',
        }
      ]}>
        <View style={styles.chartHeaderRow}>
          <ThemedText type="defaultSemiBold" style={[styles.chartTitle, { color: colors.text }]}>Revenue Trend (₹)</ThemedText>
          {hasRevenue && (() => {
            const totalRev = revenueData.reduce((acc, curr) => acc + curr.amount, 0);
            return (
              <View style={[styles.avgBadge, { backgroundColor: activeTheme === 'dark' ? '#1A334E' : '#E8F2FF' }]}>
                <ThemedText style={[styles.avgBadgeText, { color: '#007AFF' }]}>Total: ₹{totalRev.toLocaleString()}</ThemedText>
              </View>
            );
          })()}
        </View>

        {hasRevenue ? (
          <RevenueBarChart revenueData={revenueData} colors={colors} activeTheme={activeTheme} />
        ) : (
          <View style={[styles.emptyChart, { height: chartHeight }]}>
            <ThemedText style={{ color: colors.textSecondary }}>No revenue data available.</ThemedText>
          </View>
        )}
      </View>

      {/* Combined Class Distribution Card */}
      <View style={[
        styles.card, 
        { 
          backgroundColor: colors.backgroundElement, 
          paddingBottom: 24,
          borderColor: activeTheme === 'dark' ? '#2C2E35' : '#E8EFF9',
          shadowColor: activeTheme === 'dark' ? '#000000' : '#8FA4C4',
        }
      ]}>
        <View style={[styles.chartHeaderRow, { marginBottom: 24 }]}>
          <Ionicons name="school-outline" size={20} color="#007AFF" style={{ marginRight: 8 }} />
          <ThemedText type="defaultSemiBold" style={[styles.chartTitle, { marginBottom: 0, flex: 1, color: colors.text }]}>
            Class Distribution
          </ThemedText>
        </View>

        {groupedClassData.length > 0 ? (
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Svg width={width - 64} height={200}>
              {(() => {
                const cx = (width - 64) / 2;
                const cy = 100;
                const r = 70;
                const innerR = 48;
                let currentAngle = 0;

                return groupedClassData.map((item, index) => {
                  const sliceAngle = (item.students / totalStudents) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + sliceAngle;
                  currentAngle += sliceAngle;

                  const pathData = getDonutPath(cx, cy, r, innerR, startAngle, endAngle, groupedClassData.length);
                  
                  // Label coordinates
                  const midAngle = startAngle + sliceAngle / 2;
                  const lineStart = getPoint(cx, cy, r + 2, midAngle);
                  const lineEnd = getPoint(cx, cy, r + 16, midAngle);
                  const isRight = lineEnd.x > cx;
                  const color = PIE_COLORS[index % PIE_COLORS.length];

                  return (
                    <React.Fragment key={index}>
                      <Path d={pathData} fill={color} />
                      <Line 
                        x1={lineStart.x} y1={lineStart.y} 
                        x2={lineEnd.x} y2={lineEnd.y} 
                        stroke={activeTheme === 'light' ? '#C7C7CC' : '#636366'} 
                        strokeWidth="1" 
                        strokeDasharray="2,2" 
                      />
                      <SvgText 
                        x={lineEnd.x + (isRight ? 4 : -4)} 
                        y={lineEnd.y + 4} 
                        fill={color} 
                        fontSize={11} 
                        textAnchor={isRight ? 'start' : 'end'}
                      >
                        {item.name}
                      </SvgText>
                    </React.Fragment>
                  );
                });
              })()}
            </Svg>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <ThemedText style={{ color: colors.textSecondary }}>No class distribution data available.</ThemedText>
          </View>
        )}

        <View style={[styles.summaryFooter, { borderTopColor: activeTheme === 'light' ? '#E5E5EA' : '#2C2C2E' }]}>
          <View style={styles.summaryCol}>
            <ThemedText style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>TOTAL STUDENTS</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: '#06b6d4' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {totalStudents || 0}
            </ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: activeTheme === 'light' ? '#E5E5EA' : '#2C2C2E' }]} />
          <View style={styles.summaryCol}>
            <ThemedText style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>MALE</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: '#3b82f6' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {maleStudents || 0}
            </ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: activeTheme === 'light' ? '#E5E5EA' : '#2C2C2E' }]} />
          <View style={styles.summaryCol}>
            <ThemedText style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>FEMALE</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: '#f43f5e' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {femaleStudents || 0}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  emptyChart: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avgBadge: {
    backgroundColor: '#E8FDF0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  avgBadgeText: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: 'bold',
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBg: {
    width: 12,
    height: 120,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  percentageLabel: {
    fontSize: 10,
  },
  revenueContainer: {
    paddingTop: 4,
  },
  tooltipContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoCol: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoDivider: {
    width: 1,
    height: 24,
  },
  valueLabelContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  floatingValueBubble: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  barValueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  revenueBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  revenueBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  revenueBarBg: {
    width: 24,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  revenueBarFill: {
    width: '100%',
  },
  revenueMonthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#8e8e93',
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    alignSelf: 'center',
  },
});

