import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from 'react-native-elements';
import * as Notifications from 'expo-notifications';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/constants/theme';
import LoadingScreen from './src/components/LoadingScreen';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Suppress specific warnings for development
LogBox.ignoreLogs([
  'Require cycle:',
  'ViewPropTypes will be removed',
  'AsyncStorage has been extracted',
]);

export default function App() {
  useEffect(() => {
    // Initialize notifications permission
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission denied');
      }
    };

    requestNotificationPermissions();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <AppNavigator />
            <Toast />
          </SafeAreaProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
