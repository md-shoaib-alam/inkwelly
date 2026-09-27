import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';

export type TabType = 'status' | 'fee-status' | 'collect' | 'receipts' | 'concessions' | 'structures' | 'categories' | 'transport';

interface UseFeesNavigationProps {
  tabs: { id: TabType; label: string; icon: string }[];
}

export function useFeesNavigation({ tabs }: UseFeesNavigationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [layoutWidth, setLayoutWidth] = useState(Dimensions.get('window').width);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const tabBarScrollRef = useRef<any>(null);
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});

  const handleTabPress = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
    const index = tabs.findIndex(t => t.id === tabId);
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * layoutWidth, animated: true });
    }
  }, [tabs, layoutWidth]);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / layoutWidth);
    const newTab = tabs[index]?.id;
    if (newTab && newTab !== activeTabRef.current) {
      setActiveTab(newTab);
    }
  }, [tabs, layoutWidth]);

  const onLayout = useCallback((event: any) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    const layout = tabLayouts[activeTab];
    if (layout && tabBarScrollRef.current) {
      const targetX = layout.x - (layoutWidth - layout.width) / 2;
      tabBarScrollRef.current.scrollTo({ x: Math.max(0, targetX), animated: true });
    }
  }, [activeTab, tabLayouts, layoutWidth]);

  const inputRange = useMemo(() => {
    if (tabs.length === 0) return [0, layoutWidth];
    return tabs.map((_, i) => i * layoutWidth);
  }, [tabs, layoutWidth]);

  const indicatorTranslateX = useMemo(() => {
    if (tabs.length === 0) return 0;
    const hasAllLayouts = tabs.every(t => tabLayouts[t.id]);
    if (!hasAllLayouts) return 0;
    if (tabs.length === 1) return tabLayouts[tabs[0].id]?.x || 0;
    
    return scrollX.interpolate({
      inputRange,
      outputRange: tabs.map(t => tabLayouts[t.id]?.x || 0),
      extrapolate: 'clamp',
    });
  }, [tabs, tabLayouts, inputRange, scrollX]);

  const indicatorWidth = useMemo(() => {
    if (tabs.length === 0) return 0;
    const hasAllLayouts = tabs.every(t => tabLayouts[t.id]);
    if (!hasAllLayouts) return 0;
    if (tabs.length === 1) return tabLayouts[tabs[0].id]?.width || 0;

    return scrollX.interpolate({
      inputRange,
      outputRange: tabs.map(t => tabLayouts[t.id]?.width || 0),
      extrapolate: 'clamp',
    });
  }, [tabs, tabLayouts, inputRange, scrollX]);

  return {
    activeTab,
    setActiveTab,
    layoutWidth,
    scrollX,
    scrollViewRef,
    tabBarScrollRef,
    tabLayouts,
    setTabLayouts,
    handleTabPress,
    handleMomentumScrollEnd,
    onLayout,
    inputRange,
    indicatorTranslateX,
    indicatorWidth,
    parentScrollEnabled,
    setParentScrollEnabled
  };
}
