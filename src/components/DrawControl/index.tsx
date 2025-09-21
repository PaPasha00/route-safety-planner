// src/components/LeafletDraw.tsx
import { createControlComponent } from "@react-leaflet/core";
import L, { Control } from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw-src.css";

// Расширяем тип Control для Draw
declare module "leaflet" {
  namespace Control {
    class Draw extends Control {
      constructor(options?: Control.DrawOptions);
    }
  }
}

// Настройки по умолчанию (можно переопределить через props)
const createDrawControl = (props: Control.DrawOptions) => {
  console.log(props);

  return new L.Control.Draw(props);
};

// Создаём React-компонент
const LeafletDraw = createControlComponent(createDrawControl);

export default LeafletDraw;
