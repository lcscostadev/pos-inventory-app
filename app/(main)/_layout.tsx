import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

import { onAuthStateChanged } from "firebase/auth";
import HeaderBarRight from "../../components/HeaderBarRight";
import { auth } from "../../services/firebase";
import { useNotifications } from "../../store/useNotifications";

export default function MainLayout() {
  const markAllRead = useNotifications((s) => s.markAllRead); // se quiser usar no HeaderBarRight
  const [displayName, setDisplayName] = useState<string>("Usuária");

  // Nome exibido no header
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.displayName) setDisplayName(u.displayName);
      else if (u?.email) setDisplayName(u.email.split("@")[0]);
      else setDisplayName("Administradora");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (Platform.OS === "android") {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
          await NavigationBar.setBehaviorAsync("overlay-swipe"); // aparece no gesto e some
          await NavigationBar.setButtonStyleAsync("light");
        } catch (e) {
          console.warn("NavigationBar:", e);
        }
      }
    };
    run();
  }, []);

  return (
    <>
      <StatusBar hidden />

      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#F5E6CC" },
          headerShadowVisible: false,
          headerTitle: "",
          headerRight: () => (
            <HeaderBarRight
              name={displayName}
              role="Administradora"
              // onBellPress={markAllRead} // opcional
            />
          ),
          tabBarActiveTintColor: "#C49A6C",
          tabBarStyle: { backgroundColor: "#fff" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Catálogo",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: "Estoque",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="checkout"
          options={{
            title: "Checkout",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Relatórios",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="ingredients"
          options={{
            title: "Ingredientes",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="nutrition" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
