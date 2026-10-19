
import { useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Marker,
  Popup,
  Circle,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const reportIcon = L.divIcon({
  className: 'report-location-marker',
  html: '<span style="font-size:28px">📍</span>',
  iconSize: [30, 36],
  iconAnchor: [15, 34]
});

const nearbyIcon = L.divIcon({
  className: 'nearby-report-marker',
  html: '<span style="font-size:22px">🟠</span>',
  iconSize: [26, 30],
  iconAnchor: [13, 28]
});

function MapResizeFix() {
  const map = useMap();

  useMemo(() => {
    // No map mutations during rendering.
  }, []);

  return null;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

const validCoordinates = (report) => {
  if (
    report?.latitude == null ||
    report?.longitude == null ||
    report.latitude === '' ||
    report.longitude === ''
  ) {
    return false;
  }

  const lat = Number(report.latitude);
  const lon = Number(report.longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};

export default function ReportLocationMap({
  report,
  reports = []
}) {
  if (!validCoordinates(report)) return null;

  const latitude = Number(report.latitude);
  const longitude = Number(report.longitude);

  const nearbyReports = reports.filter((item) => {
    if (
      item._id === report._id ||
      item.status !== 'Verified' ||
      !validCoordinates(item)
    ) {
      return false;
    }

    return (
      distanceKm(
        latitude,
        longitude,
        Number(item.latitude),
        Number(item.longitude)
      ) <= 5
    );
  });
console.log('Selected report:', report._id);
console.log('Total reports received:', reports.length);
console.log('Nearby verified reports:', nearbyReports.length);

console.table(
  nearbyReports.map((item) => ({
    farm: item.farm?.farmName,
    crop: item.crop,
    latitude: item.latitude,
    longitude: item.longitude
  }))
);
  return (
    <div>
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={false}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '10px'
        }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street Map">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={17}
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <Marker
          position={[latitude, longitude]}
          icon={reportIcon}
        >
          <Popup>
            <strong>Selected Pest Report</strong>
            <br />
            {report.crop}
            <br />
            {report.pest?.pestName ||
              report.aiPredictedPest ||
              'Unknown pest'}
          </Popup>
        </Marker>

        <Circle
          center={[latitude, longitude]}
          radius={5000}
          pathOptions={{
            color: '#2e7d32',
            fillColor: '#2e7d32',
            fillOpacity: 0.06
          }}
        />

        {nearbyReports.map((item) => (
          <Marker
            key={item._id}
            position={[
              Number(item.latitude),
              Number(item.longitude)
            ]}
            icon={nearbyIcon}
          >
            <Popup>
              <strong>Nearby Verified Report</strong>
              <br />
              Crop: {item.crop}
              <br />
              Pest: {item.pest?.pestName ||
                item.aiPredictedPest ||
                'Unknown'}
              <br />
              Farm: {item.farm?.farmName || 'Unknown'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <p style={{ fontSize: '12px', marginTop: '8px' }}>
        📍 Selected report &nbsp; 🟠 Nearby verified reports
        within 5 km
      </p>

      <p style={{ fontSize: '12px', color: '#666' }}>
        Nearby markers are shown for geographical review only.
        Outbreak detection continues to use your existing
        crop-specific thresholds.
      </p>
    </div>
  );
}
