import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { MAP_CENTER, MAP_ZOOM, hurumaMathareGeoJSON } from "@/lib/geojson";
import type { Shop, Driver } from "@shared/schema";
import { Store, Truck, MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const createShopIcon = () => {
  const iconHtml = renderToStaticMarkup(
    <div className="shop-marker" style={{
      backgroundColor: "#0ea5e9",
      border: "2px solid white",
      borderRadius: "50%",
      width: "24px",
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    }}>
      <Store size={12} color="white" />
    </div>
  );
  return L.divIcon({
    html: iconHtml,
    className: "custom-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const createDriverIcon = () => {
  const iconHtml = renderToStaticMarkup(
    <div className="driver-marker" style={{
      backgroundColor: "#22c55e",
      border: "2px solid white",
      borderRadius: "50%",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    }}>
      <Truck size={14} color="white" />
    </div>
  );
  return L.divIcon({
    html: iconHtml,
    className: "custom-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

interface MapViewProps {
  shops?: Shop[];
  drivers?: Driver[];
  routeShops?: Shop[];
  selectedShopId?: string | null;
  onShopClick?: (shop: Shop) => void;
  onMapClick?: (lat: number, lng: number) => void;
  showAreaBoundaries?: boolean;
  height?: string;
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (!onClick) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onClick]);
  
  return null;
}

function FitBounds({ shops }: { shops?: Shop[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (shops && shops.length > 0) {
      const bounds = L.latLngBounds(
        shops.map(s => [s.latitude, s.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [shops, map]);
  
  return null;
}

export function MapView({
  shops = [],
  drivers = [],
  routeShops = [],
  selectedShopId,
  onShopClick,
  onMapClick,
  showAreaBoundaries = true,
  height = "100%",
}: MapViewProps) {
  const shopIcon = createShopIcon();
  const driverIcon = createDriverIcon();

  const geoJsonStyle = (feature: any) => {
    const props = feature.properties;
    
    if (props.road_type === "highway") {
      return { color: "#f59e0b", weight: 4, opacity: 0.8 };
    }
    if (props.road_type === "primary") {
      return { color: "#6b7280", weight: 3, opacity: 0.7 };
    }
    if (props.water_type === "river") {
      return { color: "#3b82f6", weight: 2, opacity: 0.6 };
    }
    if (props.area_type === "residential") {
      return { 
        color: "#0ea5e9", 
        weight: 2, 
        opacity: 0.6, 
        fillColor: "#0ea5e9", 
        fillOpacity: 0.1 
      };
    }
    return { color: "#6b7280", weight: 1 };
  };

  // Route line coordinates
  const routeCoordinates = routeShops.map(shop => [shop.latitude, shop.longitude] as [number, number]);

  return (
    <div style={{ height, width: "100%" }} data-testid="map-container">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maxZoom={18}
          tileSize={256}
          updateWhenIdle={true}
          reuseTiles={true}
        />
        
        <MapClickHandler onClick={onMapClick} />
        
        {showAreaBoundaries && (
          <GeoJSON 
            data={hurumaMathareGeoJSON as any} 
            style={geoJsonStyle}
            onEachFeature={(feature, layer) => {
              if (feature.properties.name) {
                layer.bindPopup(`<strong>${feature.properties.name}</strong><br/>${feature.properties.description || ""}`);
              }
            }}
          />
        )}
        
        {/* Route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#0ea5e9"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
        
        {/* Shop markers */}
        {shops.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.latitude, shop.longitude]}
            icon={shopIcon}
            eventHandlers={{
              click: () => onShopClick?.(shop),
            }}
          >
            <Popup>
              <div className="p-1">
                <strong className="text-sm">{shop.name}</strong>
                {shop.ownerName && (
                  <p className="text-xs text-gray-600">Owner: {shop.ownerName}</p>
                )}
                {shop.phone && (
                  <p className="text-xs text-gray-600">Phone: {shop.phone}</p>
                )}
                <p className="text-xs mt-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-white text-xs ${
                    shop.status === "active" ? "bg-green-500" : 
                    shop.status === "pending" ? "bg-yellow-500" : "bg-gray-500"
                  }`}>
                    {shop.status}
                  </span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Driver markers */}
        {drivers
          .filter(d => d.currentLatitude && d.currentLongitude)
          .map((driver) => (
            <Marker
              key={driver.id}
              position={[driver.currentLatitude!, driver.currentLongitude!]}
              icon={driverIcon}
            >
              <Popup>
                <div className="p-1">
                  <strong className="text-sm">{driver.name}</strong>
                  <p className="text-xs text-gray-600">{driver.vehicleType}</p>
                  <p className="text-xs text-gray-600">{driver.vehiclePlate}</p>
                  <p className="text-xs mt-1">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-white text-xs ${
                      driver.status === "available" ? "bg-green-500" : 
                      driver.status === "on_route" ? "bg-blue-500" : "bg-gray-500"
                    }`}>
                      {driver.status.replace("_", " ")}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
