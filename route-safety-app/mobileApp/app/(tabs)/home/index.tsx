import { View, Text, Keyboard, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import PlaceSearch, {
  PlaceResult,
  PlaceSearchHandle,
} from "../../../components/PlaceSearch";
import { styles } from "./styles";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchRef = useRef<PlaceSearchHandle>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Доступ к местоположению отклонен");
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      setLocation(current);
    })();
  }, []);

  const initialRegion = useMemo(
    () => ({
      latitude: location?.coords.latitude ?? 55.7558,
      longitude: location?.coords.longitude ?? 37.6176,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }),
    [location]
  );

  const onSelectPlace = (p: PlaceResult) => {
    const lat = parseFloat(p.lat);
    const lon = parseFloat(p.lon);
    setWaypoints((prev) => [...prev, { latitude: lat, longitude: lon }]);
    searchRef.current?.blur();
    Keyboard.dismiss();
  };

  const dismissSearch = () => {
    searchRef.current?.blur();
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <PlaceSearch
        ref={searchRef}
        visible={searchVisible}
        onSelect={onSelectPlace}
      />
      {!searchVisible && (
        <TouchableOpacity
          onPress={() => setSearchVisible(true)}
          activeOpacity={0.9}
          style={{
            position: "absolute",
            top: 66,
            right: 30,
            zIndex: 1001,
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 20,
            padding: 10,
          }}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      {errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
          onPress={(e) => {
            setWaypoints((prev) => [...prev, e.nativeEvent.coordinate]);
            dismissSearch();
          }}
          onPanDrag={dismissSearch}
        >
          {waypoints.map((pt, idx) => (
            <Marker
              key={`${pt.latitude}-${pt.longitude}-${idx}`}
              coordinate={pt}
              title={`Точка ${idx + 1}`}
            />
          ))}
          {waypoints.length >= 2 && (
            <Polyline
              coordinates={waypoints}
              strokeColor="#007AFF"
              strokeWidth={4}
            />
          )}
        </MapView>
      )}
      {searchVisible && (
        <TouchableOpacity
          onPress={() => setSearchVisible(false)}
          activeOpacity={0.9}
          style={{
            position: "absolute",
            top: 66,
            right: 30,
            zIndex: 1001,
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 20,
            padding: 10,
          }}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
