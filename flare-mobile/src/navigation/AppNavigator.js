import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import MainTabs from "./MainTabs";
import NewChatScreen from "../screens/NewChatScreen";
import ChatThreadScreen from "../screens/ChatThreadScreen";
import StoryViewerScreen from "../screens/StoryViewerScreen";
import NewGroupScreen from "../screens/NewGroupScreen";
import BlockedAccountsScreen from '../screens/BlockedAccountsScreen';
import StreaksScreen from '../screens/StreaksScreen';
import StoryCameraScreen from '../screens/StoryCameraScreen';
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !user.onboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="NewChat"
              component={NewChatScreen}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="NewGroup"
              component={NewGroupScreen}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
            <Stack.Screen name="BlockedAccounts" component={BlockedAccountsScreen} />
            <Stack.Screen name="Streaks" component={StreaksScreen} />
            <Stack.Screen name="StoryCamera" component={StoryCameraScreen} options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen
              name="StoryViewer"
              component={StoryViewerScreen}
              options={{ presentation: "fullScreenModal" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
