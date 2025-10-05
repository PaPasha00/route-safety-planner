import { View, Text } from "react-native";
import { styles } from "./styles";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Исследовать</Text>
      <Text style={styles.subtitle}>Откройте для себя новый контент</Text>
    </View>
  );
}
