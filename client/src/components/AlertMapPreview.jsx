import { MapContainer, TileLayer, Circle, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
 
const RISK_COLORS = { Low: '#e0b400', Medium: '#f08a24', High: '#d62f2f' };

const AlertMapPreview = ({ alert }) => {
  const { centerLatitude: lat, centerLongitude: lng, radiusKm = 5, severity } = alert;
  
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  
  const color = RISK_COLORS[severity] || RISK_COLORS.Medium;
  const bounds = L.latLng(lat, lng).toBounds(radiusKm * 2000 * 1.3);
  const farms = (alert.affectedFarms || []).filter((f) => Number.isFinite(f.latitude) && Number.isFinite(f.longitude));

  return (
    <div>
      <MapContainer
        bounds={bounds}
        style={{ height: 180, width: '100%', borderRadius: 8 }}
        zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}
        touchZoom={false} boxZoom={false} keyboard={false} attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle center={[lat, lng]} radius={radiusKm * 1000} pathOptions={{ color, fillColor: color, fillOpacity: 0.18, weight: 2 }} />
        {farms.map((f) => (
          <CircleMarker key={f._id} center={[f.latitude, f.longitude]} radius={6}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#2f6d3e', fillOpacity: 1 }} />
        ))}
      </MapContainer>
      <p className="db-muted">Shaded circle: approximate outbreak area ({radiusKm} km). Green dot: your farm.</p>
    </div>
  );
};

export default AlertMapPreview;