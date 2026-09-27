import { Tabs, useRouter } from 'expo-router';
import { BottomNavigation, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { TouchableOpacity } from 'react-native';
import { TabIcon } from '@/components/TabIcon';

export default function TeacherTabLayout() {
  const router = useRouter();
  const { activeTheme } = useSettings();
  const theme = activeTheme;
  const backgroundColor = Colors[theme].background;

  const renderHeaderLeft = () => (
    <TouchableOpacity
      onPress={() => router.push('/(teacher)/(tabs)/more')}
      style={{
        marginLeft: 16,
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: theme === 'light' ? '#E0E1E6' : '#2E3135',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TabIcon name="arrow-back" size={20} color={Colors[theme].text} />
    </TouchableOpacity>
  );

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
      tabBar={({ navigation, state, descriptors, insets }) => {
        const filteredRoutes = state.routes.filter((route) => {
          return (
            route.name !== 'profile' &&
            route.name !== 'tickets' &&
            route.name !== 'my-classes' &&
            route.name !== 'my-leaves' &&
            route.name !== 'students' &&
            route.name !== 'my-subjects' &&
            route.name !== 'exams-entry' &&
            route.name !== 'homework' &&
            route.name !== 'assessments'
          );
        });

        const filteredState = {
          ...state,
          routes: filteredRoutes,
          index: filteredRoutes.findIndex((r) => r.key === state.routes[state.index].key),
        };

        if (filteredState.index === -1) {
          const moreIndex = filteredRoutes.findIndex((r) => r.name === 'more');
          filteredState.index = moreIndex !== -1 ? moreIndex : 0;
        }

        return (
          <BottomNavigation.Bar
            navigationState={filteredState}
            safeAreaInsets={insets}
            activeColor="#007AFF"
            renderLabel={({ route, color }) => {
              const { options } = descriptors[route.key];
              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : (options.title ?? route.name);
              return (
                <Text
                  variant="labelMedium"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  selectable={false}
                  style={{ textAlign: 'center', color, fontSize: label.length > 10 ? 10 : 12 }}
                >
                  {label}
                </Text>
              );
            }}
            style={{ backgroundColor: backgroundColor }}
            activeIndicatorStyle={{
              backgroundColor: theme === 'light' ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 122, 255, 0.2)',
              height: 32,
              borderRadius: 16,
            }}
            onTabPress={({ route, preventDefault }: any) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              const isActualFocused = state.routes[state.index].key === route.key;
              if (!isActualFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            renderIcon={({ route, focused, color }) => {
              const { options } = descriptors[route.key];
              if (options.tabBarIcon) {
                return options.tabBarIcon({ focused, color, size: 24 });
              }
              return null;
            }}
            getLabelText={({ route }) => {
              const { options } = descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? (typeof options.tabBarLabel === 'string' ? options.tabBarLabel : undefined)
                  : options.title !== undefined
                  ? options.title
                  : route.name;

              return label;
            }}
          />
        );
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="grid-outline" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-attendance"
        options={{
          title: 'My Attendance',
          headerShown: false,
          tabBarLabel: 'My Attendance',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="checkmark-circle-outline" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="take-attendance"
        options={{
          title: 'Take Attendance',
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="clipboard-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="calendar-number-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="ellipsis-horizontal" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile Settings',
          href: null,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="person-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Support Tickets',
          href: null,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="ticket-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="my-classes"
        options={{
          title: 'My Classes',
          href: null,
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="my-leaves"
        options={{
          title: 'My Leaves',
          href: null,
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          href: null,
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="my-subjects"
        options={{
          title: 'My Subjects',
          href: null,
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="exams-entry"
        options={{
          title: 'Exams Entry',
          href: null,
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: 'Homework',
          href: null,
          headerLeft: renderHeaderLeft,
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          title: 'Assessments',
          href: null,
          headerLeft: renderHeaderLeft,
        }}
      />
    </Tabs>
  );
}
