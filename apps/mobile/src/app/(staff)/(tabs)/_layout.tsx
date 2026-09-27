import { Tabs, useRouter } from 'expo-router';
import { BottomNavigation } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '@/store/auth-context';
import { hasPermission } from '@/lib/permissions';
import { TabIcon } from '@/components/TabIcon';

export default function StaffTabLayout() {
  const router = useRouter();
  const { activeTheme } = useSettings();
  const theme = activeTheme;
  const backgroundColor = Colors[theme].background;
  const { user } = useAuth();

  const renderHeaderLeft = () => (
    <TouchableOpacity
      onPress={() => router.push('/(staff)/(tabs)/more' as any)}
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
        // Evaluate permissions
        const canViewFees = hasPermission(user, 'fees', 'view');
        const canViewExpenses = hasPermission(user, 'expenses', 'view');
        const canViewStudents = hasPermission(user, 'students', 'view');
        const canViewTeachers = hasPermission(user, 'teachers', 'view');
        const canViewClasses = hasPermission(user, 'classes', 'view');
        const canViewSubjects = hasPermission(user, 'subjects', 'view');
        const canViewAttendance = hasPermission(user, 'attendance', 'view');
        const canViewTasks = hasPermission(user, 'tasks', 'view');
        const canViewLeaves = hasPermission(user, 'leaves', 'view');

        // Choose template based on permission groups
        const activeTabs = ['dashboard'];

        if (canViewFees || canViewExpenses) {
          // Finance template
          if (canViewFees) activeTabs.push('fees');
          if (canViewExpenses) activeTabs.push('expenses');
        } else if (canViewStudents || canViewTeachers || canViewClasses || canViewSubjects) {
          // Academic template
          if (canViewStudents) activeTabs.push('students');
          if (canViewTeachers) activeTabs.push('teachers');
          if (!canViewStudents && !canViewTeachers && canViewClasses) activeTabs.push('classes');
        } else if (canViewAttendance || canViewTasks || canViewLeaves) {
          // Operations template
          if (canViewAttendance) activeTabs.push('attendance');
          if (canViewTasks) activeTabs.push('tasks');
          if (!canViewAttendance && !canViewTasks && canViewLeaves) activeTabs.push('leaves');
        } else {
          // General / Support template
          activeTabs.push('tickets');
          activeTabs.push('profile');
        }

        activeTabs.push('more');

        // Hide all screens NOT selected for the active template
        const allRoutes = [
          'dashboard', 'fees', 'expenses', 'students', 'teachers',
          'classes', 'subjects', 'tasks', 'attendance', 'leaves',
          'tickets', 'profile', 'notices', 'more'
        ];
        const hiddenRouteNames = allRoutes.filter(name => !activeTabs.includes(name));

        const filteredRoutes = state.routes.filter((route) => {
          return !hiddenRouteNames.includes(route.name);
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
              return options.tabBarLabel !== undefined
                ? (typeof options.tabBarLabel === 'string' ? options.tabBarLabel : undefined)
                : options.title !== undefined
                ? options.title
                : route.name;
            }}
          />
        );
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Staff Portal',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="grid-outline" size={size} color={color} focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="fees"
        options={{
          title: 'Finance',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="wallet-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'fees', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="cash-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'expenses', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="people-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'students', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="teachers"
        options={{
          title: 'Teachers',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="briefcase-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'teachers', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="school-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'classes', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="book-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'subjects', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: 'My Tasks',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="checkbox-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'tasks', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: 'My Attendance',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="checkmark-circle-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'attendance', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="leaves"
        options={{
          title: 'Leave Requests',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="calendar-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: hasPermission(user, 'leaves', 'view') ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Service Tickets',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="ticket-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: null, // Always hidden unless falling back to default General template
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="person-outline" size={size} color={color} focused={focused} />
          ),
          headerLeft: renderHeaderLeft,
          href: null,
        }}
      />
      
      <Tabs.Screen name="notices" options={{ href: null, title: 'Notices', headerLeft: renderHeaderLeft }} />

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="ellipsis-horizontal" size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
