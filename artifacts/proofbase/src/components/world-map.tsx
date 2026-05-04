import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "../hooks/use-navigate";
import type { MapProduct } from "@workspace/api-client-react";
import "leaflet/dist/leaflet.css";

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

interface WorldMapProps {
  products: MapProduct[];
}

export function WorldMap({ products }: WorldMapProps) {
  const navigate = useNavigate();
  const validProducts = products.filter((p) => p.latitude && p.longitude);

  return (
    <div className="relative w-full" style={{ height: 420 }}>
      {/* Overlay text */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] text-center pointer-events-none px-4">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
          Startups are being built everywhere
        </h1>
        <p className="text-sm md:text-base text-white/60 mt-1">
          Explore what founders are launching in real-time
        </p>
      </div>

      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={2}
        style={{ height: "100%", width: "100%", background: "#0B0B0C" }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
        className="rounded-none"
      >
        <MapResizer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {validProducts.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.latitude as number, p.longitude as number]}
            radius={8}
            pathOptions={{
              color: "#7C3AED",
              fillColor: "#8B5CF6",
              fillOpacity: 0.9,
              weight: 2,
            }}
            eventHandlers={{
              click: () => navigate(`/products/${p.id}`),
            }}
          >
            <Popup className="dark-popup" closeButton={false}>
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/products/${p.id}`)}
              >
                <div className="text-sm font-bold text-white">{p.name}</div>
                {p.tagline && (
                  <div className="text-xs text-white/60 mt-0.5 max-w-[160px] line-clamp-2">
                    {p.tagline}
                  </div>
                )}
                {p.city && (
                  <div className="text-xs text-purple-400 mt-1">
                    📍 {p.city}{p.country ? `, ${p.country}` : ""}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0B0C] to-transparent pointer-events-none z-[999]" />
    </div>
  );
}
