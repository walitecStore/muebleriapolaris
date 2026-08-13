"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];

const markerIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({
  onChange,
}: {
  onChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function RecenterMap({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.flyTo([latitude, longitude], 15, {
        duration: 0.8,
      });
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const [loadingLocation, setLoadingLocation] = useState(false);

  const position: [number, number] =
    latitude !== null && longitude !== null
      ? [latitude, longitude]
      : LIMA_CENTER;

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(
        "Tu navegador no permite obtener automáticamente tu ubicación."
      );
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (location) => {
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;

        onChange(lat, lng);
        setLoadingLocation(false);
      },
      () => {
        alert(
          "No fue posible obtener tu ubicación. Puedes seleccionar el punto directamente en el mapa."
        );

        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            📍 Ubicación de entrega
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Selecciona exactamente dónde deseas recibir tu pedido.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={loadingLocation}
          className="shrink-0 rounded-lg border border-green-600 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingLocation
            ? "Obteniendo..."
            : "📍 Mi ubicación"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          className="h-[300px] w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onChange={onChange} />

          <RecenterMap
            latitude={latitude}
            longitude={longitude}
          />

          {latitude !== null && longitude !== null && (
            <Marker
              position={[latitude, longitude]}
              icon={markerIcon}
            />
          )}
        </MapContainer>
      </div>

      {latitude !== null && longitude !== null ? (
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <p className="font-semibold">
            ✓ Ubicación seleccionada
          </p>

          <p className="mt-1">
            Latitud: {latitude.toFixed(6)}
          </p>

          <p>
            Longitud: {longitude.toFixed(6)}
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          Toca el mapa para seleccionar el punto de entrega.
        </div>
      )}
    </div>
  );
}