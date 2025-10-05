import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import PlaceSearch, { PlaceResult } from "../../components/PlaceSearch";

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);

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

  const initialRegion = useMemo(() => ({
    latitude: location?.coords.latitude ?? 55.7558,
    longitude: location?.coords.longitude ?? 37.6176,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }), [location]);

  const onSelectPlace = (p: PlaceResult) => {
    const lat = parseFloat(p.lat);
    const lon = parseFloat(p.lon);
    setWaypoints((prev) => [...prev, { latitude: lat, longitude: lon }]);
  };

  return (
    <View style={styles.container}>
      <PlaceSearch onSelect={onSelectPlace} />
      {errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
          onPress={(e) => setWaypoints((prev) => [...prev, e.nativeEvent.coordinate])}
        >
          {waypoints.map((pt, idx) => (
            <Marker key={`${pt.latitude}-${pt.longitude}-${idx}`} coordinate={pt} title={`Точка ${idx + 1}`} />
          ))}
          {waypoints.length >= 2 && (
            <Polyline coordinates={waypoints} strokeColor="#007AFF" strokeWidth={4} />
          )}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  map: {
    flex: 1,
  },
  error: {
    textAlign: "center",
    marginTop: 40,
    color: "#d00",
  },
});
