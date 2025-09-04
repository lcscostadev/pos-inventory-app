import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { migrate } from "../db";

const colors = {
  background: "#F5E6CC", 
  primary: "#C49A6C",    
  text: "#333333",       
};

export default function RootLayout() {
  useEffect(() => {
    migrate().catch((e) => console.warn("Erro ao migrar DB:", e));
  }, []);


  const [loaded] = useFonts({
    // Inter: require("../assets/fonts/Inter-Regular.ttf"),
    // "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontFamily: "Inter-Bold" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
      
      </Stack>
    </SafeAreaProvider>
  );
}
