// src/App.tsx
import React, { useState, useCallback } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import RouteAnalyzer from "./components/RouteAnalyze";
import LeafletDraw from "./components/DrawControl";

// Исправляем иконки маркеров
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LatLngTuple = [number, number];

function ClickHandler() {
  useMapEvents({
    click(e) {
      console.log("Клик на карте:", e.latlng);
    },
  });
  return null;
}

function App() {
  const [route, setRoute] = useState<LatLngTuple[] | null>(null);

  console.log(route);

  const onCreated = useCallback((e: L.DrawEvents.Created) => {
    const { layerType, layer } = e;

    if (layerType === "polyline") {
      const coords = (layer as L.Polyline).getLatLngs() as LatLngTuple[];
      setRoute(coords);
      console.log("Нарисован маршрут:", coords);

      let totalLength = 0;
      for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const dx = curr[1] - prev[1];
        const dy = curr[0] - prev[0];
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
      console.log(`Длина маршрута (градусы): ${totalLength.toFixed(4)}`);
    }
  }, []);

  const handleClear = () => {
    setRoute(null);
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <RouteAnalyzer />
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
          url="http://localhost:3001/tiles/h/{z}/{x}/{y}"
          attribution="© nakarte.me (через прокси)"
          maxZoom={14}
        />

        {/* Наш кастомный компонент рисования */}
        <LeafletDraw onCreated={onCreated} />

        <ClickHandler />
      </MapContainer>

      {route && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "white",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxWidth: "300px",
          }}
        >
          <h4>📈 Маршрут нарисован</h4>
          <p>
            <strong>Точек:</strong> {route.length}
          </p>
          <p>
            <strong>Длина (градусы):</strong>{" "}
            {route.length > 1
              ? route
                  .reduce((sum, point, i, arr) => {
                    if (i === 0) return sum;
                    const prev = arr[i - 1];
                    const dx = point[1] - prev[1];
                    const dy = point[0] - prev[0];
                    return sum + Math.sqrt(dx * dx + dy * dy);
                  }, 0)
                  .toFixed(4)
              : "0.0000"}
          </p>
          <button
            onClick={handleClear}
            style={{
              background: "#f44336",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Очистить маршрут
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
