import { View, Text } from "react-native";
import { styles } from "./styles";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Профиль</Text>
      <Text style={styles.subtitle}>Настройки и информация о пользователе</Text>
    </View>
  );
}
