import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';

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

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        <Slot />
      </PaperProvider>
    </SafeAreaProvider>
  );
}