import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1',
    primaryContainer: '#e0e7ff',
    secondary: '#10b981',
    secondaryContainer: '#d1fae5',
  },
};

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#6366f1',
            headerStyle: {
              backgroundColor: '#6366f1',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'ボード一覧',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="dashboard" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="board/[id]"
            options={{
              title: 'ボード',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="view-kanban" size={size} color={color} />
              ),
              href: null, // タブバーには表示しない
            }}
          />
        </Tabs>
      </PaperProvider>
    </SafeAreaProvider>
  );
}