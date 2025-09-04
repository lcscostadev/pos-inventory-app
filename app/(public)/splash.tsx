import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import colors from "../../theme/colors";

export default function Splash() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 2000); // ~2s
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/biscoito.png")} style={styles.img} />
      <Text style={styles.brand}>Delícias da dedê</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: "center", justifyContent: "center",
  },
  img: { width: 120, height: 120, borderRadius: 999, marginBottom: 24 },
  brand: { fontSize: 28, fontWeight: "800", color: colors.text, textAlign: "center" },
});
