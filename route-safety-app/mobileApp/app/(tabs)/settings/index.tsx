import { View, Text } from "react-native";
import { styles } from "./styles";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Настройки</Text>
      <Text style={styles.subtitle}>Конфигурация приложения</Text>
    </View>
  );
}
