import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";

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
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
