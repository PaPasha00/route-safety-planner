// src/App.jsx
import React from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Исправляем иконки маркеров (баг Leaflet в React)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler() {
  useMapEvents({
    click(e) {
      console.log("Клик на карте:", e.latlng);
    },
  });
  return null;
}

function App() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[55.75, 37.62]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <TileLayer
          url="http://tile.nakarte.me/h/{z}/{x}/{y}"
          attribution="© nakarte.me"
          maxZoom={14} // ← Максимум для слоя "h" — 14
        />
        <ClickHandler />
      </MapContainer>
    </div>
  );
}

export default App;
